import { Profile } from '@/components/profile';
import { useSession } from '@/hooks/use-session';
export default function MyProfileScreen() {
  const { user } = useSession();
  return user ? <Profile userId={user.id} /> : null;
}
