import { Component, effect, ElementRef, inject, ViewChild } from '@angular/core';
import { ChatService } from '../../service/chat-service';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { AuthService } from '../../service/auth-service';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-chat-box',
  imports: [MatProgressSpinner, DatePipe],
  templateUrl: './chat-box.html',
  styles: [`
    .chat-box{
      scroll-behavior: smooth;
      padding: 10px;
      background-color: #f5f5f5;
      border-radius: 8px;
      display: flex;
      flex-direction: column;
      box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
      overflow:auto;
    }
    chat-box::-webkit-scrollbar{
      width: 5px;
      transition: width 0.3s;
    }

    .chat-box:hover::-webkit-scrollbar{
      width: 5px;
    }

    .chat-box::-webkit-scrollbar-track{
      background: transparent;
      border-radius: 10px;
    }
    
    .chat-box:hover::-webkit-scrollbar-thumb{
      background: grey;
      border-radius: 10px;
    }
    .chat-box::-webkit-scrollbar-thumb:hover{
      background: #555;
      border-radius: 10px;
    }
    .chat-icon{
      width: 40px;
      height:40px;
      font-size:48px;
    }
    
    `],
})
export class ChatBox {
  
  chatService = inject(ChatService);
  authService = inject(AuthService);

  private currentPage = 1;

  // chat-box.component.ts
// @ViewChild('chatContainer') chatContainer!: ElementRef;

// ngOnInit() {
//   effect(() => {
//     this.chatService.chatMessages(); // track signal

//     setTimeout(() => {
//       this.scrollToBottom();
//     }, 50); // small delay ensures DOM is painted
//   });
// }

// scrollToBottom() {
//   try {
//     this.chatContainer.nativeElement.scrollTop =
//       this.chatContainer.nativeElement.scrollHeight;
//   } catch (e) {}
// }
// }
  

  @ViewChild('chatContainer') chatContainer!: ElementRef;

  // ✅ FIX: effect in field (valid injection context)
  scrollEffect = effect(() => {
    this.chatService.chatMessages(); // track signal

    setTimeout(() => {
      this.scrollToBottom();
    }, 100);
  });

  scrollToBottom() {
    try {
      this.chatContainer.nativeElement.scrollTop =
        this.chatContainer.nativeElement.scrollHeight;
    } catch (e) {}
  }

  loadMore() {
    this.currentPage++;
    this.chatService.loadMessages(this.currentPage);
  }
}
