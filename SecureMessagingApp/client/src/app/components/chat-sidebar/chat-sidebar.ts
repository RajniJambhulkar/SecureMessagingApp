import { CommonModule, TitleCasePipe } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from "@angular/material/button";
import { MatMenuModule } from '@angular/material/menu';
import { AuthService } from '../../service/auth-service';
import { Router } from '@angular/router';
import { ChatService } from '../../service/chat-service';
import { User } from '../../models/user';

@Component({
  selector: 'app-chat-sidebar',
  imports: [CommonModule, MatIconModule, MatMenuModule, MatButtonModule, TitleCasePipe],
  templateUrl: './chat-sidebar.html',
  
})
export class ChatSidebar implements OnInit{

  authService = inject(AuthService);
  chatService = inject(ChatService);
  router = inject(Router);

menu: any;

logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
    this.chatService.disconnectConnection();

}

 ngOnInit(): void {
    this.chatService.startConnection(this.authService.getAccessToken!);
  }

//   openChatWindow(user: User) {
//     this.chatService.currentOpenedChat.set(user);
//     this.chatService.loadMessages(1);
// }

openChatWindow(user: User) {
  this.chatService.currentOpenedChat.set(user);
  this.chatService.chatMessages.set([]);
  this.chatService.isLoading.set(true);
  this.chatService.isFirstLoad = true;
  this.chatService.loadMessages(1);
}
}
