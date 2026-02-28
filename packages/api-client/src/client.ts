import { createTRPCClient, httpBatchLink } from '@trpc/client';
import { createTRPCReact } from '@trpc/react-query';

// Note: AppRouter type is imported from the API package at build time.
// This type-only import ensures type-safety without runtime dependency.
// In tsconfig, we reference the API's trpc.router.ts path.
// For now, use `any` as placeholder — will be replaced by project references.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AppRouter = any;

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

// React Query hooks client
export const trpc = createTRPCReact<AppRouter>();

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
