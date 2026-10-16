import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Preferências não são sensíveis, mas o Secure Store já faz parte do app e
// evita uma nova dependência. Na prévia web, usa o localStorage quando existe.
export async function getPreference(key: string) {
  try {
    if (Platform.OS === 'web')
      return globalThis.localStorage?.getItem(key) ?? null;
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

export async function setPreference(key: string, value: string) {
  try {
    if (Platform.OS === 'web') globalThis.localStorage?.setItem(key, value);
    else await SecureStore.setItemAsync(key, value);
  } catch {
    // A preferência continua valendo durante a sessão atual.
  }
}
