import { createMessage } from '@/api/messages';

export function sendMessage(
  userId: string,
  currentUserId: string,
  text: string,
) {
  if (userId === currentUserId)
    throw new Error('Escolha outro perfil para conversar.');
  const content = text.trim();
  if (!content) throw new Error('Escreva uma mensagem.');
  if (content.length > 1000)
    throw new Error('A mensagem deve ter até 1000 caracteres.');
  return createMessage(userId, content);
}
