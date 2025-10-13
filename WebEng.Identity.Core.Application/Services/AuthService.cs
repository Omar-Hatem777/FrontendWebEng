using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
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

        public async Task<UserDto> RegisterAsync(RegisterDto model)
        {
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


            RefreshToken refreshToken = await GenerateRefreshTokenAsync();

            return new UserDto()
            {
                Id = user.Id,
                DisplayName = user.FirstName,
                Email = user.Email!,
                Token = await GenerateTokenAsync(user),
                RefreshToken = refreshToken.Token,
                RefreshTokenExpiration = refreshToken.ExpiresOn
            };
        }

        public async Task<UserDto> LoginAsync(LoginDto model)
        {
            var user = await _userManager.FindByEmailAsync(model.Email);

            if (user is null)
                throw new UnAuthorizedException("Invalid Login.");

            var result = await _signInManager.CheckPasswordSignInAsync(user, model.Password, lockoutOnFailure: true);

            if (result.IsNotAllowed)
                throw new UnAuthorizedException("Account not confirmed yet.");

            if (result.IsLockedOut)
                throw new UnAuthorizedException("Account is locked.");

            if (!result.Succeeded)
                throw new UnAuthorizedException("Invalid Login.");

            RefreshToken refreshToken = await GenerateRefreshTokenAsync();

            return new UserDto()
            {
                Id = user.Id,
                DisplayName = user.FirstName,
                Email = user.Email!,
                Token = await GenerateTokenAsync(user),
                RefreshToken = refreshToken.Token,
                RefreshTokenExpiration = refreshToken.ExpiresOn
            };
        }

        public async Task<UserDto> GetCurrentUser(ClaimsPrincipal claimsPrincipal)
        {
            var email = claimsPrincipal.FindFirstValue(ClaimTypes.Email);
            var user = await _userManager.FindByEmailAsync(email!);

            RefreshToken refreshToken = await GenerateRefreshTokenAsync();

            return new UserDto()
            {
                Id = user!.Id,
                Email = user.Email!,
                DisplayName = user.FirstName,
                Token = await GenerateTokenAsync(user),
                RefreshToken = refreshToken.Token,
                RefreshTokenExpiration = refreshToken.ExpiresOn
            };
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
                new Claim(ClaimTypes.GivenName , user.FirstName)
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
   
        private async Task<RefreshToken> GenerateRefreshTokenAsync()
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
    }
}
