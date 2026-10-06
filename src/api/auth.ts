import { apiFetch } from './api-fetch';
import type { LoginInput, RegisterInput } from '@/types/api';

type AuthResponse = { data: { access_token: string } };

export function login(input: LoginInput) {
  return apiFetch<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}
export function register(input: RegisterInput) {
  return apiFetch<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}
