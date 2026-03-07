using System.Text;
using API.Data;
using API.Endpoints;
using API.Models;
using API.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(builder =>
    {
        builder.WithOrigins("http://localhost:4200", "https://localhost:4200").AllowAnyHeader().AllowAnyMethod().AllowCredentials();
    });
});

var JwtSetting = builder.Configuration.GetSection("JwtSetting");

// Add services to the container.
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi

builder.Services.AddDbContext<AppDbContext>(x => x.UseSqlite("Data Source=chat.db"));
//This registers AppDbContext (your Entity Framework database context) as a service. The lambda configures it to use SQLite as the database provider, with a local file called chat.db as the data source. 
//Anywhere in your app that needs database access can now inject AppDbContext.

builder.Services.AddIdentityCore<AppUser>() //This sets up ASP.NET Core Identity — the built-in authentication/user management system — for a AppUser type
.AddEntityFrameworkStores<AppDbContext>()  //tells Identity to store user data (accounts, roles, claims, etc.) in your AppDbContext / SQLite database
.AddDefaultTokenProviders();  //registers built-in token generators used for things like password reset links, email confirmation tokens, and two-factor authentication codes

builder.Services.AddScoped<TokenService>();

builder.Services.AddAuthentication(opt =>
{
    opt.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    opt.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    opt.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
}).AddJwtBearer(option =>
{
    option.SaveToken = true;
    option.RequireHttpsMetadata = true;
    option.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes
            (JwtSetting.GetSection("SecurityKey").Value!)),
            ValidateIssuer = false,
            ValidateAudience = false

    };
    option.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var accessToken = context.Request.Query["access_token"];
            var path = context.HttpContext.Request.Path;
            if(!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hus"))
            {
                context.Token = accessToken;
            }
            return Task.CompletedTask;
        }
    };
});
    

builder.Services.AddAuthorization(); 

builder.Services.AddOpenApi();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors(x => x.AllowAnyHeader().AllowAnyMethod().AllowCredentials().WithOrigins("http://localhost:4200", "https://localhost:4200"));
app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();
app.UseStaticFiles();
app.MapAccountEndpoint();

app.Run();


