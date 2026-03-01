import type { NeonIconType } from '../../../(onboarding)/_components/NeonIcon';

// ─── Achievement Definitions ─────────────────────────────────────

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: NeonIconType;
  rarity: AchievementRarity;
  xpReward: number;
  check: (state: AchievementCheckState) => boolean;
}

export type AchievementRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface AchievementCheckState {
  questHistory: { questId: string }[];
  currentStreak: number;
  longestStreak: number;
  level: number;
  totalXp: number;
  coins: number;
  unlockedAchievements: string[];
  // Phase 5D+5E extensions
  masteredSkills: number;      // Skills at mastery level 5
  totalReviews: number;        // SM-2 reviews completed
  energyCrystals: number;      // Current crystals
  dailyQuestsCompleted: string[]; // Today's completed quest IDs
}

// ─── QUEST MILESTONES ─────────────────────────────────────────
// Tracks total quests completed across all time.

const QUEST_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first-quest',
    title: 'First Steps',
    description: 'Complete your first quest',
    icon: 'sparkle',
    rarity: 'common',
    xpReward: 25,
    check: (s) => s.questHistory.length >= 1,
  },
  {
    id: 'five-quests',
    title: 'Adventurer',
    description: 'Complete 5 quests',
    icon: 'compass',
    rarity: 'common',
    xpReward: 50,
    check: (s) => s.questHistory.length >= 5,
  },
  {
    id: 'ten-quests',
    title: 'Apprentice',
    description: 'Complete 10 quests',
    icon: 'shield',
    rarity: 'uncommon',
    xpReward: 75,
    check: (s) => s.questHistory.length >= 10,
  },
  {
    id: 'twenty-five-quests',
    title: 'Journeyman',
    description: 'Complete 25 quests',
    icon: 'rocket',
    rarity: 'uncommon',
    xpReward: 100,
    check: (s) => s.questHistory.length >= 25,
  },
  {
    id: 'fifty-quests',
    title: 'Master Adventurer',
    description: 'Complete 50 quests',
    icon: 'trophy',
    rarity: 'rare',
    xpReward: 200,
    check: (s) => s.questHistory.length >= 50,
  },
  {
    id: 'hundred-quests',
    title: 'Centurion',
    description: 'Complete 100 quests',
    icon: 'crown',
    rarity: 'epic',
    xpReward: 500,
    check: (s) => s.questHistory.length >= 100,
  },
];

// ─── STREAK MILESTONES ────────────────────────────────────────
// Tracks consecutive daily activity. UX-R141: positive framing.

const STREAK_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'streak-3',
    title: 'Getting Warmed Up',
    description: '3-day streak',
    icon: 'fire',
    rarity: 'common',
    xpReward: 25,
    check: (s) => s.currentStreak >= 3,
  },
  {
    id: 'streak-7',
    title: 'On Fire',
    description: '7-day streak',
    icon: 'fire',
    rarity: 'uncommon',
    xpReward: 50,
    check: (s) => s.currentStreak >= 7,
  },
  {
    id: 'streak-14',
    title: 'Dedicated',
    description: '14-day streak',
    icon: 'fire',
    rarity: 'rare',
    xpReward: 100,
    check: (s) => s.currentStreak >= 14,
  },
  {
    id: 'streak-30',
    title: 'Unstoppable',
    description: '30-day streak',
    icon: 'fire',
    rarity: 'epic',
    xpReward: 250,
    check: (s) => s.currentStreak >= 30,
  },
  {
    id: 'streak-60',
    title: 'Legend of Discipline',
    description: '60-day streak',
    icon: 'crown',
    rarity: 'legendary',
    xpReward: 500,
    check: (s) => s.currentStreak >= 60,
  },
];

// ─── LEVEL MILESTONES ─────────────────────────────────────────

const LEVEL_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'level-3',
    title: 'Rising Hero',
    description: 'Reach level 3',
    icon: 'lightning',
    rarity: 'common',
    xpReward: 25,
    check: (s) => s.level >= 3,
  },
  {
    id: 'level-5',
    title: 'Rank Up',
    description: 'Reach level 5',
    icon: 'lightning',
    rarity: 'uncommon',
    xpReward: 50,
    check: (s) => s.level >= 5,
  },
  {
    id: 'level-10',
    title: 'Veteran',
    description: 'Reach level 10',
    icon: 'trophy',
    rarity: 'rare',
    xpReward: 100,
    check: (s) => s.level >= 10,
  },
  {
    id: 'level-25',
    title: 'Elite Guardian',
    description: 'Reach level 25',
    icon: 'crown',
    rarity: 'epic',
    xpReward: 250,
    check: (s) => s.level >= 25,
  },
];

// ─── XP MILESTONES ────────────────────────────────────────────

const XP_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'xp-500',
    title: 'XP Collector',
    description: 'Earn 500 total XP',
    icon: 'xp',
    rarity: 'common',
    xpReward: 25,
    check: (s) => s.totalXp >= 500,
  },
  {
    id: 'xp-1000',
    title: 'XP Hoarder',
    description: 'Earn 1,000 total XP',
    icon: 'xp',
    rarity: 'uncommon',
    xpReward: 50,
    check: (s) => s.totalXp >= 1000,
  },
  {
    id: 'xp-5000',
    title: 'XP Legend',
    description: 'Earn 5,000 total XP',
    icon: 'star',
    rarity: 'epic',
    xpReward: 200,
    check: (s) => s.totalXp >= 5000,
  },
];

// ─── MASTERY (Spaced Repetition — Phase 5D) ──────────────────

const MASTERY_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first-mastery',
    title: 'Knowledge Keeper',
    description: 'Master your first skill',
    icon: 'book',
    rarity: 'rare',
    xpReward: 150,
    check: (s) => s.masteredSkills >= 1,
  },
  {
    id: 'mastery-3',
    title: 'Scholar',
    description: 'Master 3 skills',
    icon: 'gem',
    rarity: 'epic',
    xpReward: 300,
    check: (s) => s.masteredSkills >= 3,
  },
  {
    id: 'review-10',
    title: 'Memory Training',
    description: 'Complete 10 reviews',
    icon: 'refresh',
    rarity: 'common',
    xpReward: 25,
    check: (s) => s.totalReviews >= 10,
  },
  {
    id: 'review-50',
    title: 'Recall Master',
    description: 'Complete 50 reviews',
    icon: 'refresh',
    rarity: 'uncommon',
    xpReward: 75,
    check: (s) => s.totalReviews >= 50,
  },
];

// ─── DAILY CHALLENGES ────────────────────────────────────────

const DAILY_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'daily-all-5',
    title: 'Perfect Day',
    description: 'Complete all 5 daily quests in one day',
    icon: 'medal',
    rarity: 'rare',
    xpReward: 100,
    check: (s) => s.dailyQuestsCompleted.length >= 5,
  },
];

// ─── ECONOMY ─────────────────────────────────────────────────

const ECONOMY_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'coins-100',
    title: 'Coin Purse',
    description: 'Accumulate 100 coins',
    icon: 'coins',
    rarity: 'common',
    xpReward: 25,
    check: (s) => s.coins >= 100,
  },
  {
    id: 'coins-500',
    title: 'Treasure Hunter',
    description: 'Accumulate 500 coins',
    icon: 'coins',
    rarity: 'uncommon',
    xpReward: 50,
    check: (s) => s.coins >= 500,
  },
];

// ─── COMBINED CATALOG ─────────────────────────────────────────
// 28 achievements across 6 categories.

export const ACHIEVEMENTS: Achievement[] = [
  ...QUEST_ACHIEVEMENTS,
  ...STREAK_ACHIEVEMENTS,
  ...LEVEL_ACHIEVEMENTS,
  ...XP_ACHIEVEMENTS,
  ...MASTERY_ACHIEVEMENTS,
  ...DAILY_ACHIEVEMENTS,
  ...ECONOMY_ACHIEVEMENTS,
];
