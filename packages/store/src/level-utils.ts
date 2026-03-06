import type { LevelInfo } from '@plan2skill/types';

// ─── XP-to-Level Calculation ─────────────────────────────────────
// Gentle curve: xpForLevel(n) = 80 + 20*n
// Level 1: 100 XP, Level 5: 550 total, Level 10: 1900 total

// ─── Attribute Growth (Diminishing Returns) ──────────────────────
// Canonical formula — ОДНА СКРІЗЬ (client + server).
// Scale factor: linear from 1.0 (at base 10) to 0.0 (at cap 100).
// Always grants minimum 1 if below cap and rawGrowth > 0.
export function attributeGrowth(rawGrowth: number, currentValue: number): number {
  if (currentValue >= 100 || rawGrowth <= 0) return 0;
  const remaining = (100 - currentValue) / 90; // 1.0 at 10, 0.0 at 100
  const effective = rawGrowth * remaining;
  return Math.max(1, Math.round(effective));
}

export function xpForLevel(n: number): number {
  return 80 + 20 * n;
}

export function computeLevel(totalXp: number): number {
  let level = 1;
  let xpNeeded = 0;
  while (true) {
    xpNeeded += xpForLevel(level);
    if (totalXp < xpNeeded) return level;
    level++;
  }
}

export function getLevelInfo(totalXp: number): LevelInfo {
  let level = 1;
  let xpConsumed = 0;
  while (true) {
    const needed = xpForLevel(level);
    if (totalXp < xpConsumed + needed) {
      return {
        level,
        currentXp: totalXp - xpConsumed,
        xpForCurrentLevel: 0,
        xpForNextLevel: needed,
        progress: (totalXp - xpConsumed) / needed,
      };
    }
    xpConsumed += needed;
    level++;
  }
}
