import { createComment } from '@/api/posts';

export function publishComment(postId: string, text: string) {
  const content = text.trim();
  if (!content) throw new Error('Escreva um comentário.');
  if (content.length > 255)
    throw new Error('O comentário deve ter até 255 caracteres.');
  return createComment(postId, content);
}
