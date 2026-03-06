---
paths:
  - "apps/api/src/trpc/**/*.ts"
  - "apps/web/**/*.tsx"
  - "packages/api-client/**/*.ts"
---

# tRPC Wire-Up Pattern

## End-to-end flow
1. **Prisma schema** → model with relations
2. **Service** → business logic method
3. **tRPC Router** → procedure with Zod input schema
4. **Frontend** → `trpc.{router}.{procedure}.useQuery/useMutation()`
5. **Zustand sync** → `useEffect` to sync API response to store
6. **Optimistic UI** → update store before server confirms

## Wire-up checklist
- Zod input schema matches Prisma model fields
- Service method handles null/undefined gracefully
- Frontend has mock fallback for when API is unavailable
- Explicit return type on hooks when tRPC generics cause serialization errors
- `useEffect` deps array includes all store setters

## Server hydration
- `useServerHydration.ts` — 7 parallel queries with `hydratedRef` guard
- `staleTime: 5min, retry: 1` for all queries
- Fire-and-forget mutations for non-critical writes (reviews, analytics)
