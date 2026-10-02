import { getAccessToken } from '@/lib/secure-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL?.replace(/\/+$/, '');
let onUnauthorized: (() => void) | undefined;

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function setUnauthorizedHandler(handler?: () => void) {
  onUnauthorized = handler;
}

export function apiImageUrl(path: string) {
  if (!API_URL) return '';
  return new URL(path, `${API_URL}/`).toString();
}

export function errorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : 'Algo deu errado. Tente novamente.';
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  if (!API_URL)
    throw new Error('Configure EXPO_PUBLIC_API_URL para conectar à API.');
  const token = await getAccessToken();
  const headers = new Headers(options.headers);
  if (token && !headers.has('Authorization'))
    headers.set('Authorization', `Bearer ${token}`);
  if (options.body && !(options.body instanceof FormData))
    headers.set('Content-Type', 'application/json');
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (options.signal?.aborted) abort();
  options.signal?.addEventListener('abort', abort);
  const timeout = setTimeout(abort, 20000);
  try {
    const response = await fetch(`${API_URL}/${path.replace(/^\/+/, '')}`, {
      ...options,
      headers,
      signal: controller.signal,
    });
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      const message = Array.isArray(body?.message)
        ? body.message.join('\n')
        : body?.message;
      if (response.status === 401 && token && !path.startsWith('/auth/'))
        onUnauthorized?.();
      throw new ApiError(
        response.status === 429
          ? 'Muitas solicitações. Aguarde alguns segundos e tente novamente.'
          : message || 'Não foi possível concluir a solicitação.',
        response.status,
      );
    }
    return response.status === 204 ? (undefined as T) : await response.json();
  } catch (error) {
    if (options.signal?.aborted || error instanceof ApiError) throw error;
    throw new Error(
      'Não foi possível conectar. Verifique sua conexão e tente novamente.',
    );
  } finally {
    clearTimeout(timeout);
    options.signal?.removeEventListener('abort', abort);
  }
}
