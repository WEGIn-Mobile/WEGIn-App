import { fetchMe, fetchProfile } from '@/api/users';

export const getProfile = (userId: string) => fetchProfile(userId);
export const getMeProfile = () => fetchMe();
