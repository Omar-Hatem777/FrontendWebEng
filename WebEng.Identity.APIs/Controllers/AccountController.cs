using LinkDev.Talabat.APIs.Controllers.Base;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using WebEng.Identity.Core.Application.Models;
using WebEng.Identity.Core.Application.ServicesContracts;

namespace LinkDev.Talabat.APIs.Controllers.Controllers.Account
{
    public class AccountController: BaseApiController
    {
        private readonly IAuthService _authService;

        public AccountController(IAuthService authService)
        {
            _authService = authService;
        }

        [HttpPost("register")] // POST: /api/account/register
        public async Task<ActionResult<UserDto>> Register(RegisterDto model)
        {
            var result = await _authService.RegisterAsync(model, Response);
            return Ok(result);
        }

        [HttpPost("login")] // POST: /api/account/login
        public async Task<ActionResult<UserDto>> Login(LoginDto model)
        {
            var result = await _authService.LoginAsync(model, Response);
            return Ok(result);
        }

        [Authorize]
        [HttpPost("logout")]
        public async Task<ActionResult> Logout()
        {
            await _authService.LogoutAsync(Request, Response);
            return Ok(new { message = "Logged out successfully" });
        }

        [HttpPost("refresh")]
        public async Task<ActionResult<UserDto>> Refresh()
        {
            var userDto = await _authService.RefreshTokenAsync(Request, Response);
            return Ok(userDto);
        }


        [Authorize]
        [HttpGet] // GET: /api/account
        public async Task<ActionResult<UserDto>> GetCurrentUser()
        {
            var result = await _authService.GetCurrentUser(User, Request);
            return Ok(result);
        }





      
    }
}
