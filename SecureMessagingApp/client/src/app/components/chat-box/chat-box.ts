import { AfterViewChecked, Component, effect, ElementRef, inject, signal, ViewChild } from '@angular/core';
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
export class ChatBox implements AfterViewChecked{
  
  @ViewChild('chatContainer') chatContainer!: ElementRef;

  chatService = inject(ChatService);
  authService = inject(AuthService);

  
  // ✅ FIX: effect in field (valid injection context)
  scrollEffect = effect(() => {
    this.chatService.chatMessages(); // track signal

     if (this.chatService.autoscrollEnabled()) {
      setTimeout(() => {
      this.scrollToBottom();
    }, 100);
  }
  });

 
//   loadMoreMessages() {
//   this.chatService.autoscrollEnabled.set(false);

//   this.pageNumber++;

//   this.chatService.loadMessages(this.pageNumber);
// }

loadMoreMessages() {

  this.chatService.autoscrollEnabled.set(false);

  const currentUser =
      this.chatService.currentOpenedChat();

  if(!currentUser) return;

  const cache =
      this.chatService.getCachedChat(currentUser.id!.toString());

  const nextPage = (cache?.pageNumber ?? 1) + 1;

  this.chatService.loadMessages(nextPage);

}

  ngAfterViewChecked(): void {
    if(this.chatService.autoscrollEnabled()){
      this.scrollToBottom();
    }
  }

   scrollToBottom() {
      this.chatService.autoscrollEnabled.set(true);
      this.chatContainer.nativeElement.scrollTop =
      this.chatContainer.nativeElement.scrollHeight;
      behavior:'smooth'

    
  }
  scrollTop(){
      this.chatService.autoscrollEnabled.set(false);
      this.chatContainer.nativeElement.scrollTop = 0;
      behavior:'smooth'
  }

}
