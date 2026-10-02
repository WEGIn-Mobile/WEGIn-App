import { Redirect } from 'expo-router';
import { useSession } from '@/hooks/use-session';

export default function Index() {
  const { user } = useSession();
  return <Redirect href={user ? '/feed' : '/login'} />;
}
