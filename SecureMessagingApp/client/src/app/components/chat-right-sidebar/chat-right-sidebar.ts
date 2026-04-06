import { Component, inject, signal } from '@angular/core';
import { ChatService } from '../../service/chat-service';
import { User } from '../../models/user';
import { TitleCasePipe } from '@angular/common';


@Component({
  selector: 'app-chat-right-sidebar',
  imports: [TitleCasePipe],
  templateUrl: './chat-right-sidebar.html',
  styles: ``,
})
export class ChatRightSidebar {

  chatService = inject(ChatService);

  selectedUser = signal<User | null>(null);
isSidebarOpen = signal(false);

openSidebar(user: User) {
  this.selectedUser.set(user);
  this.isSidebarOpen.set(true);
}

closeSidebar() {
  this.isSidebarOpen.set(false);
}
}
