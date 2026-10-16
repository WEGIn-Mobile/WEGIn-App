import { createComment } from '@/api/posts';
import { t } from '@/i18n';

export function publishComment(postId: string, text: string) {
  const content = text.trim();
  if (!content) throw new Error(t('comments.empty'));
  if (content.length > 255) throw new Error(t('comments.tooLong'));
  return createComment(postId, content);
}
