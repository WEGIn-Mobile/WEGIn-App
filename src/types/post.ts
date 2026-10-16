import type { UserSummary } from './user';

export type Post = {
  id: string;
  content: string;
  authorId: string;
  author: UserSummary;
  imageUrl: string | null;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
  comments: number;
  likes: number;
  isLiked: boolean;
};
