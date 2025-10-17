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

        public async Task DeleteAllUsers()
        {
            var users = await _userManager.Users.ToListAsync();

            foreach (var user in users)
            {
                var result = await _userManager.DeleteAsync(user);
                if (!result.Succeeded)
                {
                    var errors = string.Join("; ", result.Errors.Select(e => $"{e.Code}: {e.Description}"));
                    throw new InvalidOperationException($"Failed to delete user {user.Id}: {errors}");
                }
            }
        }

        public async Task<int> DeleteUserById(int id)
        {
            var user = await _userManager.Users
        .FirstOrDefaultAsync(u => u.Id == id.ToString());

            if (user == null)
                return 0;

            var result = await _userManager.DeleteAsync(user);
            if (!result.Succeeded)
            {
                var errors = string.Join("; ", result.Errors.Select(e => $"{e.Code}: {e.Description}"));
                throw new InvalidOperationException($"Failed to delete user {user.Id}: {errors}");
            }

            return 1;
        }

        public async Task<List<UserDto>> GetAllUsers()
        {
            var users = await _userManager.Users.Select(
                u => new UserDto
                {
                    Id = u.Id,
                    DisplayName = u.FirstName,
                    Email = u.Email
                }
                )
                .ToListAsync();

            return users;
        }

        public async Task<UserDto> GetUserById(string id)
        {
            var user = await _userManager.Users
                .Where(u => u.Id==id)
                .Select(
                u => new UserDto {
                    Id = u.Id,
                    DisplayName = u.FirstName,
                    Email = u.Email
                })
                .FirstOrDefaultAsync();
            return user;
        }
    }
}
