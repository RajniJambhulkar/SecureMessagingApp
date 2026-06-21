import { CommonModule } from '@angular/common';
import { Component, ElementRef, inject, ViewChild } from '@angular/core';
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
 @ViewChild('chatContainer') chatContainer?:ElementRef;
  chatService = inject(ChatService);
  message : string = '';


sendMessage() {
  if(!this.message) return;
  this.chatService.sendMessage(this.message);
  this.message = '';
  this.scrollToBottom();
}

private scrollToBottom(){
  if(this.chatContainer){
    this.chatContainer.nativeElement.scrollTop = 
    this.chatContainer.nativeElement.scrollHeight;
  }
}
}
