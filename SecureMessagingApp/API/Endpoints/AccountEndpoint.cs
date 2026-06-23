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
public static class AccountEndpoint{
    
    public static RouteGroupBuilder MapAccountEndpoint(this WebApplication app)
    {
        var group = app.MapGroup("/api/account").WithTags("account");

        group.MapPost("/register", async (HttpContext context, UserManager<AppUser> userManager, 
                    [FromForm] RegisterDTO registerDTO) =>
        {
            //validate the email
            var userFromDb = await userManager.FindByEmailAsync(registerDTO.Email);
            if(userFromDb is not null)
            {
                return Results.BadRequest(
                Response<string>.Failure("User already exit."));
            }
            var existingUsername =
            await userManager.FindByNameAsync(registerDTO.Username);

            if(existingUsername is not null)
            {
                return Results.BadRequest(
                Response<string>.Failure("Username already exists"));
            }

            string picture;
            if(registerDTO.ProfileImage is not null)
            {
                picture = await FileUpload.Upload(registerDTO.ProfileImage!);
                picture = $"{context.Request.Scheme}://{context.Request.Host}/uploads/{picture}";
            }
            else
            {
                picture = $"{context.Request.Scheme}://{context.Request.Host}/uploads/avatar-icon.svg";
            }
            var user = new AppUser
            {
                Email = registerDTO.Email,
                FullName = registerDTO.FullName,
                UserName = registerDTO.Username,
                ProfileImage = picture
            };

            var result = await userManager.CreateAsync(user, registerDTO.Password!);

            if (!result.Succeeded)
            {
                return Results.BadRequest(Response<string>.Failure(result.Errors.Select(x => x.Description).FirstOrDefault()!));
            }
            return Results.Ok(Response<string>.Success("", "User created successfully!"));

        }).DisableAntiforgery();

        group.MapPost("/login", async(UserManager<AppUser> UserManager, TokenService tokenService,
                LoginDTO dto) =>
        {
            if(dto is null)
            {
                return Results.BadRequest(Response<string>.Failure("Invalid login details"));
            }

            var user = await UserManager.FindByEmailAsync(dto.Email);

            if(user is null)
            {
                return Results.BadRequest(Response<string>.Failure("User not found!"));
            }

            var result = await UserManager.CheckPasswordAsync(user!, dto.Password);

            if (!result)
            {
                return Results.BadRequest(Response<string>.Failure("Invalid password"));
            }
            var token = tokenService.GenerateToken(user.Id, user.UserName!);

            return Results.Ok(Response<string>.Success(token, "Login successfully!"));

        });

        group.MapGet("/me", async (HttpContext context, UserManager<AppUser> userManager) =>
        {
            var currentLoggedInUserId = context.User.GetUserId();
            var currentLoggedInUser = await userManager.Users.SingleOrDefaultAsync(x => x.Id ==currentLoggedInUserId.ToString());
            return Results.Ok(Response<AppUser>.Success(currentLoggedInUser!, "User Fetched Successfully."));

        }).RequireAuthorization();
           
        return group;    
        
        
    }
}