import type { NeonIconType } from '../../../(onboarding)/_components/NeonIcon';

// ─── Achievement Definitions ─────────────────────────────────────

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: NeonIconType;
  check: (state: AchievementCheckState) => boolean;
}

export interface AchievementCheckState {
  questHistory: { questId: string }[];
  currentStreak: number;
  longestStreak: number;
  level: number;
  totalXp: number;
  coins: number;
  unlockedAchievements: string[];
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first-quest',
    title: 'First Steps',
    description: 'Complete your first quest',
    icon: 'sparkle',
    check: (s) => s.questHistory.length >= 1,
  },
  {
    id: 'five-quests',
    title: 'Adventurer',
    description: 'Complete 5 quests',
    icon: 'compass',
    check: (s) => s.questHistory.length >= 5,
  },
  {
    id: 'ten-quests',
    title: 'Apprentice',
    description: 'Complete 10 quests',
    icon: 'shield',
    check: (s) => s.questHistory.length >= 10,
  },
  {
    id: 'twenty-five-quests',
    title: 'Journeyman',
    description: 'Complete 25 quests',
    icon: 'rocket',
    check: (s) => s.questHistory.length >= 25,
  },
  {
    id: 'fifty-quests',
    title: 'Master Adventurer',
    description: 'Complete 50 quests',
    icon: 'trophy',
    check: (s) => s.questHistory.length >= 50,
  },
  {
    id: 'streak-3',
    title: 'Getting Warmed Up',
    description: '3-day streak',
    icon: 'fire',
    check: (s) => s.currentStreak >= 3,
  },
  {
    id: 'streak-7',
    title: 'On Fire',
    description: '7-day streak',
    icon: 'fire',
    check: (s) => s.currentStreak >= 7,
  },
  {
    id: 'streak-14',
    title: 'Dedicated',
    description: '14-day streak',
    icon: 'fire',
    check: (s) => s.currentStreak >= 14,
  },
  {
    id: 'streak-30',
    title: 'Unstoppable',
    description: '30-day streak',
    icon: 'fire',
    check: (s) => s.currentStreak >= 30,
  },
  {
    id: 'level-3',
    title: 'Rising Hero',
    description: 'Reach level 3',
    icon: 'lightning',
    check: (s) => s.level >= 3,
  },
  {
    id: 'level-5',
    title: 'Rank Up',
    description: 'Reach level 5',
    icon: 'lightning',
    check: (s) => s.level >= 5,
  },
  {
    id: 'level-10',
    title: 'Veteran',
    description: 'Reach level 10',
    icon: 'trophy',
    check: (s) => s.level >= 10,
  },
  {
    id: 'xp-500',
    title: 'XP Collector',
    description: 'Earn 500 total XP',
    icon: 'xp',
    check: (s) => s.totalXp >= 500,
  },
  {
    id: 'xp-1000',
    title: 'XP Hoarder',
    description: 'Earn 1,000 total XP',
    icon: 'xp',
    check: (s) => s.totalXp >= 1000,
  },
];
