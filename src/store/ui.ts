import { create } from 'zustand';
import { THEME_MODE_STORAGE_KEY } from '@/constants/storage';
import type { ThemeMode } from '@/constants/theme';
import { storage } from '@/lib/storage';

interface UiState {
  activeTab: string;
  themeMode: ThemeMode;
  isThemeHydrated: boolean;
  setActiveTab: (tab: string) => void;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  toggleThemeMode: () => Promise<void>;
  hydrateTheme: () => Promise<void>;
}

export const useUIStore = create<UiState>((set) => ({
  activeTab: 'welcome',
  themeMode: 'dark',
  isThemeHydrated: false,
  setActiveTab: (activeTab) => set({ activeTab }),
  async setThemeMode(themeMode) {
    await storage.set(THEME_MODE_STORAGE_KEY, themeMode);
    set({ themeMode });
  },
  async toggleThemeMode() {
    const current = useUIStore.getState().themeMode;
    const next: ThemeMode = current === 'dark' ? 'light' : 'dark';
    await storage.set(THEME_MODE_STORAGE_KEY, next);
    set({ themeMode: next });
  },
  async hydrateTheme() {
    const storedTheme = await storage.get<ThemeMode>(THEME_MODE_STORAGE_KEY);
    set({
      themeMode: storedTheme === 'light' ? 'light' : 'dark',
      isThemeHydrated: true,
    });
  },
}));
