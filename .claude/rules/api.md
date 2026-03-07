---
paths:
  - "apps/api/**/*.ts"
---

# API Rules (NestJS + Prisma + tRPC)

## NestJS Patterns
- Use `@Injectable()` services, inject via constructor DI
- Dev-only endpoints: guard with `assertDev()` (throws if not development)
- Controllers handle HTTP routing only — business logic stays in services

## Prisma
- After schema changes: `npx prisma generate` then `npx prisma migrate dev`
- Use cascade delete for user-owned relations
- All queries must handle `null`/`undefined` from optional relations

## Post-Release Checklist
After switching to a new release branch or pulling schema changes:
1. `cd apps/api && npx prisma migrate dev` (or `npx prisma migrate reset --force` if drift detected)
2. `cd apps/api && npx tsx prisma/seed-i18n-full.ts` (re-seed translations + reference data)
3. Restart backend: `npm run dev`
- **Never skip migration + seeding** — the database must match the current schema before starting dev servers

## tRPC Router
- All procedures defined in `trpc.router.ts` with Zod input validation
- Use `.query()` for reads, `.mutation()` for writes
- Complex types: use explicit Zod schemas, avoid inferred types that explode serialization

## Error Handling
- Throw `UnauthorizedException` for auth failures
- Throw `BadRequestException` for invalid input
- Log warnings with `console.warn('[ServiceName] message:', err.message)` — no stack traces in non-critical paths
