'use client';

import { TrpcProvider } from '@plan2skill/api-client';
import { useAuthStore } from '@plan2skill/store';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export function Providers({ children }: { children: React.ReactNode }) {
  const getToken = () => useAuthStore.getState().accessToken;

  return (
    <TrpcProvider baseUrl={API_BASE_URL} getToken={getToken}>
      {children}
    </TrpcProvider>
  );
}
