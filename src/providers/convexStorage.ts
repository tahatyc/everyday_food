import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Secure storage adapter for Convex auth tokens.
 * Uses expo-secure-store (Keychain/Keystore) on native platforms
 * and falls back to AsyncStorage on web where SecureStore is unavailable.
 */
const isWeb = Platform.OS === "web";

export const convexAsyncStorage = {
  getItem: async (key: string): Promise<string | null> => {
    if (isWeb) {
      return AsyncStorage.getItem(key);
    }
    return SecureStore.getItemAsync(key);
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (isWeb) {
      await AsyncStorage.setItem(key, value);
      return;
    }
    await SecureStore.setItemAsync(key, value);
  },
  removeItem: async (key: string): Promise<void> => {
    if (isWeb) {
      await AsyncStorage.removeItem(key);
      return;
    }
    await SecureStore.deleteItemAsync(key);
  },
};
