import { apiFetch } from './api-fetch';
import type { Post } from '@/types/post';
import type { Page } from '@/types/api';

export function getPosts(skip = 0, userId?: string, signal?: AbortSignal) {
  const path = userId
    ? `/posts/user/${encodeURIComponent(userId)}`
    : '/posts/feed';
  return apiFetch<Page<Post>>(`${path}?take=12&skip=${skip}`, { signal });
}
export const getPost = (id: string) =>
  apiFetch<Post>(`/posts/${encodeURIComponent(id)}`);
export const createPost = (body: FormData) =>
  apiFetch<Post>('/posts', { method: 'POST', body });
export const editPost = (id: string, content: string) =>
  apiFetch<Post>(`/posts/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ content }),
  });
export const deletePost = (id: string) =>
  apiFetch<{ id: string }>(`/posts/me/${id}`, { method: 'DELETE' });
export function setPostLike(id: string, liked: boolean) {
  return apiFetch<{ liked: boolean }>(
    `/posts/${liked ? 'like' : 'unlike'}/${id}`,
    {
      method: liked ? 'POST' : 'DELETE',
    },
  );
}
