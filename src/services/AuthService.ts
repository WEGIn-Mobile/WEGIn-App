import type { RegisterInput } from '@/types/api';
import { t } from '@/i18n';

export function validateAuthInput(
  input: RegisterInput,
  registering: boolean,
  confirmation: string,
) {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email))
    return t('auth.invalidEmail');
  if (!input.password) return t('auth.passwordRequired');
  if (!registering) return '';
  if (!/@weg\.net$/i.test(input.email)) return t('auth.wegEmail');
  if (input.name.length < 4 || input.name.length > 60)
    return t('auth.nameLength');
  if (!/^[a-z0-9._-]{4,60}$/.test(input.username))
    return t('auth.usernameFormat');
  if (
    input.password.length < 8 ||
    !/[a-z]/.test(input.password) ||
    !/[A-Z]/.test(input.password) ||
    !/\d/.test(input.password) ||
    !/[^a-zA-Z0-9\s]/.test(input.password)
  ) {
    return t('auth.passwordStrength');
  }
  if (input.password !== confirmation) return t('auth.passwordMismatch');
  return '';
}
