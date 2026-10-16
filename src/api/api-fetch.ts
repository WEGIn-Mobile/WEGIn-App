import { getAccessToken } from '@/lib/secure-storage';
import { getLanguage, t, type TranslationKey } from '@/i18n';

const configuredApiUrl = process.env.EXPO_PUBLIC_API_URL;
const API_URL = configuredApiUrl?.trim().replace(/\/+$/, '');
let onUnauthorized: (() => void) | undefined;

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code:
      'REQUEST_FAILED' | 'UNSUPPORTED_ENDPOINT' = 'REQUEST_FAILED',
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
  return error instanceof Error ? error.message : t('errors.generic');
}

const statusMessages: Partial<Record<number, TranslationKey>> = {
  400: 'errors.badRequest',
  401: 'errors.unauthorized',
  403: 'errors.forbidden',
  404: 'errors.notFound',
  409: 'errors.conflict',
  413: 'errors.tooLarge',
};

// A API responde em português. Nos outros idiomas, usa uma mensagem traduzida
// pelo status para não misturar idiomas na interface.
function requestErrorMessage(status: number, message: unknown) {
  if (getLanguage() === 'pt' && typeof message === 'string' && message)
    return message;
  const key = statusMessages[status];
  return key ? t(key) : t('errors.requestFailed');
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  if (!API_URL) throw new Error(t('errors.noApiUrl'));
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
      const unsupported =
        response.status === 404 &&
        typeof message === 'string' &&
        /^Cannot\s+(GET|POST|PATCH|DELETE|PUT|HEAD|OPTIONS)\s+\//i.test(
          message,
        );
      if (response.status === 401 && token && !path.startsWith('/auth/'))
        onUnauthorized?.();
      throw new ApiError(
        unsupported
          ? t('errors.unsupported')
          : response.status >= 500
            ? t('errors.server')
            : response.status === 429
              ? t('errors.tooMany')
              : requestErrorMessage(response.status, message),
        response.status,
        unsupported ? 'UNSUPPORTED_ENDPOINT' : 'REQUEST_FAILED',
      );
    }
    return response.status === 204 ? (undefined as T) : await response.json();
  } catch (error) {
    if (options.signal?.aborted || error instanceof ApiError) throw error;
    throw new Error(t('errors.network'));
  } finally {
    clearTimeout(timeout);
    options.signal?.removeEventListener('abort', abort);
  }
}
