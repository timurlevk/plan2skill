import type {
  LearnerProfileContext,
  RoadmapContextSummary,
  LedgerContext,
  DomainModelContext,
} from './types';
import {
  TASK_TYPE_DOC,
  QUEST_TYPE_DOC,
  RARITY_DOC,
  BLOOM_LEVEL_DOC,
  FLOW_CATEGORY_DOC,
  TASK_QUEST_TYPE_MAP,
  XP_BY_RARITY,
  COIN_BY_TASK_TYPE,
  RARITY_DISTRIBUTION,
} from './prompt-constants';

// ─── JSON Header / Footer ────────────────────────────────────────────

export function jsonInstructionHeader(): string {
  return `Your output must be valid JSON matching the schema exactly. No markdown fences, no explanation — pure JSON only.`;
}

export function jsonFooter(): string {
  return `Return ONLY the JSON. No markdown fences, no explanation.`;
}

// ─── Enum Documentation ──────────────────────────────────────────────

export function enumDoc(label: string, values: string): string {
  return `"${label}": "${values}"`;
}

export function taskTypeDoc(): string {
  return enumDoc('taskType', TASK_TYPE_DOC);
}

export function questTypeDoc(): string {
  return enumDoc('questType', QUEST_TYPE_DOC);
}

export function rarityDoc(): string {
  return enumDoc('rarity', RARITY_DOC);
}

export function bloomLevelDoc(): string {
  return enumDoc('bloomLevel', BLOOM_LEVEL_DOC);
}

export function flowCategoryDoc(): string {
  return enumDoc('flowCategory', FLOW_CATEGORY_DOC);
}

// ─── Context Sections ────────────────────────────────────────────────

export function userContextSection(profile: LearnerProfileContext): string {
  let s = `\n**User Context:**`;
  s += `\n- Level: ${profile.level}`;
  s += `\n- Total XP: ${profile.totalXp}`;
  if (profile.archetypeId) {
    s += `\n- Archetype: ${profile.archetypeId}`;
  }
  s += `\n- Current streak: ${profile.currentStreak} days`;
  s += `\n- Recent completions (30d): ${profile.recentCompletions}`;
  if (profile.averageQualityScore !== undefined) {
    s += `\n- Average quality: ${(profile.averageQualityScore * 100).toFixed(0)}%`;
  }
  if (profile.preferredTaskTypes.length > 0) {
    s += `\n- Preferred types: ${profile.preferredTaskTypes.join(', ')}`;
  }
  s += `\n- Avg time ratio: ${profile.averageTimeSpentRatio.toFixed(2)} (>1 = takes longer than estimated)`;
  if (profile.dreamGoal) {
    s += `\n- Dream goal: ${profile.dreamGoal}`;
  }
  if (profile.interests?.length) {
    s += `\n- Interests: ${profile.interests.join(', ')}`;
  }
  if (profile.dueReviewCount > 0) {
    s += `\n- Due reviews: ${profile.dueReviewCount} (consider including review-type quests)`;
  }
  return s;
}

export function skillEloSection(
  elos: LearnerProfileContext['skillElos'],
  max = 5,
): string {
  if (!elos.length) return '';
  const eloStr = elos
    .slice(0, max)
    .map((e) => `${e.skillDomain}(${e.elo}, ${e.assessmentCount} assessments)`)
    .join(', ');
  return `\n- Skill Elo: ${eloStr}`;
}

export function characterSection(profile: LearnerProfileContext): string {
  if (!profile.characterAttributes) return '';
  const attrs = profile.characterAttributes;
  let s = `\n- Character: ${profile.characterId ?? 'unknown'} (${profile.evolutionTier ?? 'base'})`;
  s += `\n- Top attributes: STR=${attrs.strength} INT=${attrs.intelligence} CHA=${attrs.charisma}`;
  return s;
}

export function archetypeSection(
  blueprint: DomainModelContext['archetypeBlueprint'],
): string {
  if (!blueprint) return '';
  const bp = blueprint;
  let s = `\n\n**Archetype: ${bp.archetypeId}**`;
  s += `\n- Quest type mix: knowledge ${(bp.questMix.knowledge * 100).toFixed(0)}%, practice ${(bp.questMix.practice * 100).toFixed(0)}%, creative ${(bp.questMix.creative * 100).toFixed(0)}%, boss ${(bp.questMix.boss * 100).toFixed(0)}%`;
  s += `\n- Preferred Bloom's levels: ${bp.preferredBloomLevels.join(', ')}`;
  s += `\nSkew task types and Bloom's levels toward archetype preferences.`;
  return s;
}

// ─── Roadmap Context ─────────────────────────────────────────────────

export function roadmapContextSection(
  ctx: RoadmapContextSummary | undefined,
): string {
  if (!ctx) return '';
  let s = `\n\n**Roadmap Context:**`;
  s += `\n- Goal: ${ctx.goal}`;
  s += `\n- Progress: ${ctx.progress.toFixed(0)}%`;
  const completedMilestones = ctx.milestones.filter((m) => m.status === 'completed');
  if (completedMilestones.length > 0) {
    s += `\n- Completed milestones: ${completedMilestones.map((m) => m.title).join(', ')}`;
  }
  const coveredDomains = [...new Set(ctx.milestones.flatMap((m) => m.skillDomains))];
  if (coveredDomains.length > 0) {
    s += `\n- Covered skill domains: ${coveredDomains.join(', ')}`;
  }
  return s;
}

export function activeMilestoneSection(
  ctx: RoadmapContextSummary | undefined,
): string {
  if (!ctx) return '';
  const active = ctx.milestones.find((m) => m.status === 'active' || m.status === 'in_progress');
  if (!active) return '';
  let s = `\n- Active milestone: "${active.title}" (${active.completedTasks}/${active.totalTasks} tasks done)`;
  if (active.skillDomains.length > 0) {
    s += `\n- Milestone skill domains: ${active.skillDomains.join(', ')}`;
  }
  return s;
}

// ─── Ledger Insights ─────────────────────────────────────────────────

export function ledgerInsightsSection(
  ctx: LedgerContext | undefined,
): string {
  if (!ctx?.insights.length) return '';
  const patterns = ctx.insights
    .filter((i) => i.insightType === 'error_pattern' || i.insightType === 'misconception')
    .slice(0, 3);
  if (!patterns.length) return '';
  let s = `\n\n**Known Learner Patterns:**`;
  for (const p of patterns) {
    s += `\n- ${p.title}: ${p.description}`;
  }
  s += `\nInclude review-type quests that address these patterns.`;
  return s;
}

// ─── Rules & Constraints ─────────────────────────────────────────────

export function rewardRulesDoc(): string {
  const xpLines = Object.entries(XP_BY_RARITY)
    .map(([rarity, [min, max]]) => `${rarity} ${min}-${max}`)
    .join(', ');
  const coinLines = Object.entries(COIN_BY_TASK_TYPE)
    .map(([type, [min, max]]) => `${type} ${min}-${max}`)
    .join(', ');
  return `- XP rewards by rarity: ${xpLines}\n- Coin rewards by taskType: ${coinLines}`;
}

export function rarityDistributionDoc(): string {
  const parts = Object.entries(RARITY_DISTRIBUTION)
    .map(([rarity, pct]) => `${pct}% ${rarity}`)
    .join(', ');
  return `- Rarity distribution: ~${parts}`;
}

export function pacingConstraint(dailyMinutes: number): string {
  if (!dailyMinutes) return '';
  return `- Daily time budget: ${dailyMinutes} minutes — total estimated task time per day must not exceed this`;
}

export function taskQuestTypeMapping(): string {
  const lines = Object.entries(TASK_QUEST_TYPE_MAP)
    .map(([task, quests]) => `  ${task} → ${quests.join(' | ')}`)
    .join('\n');
  return `- Valid taskType → questType mapping:\n${lines}`;
}

export function missingDataGuidance(): string {
  return `
**Missing Data Guidance:**
- If no skill Elo data: assume beginner level, start with Bloom's "remember" and "understand"
- If no archetype blueprint: use balanced quest mix (40% knowledge, 30% practice, 20% creative, 10% boss)
- If no roadmap context: generate standalone content appropriate for the skill domain
- If no learner patterns: skip pattern-targeted review quests`;
}
