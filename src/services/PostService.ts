import { Platform } from 'react-native';
import type { ImagePickerAsset } from 'expo-image-picker';
import { createPost } from '@/api/posts';

export async function publishPost(image: ImagePickerAsset, content: string) {
  if (content.length > 255)
    throw new Error('A legenda deve ter até 255 caracteres.');
  if ((image.fileSize ?? image.file?.size ?? 0) > 5 * 1024 * 1024) {
    throw new Error('Escolha uma foto de até 5 MB.');
  }
  const mime = image.mimeType || 'image/jpeg';
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(mime)) {
    throw new Error('Escolha uma foto JPEG, PNG ou WebP.');
  }
  const body = new FormData();
  body.append('content', content.trim());
  if (Platform.OS === 'web') {
    if (!image.file) throw new Error('Selecione a foto novamente.');
    body.append('image', image.file, image.file.name);
  } else {
    body.append('image', {
      uri: image.uri,
      name: `foto.${mime.split('/')[1]}`,
      type: mime,
    } as unknown as Blob);
  }
  return createPost(body);
}
