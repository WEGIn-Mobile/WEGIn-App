import { Platform } from 'react-native';
import type { ImagePickerAsset } from 'expo-image-picker';
import { t } from '@/i18n';

export function appendPhoto(
  body: FormData,
  field: string,
  image: ImagePickerAsset,
) {
  if ((image.fileSize ?? image.file?.size ?? 0) > 5 * 1024 * 1024)
    throw new Error(t('photos.tooLarge'));
  const mime = image.mimeType || 'image/jpeg';
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(mime))
    throw new Error(t('photos.invalidType'));
  if (Platform.OS === 'web') {
    if (!image.file) throw new Error(t('photos.reselect'));
    body.append(field, image.file, image.file.name);
  } else {
    body.append(field, {
      uri: image.uri,
      name: `foto.${mime.split('/')[1]}`,
      type: mime,
    } as unknown as Blob);
  }
}
