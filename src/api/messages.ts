import { apiFetch } from './api-fetch';
import type { Page } from '@/types/api';
import type { Conversation, Message, MessagePage } from '@/types/message';

export const getConversations = (skip = 0, signal?: AbortSignal) =>
  apiFetch<Page<Conversation>>(`/messages?take=20&skip=${skip}`, { signal });
export const getMessages = (userId: string, skip = 0, signal?: AbortSignal) =>
  apiFetch<MessagePage>(
    `/messages/${encodeURIComponent(userId)}?take=30&skip=${skip}`,
    { signal },
  );
export const createMessage = (userId: string, content: string) =>
  apiFetch<Message>(`/messages/${encodeURIComponent(userId)}`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  });
export const markConversationRead = (
  userId: string,
  throughId: string,
  signal?: AbortSignal,
) =>
  apiFetch<void>(`/messages/${encodeURIComponent(userId)}/read`, {
    method: 'PATCH',
    signal,
    body: JSON.stringify({ throughId }),
  });
export const deleteMessage = (id: string) =>
  apiFetch<Message>(`/messages/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
