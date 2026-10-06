import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// SecureStore is native-only. Web previews keep the session in memory.
let webToken: string | null = null;

export async function saveAccessToken(token: string) {
  if (Platform.OS === 'web') webToken = token;
  else await SecureStore.setItemAsync('access_token', token);
}

export async function getAccessToken() {
  return Platform.OS === 'web'
    ? webToken
    : SecureStore.getItemAsync('access_token');
}

export async function removeAccessToken() {
  if (Platform.OS === 'web') webToken = null;
  else await SecureStore.deleteItemAsync('access_token');
}
