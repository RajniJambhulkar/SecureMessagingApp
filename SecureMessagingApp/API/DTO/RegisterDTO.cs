using System.ComponentModel.DataAnnotations;

namespace API.DTO;
public class RegisterDTO
{
    [Required]
    public string FullName {get; set;} = "";
    [Required]
    [EmailAddress]
    public string Email { get; set; } = "";
    [Required]
    [MinLength(6)]
    public string Password { get; set; } = "";
    [Required]
    public string Username { get; set; } = "";
    public IFormFile? ProfileImage { get; set; }
}