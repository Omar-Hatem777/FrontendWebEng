using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using WebEng.Identity.Core.Application.Models;

namespace WebEng.Identity.Core.Application.ServicesContracts
{
    public interface IAuthService
    {
        Task<UserDto> LoginAsync(LoginDto model, HttpResponse response);

        Task<UserDto> RegisterAsync(RegisterDto model, HttpResponse response);

        Task<UserDto> GetCurrentUser(ClaimsPrincipal claimsPrincipal, HttpRequest request);

        Task<UserDto> RefreshTokenAsync(HttpRequest request, HttpResponse response);

        Task<bool> RevokeTokenAsync(HttpRequest request, HttpResponse response);

        Task LogoutAsync(HttpRequest request, HttpResponse response);

    }
}
