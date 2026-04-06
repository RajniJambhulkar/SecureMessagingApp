import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ChatService } from '../../service/chat-service';
import { ChatBox } from "../chat-box/chat-box";

@Component({
  selector: 'app-chat-window',
  imports: [CommonModule, FormsModule, MatIconModule, ChatBox],
  templateUrl: './chat-window.html',
  styles: ``,
})
export class ChatWindow {

  chatService = inject(ChatService);
  message : string = '';


sendMessage() {
  if(!this.message) return;
  this.chatService.sendMessage(this.message);
  this.message = '';
}
}
