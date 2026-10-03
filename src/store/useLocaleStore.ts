import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { safeStorage } from '../lib/storage';
export const useLocaleStore = create<{ language: 'pl' | 'en'; setLanguage: (language: 'pl' | 'en') => void }>()(persist(set => ({ language: 'pl', setLanguage: language => set({ language }) }), { name: 'folio-ui-language', storage: createJSONStorage(() => safeStorage) }));
