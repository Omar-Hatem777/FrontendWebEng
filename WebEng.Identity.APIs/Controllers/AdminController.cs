using LinkDev.Talabat.APIs.Controllers.Base;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using WebEng.Identity.Core.Application.Models;
using WebEng.Identity.Core.Application.ServicesContracts;

namespace WebEng.Identity.APIs.Controllers
{
    [Authorize(Roles = "Admin")]

    public class AdminController : BaseApiController
    {
        private readonly IAdminService _adminService;

        public AdminController(IAdminService adminService)
        {
            _adminService = adminService;
        }

        [HttpGet("users")]
        public async Task<ActionResult<List<UserDto>>> GetAllUsers()
        {
            var users = await _adminService.GetAllUsers();
            return Ok(users);
        }


        [HttpGet("user/{id}")]
        public async Task<ActionResult<UserDto>> GetUserById(string id)
        {
            var user = await _adminService.GetUserById(id);
            if (user == null)
                return NotFound($"User with ID '{id}' not found.");
            return Ok(user);
        }
    }
}
