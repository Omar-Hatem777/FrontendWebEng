using LinkDev.Talabat.APIs.Controllers.Base;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
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
        public IActionResult GetAllUsers()
        {
            return Ok(new { message = "Admin access granted" });
        }
    }
}
