import { useState } from 'react';
import { Image } from 'expo-image';
import { Text, View } from 'react-native';
import { apiImageUrl } from '@/api/api-fetch';
import { useSession } from '@/hooks/use-session';

export function PostImage({
  path,
  thumbnail = false,
}: {
  path: string | null;
  thumbnail?: boolean;
}) {
  const { token } = useSession();
  const [failed, setFailed] = useState(false);
  if (!path || failed)
    return (
      <View className="aspect-square items-center justify-center bg-slate-100 p-3">
        <Text className="text-center text-xs text-slate-500">
          Imagem indisponível
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
      accessibilityLabel="Foto da publicação"
    />
  );
}
