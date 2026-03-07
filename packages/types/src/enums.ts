// ─── Auth Provider ───────────────────────────────────────────────
export type AuthProvider = 'apple' | 'google';

// ─── Archetypes ──────────────────────────────────────────────────
export type ArchetypeId = 'strategist' | 'explorer' | 'connector' | 'builder' | 'innovator';

// ─── Character IDs (8 diverse characters) ────────────────────────
export type CharacterId =
  | 'aria'
  | 'kofi'
  | 'mei'
  | 'diego'
  | 'zara'
  | 'alex'
  | 'priya'
  | 'liam';

// ─── Evolution Tiers ─────────────────────────────────────────────
export type EvolutionTier = 'novice' | 'apprentice' | 'practitioner' | 'master';

// ─── Body Types ────────────────────────────────────────────────
export type BodyType = 'slim' | 'athletic' | 'sturdy' | 'petite';

// ─── Attributes ──────────────────────────────────────────────────
export type AttributeKey = 'STR' | 'INT' | 'CHA' | 'CON' | 'DEX' | 'WIS';

// ─── Equipment Slots ─────────────────────────────────────────────
export type EquipmentSlot =
  | 'weapon'
  | 'shield'
  | 'armor'
  | 'helmet'
  | 'boots'
  | 'ring'
  | 'companion';

// ─── Rarity ──────────────────────────────────────────────────────
export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

// ─── Roadmap & Task Status ───────────────────────────────────────
export type RoadmapStatus = 'generating' | 'active' | 'paused' | 'completed' | 'archived';
export type RoadmapTier = 'diamond' | 'gold' | 'silver' | 'bronze';
export type MilestoneStatus = 'locked' | 'active' | 'completed' | 'boss';
export type TaskStatus = 'locked' | 'available' | 'in_progress' | 'completed' | 'skipped';
export type TaskType = 'article' | 'quiz' | 'project' | 'review' | 'boss' | 'reflection';

// ─── Subscription ────────────────────────────────────────────────
export type SubscriptionTier = 'free' | 'pro' | 'champion';

// ─── Companion Types ─────────────────────────────────────────────
export type CompanionId = 'cat' | 'plant' | 'guitar' | 'robot' | 'bird';

// ─── Onboarding v2 ─────────────────────────────────────────────
export type OnboardingIntent = 'know' | 'explore_guided' | 'career' | 'exploring';
export type DiscoveryPath = 'direct' | 'guided' | 'career';
export type AssessmentLevel = 'beginner' | 'familiar' | 'intermediate' | 'advanced';
export type AssessmentMethod = 'quiz' | 'self_assessment';

// ─── XP Source ───────────────────────────────────────────────────
export type XPSource =
  | 'task_complete'
  | 'quiz_pass'
  | 'boss_defeat'
  | 'streak_bonus'
  | 'milestone_complete'
  | 'roadmap_complete'
  | 'daily_login'
  | 'review'
  | 'first_task'
  | 'loot_drop'
  | 'forge'
  | 'shop_purchase';
