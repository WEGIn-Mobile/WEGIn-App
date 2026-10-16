import { useState } from 'react';
import { Image } from 'expo-image';
import { Text, View } from 'react-native';
import { apiImageUrl } from '@/api/api-fetch';
import { useSession } from '@/hooks/use-session';
import { useI18n } from '@/i18n';

export function PostImage({
  path,
  thumbnail = false,
}: {
  path: string | null;
  thumbnail?: boolean;
}) {
  const { token } = useSession();
  const { t } = useI18n();
  const [failed, setFailed] = useState(false);
  if (!path || failed)
    return (
      <View className="aspect-square items-center justify-center bg-surface-strong p-3">
        <Text className="text-center text-xs text-muted">
          {t('common.imageUnavailable')}
        </Text>
      </View>
    );
  return (
    <Image
      source={{
        uri: apiImageUrl(path),
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      }}
      style={{ width: '100%', aspectRatio: 1 }}
      contentFit={thumbnail ? 'cover' : 'contain'}
      onError={() => setFailed(true)}
      accessibilityLabel={t('post.photo')}
      transition={250}
    />
  );
}
