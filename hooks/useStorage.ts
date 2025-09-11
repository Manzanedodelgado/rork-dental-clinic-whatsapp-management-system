import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useMemo } from 'react';

export const [StorageProvider, useStorage] = createContextHook(() => {
  const storage = useMemo(() => ({
    getItem: AsyncStorage.getItem,
    setItem: AsyncStorage.setItem,
    removeItem: AsyncStorage.removeItem,
    clear: AsyncStorage.clear,
  }), []);

  return storage;
});