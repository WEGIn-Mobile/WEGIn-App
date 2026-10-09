import { apiFetch } from './api-fetch';
import type { UserSummary } from '@/types/user';

export const getFollowing = (id = 'me', signal?: AbortSignal) =>
  apiFetch<UserSummary[]>(`/following/${encodeURIComponent(id)}`, { signal });
export const getFollowers = (id: string, signal?: AbortSignal) =>
  apiFetch<UserSummary[]>(`/followers/${encodeURIComponent(id)}`, { signal });
export const setFollowing = (id: string, following: boolean) =>
  apiFetch<{ following: boolean; followingId: string }>(
    `/${following ? 'follow' : 'unfollow'}/${encodeURIComponent(id)}`,
    { method: 'POST' },
  );
