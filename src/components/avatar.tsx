import { Image } from 'expo-image';
import { apiImageUrl } from '@/api/api-fetch';
import { useSession } from '@/hooks/use-session';
import { Text, View } from 'react-native';
import type { UserSummary } from '@/types/user';

export function Avatar({
  user,
  large = false,
}: {
  user: Pick<UserSummary, 'name' | 'avatarUrl'>;
  large?: boolean;
}) {
  const { token } = useSession();
  const protectedPhoto = user.avatarUrl?.startsWith('/api/users/') ?? false;
  const initials = user.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();
  return (
    <View
      className={`items-center justify-center overflow-hidden rounded-full bg-brand-50 ${large ? 'h-20 w-20' : 'h-11 w-11'}`}
    >
      {user.avatarUrl ? (
        <Image
          source={{
            uri: protectedPhoto ? apiImageUrl(user.avatarUrl) : user.avatarUrl,
            headers:
              protectedPhoto && token
                ? { Authorization: `Bearer ${token}` }
                : undefined,
          }}
          style={{ width: '100%', height: '100%' }}
          contentFit="cover"
          accessibilityLabel={`Foto de ${user.name}`}
        />
      ) : (
        <Text
          className={`font-bold text-brand-500 ${large ? 'text-2xl' : 'text-sm'}`}
        >
          {initials}
        </Text>
      )}
    </View>
  );
}
