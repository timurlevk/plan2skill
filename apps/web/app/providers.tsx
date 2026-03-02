'use client';

import { useMemo } from 'react';
import { TrpcProvider } from '@plan2skill/api-client';
import type { TokenRefreshConfig } from '@plan2skill/api-client';
import { useAuthStore } from '@plan2skill/store';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export function Providers({ children }: { children: React.ReactNode }) {
  const getToken = () => useAuthStore.getState().accessToken;

  const refreshConfig = useMemo<TokenRefreshConfig>(() => ({
    getRefreshToken: () => useAuthStore.getState().refreshToken,
    onTokensRefreshed: (accessToken, refreshToken) => {
      useAuthStore.getState().setTokens(accessToken, refreshToken);
    },
    onRefreshFailed: () => {
      useAuthStore.getState().logout();
      // Redirect to login — safe to call on client side
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    },
  }), []);

  return (
    <TrpcProvider baseUrl={API_BASE_URL} getToken={getToken} refreshConfig={refreshConfig}>
      {children}
    </TrpcProvider>
  );
}
