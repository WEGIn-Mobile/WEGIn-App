export type UserSummary = {
  id: string;
  name: string;
  username: string;
  avatarUrl: string | null;
};

export type User = UserSummary & {
  bio: string | null;
  followers: number;
  following: number;
};

export type CurrentUser = User & {
  email: string;
  role: 'USER' | 'ADMIN';
};
