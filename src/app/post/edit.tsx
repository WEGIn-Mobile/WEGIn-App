import { useLocalSearchParams } from 'expo-router';
import { PostEditor } from '@/components/post-editor';
import { EmptyState, Screen } from '@/components/common';
import { useI18n } from '@/i18n';
export default function EditPostScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { t } = useI18n();
  return id ? (
    <PostEditor key={id} postId={id} />
  ) : (
    <Screen>
      <EmptyState title={t('editor.notFound')} />
    </Screen>
  );
}
