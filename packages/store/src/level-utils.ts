import type { LevelInfo } from '@plan2skill/types';

// ─── XP-to-Level Calculation ─────────────────────────────────────
// Gentle curve: xpForLevel(n) = 80 + 20*n
// Level 1: 100 XP, Level 5: 550 total, Level 10: 1900 total

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
