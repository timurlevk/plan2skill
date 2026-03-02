import type { XPSource } from './enums';

// ─── User Progression ───────────────────────────────────────────

export interface UserProgression {
  id: string;
  userId: string;
  totalXp: number;
  level: number;
  coins: number;
  energyCrystals: number;
  maxEnergyCrystals: number;
  energyRechargeAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Streak ──────────────────────────────────────────────────────

export interface Streak {
  id: string;
  userId: string;
  currentStreak: number;
  longestStreak: number;
  status: 'active' | 'at_risk' | 'frozen' | 'broken';
  lastActivityDate: string;
  freezesUsed: number;
  freezesUsedMonth: number;
  maxFreezes: number;
  frozenAt: string | null;
}

// ─── XP Event ────────────────────────────────────────────────────

export interface XPEvent {
  id: string;
  userId: string;
  amount: number;
  source: XPSource;
  multiplier: number;
  metadata: Record<string, unknown>;
  createdAt: string;
}

// ─── Level Calculation ───────────────────────────────────────────

export interface LevelInfo {
  level: number;
  currentXp: number;
  xpForCurrentLevel: number;
  xpForNextLevel: number;
  progress: number; // 0-1
}

// ─── Loot Drop (Phase 5F) ────────────────────────────────────────

export interface LootDrop {
  itemId: string;
  slot: string;
  rarity: string;
  name: string;
  description: string;
  attributeBonus: Record<string, number>;
}

// ─── Task Completion Result ──────────────────────────────────────

export interface TaskCompletionResult {
  xpEarned: number;
  coinsEarned: number;
  totalXp: number;
  previousLevel: number;
  currentLevel: number;
  leveledUp: boolean;
  streakUpdated: boolean;
  currentStreak: number;
  milestoneCompleted: boolean;
  roadmapProgress: number;
  roadmapCompleted: boolean;
  lootDrop?: LootDrop | null;
}

// ─── Daily Summary ───────────────────────────────────────────────

export interface DailySummary {
  date: string;
  tasksCompleted: number;
  totalTasks: number;
  xpEarned: number;
  minutesSpent: number;
  streakDay: number;
  energyCrystalsUsed: number;
}
