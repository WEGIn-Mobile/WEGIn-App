import { Image } from 'expo-image';
import { Text, View } from 'react-native';
import type { UserSummary } from '@/types/user';

export function Avatar({
  user,
  large = false,
}: {
  user: Pick<UserSummary, 'name' | 'avatarUrl'>;
  large?: boolean;
}) {
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
          source={{ uri: user.avatarUrl }}
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
