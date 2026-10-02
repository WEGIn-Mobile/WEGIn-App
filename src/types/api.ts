export type Page<T> = {
  items: T[];
  pagination: { take: number; skip: number };
};

export type LoginInput = { email: string; password: string };
export type RegisterInput = LoginInput & { name: string; username: string };
