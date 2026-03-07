# Roadmap Deactivation — Design Document

**Goal:** Allow users to deactivate (archive) roadmaps while preserving full history — roadmap structure, milestones, tasks, quest completions — viewable in a read-only History tab.

**Approach:** Use existing `'archived'` RoadmapStatus value (already in enum, never used). Minimal schema changes.

---

## Data Layer

### Schema Changes
- Add `archivedAt: DateTime?` to Roadmap model (nullable, set on archive)

### Backend (roadmap.service.ts)
- `archiveRoadmap(userId, roadmapId)` — validates `active`/`paused` status → sets `status: 'archived'`, `archivedAt: now()`
- `reactivateRoadmap(userId, roadmapId)` — validates `archived` status, checks tier limit → sets `status: 'paused'`, `archivedAt: null`
- `listRoadmaps` — already returns all statuses, frontend filters

### tRPC Procedures
- `roadmap.archive` — input: `{ roadmapId: uuid }`
- `roadmap.reactivate` — input: `{ roadmapId: uuid }`

### Limits
- `validateRoadmapLimit` already counts only `active` + `generating` — archived doesn't affect limits
- Reactivation checks limit before restoring

---

## UI: Tabs & History on /roadmap

### Tab Bar
Two tabs above roadmap list:
- **Active** — `active`, `paused`, `generating` roadmaps
- **History** — `archived`, `completed` roadmaps

### Active Tab (existing behavior + archive action)
- QuestLineCard context menu gains **Archive** action (for `active`/`paused`)
- Confirmation dialog: "Deactivate Quest Line? You can restore it from History."

### History Tab
- Same QuestLineCard with `archived` (grey) / `completed` (gold) badges
- Click → `/roadmap/[id]` in read-only mode
- Context menu for `archived`: **Reactivate** (if tier allows, else show tier modal)
- Context menu for `completed`: view only

### /roadmap/[id] — Read-Only for Archived
- Same timeline view, but:
  - Action bar hidden (no Adjust/Pause buttons)
  - Top banner: "This Quest Line is archived" + Reactivate button
  - Tasks non-interactive (no "Start Quest")
  - Quest completion history shown per milestone: completedAt, xpReward, rarity

---

## Store, i18n, Side Effects

### Zustand (roadmap.store.ts)
- `archiveRoadmap(roadmapId)` — optimistic: status → `'archived'`
- `reactivateRoadmap(roadmapId)` — optimistic: status → `'paused'`

### i18n Keys
- `roadmap.tab_active`, `roadmap.tab_history`
- `roadmap.archive_confirm_title`, `roadmap.archive_confirm_body`
- `roadmap.archived_banner`, `roadmap.reactivate`
- `roadmap.reactivate_tier_blocked`
- `roadmap.quest_history`, `roadmap.completed_on`, `roadmap.xp_earned`

### Side Effects
- **Daily quests:** quest.service already filters by active roadmaps — no change
- **Dashboard RoadmapCards:** filter archived from tier sorting
- **Progression stats:** archived roadmaps still count in total XP/level
- **Spaced repetition:** reviews from archived roadmap skills remain active

### YAGNI — NOT doing
- Bulk archive
- Auto-archive by inactivity
- Export/download
- Permanent delete
