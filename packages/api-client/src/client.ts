import { createTRPCClient, httpBatchLink } from '@trpc/client';
import { type CreateTRPCReact, createTRPCReact } from '@trpc/react-query';

// Type-only import from @plan2skill/api (workspace devDependency)
// No runtime code is pulled — only the inferred router type for type-safe hooks.
import type { AppRouter } from '@plan2skill/api/src/trpc/trpc.router';

export type { AppRouter };

// ─── Token refresh callback type ───
export interface TokenRefreshConfig {
  getRefreshToken: () => string | null;
  onTokensRefreshed: (accessToken: string, refreshToken: string) => void;
  onRefreshFailed: () => void;
}

// ─── Fetch wrapper with 401 → auto-refresh → retry ───
function createFetchWithRefresh(
  baseUrl: string,
  getToken: () => string | null,
  refreshConfig?: TokenRefreshConfig,
): typeof globalThis.fetch {
  let refreshPromise: Promise<boolean> | null = null;

  return async (input, init) => {
    const res = await globalThis.fetch(input, init);

    // If not 401 or no refresh config, return as-is
    if (res.status !== 401 || !refreshConfig) return res;

    const refreshToken = refreshConfig.getRefreshToken();
    if (!refreshToken) {
      refreshConfig.onRefreshFailed();
      return res;
    }

    // Deduplicate concurrent refresh attempts
    if (!refreshPromise) {
      refreshPromise = (async () => {
        try {
          const refreshRes = await globalThis.fetch(`${baseUrl}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
          });
          if (!refreshRes.ok) {
            refreshConfig.onRefreshFailed();
            return false;
          }
          const data: { accessToken: string; refreshToken: string } = await refreshRes.json();
          refreshConfig.onTokensRefreshed(data.accessToken, data.refreshToken);
          return true;
        } catch {
          refreshConfig.onRefreshFailed();
          return false;
        } finally {
          refreshPromise = null;
        }
      })();
    }

    const refreshed = await refreshPromise;
    if (!refreshed) return res;

    // Retry original request with new token
    const newToken = getToken();
    const retryInit = { ...init };
    if (newToken) {
      retryInit.headers = { ...retryInit.headers as Record<string, string>, Authorization: `Bearer ${newToken}` };
    }
    return globalThis.fetch(input, retryInit);
  };
}

// Vanilla client (for non-React contexts, e.g. Expo auth)
export function createTrpcClient(
  baseUrl: string,
  getToken: () => string | null,
  refreshConfig?: TokenRefreshConfig,
) {
  return createTRPCClient<AppRouter>({
    links: [
      httpBatchLink({
        url: `${baseUrl}/trpc`,
        headers: () => {
          const token = getToken();
          return token ? { Authorization: `Bearer ${token}` } : {};
        },
        fetch: createFetchWithRefresh(baseUrl, getToken, refreshConfig),
      }),
    ],
  });
}

// React Query hooks client — explicit type annotation to avoid TS2742
export const trpc: CreateTRPCReact<AppRouter, unknown> = createTRPCReact<AppRouter>();

export function createTrpcReactClient(
  baseUrl: string,
  getToken: () => string | null,
  refreshConfig?: TokenRefreshConfig,
) {
  return trpc.createClient({
    links: [
      httpBatchLink({
        url: `${baseUrl}/trpc`,
        headers: () => {
          const token = getToken();
          return token ? { Authorization: `Bearer ${token}` } : {};
        },
        fetch: createFetchWithRefresh(baseUrl, getToken, refreshConfig),
      }),
    ],
  });
}
