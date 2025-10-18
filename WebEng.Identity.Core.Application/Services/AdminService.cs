using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using WebEng.Identity.Core.Application.Models;
using WebEng.Identity.Core.Application.ServicesContracts;
using WebEng.Identity.Core.Domain.Entities;

namespace WebEng.Identity.Core.Application.Services
{
    public class AdminService : IAdminService
    {
        private readonly UserManager<User> _userManager;

        public AdminService(UserManager<User> userManager)
        {
            _userManager = userManager;
        }

        public async Task<List<UserDto>> GetAllUsers()
        {
            var users = await _userManager.Users.ToListAsync();

            var userDtos = new List<UserDto>();

            foreach (var user in users)
            {
                var roles = await _userManager.GetRolesAsync(user);

                userDtos.Add(new UserDto
                {
                    Id = user.Id,
                    DisplayName = user.FirstName,
                    Email = user.Email,
                    Roles = roles.ToList(),
                    RefreshTokenExpiration = user.RefreshTokens[user.RefreshTokens.Count-1].ExpiresOn,
                });
            }

            return userDtos;
        }

        public async Task<UserDto> GetUserById(string id)
        {
            var user = await _userManager.FindByIdAsync(id);

            if (user == null)
                return null;

            var roles = await _userManager.GetRolesAsync(user);

            return new UserDto
            {
                Id = user.Id,
                DisplayName = user.FirstName,
                Email = user.Email,
                RefreshTokenExpiration = user.RefreshTokens.LastOrDefault()?.ExpiresOn,
                Roles = roles.ToList()
            };
        }
    }
}
