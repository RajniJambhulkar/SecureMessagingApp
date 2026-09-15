using System.Data.SqlTypes;
using API.DTO;
using API.Extensions;
using API.Models;
using API.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Query.SqlExpressions;
namespace API.Endpoints;

[ApiController]
[Route("/api/account")]
public class AccountController: ControllerBase
{
    public readonly UserManager<AppUser> _userManager;
    public readonly TokenService _tokenService;

    public AccountController(UserManager<AppUser> userManager, TokenService tokenService)
    {
        _userManager = userManager;
        _tokenService = tokenService;
    }

    //api/account/register
    [HttpPost("register")]
    [IgnoreAntiforgeryToken]
    public async Task<IActionResult> Register([FromForm] RegisterDTO registerDTO)
    {
        //check email if present
        var userFromDb = await _userManager.FindByEmailAsync(registerDTO.Email);
        if(userFromDb is not null)
        {
            return BadRequest(Response<string>.Failure("User already exists!"));
        }
        //check whether username already exist
        var existingUsername = await _userManager.FindByNameAsync(registerDTO.Username);
        if(existingUsername is not null)
        {
            return BadRequest(Response<string>.Failure("Username already exists!"));           
        }
        //Handle profile image
        string? picture = null;
        if(registerDTO.ProfileImage is not null)
        {
            picture = await FileUpload.Upload(registerDTO.ProfileImage);
            picture = $"{Request.Scheme}://{Request.Host}/uploads/{picture}";
        }
        else
        {
            picture = $"{Request.Scheme}://{Request.Host}/uploads/avatar-icon.svg";
        }
        //create AppUser
        AppUser user = new AppUser
        {
            FullName = registerDTO.FullName,
            ProfileImage = picture,
            Email = registerDTO.Email,
            UserName = registerDTO.Username
        };
        //create user using asp.net core identity
        var result = await _userManager.CreateAsync(user, registerDTO.Password);
        //check identity errors
        if (!result.Succeeded)
        {
            var error = result.Errors.Select(e => e.Description).FirstOrDefault();                                                                                  
            return BadRequest(Response<string>.Failure(error ?? "user creation failed!"));
        }
        return Ok(Response<string>.Success("", "User created successfully!"));
        

    }
    //api/account/login
    [HttpPost("login")]
    [IgnoreAntiforgeryToken]
    public async Task<IActionResult> login([FromBody] LoginDTO loginDTO)
    {
        //check whether user exist or not
        var userFromDb = await _userManager.FindByEmailAsync(loginDTO.Email);
        if(userFromDb is null)
        {
            return NotFound(Response<string>.Failure("User not found!"));
        }
        //check password
        var result = await _userManager.CheckPasswordAsync(userFromDb, loginDTO.Password);
        if (!result)
        {
            return BadRequest(Response<string>.Failure("Password does not match!"));
        }
        //generate jwt
        var token = _tokenService.GenerateToken(userFromDb.Id, userFromDb.UserName);
        return Ok(Response<string>.Success(token, "User logged in successfully!"));

    }
    //api/account/me
    [HttpGet("me")]
    public async Task<IActionResult> Me()
    {
        //get the current logged in user's id
        var currentLoggedInUserId = User.GetUserId();
        var currentLoggedInUser = await _userManager.Users.SingleOrDefaultAsync(x => x.Id == currentLoggedInUserId.ToString());
        return Ok(Response<AppUser>.Success(currentLoggedInUser!, "User fetched successfully!"));
    }
}