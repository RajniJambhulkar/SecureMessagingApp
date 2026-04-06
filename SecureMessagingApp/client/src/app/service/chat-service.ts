import { inject, Injectable, signal } from '@angular/core';
import { AuthService } from './auth-service';
import { User } from '../models/user';
import { HubConnection, HubConnectionBuilder, HubConnectionState } from '@microsoft/signalr';
import { Message } from '../models/message';

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  private authService = inject(AuthService);
  private hubUrl = 'http://localhost:5000/hubs/chat';
  onlineUsers = signal<User[]>([]);
  currentOpenedChat = signal<User | null>(null);
  chatMessages = signal<Message[]>([]);
  isLoading = signal<boolean>(true);

  isFirstLoad = true;

  private hubConnection?: HubConnection;

  private normalizeDate(dateStr: string): string {
  if (!dateStr) return new Date().toISOString();
  // Server sent UTC without Z — append it so browser parses correctly
  return dateStr.endsWith('Z') || dateStr.includes('+') ? dateStr : dateStr + 'Z';
}

private normalizeMessages(messages: Message[]): Message[] {
  return messages.map(m => ({
    ...m,
    createdDate: this.normalizeDate(m.createdDate)
  }));
}

  startConnection(token: string, senderId?: string) {
    this.hubConnection = new HubConnectionBuilder()
      .withUrl(`${this.hubUrl}?senderId=${senderId}`, {
        accessTokenFactory: () => token
      })
      .withAutomaticReconnect()
      .build();

    this.hubConnection.start()
      .then(() => console.log('SignalR Connected'))
      .catch(err => console.error('SignalR Connection Error: ', err));

    this.hubConnection.on('OnlineUsers', (user: User[]) => {
      console.log(user);
      this.onlineUsers.update(() => {
        return user.filter(user => user.userName !== this.authService.currentLoggedUser()?.userName)
      });
    });

    // this.hubConnection.on('ReceiveMessageList', (message) => {
    //   // this.chatMessages.update(messages => [...message, ...messages]);
    //   this.chatMessages.set(message);
    //   this.isLoading.update(() => false);
    // });

    this.hubConnection.on('ReceiveMessageList', (messages: Message[]) => {
      const normalized = this.normalizeMessages(messages); 
      const sorted = [...normalized].sort(
    (a, b) => new Date(a.createdDate).getTime() - new Date(b.createdDate).getTime()
  );

  if (this.isFirstLoad) {
    this.chatMessages.set(sorted);
  } else {
    // Load more: prepend older messages at top
    // this.chatMessages.update(existing => [...sorted, ...existing]);
    this.chatMessages.update(existing => {
      const existingIds = new Set(existing.map(m => m.id));
      const newOnly = sorted.filter(m => !existingIds.has(m.id));
      return [...newOnly, ...existing];
    });
  }

  this.isLoading.set(false);
});

   
    this.hubConnection.on('ReceiveNewMessage', (message: Message) => {
  const currentChat = this.currentOpenedChat();

  if (!currentChat) return;

  // ✅ FIX: only update if message belongs to current chat
   const normalized: Message = {
    ...message,
    createdDate: this.normalizeDate(message.createdDate) // ← add
  };
  
  if (
    normalized.senderId === currentChat.id?.toString() ||
    normalized.receiverId === currentChat.id?.toString()
  ) {
    this.chatMessages.update(messages => [...messages, normalized]);
  }

  document.title = '(1) New Message';
});


  }
  disconnectConnection() {
    if (this.hubConnection?.state === HubConnectionState.Connected) {
      this.hubConnection.stop().catch(err => console.error('SignalR Disconnection Error: ', err));
    }
  }

  // sendMessage(message: string) {
  //   this.chatMessages.update(messages => [...messages, {
  //     content: message,
  //     senderId: this.authService.currentLoggedUser?.id?.toString() || null,
  //     receiverId: this.currentOpenedChat()?.id?.toString() || null,
  //     createdDate: new Date().toString(),
  //     isRead: false,
  //     id: Date.now()
  //   }
  //   ])
  //   this.hubConnection?.invoke('SendMessage', {
  //     receiverId: this.currentOpenedChat()?.id,
  //     content: message
  //   }).then((id) => console.log('Message sent successfully'))
  //     .catch(err => console.error('Error sending message: ', err));
  // }

//   openChat(user: User) {
//   this.currentOpenedChat.set(user);

//   // ✅ FIX: clear previous chat messages
//   this.chatMessages.set([]);
//   this.isLoading.set(true);

//   // Load fresh messages
//   this.loadMessages(1);
// }



  sendMessage(message: string) {
  if (!message) return;

  const currentChat = this.currentOpenedChat();
  if (!currentChat) {
    console.error('No chat selected');
    return;
  }

  if (this.hubConnection?.state !== HubConnectionState.Connected) {
    console.error('SignalR not connected');
    return;
  }

  // Optimistic UI update with UNIQUE ID
  const tempMessage: Message = {
    content: message,
    senderId: this.authService.currentLoggedUser()?.id?.toString() || null,
    receiverId: currentChat.id?.toString() || null,
    createdDate: new Date().toISOString(),
    isRead: false,
    id: Date.now() // ✅ FIX: unique temporary ID
  };

  this.chatMessages.update(messages => [...messages, tempMessage]);

  this.hubConnection.invoke('SendMessage', {
    receiverId: currentChat.id,
    content: message
  })
  .then(() => console.log('Message sent successfully'))
  .catch(err => console.error('Error sending message: ', err));
}

  status(userName: string): string { //
    const currentChatUser = this.currentOpenedChat();
    if (!currentChatUser) {
      return 'offline';
    }
    const onlineUser = this.onlineUsers().find(
      user => user.userName === userName
    );
    return onlineUser?.isTyping ? 'typing...' : this.isUserOnline(userName) ? 'online' : 'offline';
  }

  typingStatus(): string {
    const currentChatUser = this.currentOpenedChat();
    return currentChatUser?.isTyping ? currentChatUser.fullName + ' is typing...' : '';
  }

  isUserOnline(userName: string): boolean {
    const onlineUser = this.onlineUsers().find(user => user.userName === this.currentOpenedChat()?.userName);
    return onlineUser ? onlineUser.isOnline : false;
  }


loadMessages(pageNumber: number) {
  const chatUserId = this.currentOpenedChat()?.id;
  if (!chatUserId) return;

  this.isLoading.set(true);
  this.isFirstLoad = pageNumber === 1; // ← tracks whether it's fresh load

  this.hubConnection?.invoke('LoadMessages', chatUserId, pageNumber)
    .catch(err => console.error('LoadMessages error:', err));
    // Don't set isLoading false here — do it in ReceiveMessageList handler
}

//   loadMessages(pageNumber: number) {
//   this.hubConnection?.invoke(
//     'LoadMessages',
//     this.currentOpenedChat()?.id,
//     pageNumber
//   )
//   .catch(err => console.error(err))
//   .finally(() => this.isLoading.set(false));
// }
}
