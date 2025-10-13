using System.Text.Json.Serialization;

namespace WebEng.Identity.Core.Application.Models
{
    public class UserDto
    {
        public required string Id { get; set; }
        public required string DisplayName { get; set; }
        public required string Email { get; set; }
        public required string Token { get; set; }

        [JsonIgnore]// msh 3ayzha trg3 fl response
        public string? RefreshToken {  get; set; }

        public DateTime RefreshTokenExpiration {  get; set; }
    }
}
