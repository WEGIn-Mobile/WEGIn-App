import { Stack, useLocalSearchParams } from 'expo-router';
import { Profile } from '@/components/profile';
export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <>
      <Stack.Screen options={{ title: 'Perfil' }} />
      <Profile key={id} userId={id} />
    </>
  );
}
