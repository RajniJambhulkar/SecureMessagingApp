import { Component } from '@angular/core';
 import { signal } from '@angular/core';
import { ChatSidebar } from "../components/chat-sidebar/chat-sidebar";
import { ChatWindow } from "../components/chat-window/chat-window";
import { ChatRightSidebar } from "../components/chat-right-sidebar/chat-right-sidebar";

@Component({
  selector: 'app-chat',
  imports: [ChatSidebar, ChatWindow, ChatRightSidebar],
  templateUrl: './chat.html',
  styleUrl: './chat.css',
})
export class Chat {
 

showChatWindow = signal(false);

openChat() {
  this.showChatWindow.set(true);
}

goBack() {
  this.showChatWindow.set(false);
}
}
