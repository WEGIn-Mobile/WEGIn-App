const { loadProjectEnv } = require('@expo/env');

function apkApiUrl(value) {
  if (!value?.trim()) {
    throw new Error('Configure EXPO_PUBLIC_API_URL antes de gerar o APK.');
  }
  let url;
  try {
    url = new URL(value.trim());
  } catch {
    throw new Error('EXPO_PUBLIC_API_URL deve ser uma URL completa da API.');
  }
  if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) {
    throw new Error('Use uma URL HTTP ou HTTPS da API, sem credenciais.');
  }
  if (
    url.hostname === 'localhost' ||
    url.hostname.endsWith('.localhost') ||
    url.hostname.startsWith('127.') ||
    url.hostname === '[::1]' ||
    url.hostname === '0.0.0.0'
  ) {
    throw new Error(
      'A URL da API no APK não pode usar localhost. Use um endereço acessível pelo celular.',
    );
  }
  return url.toString().replace(/\/+$/, '');
}

module.exports = { apkApiUrl };

if (require.main === module) {
  try {
    loadProjectEnv(process.cwd(), { mode: 'production', force: true, silent: true });
    process.stdout.write(apkApiUrl(process.env.EXPO_PUBLIC_API_URL));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
