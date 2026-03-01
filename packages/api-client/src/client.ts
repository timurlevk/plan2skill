import { createTRPCClient, httpBatchLink } from '@trpc/client';
import { createTRPCReact } from '@trpc/react-query';

// TODO: Replace with proper type import when TypeScript project references
// are configured between api-client and api packages.
// For now, AppRouter is typed via inference from trpc.router.ts at the app level.
// The web app's transpilePackages handles the actual type resolution.
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
