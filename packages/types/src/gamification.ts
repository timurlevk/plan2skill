import type {
  ArchetypeId, AttributeKey, CompanionId, EquipmentSlot, Rarity,
  OnboardingIntent, DiscoveryPath, AssessmentLevel, AssessmentMethod,
} from './enums';

// ─── Rarity Config ───────────────────────────────────────────────

export interface RarityConfig {
  id: Rarity;
  label: string;
  color: string;
  bgColor: string;
  glow: string | null;
  roman: string;
  distribution: number; // percentage
}

// ─── Archetype Config ────────────────────────────────────────────

export interface ArchetypeConfig {
  id: ArchetypeId;
  name: string;
  icon: string;
  color: string;
  bonus: string;
  bonusPercent: number;
}

// ─── Attribute Config ────────────────────────────────────────────

export interface AttributeConfig {
  key: AttributeKey;
  name: string;
  fullName: string;
  icon: string;
  color: string;
}

// ─── Equipment Slot Config ───────────────────────────────────────

export interface EquipmentSlotConfig {
  slot: EquipmentSlot;
  name: string;
  skillCategory: string;
  visualDescription: string;
}

// ─── Companion Config ────────────────────────────────────────────

export interface CompanionConfig {
  id: CompanionId;
  name: string;
  nameUk: string;
  buff: string;
  buffPercent: number;
  colors: string[];
}

// ─── Onboarding — Goal Categories ───────────────────────────────

export type GoalCategory = 'ai' | 'business' | 'tech' | 'creative' | 'data' | 'languages' | 'marketing' | 'leadership' | 'security';

// ─── Onboarding — Skill Levels ──────────────────────────────────

export type SkillLevel = 'beginner' | 'familiar' | 'intermediate' | 'advanced';

// ─── Onboarding — Goal Selection ────────────────────────────────

export interface GoalSelection {
  id: string;
  label: string;
  category: GoalCategory;
  popularity: number;
  isCustom?: boolean;
  subGoals?: string[];    // selected sub-goal preset IDs
  freeText?: string;      // free-form description
}

// ─── Sub-Goal Preset ────────────────────────────────────────────

export interface SubGoalPreset {
  id: string;
  label: string;
  type: 'milestone' | 'dream' | 'project';
}

// ─── Equipment Item ─────────────────────────────────────────────
// Re-exported from ./character (EquipmentItem)

// ─── Inventory Item (Phase 5F) ──────────────────────────────────

export interface InventoryItemFull {
  id: string;
  itemId: string;
  slot: string;
  rarity: Rarity;
  quantity: number;
  acquiredAt: string;
  name: string;
  description: string;
  attributeBonus: Partial<Record<AttributeKey, number>>;
}

// ─── Equipped Item (Phase 5F) ───────────────────────────────────

export interface EquippedItemFull {
  id: string;
  slot: string;
  itemId: string;
  rarity: string;
  equippedAt: string;
  name: string;
  description: string;
  attributeBonus: Partial<Record<AttributeKey, number>>;
}

// ─── Computed Attributes (Phase 5F) ─────────────────────────────

export interface ComputedAttributes {
  base: Record<AttributeKey, number>;
  bonus: Record<AttributeKey, number>;
  total: Record<AttributeKey, number>;
}

// ─── Onboarding — Skill Assessment ──────────────────────────────

export interface SkillAssessment {
  goalId: string;
  level: SkillLevel;
  answers: number[];
  freeTextNote?: string;
}

// ─── Onboarding v2 — Goal & Assessment Types ───────────────────

export interface DreamGoal {
  text: string;
  domain?: string;
}

export interface PerformanceGoal {
  id: string;
  text: string;
  isCustom: boolean;
}

export interface SkillAssessmentV2 {
  domain: string;
  level: AssessmentLevel;
  method: AssessmentMethod;
  score: number;
  confidence: number;
}

// ─── Onboarding Data (legacy — kept for compatibility) ──────────

export interface OnboardingState {
  step: number;
  identity: string;
  superpower: string;
  experienceLevel: string;
  selectedTools: string[];
  dailyMinutes: number;
  selectedArchetype: ArchetypeId | null;
  selectedCharacter: string | null;
  selectedCompanion: CompanionId | null;
}

// ─── Home Dashboard ──────────────────────────────────────────────

export interface HomeDashboardData {
  greeting: string;
  todaysFocus: string;
  dailySummary: {
    tasksCompleted: number;
    totalTasks: number;
    xpEarned: number;
  };
  currentStreak: number;
  energyCrystals: number;
  maxEnergyCrystals: number;
  level: number;
  levelProgress: number;
  totalXp: number;
  activeRoadmap: {
    id: string;
    title: string;
    progress: number;
    currentMilestone: string;
  } | null;
  todaysTasks: Array<{
    id: string;
    title: string;
    taskType: string;
    estimatedMinutes: number;
    xpReward: number;
    rarity: Rarity;
    completed: boolean;
  }>;
}
