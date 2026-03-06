# Wire-Up Methodology & Playbook

**Purpose:** Prescriptive guide for AI coding agents and developers performing end-to-end backend-frontend wire-up in a NestJS + tRPC + Next.js + Zustand monorepo.

**Stack assumed:** NestJS (apps/api), Next.js (apps/web), tRPC (packages/api-client), Zustand (packages/store), Zod (packages/types), Prisma ORM.

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Core Principles](#2-core-principles)
3. [Step-by-Step Methodology](#3-step-by-step-methodology)
4. [Patterns and Anti-Patterns](#4-patterns-and-anti-patterns)
5. [Type Safety Chain](#5-type-safety-chain)
6. [Error Handling Standards](#6-error-handling-standards)
7. [Verification Checklist](#7-verification-checklist)
8. [Agent Workflow Rules](#8-agent-workflow-rules)
9. [Prompt Templates](#9-prompt-templates)
10. [Automated Verification](#10-automated-verification)
11. [Reference Links](#11-reference-links)

---

## 1. Executive Summary

Wire-up is the process of connecting every layer of a fullstack feature so that data flows from database to UI and back without gaps. The most common failure mode is **orphaned code**: backend endpoints with no frontend consumer, store fields with no data source, components rendering hardcoded data instead of live API responses.

This playbook eliminates orphaned code by enforcing:

- **Vertical slice architecture** -- implement all layers for one feature before starting the next
- **Contract-first design** -- Zod schemas in a shared package are the single source of truth
- **Mandatory verification** -- typecheck and cross-reference audit after every wire-up
- **One feature per context window** -- clear agent context between features to prevent drift

### Wire-Up Success Criteria

A wire-up is complete when:

1. Every tRPC procedure has at least one frontend consumer
2. Every Zustand store field is populated by a real tRPC hook call
3. Every UI component reads from the store, not from hardcoded data
4. `npm run typecheck` passes with zero new errors
5. Loading, error, and empty states are all handled in the UI

---

## 2. Core Principles

### P1: Vertical Slices, Not Horizontal Layers

Implement features as full vertical slices (DB -> Service -> Router -> Store -> Component). Never implement "all backend first, then all frontend." Each slice must be self-contained and independently verifiable.

### P2: Single Source of Truth for Types

Define Zod schemas once in `packages/types`. Derive TypeScript types via `z.infer<>`. Import these schemas in both backend (procedure input/output) and frontend (store types, component props). Never duplicate type definitions.

### P3: No Orphaned Code

Every backend endpoint MUST have a frontend consumer. Every store field MUST have a data source. Every component MUST read from the store. Violation of this principle is a blocking defect.

### P4: Verify After Every Layer

Run `npm run typecheck` after completing each layer. Do not proceed to the next layer if the current one introduces type errors. Fix forward, never skip.

### P5: Follow Existing Patterns

Before implementing a new feature, read the existing wire-up for a similar feature (e.g., RoadmapService flow). Replicate the same file structure, naming conventions, and data flow patterns. Do not invent new patterns.

### P6: One Feature Per Context Window

For AI agents: implement one feature, verify it, commit it, then `/clear` context before starting the next feature. Multi-feature sessions cause context overflow and cross-contamination.

### P7: Plan Before Code

Create a file map listing every file that will be created or modified, grouped by layer, before writing any code. Confirm the plan, then execute it.

---

## 3. Step-by-Step Methodology

### Phase 1: Planning

**Goal:** Map the entire wire-up before writing any code.

1. Identify the feature and its data requirements
2. Identify which pages/components will consume the data
3. Decide on query vs. mutation (read vs. write operation)
4. Decide on optimistic update strategy (for mutations)
5. Specify loading, error, and empty states for the UI
6. Create a wire-up map (template below)

**Wire-Up Map Template:**

```markdown
| Layer     | File                                        | Change              | Status |
|-----------|---------------------------------------------|---------------------|--------|
| Schema    | packages/types/src/[feature].ts              | Add [Feature]Schema | [ ]    |
| Service   | apps/api/src/[domain]/[domain].service.ts    | Add method          | [ ]    |
| Generator | apps/api/src/ai/generators/[feature].gen.ts  | Extend BaseGenerator| [ ]    |
| Router    | apps/api/src/trpc/trpc.router.ts             | Add procedure       | [ ]    |
| Module    | apps/api/src/[domain]/[domain].module.ts     | Register provider   | [ ]    |
| Store     | packages/store/src/[domain]Store.ts          | Add state+actions   | [ ]    |
| Component | apps/web/app/(main)/[feature]/page.tsx        | Wire trpc hook      | [ ]    |
| Test      | apps/api/test/[feature].spec.ts              | createCaller test   | [ ]    |
```

**Connection chain:**
```
User action -> Component -> trpc.[domain].[method] -> Service -> Generator -> DB -> Store -> UI update
```

### Phase 2: Schema (packages/types)

**Goal:** Define the contract that both backend and frontend will use.

1. Create or modify the Zod schema in `packages/types/src/[feature].ts`
2. Export the schema and its inferred TypeScript type
3. Include input schemas (for procedure input validation) and output schemas (for response shape)

```typescript
// packages/types/src/narrative.ts
import { z } from 'zod';

export const NarrativeEpisodeSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(100),
  content: z.string().min(100).max(5000),
  worldId: z.string().uuid(),
  arcId: z.string().uuid(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']),
});

export type NarrativeEpisode = z.infer<typeof NarrativeEpisodeSchema>;
```

**Verify:** `npm run typecheck` -- schema compiles without errors.

### Phase 3: Backend Service (apps/api)

**Goal:** Implement business logic and expose it via tRPC.

1. **Prisma schema** -- Add or modify models if the feature requires new database tables. Run `npx prisma generate` to confirm validity.
2. **Service method** -- Add a method to the domain service (e.g., `NarrativeService.getEpisode()`). Import types from `packages/types`.
3. **tRPC procedure** -- Add a query or mutation to the router with `.input(InputSchema)` and optionally `.output(OutputSchema)`. Register the procedure in the appropriate router namespace.
4. **Module registration** -- If a new service or generator class was created, register it as a provider in the NestJS module.

```typescript
// Router example
narrative: {
  getEpisode: protectedProcedure
    .input(z.object({ episodeId: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      return ctx.narrativeService.getEpisode(input.episodeId);
    }),
}
```

**Verify:** `npm run typecheck` -- procedure types resolve correctly.

### Phase 4: Zustand Store (packages/store)

**Goal:** Add state and actions that the frontend components will consume.

1. Add state fields matching the response type from the procedure
2. Add setter actions: `setEpisode`, `setEpisodeLoading`, `setEpisodeError`
3. Add a reset action: `resetEpisode`
4. Type everything using the shared schema types from `packages/types`

```typescript
// packages/store/src/narrativeStore.ts
import { NarrativeEpisode } from '@plan2skill/types';

interface NarrativeState {
  currentEpisode: NarrativeEpisode | null;
  episodeLoading: boolean;
  episodeError: string | null;
  setCurrentEpisode: (episode: NarrativeEpisode) => void;
  setEpisodeLoading: (loading: boolean) => void;
  setEpisodeError: (error: string | null) => void;
  resetEpisode: () => void;
}
```

**Verify:** `npm run typecheck` -- store types match schema types.

### Phase 5: Frontend Component (apps/web)

**Goal:** Wire the tRPC hook to the store and render the UI.

1. Import `trpc` from `@plan2skill/api-client`
2. Call `trpc.[domain].[method].useQuery()` or `.useMutation()`
3. Use `useEffect` to sync the response into the Zustand store
4. Render four states: loading, error, empty, and data
5. For mutations: implement optimistic updates (mutate store first, revert on error)

```typescript
// apps/web/app/(main)/narrative/episode/[id]/page.tsx
import { trpc } from '@plan2skill/api-client';
import { useNarrativeStore } from '@plan2skill/store';

export default function EpisodePage({ params }: { params: { id: string } }) {
  const { setCurrentEpisode, setEpisodeLoading, setEpisodeError } = useNarrativeStore();

  const { data, isLoading, error } = trpc.narrative.getEpisode.useQuery({
    episodeId: params.id,
  });

  useEffect(() => {
    setEpisodeLoading(isLoading);
    if (error) setEpisodeError(error.message);
    if (data) setCurrentEpisode(data);
  }, [data, isLoading, error]);

  if (isLoading) return <EpisodeSkeleton />;
  if (error) return <ErrorBanner message={error.message} />;
  if (!data) return <EmptyState message="Episode not found" />;

  return <EpisodeDisplay episode={data} />;
}
```

**Verify:** `npm run typecheck` -- full type chain resolves from Zod schema through tRPC to component.

### Phase 6: Final Verification

**Goal:** Confirm the wire-up is complete and nothing is orphaned.

1. Run `npm run typecheck` -- zero new errors
2. Run `npm run build` -- build succeeds
3. Cross-reference: every new endpoint has a frontend consumer
4. Cross-reference: every new store field has a data source
5. Confirm: no hardcoded or mock data remains in components
6. Confirm: auth guards are present on protected endpoints
7. List all modified files grouped by layer

---

## 4. Patterns and Anti-Patterns

### DO: Correct Patterns

| Pattern | Description |
|---------|-------------|
| Vertical slice | Implement DB -> Service -> Router -> Store -> Component as one unit |
| `z.infer<typeof Schema>` | Derive all TypeScript types from Zod schemas |
| `trpc.X.useQuery()` | Always use tRPC hooks for data fetching |
| `useEffect` sync to store | Push tRPC response data into Zustand via useEffect |
| Optimistic mutations | Update store immediately, revert on error for mutations |
| Pattern replication | Copy the structure of an existing working wire-up |
| `npm run typecheck` after each layer | Catch breaks immediately |
| One feature per session | Clear context between features |
| `.input(Schema)` on all procedures | Validate all inputs with Zod |
| Loading/error/empty states | Handle all three in every component that fetches data |

### DON'T: Anti-Patterns

| Anti-Pattern | Problem | Correct Approach |
|--------------|---------|------------------|
| `fetch()` or `axios` instead of tRPC | Bypasses type chain entirely | Always use `trpc.X.useQuery()` / `.useMutation()` |
| Manual type definitions | Types drift between layers | Use `z.infer<>` from shared schemas |
| `JSON.parse() as T` | Runtime crashes, no validation | Use `Schema.parse()` for runtime validation |
| `any` in store types | Disables all type checking | Explicitly type with schema-derived types |
| Backend-only implementation | Frontend becomes an afterthought | Require full vertical slice |
| Multiple features in one prompt | Context overflow, features interfere | One feature per prompt, `/clear` between |
| Vague prompts like "build X" | Agent invents architecture | Decompose into specific vertical slices |
| No verification step in prompts | Orphaned code goes undetected | Always include "verify with typecheck" |
| No existing pattern reference | Agent invents new conventions | Specify: "follow the pattern in [ExistingService]" |
| Hardcoded data in components | Wire-up appears complete but is fake | Grep for hardcoded arrays/objects in components |
| Missing `.output()` on procedures | Response type inferred as `unknown` | Add `.output(Schema)` to all procedures |
| Skipping error/loading states | Poor UX, runtime crashes | Handle loading, error, empty in every consumer |

---

## 5. Type Safety Chain

### The Full Chain

```
Zod Schema (packages/types)
    | z.infer<typeof Schema>
    v
tRPC Procedure .input(Schema).output(Schema)   (apps/api)
    | AppRouter type export
    v
tRPC Client (packages/api-client)
    | trpc.X.useQuery() return type
    v
Zustand Store (packages/store)
    | state: InferredType
    v
React Component (apps/web)
```

Every link in this chain is enforced by TypeScript. If any schema changes, the compiler surfaces errors at every affected call site.

### Common Break Points

| Break Point | Symptom | Fix |
|-------------|---------|-----|
| `JSON.parse() as T` | Runtime crash, wrong shape | Use Zod `.parse()` or tRPC output validation |
| Manual type definition | Silently diverges from schema | Use `z.infer<>` from shared schema |
| `any` in store | No type errors, wrong data silently accepted | Explicitly type store fields |
| `fetch()` / `axios` | Completely bypasses tRPC type chain | Use `trpc.X.useQuery()` / `.useMutation()` |
| Missing `.output()` | Response type is `unknown` | Add `.output(Schema)` to the procedure |
| WebSocket / SSE data | Not validated by tRPC automatically | Manually validate with `Schema.parse()` |

### Runtime Validation at Boundaries

Use Zod `.parse()` at system boundaries where data enters from untyped sources:

```typescript
// Validate AI-generated content before database write
const validated = NarrativeEpisodeSchema.parse(aiResponse);
await prisma.episode.create({ data: validated });

// Validate WebSocket/SSE events (not covered by tRPC)
const event = SSEEventSchema.parse(JSON.parse(rawEvent));
```

---

## 6. Error Handling Standards

### Backend Error Handling

- Throw `TRPCError` with appropriate codes (`NOT_FOUND`, `UNAUTHORIZED`, `BAD_REQUEST`, `INTERNAL_SERVER_ERROR`)
- Never expose internal error details to clients -- log them server-side, return generic messages
- Validate all inputs via `.input(Schema)` -- invalid inputs are rejected before reaching service logic

### Frontend Error Handling

Every component that calls a tRPC hook MUST handle four states:

```typescript
// 1. Loading
if (isLoading) return <Skeleton />;

// 2. Error
if (error) return <ErrorBanner message={error.message} retry={refetch} />;

// 3. Empty (successful response, but no data)
if (!data || data.length === 0) return <EmptyState />;

// 4. Success (render data)
return <DataDisplay data={data} />;
```

### Optimistic Update Pattern (Mutations)

```typescript
const mutation = trpc.feature.update.useMutation({
  onMutate: (newData) => {
    // 1. Save previous state for rollback
    const previous = store.getState().feature;
    // 2. Optimistically update store
    store.setState({ feature: { ...previous, ...newData } });
    return { previous };
  },
  onError: (_err, _vars, context) => {
    // 3. Revert on error
    if (context?.previous) store.setState({ feature: context.previous });
  },
  onSettled: () => {
    // 4. Invalidate to refetch fresh data
    utils.feature.get.invalidate();
  },
});
```

---

## 7. Verification Checklist

Use this checklist after completing every wire-up. All items must pass.

### Pre-Implementation

```
- [ ] Wire-up map created (endpoint -> store -> component)
- [ ] Zod schemas identified or drafted in packages/types
- [ ] Target files identified for each layer
- [ ] Existing similar pattern reviewed as reference
- [ ] Loading/error/empty states specified
- [ ] Optimistic update strategy decided (if mutation)
```

### Post-Implementation: Backend

```
- [ ] Prisma schema valid: npx prisma generate
- [ ] Service method exists with correct types
- [ ] tRPC procedure registered in router
- [ ] Zod input schema validates correctly
- [ ] Auth guard present on protected endpoints
```

### Post-Implementation: Frontend

```
- [ ] Store has state + actions for this feature
- [ ] Component uses trpc.X.useQuery/useMutation (NOT fetch/axios)
- [ ] useEffect syncs API response to store
- [ ] Loading state renders skeleton/spinner
- [ ] Error state renders error message with retry option
- [ ] Empty state renders appropriate UI
- [ ] No hardcoded/mock data remains in component
```

### Post-Implementation: Cross-Cutting

```
- [ ] npm run typecheck passes (zero new errors)
- [ ] npm run build succeeds
- [ ] Every new endpoint has >= 1 frontend consumer
- [ ] Every new store field has a data source (trpc hook)
- [ ] Optimistic updates revert on error (if applicable)
- [ ] All modified files listed and grouped by layer
```

---

## 8. Agent Workflow Rules

These rules are for AI coding agents (Claude Code, Cursor, Copilot) performing wire-up tasks.

### Rule 1: Always Plan First

Before writing any code, create a wire-up map listing every file that will be created or modified. Present the plan and wait for approval. Do not skip this step.

### Rule 2: Implement in Strict Layer Order

Follow this exact order for every feature:

1. Schema (packages/types)
2. Service (apps/api/src/[domain]/[domain].service.ts)
3. Router (apps/api/src/trpc/trpc.router.ts)
4. Module registration (if new provider)
5. Store (packages/store/src/[domain]Store.ts)
6. Component (apps/web/app/...)
7. Verification (typecheck + audit)

Never skip a layer. Never reorder layers.

### Rule 3: Typecheck After Every Layer

Run `npm run typecheck` after completing each layer. If it fails, fix the error before proceeding. Do not accumulate errors.

### Rule 4: One Feature Per Context Window

Implement one feature, verify it completely, commit it. Then `/clear` context before starting the next feature. Do not attempt multiple features in a single session.

### Rule 5: Replicate Existing Patterns

Before implementing, read an existing working wire-up (e.g., RoadmapService, NarrativeService). Replicate its file structure, naming conventions, import paths, and data flow. Do not invent new patterns.

### Rule 6: No Orphaned Code

After implementation, verify:
- Every backend procedure has at least one frontend `trpc.X.useQuery/useMutation` call
- Every store field is populated by a real tRPC hook (not hardcoded)
- Every component reads from the store, not from local mock data

### Rule 7: Use Imperative Language in Instructions

When writing CLAUDE.md rules or agent instructions, use imperative language: "MUST", "NEVER", "ALWAYS". Avoid suggestions like "consider" or "you might want to." Explicit constraints increase compliance.

### Rule 8: Commit at Milestones

After each verified vertical slice, create a git commit with a descriptive message. This provides rollback points if subsequent changes break things.

### Rule 9: Interview for Ambiguity

If the feature requirements are ambiguous, ask clarifying questions before building:
- Which pages/components will consume this data?
- What loading/error states should the UI show?
- Should this use optimistic updates?
- What store fields need to change?

### Rule 10: File Map Before Implementation

Before implementing, create and present a file map:
```
Backend files to modify: [list with paths]
Frontend files to modify: [list with paths]
New files to create: [list with paths]
Connection diagram: Endpoint -> Store -> Component
```

---

## 9. Prompt Templates

### Template 1: Full Vertical Slice

```
Implement [feature] using vertical slice approach. For each slice:

LAYER 1 -- Database: Add/modify Prisma schema
LAYER 2 -- Service: Add business logic method
LAYER 3 -- Router: Add tRPC procedure with Zod input validation
LAYER 4 -- Store: Add Zustand action + state field
LAYER 5 -- Component: Wire UI to store

After ALL layers are complete for one slice, verify with:
- npx prisma generate (schema valid)
- npm run typecheck (full type chain works)
- List all files modified and confirm each layer is connected

Only then move to the next slice.
```

### Template 2: No Orphan Code Constraint

```
Implement [feature] end-to-end. For EACH new backend endpoint you create:
1. Add the tRPC procedure (router)
2. Add the frontend hook call (trpc.X.useQuery/useMutation)
3. Wire the result into the Zustand store
4. Connect the store to the UI component
5. Verify: run npm run typecheck to confirm no TS errors

IMPORTANT: No orphaned code. Every endpoint MUST have a frontend consumer.
Every store field MUST be populated by a real API call.
Every UI component MUST read from the store, not hardcoded data.
```

### Template 3: Plan-Then-Implement

```
I want to wire up [feature] to the frontend.

Before implementing, create a FILE MAP showing:
- Backend files to modify: [list with paths]
- Frontend files to modify: [list with paths]
- New files to create: [list with paths]
- Connection diagram: Endpoint -> Store -> Component

Confirm this map with me before proceeding.
```

### Template 4: Phase Implementation (for multi-phase projects)

```
1. /clear -- fresh context
2. Read [PHASE_DOC] and the existing [ReferenceService] wire-up as reference.
   Create a file-by-file implementation plan.
   -> Review plan -> approve
3. Implement the wire-up per your plan. After each layer, run typecheck.
4. Verify: every new endpoint has a frontend consumer.
   Run full typecheck. List all modified files by layer.
5. Commit with descriptive message.
6. /clear -- prepare for next phase
```

---

## 10. Automated Verification

### Verification Script (ts-morph)

This script scans the codebase to detect orphaned endpoints and phantom consumers:

```typescript
// scripts/verify-wireup.ts
import { Project, SyntaxKind } from 'ts-morph';

const project = new Project({ tsConfigFilePath: 'tsconfig.json' });

// Step 1: Find all tRPC procedures defined in routers
const routerFiles = project.getSourceFiles('**/router*.ts');
const procedures = new Set<string>();
for (const file of routerFiles) {
  file.getDescendantsOfKind(SyntaxKind.PropertyAccessExpression)
    .filter(n => ['query', 'mutation'].includes(n.getName()))
    .forEach(n => procedures.add(extractProcedurePath(n)));
}

// Step 2: Find all tRPC hook calls in frontend
const frontendFiles = project.getSourceFiles('apps/web/**/*.{ts,tsx}');
const consumers = new Set<string>();
for (const file of frontendFiles) {
  file.getDescendantsOfKind(SyntaxKind.CallExpression)
    .filter(n => n.getText().includes('trpc.'))
    .forEach(n => consumers.add(extractConsumerPath(n)));
}

// Step 3: Report orphans
const orphanedEndpoints = [...procedures].filter(p => !consumers.has(p));
const phantomConsumers = [...consumers].filter(c => !procedures.has(c));

if (orphanedEndpoints.length > 0) {
  console.error('ORPHANED ENDPOINTS (no frontend consumer):');
  orphanedEndpoints.forEach(e => console.error(`  - ${e}`));
}

if (phantomConsumers.length > 0) {
  console.error('PHANTOM CONSUMERS (endpoint does not exist):');
  phantomConsumers.forEach(c => console.error(`  - ${c}`));
}

process.exit(orphanedEndpoints.length + phantomConsumers.length > 0 ? 1 : 0);
```

### Hook-Based Verification (Claude Code)

Add to `.claude/settings.json` to run typecheck after every file edit:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "command": "npm run typecheck 2>&1 | tail -5"
      }
    ]
  }
}
```

### Integration Verifier Subagent

Create a read-only subagent that audits wire-up completeness:

```markdown
# .claude/agents/integration-verifier.md

You are a read-only integration verifier. Your task: verify wire-up completeness.

1. Find all tRPC procedures in apps/api/src/trpc/trpc.router.ts
2. Find all trpc.*.useQuery and trpc.*.useMutation calls in apps/web/
3. Cross-reference: every procedure MUST have >= 1 frontend consumer
4. Find all store fields in packages/store/ -- each MUST have a data source
5. Report:
   ORPHANED ENDPOINTS: [list]
   PHANTOM CONSUMERS: [list]
   DISCONNECTED STORE FIELDS: [list]
   STATUS: PASS / FAIL
```

---

## 11. Reference Links

### tRPC and Type Safety
- [tRPC Official](https://trpc.io/)
- [NestJS + Next.js + tRPC Monorepo Guide](https://www.tomray.dev/nestjs-nextjs-trpc)
- [End-to-End Type Safety with tRPC](https://leapcell.io/blog/achieving-end-to-end-type-safety-in-full-stack-typescript-with-trpc)
- [Contract-First API Design](https://www.highlight.io/blog/the-beauty-of-contract-first-api-design)

### AI Agent Patterns
- [Claude Code Best Practices](https://code.claude.com/docs/en/best-practices)
- [Backend/Frontend Agents Standard](https://gooapps.net/2026/01/30/backend-and-frontend-agents-the-gooapps-standard-for-programming-with-ai/)
- [Claude Code Subagents](https://www.pubnub.com/blog/best-practices-for-claude-code-sub-agents/)
- [Optimizing Coding Agent Rules](https://arize.com/blog/optimizing-coding-agent-rules-claude-md-agents-md-clinerules-cursor-rules-for-improved-accuracy/)

### Fullstack Development with AI
- [Claude Code Fullstack Development Essentials](https://wasp.sh/blog/2026/01/29/claude-code-fullstack-development-essentials)
- [Structured Workflow for Vibe Coding](https://dev.to/wasp/a-structured-workflow-for-vibe-coding-full-stack-apps-352l)
- [Full Stack App Using Only Vibe Coding Prompts](https://dzone.com/articles/full-stack-app-with-vibe-coding-prompts)
- [Claude Code Full-Stack Configuration Guide](https://htdocs.dev/posts/claude-code-full-stack-configuration-guide/)
- [AGENTS.md Standard](https://agents.md/)

### Code Generation Tools (alternatives, for reference)
- [Orval -- OpenAPI to React Query](https://orval.dev/)
- [Kubb -- OpenAPI Code Generator](https://kubb.dev/)
- [tRPC Skill for Claude Code](https://playbooks.com/skills/bobmatnyc/claude-mpm-skills/trpc)
