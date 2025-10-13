using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Text;
using System.Threading.Tasks;
using WebEng.Identity.Core.Domain.Entities;

namespace WebEng.Identity.Infra.Persistance.Identity
{
    public class WebEngIdentityDbContext : IdentityDbContext<User>
    {
        public WebEngIdentityDbContext(DbContextOptions<WebEngIdentityDbContext> options)
            : base(options)
        {
            
        }

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);
        }
    }
}
