import type { ImagePickerAsset } from 'expo-image-picker';
import { createPost } from '@/api/posts';
import { appendPhoto } from './PhotoUploadService';
import { t } from '@/i18n';

export async function publishPost(image: ImagePickerAsset, content: string) {
  if (content.length > 255) throw new Error(t('editor.captionTooLong'));
  const body = new FormData();
  body.append('content', content.trim());
  appendPhoto(body, 'image', image);
  return createPost(body);
}
