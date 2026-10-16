import { Linking, Text, View } from 'react-native';
import type {
  PhotoPermissionIssue,
  PostPhotoSource,
} from '@/services/PostPhotoService';
import { useI18n } from '@/i18n';
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
  const { t } = useI18n();
  return issues.map(({ source, canAskAgain }) => (
    <View key={source} className="gap-3 rounded-xl bg-surface p-4">
      <Text className="leading-6 text-fg-soft">
        {source === 'camera'
          ? t('photos.noticeCamera')
          : t('photos.noticeLibrary')}{' '}
        {!canAskAgain && t('photos.openSettingsHint')}
      </Text>
      <Button
        title={
          canAskAgain
            ? source === 'camera'
              ? t('photos.allowCamera')
              : t('photos.allowPhotos')
            : t('photos.openSettings')
        }
        secondary
        disabled={disabled}
        onPress={() => {
          if (canAskAgain) onRetry(source);
          else {
            void Linking.openSettings().catch(() =>
              onError(t('photos.settingsFailed')),
            );
          }
        }}
      />
    </View>
  ));
}
