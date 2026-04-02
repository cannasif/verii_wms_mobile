import i18n from '@/locales';
import { create } from 'zustand';
import { storage } from '@/lib/storage';
import { ACCESS_TOKEN_KEY, BRANCH_STORAGE_KEY, USER_STORAGE_KEY } from '@/constants/storage';
import type { Branch, User } from '@/features/auth/types';
import { getUserFromToken, isTokenValid } from '@/features/auth/utils';

interface AuthState {
  user: User | null;
  token: string | null;
  branch: Branch | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  setAuth: (token: string) => Promise<void>;
  setBranch: (branch: Branch) => Promise<void>;
  clearAuth: () => Promise<void>;
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  branch: null,
  isAuthenticated: false,
  isHydrated: false,
  async setAuth(token) {
    const user = getUserFromToken(token);
    if (!user) throw new Error(i18n.t('auth.invalidToken'));
    await storage.set(ACCESS_TOKEN_KEY, token);
    await storage.set(USER_STORAGE_KEY, user);
    set({ token, user, isAuthenticated: true });
  },
  async setBranch(branch) {
    await storage.set(BRANCH_STORAGE_KEY, branch);
    set({ branch });
  },
  async clearAuth() {
    await storage.remove(ACCESS_TOKEN_KEY);
    await storage.remove(USER_STORAGE_KEY);
    await storage.remove(BRANCH_STORAGE_KEY);
    set({ user: null, token: null, branch: null, isAuthenticated: false });
  },
  async hydrate() {
    try {
      const token = await storage.get<string>(ACCESS_TOKEN_KEY);
      const branch = await storage.get<Branch>(BRANCH_STORAGE_KEY);

      if (token && isTokenValid(token)) {
        const user = getUserFromToken(token);
        if (user) {
          set({ user, token, branch, isAuthenticated: true, isHydrated: true });
          return;
        }
      }

      await storage.remove(ACCESS_TOKEN_KEY);
      await storage.remove(USER_STORAGE_KEY);
      set({ user: null, token: null, branch: null, isAuthenticated: false, isHydrated: true });
    } catch {
      await storage.remove(ACCESS_TOKEN_KEY);
      await storage.remove(USER_STORAGE_KEY);
      await storage.remove(BRANCH_STORAGE_KEY);
      set({ user: null, token: null, branch: null, isAuthenticated: false, isHydrated: true });
    }
  },
}));
