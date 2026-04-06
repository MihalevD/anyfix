// AnyFix – src/lib/store.ts
// Zustand глобален стор за auth и app state

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authAPI } from './api';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: 'CLIENT' | 'MASTER' | 'ADMIN';
  status: string;
  avatarUrl?: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  masterProfile?: {
    id: string;
    level: string;
    verificationStatus: string;
    averageRating: number;
    totalReviews: number;
    completedOrders: number;
    city: string;
    subscriptionPlan: string;
    categories: { category: string; pricePerHour?: number }[];
  };
}

interface AuthStore {
  user:         User | null;
  accessToken:  string | null;
  refreshToken: string | null;
  isLoading:    boolean;
  login:        (email: string, password: string) => Promise<void>;
  logout:       () => Promise<void>;
  fetchMe:      () => Promise<void>;
  setTokens:    (access: string, refresh: string) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null, accessToken: null, refreshToken: null, isLoading: false,

      setTokens: (accessToken, refreshToken) => {
        set({ accessToken, refreshToken });
        if (typeof window !== 'undefined') {
          localStorage.setItem('accessToken',  accessToken);
          localStorage.setItem('refreshToken', refreshToken);
        }
      },

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const { data } = await authAPI.login({ email, password });
          get().setTokens(data.accessToken, data.refreshToken);
          set({ user: data.user, isLoading: false });
        } catch (err) {
          set({ isLoading: false });
          throw err;
        }
      },

      logout: async () => {
        try { await authAPI.logout(); } catch {}
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        set({ user: null, accessToken: null, refreshToken: null });
        window.location.href = '/';
      },

      fetchMe: async () => {
        try {
          const { data } = await authAPI.me();
          set({ user: data });
        } catch {
          set({ user: null });
        }
      },
    }),
    {
      name: 'anyfix-auth',
      partialize: (s) => ({ accessToken: s.accessToken, refreshToken: s.refreshToken }),
    }
  )
);
