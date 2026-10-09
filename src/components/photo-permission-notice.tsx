import { Linking, Text, View } from 'react-native';
import type {
  PhotoPermissionIssue,
  PostPhotoSource,
} from '@/services/PostPhotoService';
import { Button } from './common';

export function PhotoPermissionNotice({
  issues,
  disabled,
  onRetry,
  onError,
}: {
  issues: PhotoPermissionIssue[];
  disabled: boolean;
  onRetry: (source: PostPhotoSource) => void;
  onError: (message: string) => void;
}) {
  return issues.map(({ source, canAskAgain }) => (
    <View key={source} className="gap-3 rounded-xl bg-slate-50 p-4">
      <Text className="leading-6 text-slate-600">
        {source === 'camera'
          ? 'Permita o acesso à câmera para tirar fotos.'
          : 'Permita o acesso às fotos para selecionar uma imagem.'}{' '}
        {!canAskAgain &&
          'Ative a permissão nas configurações do celular e tente novamente.'}
      </Text>
      <Button
        title={
          canAskAgain
            ? source === 'camera'
              ? 'Permitir câmera'
              : 'Permitir fotos'
            : 'Abrir configurações'
        }
        secondary
        disabled={disabled}
        onPress={() => {
          if (canAskAgain) onRetry(source);
          else {
            void Linking.openSettings().catch(() =>
              onError('Não foi possível abrir as configurações do celular.'),
            );
          }
        }}
      />
    </View>
  ));
}
