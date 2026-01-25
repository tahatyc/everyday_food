import AsyncStorage from "@react-native-async-storage/async-storage";

export const convexAsyncStorage = {
    getItem: AsyncStorage.getItem,
    setItem: AsyncStorage.setItem,
    removeItem: AsyncStorage.removeItem,
};