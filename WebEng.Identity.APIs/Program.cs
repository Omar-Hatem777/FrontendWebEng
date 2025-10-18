
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using WebEng.Identity.APIs.Middlewares;
using WebEng.Identity.Core.Application.Models;
using WebEng.Identity.Core.Application.Services;
using WebEng.Identity.Core.Application.ServicesContracts;
using WebEng.Identity.Core.Domain.Entities;
using WebEng.Identity.Infra.Persistance.Identity;
using YourProject.Infrastructure.Identity;

namespace WebEng.Identity.APIs
{
    public class Program
    {
        
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            // Add services to the container.

            builder.Services.AddControllers();
            
            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddSwaggerGen();

            builder.Services.AddCors(options =>
            {
                options.AddPolicy("AllowFrontend", policy =>
                {
                    policy.WithOrigins("http://127.0.0.1:5502")
                          .AllowAnyHeader()
                          .AllowAnyMethod()
                          .AllowCredentials();
                    
                });
            });

            #region DB Connection DI
            builder.Services.AddDbContext<WebEngIdentityDbContext>((optionsBuilder) =>
                 {
                     optionsBuilder
                     .UseSqlServer(builder.Configuration.GetConnectionString("WebEngContext"));
                 });
            #endregion

            #region Identity DI 
            builder.Services.AddIdentity<User, IdentityRole>((identityOptions) =>
               {
               }).AddEntityFrameworkStores<WebEngIdentityDbContext>();

            builder.Services.AddScoped(typeof(IPasswordHasher<User>), typeof(Argon2PasswordHasher<User>));


            builder.Services.AddScoped(typeof(IAuthService), typeof(AuthService));
            builder.Services.AddScoped(typeof(IAdminService), typeof(AdminService));

            builder.Services.Configure<JwtSettings>(builder.Configuration.GetSection("jwtSettings")); 

            builder.Services.AddAuthentication((authenticationOptions) =>
            {
                authenticationOptions.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                authenticationOptions.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
            })
                .AddJwtBearer(JwtBearerDefaults.AuthenticationScheme, (configurationOptions) =>
                {
                    configurationOptions.TokenValidationParameters = new TokenValidationParameters()
                    {
                        ValidateAudience = true,
                        ValidateIssuer = true,
                        ValidateIssuerSigningKey = true,
                        ValidateLifetime = true,

                        ClockSkew = TimeSpan.FromMinutes(0),
                        ValidIssuer = builder.Configuration["jwtSettings:Issuer"],
                        ValidAudience = builder.Configuration["jwtSettings:Audience"],
                        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["jwtSettings:Key"]!))
                    };
                    configurationOptions.Events = new JwtBearerEvents()
                    {
                        OnMessageReceived = context =>
                        {
                            var authorizationHeader = context.Request.Headers["Authorization"].ToString();

                            if (authorizationHeader.StartsWith(JwtBearerDefaults.AuthenticationScheme, StringComparison.OrdinalIgnoreCase))
                            {
                                context.Token = authorizationHeader.Substring(JwtBearerDefaults.AuthenticationScheme.Length).Trim();
                            }
                            return Task.CompletedTask;
                        }
                    };
                });

            #endregion

            var app = builder.Build();

            app.UseMiddleware<ExceptionHandlerMiddleware>();

            // Configure the HTTP request pipeline.
            if (app.Environment.IsDevelopment())
            {
                app.UseSwagger();
                app.UseSwaggerUI();
            }


            //app.UseHttpsRedirection();

            app.UseCors("AllowFrontend");


            app.UseAuthentication();

            app.UseAuthorization();

            app.MapControllers();

            app.Run();
        }
    }
}
