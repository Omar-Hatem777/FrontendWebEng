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
        Task<UserDto> LoginAsync(LoginDto model);

        Task<UserDto> RegisterAsync(RegisterDto model);

        Task<UserDto> GetCurrentUser(ClaimsPrincipal claimsPrincipal);
    }
}
