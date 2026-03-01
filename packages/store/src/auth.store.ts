import { create } from 'zustand';
import { persist } from 'zustand/middleware';
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

const initialState = {
  isAuthenticated: false,
  userId: null as string | null,
  displayName: null as string | null,
  accessToken: null as string | null,
  refreshToken: null as string | null,
  isLoading: false,
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      ...initialState,

      setTokens: (accessToken, refreshToken) =>
        set({ accessToken, refreshToken, isAuthenticated: true }),

      setUser: (userId, displayName) => set({ userId, displayName }),

      logout: () => set({ ...initialState }),

      setLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: 'plan2skill-auth',
      partialize: (state) => ({
        // Persist auth credentials, exclude transient loading state
        isAuthenticated: state.isAuthenticated,
        userId: state.userId,
        displayName: state.displayName,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
    },
  ),
);
