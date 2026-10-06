import { useLocalSearchParams } from 'expo-router';
import { PostEditor } from '@/components/post-editor';
import { EmptyState, Screen } from '@/components/common';
export default function EditPostScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  return id ? (
    <PostEditor key={id} postId={id} />
  ) : (
    <Screen>
      <EmptyState title="Publicação não encontrada" />
    </Screen>
  );
}
