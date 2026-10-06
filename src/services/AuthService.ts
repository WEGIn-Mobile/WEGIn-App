import type { RegisterInput } from '@/types/api';

export function validateAuthInput(
  input: RegisterInput,
  registering: boolean,
  confirmation: string,
) {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email))
    return 'Informe um email válido.';
  if (!input.password) return 'Informe sua senha.';
  if (!registering) return '';
  if (!/@weg\.net$/i.test(input.email))
    return 'Use seu email corporativo @weg.net.';
  if (input.name.length < 4 || input.name.length > 60)
    return 'Seu nome deve ter entre 4 e 60 caracteres.';
  if (!/^[a-z0-9._-]{4,60}$/.test(input.username))
    return 'Use de 4 a 60 caracteres no nome de usuário: letras, números, ponto, hífen ou sublinhado.';
  if (
    input.password.length < 8 ||
    !/[a-z]/.test(input.password) ||
    !/[A-Z]/.test(input.password) ||
    !/\d/.test(input.password) ||
    !/[^a-zA-Z0-9\s]/.test(input.password)
  ) {
    return 'A senha precisa ter 8 caracteres, maiúscula, minúscula, número e símbolo.';
  }
  if (input.password !== confirmation) return 'As senhas não coincidem.';
  return '';
}
