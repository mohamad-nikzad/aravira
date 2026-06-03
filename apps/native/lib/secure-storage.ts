import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'saluna.session.token';

const isWeb = Platform.OS === 'web';

function webStorage(): Storage | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export async function getStoredToken(): Promise<string | null> {
  if (isWeb) return webStorage()?.getItem(TOKEN_KEY) ?? null;
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function setStoredToken(token: string): Promise<void> {
  if (isWeb) {
    webStorage()?.setItem(TOKEN_KEY, token);
    return;
  }
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function clearStoredToken(): Promise<void> {
  if (isWeb) {
    webStorage()?.removeItem(TOKEN_KEY);
    return;
  }
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch {
    // ignore — key may not exist
  }
}
