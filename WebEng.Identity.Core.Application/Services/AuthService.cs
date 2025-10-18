using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Runtime.ConstrainedExecution;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using WebEng.Identity.Core.Application.Exceptions;
using WebEng.Identity.Core.Application.Models;
using WebEng.Identity.Core.Application.ServicesContracts;
using WebEng.Identity.Core.Domain.Entities;

namespace WebEng.Identity.Core.Application.Services
{
    public class AuthService : IAuthService
    {
        private readonly UserManager<User> _userManager;
        private readonly SignInManager<User> _signInManager;
        private readonly IOptions<JwtSettings> _jwtSettings;
        private readonly JwtSettings _jwtSettingsValue;

        public AuthService(UserManager<User> userManager, SignInManager<User> signInManager, IOptions<JwtSettings> jwtSettings)
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _jwtSettings = jwtSettings;
            _jwtSettingsValue = _jwtSettings.Value;
        }

        public async Task<UserDto> RegisterAsync(RegisterDto model, HttpResponse response)
        {
            var existingUser = await _userManager.FindByEmailAsync(model.Email);
            if (existingUser != null)
                throw new ValidationException() { Errors = new[] { "Email is already registered." } };

            var user = new User()
            {
                FirstName = model.DisplayName,
                Email = model.Email,
                UserName = model.UserName,
                PhoneNumber = model.PhoneNumber
            };

            var result = await _userManager.CreateAsync(user, model.Password);

            if (!result.Succeeded)
                throw new ValidationException() { Errors = result.Errors.Select(e => e.Description).ToArray() };

            var roleResult = await _userManager.AddToRoleAsync(user, "User");

            if (!roleResult.Succeeded)
            {
                throw new ValidationException() { Errors = roleResult.Errors.Select(e => e.Description).ToArray() };
            }

            var roles = await _userManager.GetRolesAsync(user);

            await _userManager.Users.Include(u => u.RefreshTokens).FirstOrDefaultAsync(u => u.Id == user.Id);
            RemoveInActiveRefreshTokens(user);

            RefreshToken refreshToken = GenerateRefreshToken();
            user.RefreshTokens.Add(refreshToken);
            await _userManager.UpdateAsync(user);

            SetRefreshTokenCookie(response, refreshToken.Token, refreshToken.ExpiresOn);

            return new UserDto()
            {
                Id = user.Id,
                DisplayName = user.FirstName,
                Email = user.Email!,
                Token = await GenerateTokenAsync(user),
                RefreshTokenExpiration = refreshToken.ExpiresOn,
                Roles = roles.ToList()

            };
        }

        public async Task<UserDto> LoginAsync(LoginDto model, HttpResponse response)
        {
            var user = await _userManager.Users
                    .Include(u => u.RefreshTokens)
                    .FirstOrDefaultAsync(u => u.Email == model.Email);

            if (user is null)
                throw new UnAuthorizedException("Invalid Login.");

            var result = await _signInManager.CheckPasswordSignInAsync(user, model.Password, lockoutOnFailure: true);

            if (result.IsNotAllowed)
                throw new UnAuthorizedException("Account not confirmed yet.");

            if (result.IsLockedOut)
                throw new UnAuthorizedException("Account is locked.");

            if (!result.Succeeded)
                throw new UnAuthorizedException("Invalid Login.");

            var roles = await _userManager.GetRolesAsync(user);

            await _userManager.Users.Include(u => u.RefreshTokens).FirstOrDefaultAsync(u => u.Id == user.Id);

            RemoveInActiveRefreshTokens(user);

            RefreshToken refreshToken = GenerateRefreshToken();
            user.RefreshTokens.Add(refreshToken);
            await _userManager.UpdateAsync(user);

            SetRefreshTokenCookie(response, refreshToken.Token, refreshToken.ExpiresOn);

            return new UserDto()
            {
                Id = user.Id,
                DisplayName = user.FirstName,
                Email = user.Email!,
                Token = await GenerateTokenAsync(user),
                RefreshTokenExpiration = refreshToken.ExpiresOn,
                Roles = roles.ToList(),
            };
        }

        public async Task<UserDto> GetCurrentUser(ClaimsPrincipal claimsPrincipal, HttpRequest request)
        {
            var email = claimsPrincipal.FindFirstValue(ClaimTypes.Email);
            var user = await _userManager.FindByEmailAsync(email!);

            if (user == null)
                throw new UnAuthorizedException("User not found.");

            var roles = await _userManager.GetRolesAsync(user);


            var securityStampClaim = claimsPrincipal.FindFirstValue("SecurityStamp");
            if (user.SecurityStamp != securityStampClaim)
                throw new UnAuthorizedException("Session expired. Please login again.");


            var token = request.Headers["Authorization"].ToString().Replace("Bearer ", "");


            return new UserDto()
            {
                Id = user!.Id,
                Email = user.Email!,
                DisplayName = user.FirstName,
                Token = token,
                Roles = roles.ToList(),
                RefreshTokenExpiration = user.RefreshTokens.LastOrDefault().ExpiresOn
            };
        }

        public async Task<bool> RevokeTokenAsync(HttpRequest request, HttpResponse response)
        {

            var token = request.Cookies["refreshToken"];
            if (string.IsNullOrEmpty(token))
                return false;

            var user = await _userManager.Users.Include(u => u.RefreshTokens).FirstOrDefaultAsync(u => u.RefreshTokens.Any(t => t.Token == token));

            if (user is null)
                return false;

            var refreshToken = user.RefreshTokens.SingleOrDefault(t => t.Token == token);

            if (refreshToken is null || !refreshToken.IsActive)
                return false;

            refreshToken.RevokedOn = DateTime.UtcNow;
            await _userManager.UpdateAsync(user);

            response.Cookies.Delete("refreshToken");


            return true;

        }

        public async Task<UserDto> RefreshTokenAsync(HttpRequest request, HttpResponse response)
        {

            var token = request.Cookies["refreshToken"];

            if (string.IsNullOrEmpty(token))
                throw new UnAuthorizedException("Refresh token is required.");

            var user = await _userManager.Users.Include(u => u.RefreshTokens).FirstOrDefaultAsync(u => u.RefreshTokens.Any(t => t.Token == token));

            if (user is null)
                throw new UnAuthorizedException("Invalid token.");

            var oldRefreshToken = user.RefreshTokens.Single(t => t.Token == token);

            if (!oldRefreshToken.IsActive)
            {
                foreach (var rt in user.RefreshTokens.Where(t => t.IsActive))
                {
                    rt.RevokedOn = DateTime.UtcNow;
                }
                await _userManager.UpdateAsync(user);
                response.Cookies.Delete("refreshToken");

                throw new UnAuthorizedException("Token reuse detected. All sessions have been revoked for security.");
            }

            oldRefreshToken.RevokedOn = DateTime.UtcNow;

            RemoveInActiveRefreshTokens(user);

            var newRefreshToken = GenerateRefreshToken();
            user.RefreshTokens.Add(newRefreshToken);

            await _userManager.UpdateSecurityStampAsync(user);
            await _userManager.UpdateAsync(user);

            SetRefreshTokenCookie(response, newRefreshToken.Token, newRefreshToken.ExpiresOn);

            var roles = await _userManager.GetRolesAsync(user);
            var jwt = await GenerateTokenAsync(user);
            response.Headers["Authorization"] = "Bearer " + jwt;


            return new UserDto()
            {
                Id = user.Id,
                DisplayName = user.FirstName,
                Email = user.Email!,
                Roles = roles.ToList(),
                Token = jwt,
                RefreshTokenExpiration = newRefreshToken.ExpiresOn
            };
        }

        public async Task LogoutAsync(HttpRequest request, HttpResponse response)
        {
            var token = request.Cookies["refreshToken"];

            if (!string.IsNullOrEmpty(token))
                await RevokeTokenAsync(request, response);

            var userEmail = request.HttpContext?.User?.FindFirstValue(ClaimTypes.Email);
            var user = await _userManager.FindByEmailAsync(userEmail);

            if (user == null)
                throw new UnAuthorizedException("You are not signed in");

            await _userManager.UpdateSecurityStampAsync(user);
            response.Cookies.Delete("refreshToken");
        }


        private void RemoveInActiveRefreshTokens(User user)
        {
            var expiredTokens = user.RefreshTokens
            .Where(t => !t.IsActive && t.ExpiresOn < DateTime.UtcNow.AddDays(-30))
            .ToList();

                foreach (var expired in expiredTokens)
                {
                    user.RefreshTokens.Remove(expired);
                }
        }

        private async Task<string> GenerateTokenAsync(User user)
        {
            var userClaims = await _userManager.GetClaimsAsync(user);
            var rolesAsClaims = new List<Claim>();

            var roles = await _userManager.GetRolesAsync(user);
            foreach (var role in roles)
                rolesAsClaims.Add(new Claim(ClaimTypes.Role, role));

            var claims = new List<Claim>()
            {
                new Claim(ClaimTypes.NameIdentifier , user.Id),
                new Claim(ClaimTypes.Email , user.Email!),
                new Claim(ClaimTypes.GivenName , user.FirstName),
                new Claim("SecurityStamp", user.SecurityStamp)

            }
            .Union(userClaims)
            .Union(rolesAsClaims);

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtSettingsValue.Key));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: _jwtSettingsValue.Issuer,
                audience: _jwtSettingsValue.Audience,
                expires: DateTime.UtcNow.AddMinutes(_jwtSettingsValue.DurationInMinutes),
                claims: claims,
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
   
        private RefreshToken GenerateRefreshToken()
        {
            var randomBytes = new byte[64]; 
            RandomNumberGenerator.Fill(randomBytes);

            return new RefreshToken
            {
                Token = Convert.ToBase64String(randomBytes),
                ExpiresOn = DateTime.UtcNow.AddDays(5),
                CreatedOn = DateTime.UtcNow,
            };
        }

        private void SetRefreshTokenCookie(HttpResponse response, string refreshToken, DateTime expires)
        {
            var cookieOptions = new CookieOptions
            {
                HttpOnly = false,                  
                Expires = expires,
                Secure = false,                      
                SameSite = SameSiteMode.Lax,
                Path = "/"
            };

            response.Cookies.Append("refreshToken", refreshToken, cookieOptions);

        }


    }
}
