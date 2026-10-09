import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

export type PostPhotoSource = 'camera' | 'library';
export type PhotoPermissionIssue = {
  source: PostPhotoSource;
  canAskAgain: boolean;
};

export class PhotoPermissionError extends Error {
  constructor(public readonly issue: PhotoPermissionIssue) {
    super(
      issue.source === 'camera'
        ? 'Permita o acesso à câmera para tirar uma foto.'
        : 'Permita o acesso às fotos para selecionar uma imagem.',
    );
    this.name = 'PhotoPermissionError';
  }
}

async function requestPermission(
  source: PostPhotoSource,
): Promise<PhotoPermissionIssue | null> {
  // Android 13+ uses the system photo picker, which grants access to each selection.
  if (
    Platform.OS === 'web' ||
    (source === 'library' &&
      Platform.OS === 'android' &&
      Number(Platform.Version) >= 33)
  ) {
    return null;
  }

  const getPermission =
    source === 'camera'
      ? ImagePicker.getCameraPermissionsAsync
      : ImagePicker.getMediaLibraryPermissionsAsync;
  const askPermission =
    source === 'camera'
      ? ImagePicker.requestCameraPermissionsAsync
      : ImagePicker.requestMediaLibraryPermissionsAsync;
  let permission = await getPermission();
  if (!permission.granted && permission.canAskAgain) {
    permission = await askPermission();
  }
  return permission.granted
    ? null
    : { source, canAskAgain: permission.canAskAgain };
}

export async function requestPublicationPhotoPermissions() {
  const issues: PhotoPermissionIssue[] = [];
  // Keep native permission dialogs sequential.
  for (const source of ['camera', 'library'] as const) {
    const issue = await requestPermission(source);
    if (issue) issues.push(issue);
  }
  return issues;
}

export async function pickPostPhoto(source: PostPhotoSource) {
  const issue = await requestPermission(source);
  if (issue) throw new PhotoPermissionError(issue);

  const options: ImagePicker.ImagePickerOptions = {
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
    preferredAssetRepresentationMode:
      ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
  };
  let result: ImagePicker.ImagePickerResult;
  try {
    result = await (source === 'camera'
      ? ImagePicker.launchCameraAsync(options)
      : ImagePicker.launchImageLibraryAsync(options));
  } catch {
    throw new Error(
      source === 'camera'
        ? 'Não foi possível abrir a câmera. Tente novamente.'
        : 'Não foi possível abrir a galeria. Tente novamente.',
    );
  }
  if (result.canceled) return null;
  const image = result.assets[0];
  if (!image) throw new Error('Selecione a foto novamente.');
  if ((image.fileSize ?? image.file?.size ?? 0) > 5 * 1024 * 1024) {
    throw new Error('Escolha uma foto de até 5 MB.');
  }
  return image;
}
