using Microsoft.AspNetCore.Identity;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace WebEng.Identity.Core.Domain.Entities
{
    public class User : IdentityUser
    {
        public string FirstName { get; set; } = null!;

        public List<RefreshToken>? RefreshTokens { get; set; } = new();

    }
}
