---
paths:
  - "packages/store/**/*.ts"
---

# Store Rules (Zustand)

## Store Pattern
- `create<StateInterface>()(persist((set, get) => ({...}), { name: 'plan2skill-{name}' }))`
- `partialize` to exclude transient state (animations, loading flags) from persistence
- `onRehydrateStorage` for migration bridges between stores

## Actions
- Actions defined inside the store (not external)
- Use `get()` for reading current state, `set()` for updates
- Computed values via selectors: `useStore((s) => s.computed)`

## Types
- Export interfaces for both state and action types
- Re-export all stores and types from `packages/store/src/index.ts`
- Import stores in frontend as `import { useXxxStore } from '@plan2skill/store'`
