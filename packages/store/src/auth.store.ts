import { create } from 'zustand';
import type { AuthProvider } from '@plan2skill/types';

interface AuthState {
  isAuthenticated: boolean;
  userId: string | null;
  displayName: string | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;

  setTokens: (accessToken: string, refreshToken: string) => void;
  setUser: (userId: string, displayName: string) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  userId: null,
  displayName: null,
  accessToken: null,
  refreshToken: null,
  isLoading: false,

  setTokens: (accessToken, refreshToken) =>
    set({ accessToken, refreshToken, isAuthenticated: true }),

  setUser: (userId, displayName) => set({ userId, displayName }),

  logout: () =>
    set({
      isAuthenticated: false,
      userId: null,
      displayName: null,
      accessToken: null,
      refreshToken: null,
    }),

  setLoading: (isLoading) => set({ isLoading }),
}));
