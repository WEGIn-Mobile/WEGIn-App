import { useLocalSearchParams } from 'expo-router';
import { Comments } from '@/components/comments';

export default function CommentsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <Comments key={id} postId={id} />;
}
