import { fetchMe, fetchProfile, updateMe, uploadAvatar } from '@/api/users';
import { getFollowers, getFollowing } from '@/api/follows';
import type { ImagePickerAsset } from 'expo-image-picker';
import { appendPhoto } from './PhotoUploadService';
import { t } from '@/i18n';

export async function getProfile(userId: string) {
  // The published API's profile counters are inverted; connection lists use
  // the correct direction in both API versions and are not paginated.
  const [profile, followers, following] = await Promise.all([
    fetchProfile(userId),
    getFollowers(userId),
    getFollowing(userId),
  ]);
  return {
    ...profile,
    followers: followers.length,
    following: following.length,
  };
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
    throw new Error(t('profileEditor.nameLength'));
  if (!/^[a-z0-9._-]{4,60}$/.test(username))
    throw new Error(t('profileEditor.usernameFormat'));
  if (input.bio.length > 160) throw new Error(t('profileEditor.bioTooLong'));
  return updateMe({ name, username, bio: input.bio.trim() });
}

export function saveAvatar(image: ImagePickerAsset) {
  const body = new FormData();
  appendPhoto(body, 'image', image);
  return uploadAvatar(body);
}
