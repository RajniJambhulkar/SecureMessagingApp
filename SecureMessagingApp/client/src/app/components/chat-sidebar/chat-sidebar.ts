import { CommonModule, TitleCasePipe } from '@angular/common';
import { Component, effect, inject, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from "@angular/material/button";
import { MatMenuModule } from '@angular/material/menu';
import { AuthService } from '../../service/auth-service';
import { Router } from '@angular/router';
import { ChatService } from '../../service/chat-service';
import { User } from '../../models/user';
import { TypingIndicator } from '../typing-indicator/typing-indicator';
import { Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-chat-sidebar',
  imports: [CommonModule, MatIconModule, MatMenuModule,  FormsModule, MatButtonModule, TypingIndicator, TitleCasePipe],
  templateUrl: './chat-sidebar.html',
  
})
export class ChatSidebar implements OnInit{
  authService = inject(AuthService);
  chatService = inject(ChatService);
  router = inject(Router);
  @Output() chatSelected = new EventEmitter<void>();

menu: any;

searchText = "";

ngOnInit(): void {
    this.chatService.startConnection(this.authService.getAccessToken!);
}


logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
    this.chatService.disconnectConnection();

}

openChatWindow(user: User) {
  this.chatService.currentOpenedChat.set(user);
  this.chatService.chatMessages.set([]);
  this.chatService.isLoading.set(true);
  this.chatService.isFirstLoad = true;
  this.chatService.loadMessages(1);
  this.chatSelected.emit();
}

get filteredUsers(): User[] {

  const search = this.searchText.toLowerCase().trim();

  if (!search) {
    return this.chatService.onlineUsers();
  }

  return this.chatService.onlineUsers().filter(user =>
    user.fullName?.toLowerCase().includes(search) ||
    user.userName?.toLowerCase().includes(search)
  );
}
}
