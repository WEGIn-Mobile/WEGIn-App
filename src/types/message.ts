import type { UserSummary } from './user';
import type { Page } from './api';

export type Message = {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  createdAt: string;
  readAt: string | null;
  deletedAt: string | null;
  sender: UserSummary;
  receiver: UserSummary;
};

export type Conversation = {
  user: UserSummary;
  unreadCount: number;
  lastMessage: Pick<
    Message,
    'id' | 'content' | 'senderId' | 'createdAt' | 'deletedAt' | 'readAt'
  >;
};

export type MessagePage = Page<Message> & {
  deletedMessages?: Pick<Message, 'id' | 'deletedAt'>[];
};

export type UnreadCount = {
  /** Conversas com pelo menos uma mensagem recebida e não lida. */
  conversations: number;
  messages: number;
};
