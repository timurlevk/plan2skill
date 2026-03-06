---
paths:
  - "apps/web/**/*.tsx"
  - "apps/web/**/*.ts"
---

# Frontend Rules (Next.js + React)

## Styling
- All inline styles via `style={{}}` objects — NO CSS files, NO Tailwind
- Import design tokens from `tokens.ts` (colors, fonts, spacing)
- Dark theme only (bg: #0C0C10, card: #18181F, text: #FFFFFF)
- Never mix `border` shorthand with `borderTop`/`borderBottom` longhand
- Use `React.CSSProperties` type for style objects, cast CSS vars with `as React.CSSProperties`

## Components
- `'use client'` directive at top of every client component
- Prefer `useState` + `useEffect` over complex state management for local UI state
- `prefers-reduced-motion`: respect via `window.matchMedia` — disable animations when set
- Animations: CSS keyframes in `<style>` tags or inline `animation` property

## Data Fetching
- Use `trpc.{router}.{procedure}.useQuery()` for server data
- Mock fallback pattern: `useMemo(() => apiData?.length ? apiData : MOCK_DATA, [apiData])`
- `staleTime: 5 * 60 * 1000, retry: 1` for standard queries
- Sync API data to Zustand stores via `useEffect`

## Gamification UI Vocabulary
- Quests (not tasks), Heroes (not users), XP (not points)
- Energy Crystals, Streaks, Archetypes, Equipment slots, Rarity tiers
- 5 archetypes: Strategist, Explorer, Connector, Builder, Innovator
- 8 pixel characters with diversity compliance
