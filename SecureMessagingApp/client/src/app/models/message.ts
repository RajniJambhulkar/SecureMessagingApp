export interface Message {
  id: number;
  senderId: string | null;
  receiverId: string | null;
  content: string;
  createdDate: string;
  isRead: boolean;
}