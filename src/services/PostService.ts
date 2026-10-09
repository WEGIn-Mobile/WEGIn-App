import type { ImagePickerAsset } from 'expo-image-picker';
import { createPost } from '@/api/posts';
import { appendPhoto } from './PhotoUploadService';

export async function publishPost(image: ImagePickerAsset, content: string) {
  if (content.length > 255)
    throw new Error('A legenda deve ter até 255 caracteres.');
  const body = new FormData();
  body.append('content', content.trim());
  appendPhoto(body, 'image', image);
  return createPost(body);
}
