// ═══════════════════════════════════════════
// TIMELINE LOGIC — estimate calculator
// calculateEstimate, detectMismatch
// ═══════════════════════════════════════════

import type { SkillLevel } from '@plan2skill/types';
import type { GoalData } from './goals';

// Skill multiplier: lower skill = more time needed
const SKILL_MULTIPLIER: Record<SkillLevel, number> = {
  beginner:     1.0,
  familiar:     0.75,
  intermediate: 0.5,
  advanced:     0.3,
};

interface GoalEstimate {
  goalId: string;
  label: string;
  level: SkillLevel;
  weeks: number;
}

export interface EstimateResult {
  perGoal: GoalEstimate[];
  totalWeeks: number;
}

// Calculate estimate for all goals
// Formula: baseWeeks × skillMultiplier × (30 / dailyMinutes)
// Parallel learning = max across goals (you learn them simultaneously)
export function calculateEstimate(
  goals: GoalData[],
  assessments: { goalId: string; level: SkillLevel }[],
  dailyMinutes: number,
): EstimateResult {
  const clampedMinutes = Math.max(15, Math.min(120, dailyMinutes));

  const perGoal: GoalEstimate[] = goals.map(goal => {
    const assessment = assessments.find(a => a.goalId === goal.id);
    const level: SkillLevel = assessment?.level ?? 'beginner';
    const multiplier = SKILL_MULTIPLIER[level];
    const timeRatio = 30 / clampedMinutes;
    const baseWeeks = goal.estimatedWeeks || 12;
    const weeks = Math.max(1, Math.ceil(baseWeeks * multiplier * timeRatio));

    return {
      goalId: goal.id,
      label: goal.label,
      level,
      weeks,
    };
  });

  // Parallel learning: take the max, not sum
  const totalWeeks = perGoal.length > 0
    ? Math.max(...perGoal.map(g => g.weeks))
    : 0;

  return { perGoal, totalWeeks };
}

export interface MismatchResult {
  hasMismatch: boolean;
  suggestions: string[];
}

// Detect mismatch between estimate and target
export function detectMismatch(
  estimateWeeks: number,
  targetMonths: number,
): MismatchResult {
  const targetWeeks = targetMonths * 4.33;
  const ratio = estimateWeeks / targetWeeks;

  if (ratio <= 1.15) {
    return { hasMismatch: false, suggestions: [] };
  }

  const suggestions: string[] = [];

  if (ratio > 1.5) {
    suggestions.push('Increase daily study time for faster progress');
    suggestions.push('Extend your timeline to reduce daily pressure');
    suggestions.push('Focus on fewer goals for deeper mastery');
  } else {
    suggestions.push('Add 15 more minutes per day to stay on track');
    suggestions.push('Extend by 1–2 months for a comfortable pace');
  }

  return { hasMismatch: true, suggestions };
}
