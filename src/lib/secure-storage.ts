import * as SecureStore from 'expo-secure-store';

export async function saveAccessToken(token: string) {
    await SecureStore.setItemAsync('access_token', token);
}

export async function getAccessToken() {
    return SecureStore.getItemAsync('access_token');
}

export async function removeAccessToken() {
    await SecureStore.deleteItemAsync('access_token');
}