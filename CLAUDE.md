# Plan2Skill

EdTech gamified learning platform with RPG mechanics (quests, XP, characters, equipment).

## Tech Stack

- **Monorepo:** pnpm workspaces + Turborepo
- **API:** NestJS 10, Prisma ORM, PostgreSQL, tRPC router
- **Web:** Next.js 14 (App Router), React 19, inline styles (no CSS framework)
- **Mobile:** Expo (React Native) — early stage
- **Packages:** `@plan2skill/store` (Zustand), `@plan2skill/types`, `@plan2skill/api-client` (tRPC), `@plan2skill/ui`
- **Language:** TypeScript strict (`noUncheckedIndexedAccess: true`)

## Project Structure

```
apps/api/          — NestJS backend (REST + tRPC)
apps/web/          — Next.js frontend
apps/mobile/       — Expo mobile app
packages/store/    — Zustand stores with persist middleware
packages/types/    — Shared TypeScript types
packages/api-client/ — tRPC client + React hooks
packages/ui/       — Shared UI components
docs/              — Design docs, requirements, methodology
```

## Commands

- `pnpm dev` — start all services (Turborepo)
- `pnpm build` — build all packages
- `pnpm typecheck` — TypeScript check across monorepo
- `pnpm lint` — ESLint across monorepo
- `cd apps/api && npx prisma generate` — regenerate Prisma client after schema changes
- `cd apps/api && npx prisma migrate dev` — run database migrations

## Code Style

- All inline styles, dark theme. No CSS/SCSS/Tailwind — use style objects with tokens from `tokens.ts`
- Prefer named exports. `'use client'` directive for all client components
- RPG vocabulary throughout UI: quests, heroes, XP, crystals, streaks, archetypes
- Ukrainian for all communication, English for code/variables/docstrings

## Key Patterns

- **tRPC wire-up:** Import `trpc` from `@plan2skill/api-client`, `.useQuery()` / `.useMutation()`, sync to Zustand via `useEffect`, optimistic UI
- **API → Mock fallback:** `const data = useQuery(...)` then `useMemo(() => apiData?.length ? apiData : MOCK_DATA)`
- **Dev endpoints:** `assertDev()` guard — throws if `NODE_ENV !== 'development'`
- **Auth guard:** `trpc.user.profile.useQuery()` + `useEffect` redirect

## Content & i18n

Three content layers: **UI strings** (`tr('key')` via `useI18nStore`), **Reference data** (`refContent` + `refTranslation` via tRPC), **AI-generated** (generators with template fallbacks).

- **Never hardcode user-facing English text** — every visible string goes through `tr()` or API
- **`tr` vs `t`:** `t` = design tokens (colors/fonts from `tokens.ts`), `tr` = translation function from `useI18nStore`
- **Locales:** `en`, `uk`, `pl` — all three required for every translation key
- **Seed file:** `apps/api/prisma/seed-i18n-full.ts` — single source of truth for all reference + translation data
- **Template fallbacks:** `TemplateService` uses `TranslationService` for locale-aware AI fallbacks
- See `.claude/rules/content.md` for full methodology

## Gotchas

- `noUncheckedIndexedAccess: true` — `Record<string, T>` indexed access returns `T | undefined`, always handle
- `experimentalDecorators` + `emitDecoratorMetadata` in tsconfig.base.json — required for NestJS decorators pulled via tRPC type inference
- Prisma client must be regenerated after schema changes (`prisma generate`) — dev server may lock DLL on Windows (restart needed)
- Zustand stores use `persist()` middleware with `partialize` to exclude transient animation state
- CSS inline styles: never mix `border` shorthand with `borderTop`/`borderBottom` longhand (React console warning)

## Important Files

- Theme tokens: `apps/web/app/(onboarding)/_components/tokens.ts`
- Pixel engine: `apps/web/app/(onboarding)/_components/PixelEngine.tsx`
- Progression store: `packages/store/src/progression.store.ts`
- Quest system: `apps/web/app/(dashboard)/home/_hooks/useQuestSystem.ts`
- Server hydration: `apps/web/app/(dashboard)/_hooks/useServerHydration.ts`
- tRPC router: `apps/api/src/trpc/trpc.router.ts`
- Prisma schema: `apps/api/prisma/schema.prisma`
- i18n seed (all translations): `apps/api/prisma/seed-i18n-full.ts`
- i18n store: `packages/store/src/i18n.store.ts`
- Translation service: `apps/api/src/i18n/translation.service.ts`
- Content service: `apps/api/src/onboarding/onboarding-content.service.ts`
- Template fallbacks: `apps/api/src/ai/core/template.service.ts`
- Content audit: `docs/content-audit.html`

## Documentation

- AI service methodology: `docs/AI_SERVICE_METHODOLOGY.md`
- Wire-up best practices: `docs/WIREUP_BEST_PRACTICES_RESEARCH.md`
- Fullstack wire-up requirements: `docs/FULLSTACK_WIREUP_REQUIREMENTS.md`
- Character redesign: `docs/CHARACTER_REDESIGN_REQUIREMENTS.md`
- Content audit (interactive table): `docs/content-audit.html`

## Domain-Specific Rules

See `.claude/rules/` for API, frontend, store, wire-up, and content/i18n patterns.
