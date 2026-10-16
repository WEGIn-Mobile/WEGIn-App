import { createMessage } from '@/api/messages';
import { t } from '@/i18n';

export function sendMessage(
  userId: string,
  currentUserId: string,
  text: string,
) {
  if (userId === currentUserId) throw new Error(t('chat.self'));
  const content = text.trim();
  if (!content) throw new Error(t('chat.empty'));
  if (content.length > 1000) throw new Error(t('chat.tooLong'));
  return createMessage(userId, content);
}
