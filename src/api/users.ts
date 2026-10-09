import { apiFetch } from './api-fetch';
import type { CurrentUser, User, UserSummary } from '@/types/user';
import type { Page } from '@/types/api';

export const fetchProfile = (id: string) =>
  apiFetch<User>(`/users/${encodeURIComponent(id)}`);
export const fetchMe = () => apiFetch<CurrentUser>('/users/me');
export const updateMe = (input: {
  bio: string;
  name: string;
  username: string;
}) =>
  apiFetch<CurrentUser>('/users/me', {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
export const uploadAvatar = (body: FormData) =>
  apiFetch<CurrentUser>('/users/me/avatar', { method: 'POST', body });
export const removeAvatar = () =>
  apiFetch<CurrentUser>('/users/me/avatar', { method: 'DELETE' });
export function searchUsers(q: string, skip = 0, signal?: AbortSignal) {
  return apiFetch<Page<UserSummary>>(
    `/users/search?q=${encodeURIComponent(q)}&take=20&skip=${skip}`,
    { signal },
  );
}
