import { createTRPCClient, httpBatchLink } from '@trpc/client';
import { type CreateTRPCReact, createTRPCReact } from '@trpc/react-query';

// Type-only import from @plan2skill/api (workspace devDependency)
// No runtime code is pulled — only the inferred router type for type-safe hooks.
import type { AppRouter } from '@plan2skill/api/src/trpc/trpc.router';

export type { AppRouter };

// Vanilla client (for non-React contexts, e.g. Expo auth)
export function createTrpcClient(baseUrl: string, getToken: () => string | null) {
  return createTRPCClient<AppRouter>({
    links: [
      httpBatchLink({
        url: `${baseUrl}/trpc`,
        headers: () => {
          const token = getToken();
          return token ? { Authorization: `Bearer ${token}` } : {};
        },
      }),
    ],
  });
}

// React Query hooks client — explicit type annotation to avoid TS2742
export const trpc: CreateTRPCReact<AppRouter, unknown> = createTRPCReact<AppRouter>();

export function createTrpcReactClient(baseUrl: string, getToken: () => string | null) {
  return trpc.createClient({
    links: [
      httpBatchLink({
        url: `${baseUrl}/trpc`,
        headers: () => {
          const token = getToken();
          return token ? { Authorization: `Bearer ${token}` } : {};
        },
      }),
    ],
  });
}
