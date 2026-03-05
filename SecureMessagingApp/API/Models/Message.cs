namespace API.Models;
public class Message
{
    public int Id {get; set;}
    public string? SenderId {get; set;}
    public string? ReceiverId {get; set;}
    public string? Content {get; set;}
    public DateTime CreatedTime {get; set;}
    public bool IsRead {get; set;}

    //Navigation Properties
    public AppUser? Sender {get; set;}
    public AppUser? Receiver {get; set;}


}