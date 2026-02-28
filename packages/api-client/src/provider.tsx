import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { trpc, createTrpcReactClient } from './client';

interface TrpcProviderProps {
  children: React.ReactNode;
  baseUrl: string;
  getToken: () => string | null;
}

export function TrpcProvider({ children, baseUrl, getToken }: TrpcProviderProps) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 minutes
        retry: 1,
      },
    },
  }));

  const [trpcClient] = useState(() => createTrpcReactClient(baseUrl, getToken));

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </trpc.Provider>
  );
}
