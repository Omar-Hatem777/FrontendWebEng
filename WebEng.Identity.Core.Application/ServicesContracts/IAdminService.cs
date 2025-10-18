using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using WebEng.Identity.Core.Application.Models;
using WebEng.Identity.Core.Domain.Entities;

namespace WebEng.Identity.Core.Application.ServicesContracts
{
    public interface IAdminService
    {
        Task<List<UserDto>> GetAllUsers();

        Task<UserDto> GetUserById(string id);

    }
}
