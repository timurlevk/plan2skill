// ─── Variable Bonus XP (20% chance, Variable Ratio Reinforcement) ───

export interface BonusResult {
  bonus: number;
  total: number;
  hasBonus: boolean;
}

export function rollBonusXP(baseXP: number): BonusResult {
  const hasBonus = Math.random() < 0.2; // 20% chance
  const bonus = hasBonus ? Math.round(baseXP * 0.5) : 0; // +50% bonus
  return { bonus, total: baseXP + bonus, hasBonus };
}

// ─── Daily Quest Proximity Messaging (Goal-Gradient Effect) ───

export function getDailyProgressMessage(completed: number, total: number): string {
  if (completed === 0) return 'Begin your journey, hero!';
  if (completed === total) return 'All quests conquered! Glorious!';
  const remaining = total - completed;
  if (remaining === 1) return 'One quest away from glory!';
  if (completed / total >= 0.5) return 'Over halfway — keep the momentum!';
  return `${remaining} quests remain on your path`;
}

// ─── Greeting ───

export function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}
