using System.Text.Json.Serialization;

namespace WebEng.Identity.Core.Application.Models
{
    public class UserDto
    {
        public required string Id { get; set; }
        public required string DisplayName { get; set; }
        public required string Email { get; set; }
        public List<string> Roles { get; set; } = new List<string>();
        public string? Token { get; set; }
        public DateTime? RefreshTokenExpiration {  get; set; }

    }
}
