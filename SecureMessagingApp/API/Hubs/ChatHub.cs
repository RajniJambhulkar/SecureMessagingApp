using System;
using System.Collections.Concurrent;
using API.Data;
using API.DTO;
using API.Extensions;
using API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.SignalR;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp.Syntax;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Query.SqlExpressions;

namespace API.Hubs;

[Authorize]
public class ChatHub(UserManager<AppUser> userManager, AppDbContext context) : Hub
{
    //This is a Thread safe dictionary used to store the online users. stores (username, onineUserDto). ConcurrentDictionary prevents race conditions.
    public static readonly ConcurrentDictionary<string, OnlineUserDto> onlineUsers = new();

    //OnConnectedAsync() : This method runs automatically when a user connects to the hub.
    public override async Task OnConnectedAsync()
    {
        
        var httpContext = Context.GetHttpContext();
        var receiverId = httpContext?.Request.Query["senderId"].ToString();  //Gets query parameters from the connection URL.

        var userName = Context.User!.Identity!.Name;  //SignalR extracts the username from the JWT token.
        var currentUser = await userManager.FindByNameAsync(userName!); //get currentUser from database
        var connectionId = Context.ConnectionId;

        if (onlineUsers.ContainsKey(userName!))
        {
            onlineUsers[userName!].ConnectionId = connectionId; //onlineUserDto.ConnectionId
        }
        else
        {    //if user is not present in onlineUsers dictionary, then add him
            var user = new OnlineUserDto
            {
                ConnectionId = connectionId,
                UserName = userName,
                ProfileImage = currentUser!.ProfileImage,
                FullName = currentUser!.FullName

            };
            onlineUsers.TryAdd(userName!, user);

            await Clients.AllExcept(connectionId).SendAsync("Notify", currentUser); //notify other users that currentUser came online
        }
        if (!string.IsNullOrEmpty(receiverId))
        {
            await LoadMessages(receiverId);
        }
        await Clients.All.SendAsync("OnlineUsers", await GetAllUsers()); //send updated users to all clients

    }
    public async Task LoadMessages(string recipientId, int pageNumber = 1)
    {
         int pageSize = 10;
         var username = Context.User!.Identity!.Name;
         var currentUser = await userManager.FindByNameAsync(username!);
        
        if(currentUser is null)
        {
            return;
        }

        List<MessageResponseDto> messages = await context.Messages
        .Where(x => x.ReceiverId == currentUser!.Id && 
        x.SenderId == recipientId || x.SenderId == currentUser!.Id 
        && x.ReceiverId == recipientId)
        .OrderByDescending(x => x.CreatedDate)
        .Select(x => new MessageResponseDto
        {
            Id = x.Id,
            Content = x.Content,
            CreatedDate = x.CreatedDate,
            ReceiverId = x.ReceiverId,
            SenderId = x.SenderId
        })
        .ToListAsync();

        

        foreach(var message in messages)
        {
            var msg = await context.Messages.FirstOrDefaultAsync(x => x.Id == message.Id);

            if(msg != null && msg.ReceiverId == currentUser.Id)
            {
                msg.IsRead = true;
                await context.SaveChangesAsync();
            }
        }
        await Clients.User(currentUser.Id)
        .SendAsync("ReceiveMessageList", messages);
    }

    public async Task SendMessage(MessageRequestDto message)
    {
        var senderId = Context.User!.Identity!.Name; //SignalR reads username from the token
        var recipientId = message.ReceiverId;

        var newMsg = new Message  //Create Message
        {
            Sender = await userManager.FindByNameAsync(senderId!), //returns the user (Sender = Navigation property)
            Receiver = await userManager.FindByIdAsync(recipientId!), //returns the user (Receiver = Navigation property)
            IsRead = false,
            CreatedDate = DateTime.UtcNow,
            Content = message.Content
        };
        context.Messages.Add(newMsg);   //adding to the DbSet<Message> Messages
        await context.SaveChangesAsync();  //Save to Db

        await Clients.User(recipientId!).SendAsync("ReceiveNewMessage", newMsg); //SignalR sends the message instantly to the receiver.

    }

    public async Task NotifyTyping(string recipientUserName)
    {
        var senderUserName = Context.User!.Identity!.Name;
        if(senderUserName is null)
        {
            return;
        }
        //get receiver's connection id
        var connectionId = onlineUsers.Values.FirstOrDefault
                            (x => x.UserName == recipientUserName)?.ConnectionId;

        if(connectionId != null)
        {
            //send typing notification to the recever.
            await Clients.Client(connectionId).SendAsync("NotifyTypingToUser", senderUserName);
        }
    }

//OnDisconnectedAsync : Runs when the user disconnects  (browser closed, logout, internet lost)
    public override async Task OnDisconnectedAsync(Exception? exception)
    { 
        var username = Context.User!.Identity!.Name;
        onlineUsers.TryRemove(username!, out _);   //remove the user from onlineUsers dictinary
        await Clients.All.SendAsync("OnlineUsers", await GetAllUsers());
    }
     
    // private async Task<IEnumerable<OnlineUserDto>> GetAllUsers()
    // {
    //     var username = Context.User!.GetUserName();
    //     var onlineUsersSet = new HashSet<string>(onlineUsers.Keys);

    //     var users = await userManager.Users
    //     .Select(u => new OnlineUserDto
    //     {
    //         Id = u.Id,
    //         UserName = u.UserName,
    //         FullName = u.FullName,
    //         ProfileImage = u.ProfileImage,
    //         IsOnline = onlineUsersSet.Contains(u.UserName),
    //         UnreadCount = context.Messages.Count(x => x.ReceiverId == username && 
    //         x.SenderId == u.Id && !x.IsRead)

    //     }).OrderByDescending(u=> u.IsOnline)
    //         .ToListAsync();

    //     return users;
    // }
    //far better than the above logic. For 100 users
    //the query instead of running 100 times, it will only run for 2 times
    //Entity Framework can only translate certain expressions into SQL. 
    // Operations involving in-memory collections like HashSet or Dictionary cannot be translated. 
    // So I separated database queries from in-memory logic. 
    // This also prevents N+1 queries and improves performance.
    private async Task<IEnumerable<OnlineUserDto>> GetAllUsers()
    {
        var username = Context.User!.GetUserName();
        //Get users
        var users = await userManager.Users  //Pure SQL logic
            .Select(u => new
            {
                u.Id,
                u.UserName,
                u.FullName,
                u.ProfileImage
            })
            .ToListAsync();
        //Get unread counts of users
        var unreadCounts = await context.Messages
            .Where(x => x.ReceiverId == username && !x.IsRead)
            .GroupBy(x => x.SenderId!)
            .Select(g => new
            {
                SenderId = g.Key,
                Count = g.Count()
            })
            .ToDictionaryAsync(x => x.SenderId!, x => x.Count);
        //get online user's usernames
        var onlineUsersSet = new HashSet<string>(onlineUsers.Keys);

        //combine them. result = List<OnlineUserDto>
        var result = users.Select(u => new OnlineUserDto  
        {
            Id = u.Id,
            UserName = u.UserName,
            FullName = u.FullName,
            ProfileImage = u.ProfileImage,
            IsOnline = onlineUsersSet.Contains(u.UserName!),     //in memory logic
            UnreadCount = unreadCounts.ContainsKey(u.Id) ? unreadCounts[u.Id] : 0
        })
        .OrderByDescending(u => u.IsOnline)
        .ToList();

        return result;
    }



}
