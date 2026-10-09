import { fetchMe, fetchProfile, updateMe, uploadAvatar } from '@/api/users';
import { getFollowers, getFollowing } from '@/api/follows';
import type { ImagePickerAsset } from 'expo-image-picker';
import { appendPhoto } from './PhotoUploadService';

export async function getProfile(userId: string) {
  // The published API's profile counters are inverted; connection lists use
  // the correct direction in both API versions and are not paginated.
  const [profile, followers, following] = await Promise.all([
    fetchProfile(userId),
    getFollowers(userId),
    getFollowing(userId),
  ]);
  return { ...profile, followers: followers.length, following: following.length };
}
export const getMeProfile = () => fetchMe();

export function saveProfile(input: {
  name: string;
  username: string;
  bio: string;
}) {
  const name = input.name.trim();
  const username = input.username.trim();
  if (name.length < 4 || name.length > 60)
    throw new Error('O nome deve ter entre 4 e 60 caracteres.');
  if (!/^[a-z0-9._-]{4,60}$/.test(username))
    throw new Error(
      'Use de 4 a 60 letras minúsculas, números, ponto, hífen ou sublinhado no usuário.',
    );
  if (input.bio.length > 160)
    throw new Error('A bio deve ter até 160 caracteres.');
  return updateMe({ name, username, bio: input.bio.trim() });
}

export function saveAvatar(image: ImagePickerAsset) {
  const body = new FormData();
  appendPhoto(body, 'image', image);
  return uploadAvatar(body);
}
