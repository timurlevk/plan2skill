import type { NeonIconType } from '../../../(onboarding)/_components/NeonIcon';
import { rarity } from '../../../(onboarding)/_components/tokens';

// ─── Quest Task Interface ────────────────────────────────────────

export interface QuestTask {
  id: string;
  title: string;
  type: string;
  xp: number;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  mins: number;
  desc: string;
  objectives: string[];
  aiTip: string;
  funFact: string;
  checkQuestion: string;
  checkOptions: string[];
  checkCorrect: number;
  goalLabel: string;
  goalIcon: string;
}

// ─── Mock Task Templates ─────────────────────────────────────────

const TASK_TEMPLATES = [
  {
    titleFn: (g: string) => `Read: Introduction to ${g}`,
    type: 'article', xp: 15, rarity: 'common' as const, mins: 5,
    descFn: (g: string) => `Dive into the fundamentals of ${g}. This article covers the core concepts you need before going deeper.`,
    objectivesFn: (g: string) => [
      `Read the full introduction to ${g}`,
      'Take note of 3 key concepts',
      'Mark quest as complete when done',
    ],
    aiTipFn: (g: string) => `When reading about ${g}, highlight key terms you don't understand. Then ask AI: "Explain [term] like I'm 5." You'll learn 3x faster!`,
    funFactFn: (g: string) => `The word "study" comes from the Latin "studium" meaning "eagerness." So when you study ${g}, you're literally being eager to learn!`,
    checkQuestionFn: (g: string) => `What is the most effective way to retain new ${g} concepts?`,
    checkOptions: ['Read it once quickly', 'Take notes and summarize in your own words', 'Memorize definitions word-for-word', 'Skip to the next topic'],
    checkCorrect: 1,
  },
  {
    titleFn: (g: string) => `Watch: ${g} Fundamentals`,
    type: 'video', xp: 25, rarity: 'common' as const, mins: 10,
    descFn: (g: string) => `A guided video walkthrough of ${g} fundamentals. Follow along and practice the demonstrated techniques.`,
    objectivesFn: (g: string) => [
      `Watch the ${g} fundamentals video`,
      'Follow along with the examples',
      'Try one technique on your own',
    ],
    aiTipFn: (g: string) => `Pause the video every 2 minutes and try to explain what you just learned. This is called "active recall" — it makes ${g} concepts stick 10x better!`,
    funFactFn: (g: string) => `Your brain processes visual information 60,000x faster than text. That's why video tutorials about ${g} feel so much easier to follow!`,
    checkQuestionFn: (g: string) => `After watching a ${g} tutorial, what should you do first?`,
    checkOptions: ['Watch another video', 'Try to recreate what was shown', 'Take a break for the day', 'Read the comments section'],
    checkCorrect: 1,
  },
  {
    titleFn: (g: string) => `Quiz: ${g} Basics`,
    type: 'quiz', xp: 30, rarity: 'uncommon' as const, mins: 5,
    descFn: (g: string) => `Test your knowledge of ${g} basics. Score 80% or higher to earn bonus XP. Don't worry — you can retry!`,
    objectivesFn: (g: string) => [
      `Complete the ${g} basics quiz`,
      'Score at least 80%',
      'Review any incorrect answers',
    ],
    aiTipFn: (g: string) => `If you get a question wrong, don't just look at the answer. Ask AI: "Why is option B correct for ${g}?" Understanding the WHY is more valuable than the answer!`,
    funFactFn: (g: string) => `Studies show that testing yourself (even and failing!) improves long-term memory by 50%. Every wrong answer about ${g} is actually making you smarter!`,
    checkQuestionFn: (g: string) => `Why is it important to review incorrect quiz answers about ${g}?`,
    checkOptions: ['To feel bad about mistakes', 'To understand WHY the correct answer is right', 'It\'s not important, just move on', 'To memorize the answers for next time'],
    checkCorrect: 1,
  },
  {
    titleFn: (g: string) => `Build: ${g} Mini-Project`,
    type: 'project', xp: 50, rarity: 'rare' as const, mins: 20,
    descFn: (g: string) => `Apply what you've learned by building a small ${g} project from scratch. This is where real learning happens!`,
    objectivesFn: (g: string) => [
      'Set up your project environment',
      `Build a working ${g} prototype`,
      'Test and iterate on your solution',
      'Share or save your progress',
    ],
    aiTipFn: (g: string) => `Stuck on your ${g} project? Describe what you're trying to build to AI and ask: "What's the simplest way to start?" Break big tasks into tiny steps!`,
    funFactFn: (g: string) => `The "IKEA effect" shows that people value things they build themselves 5x more. Your ${g} project will feel amazing because YOU made it!`,
    checkQuestionFn: (g: string) => `What's the best approach when starting a ${g} project?`,
    checkOptions: ['Build everything at once', 'Start with the hardest part', 'Build a small working version first, then improve', 'Copy someone else\'s project exactly'],
    checkCorrect: 2,
  },
];

// ─── Task Generation ─────────────────────────────────────────────

export function generateTasks(goalLabel: string, goalId: string, goalIcon: string): QuestTask[] {
  const seed = goalId.length;
  const count = 2 + (seed % 2);
  return TASK_TEMPLATES.slice(0, count).map((tmpl, i) => ({
    id: `${goalId}-task-${i}`,
    title: tmpl.titleFn(goalLabel),
    type: tmpl.type,
    xp: tmpl.xp,
    rarity: tmpl.rarity,
    mins: tmpl.mins,
    desc: tmpl.descFn(goalLabel),
    objectives: tmpl.objectivesFn(goalLabel),
    aiTip: tmpl.aiTipFn(goalLabel),
    funFact: tmpl.funFactFn(goalLabel),
    checkQuestion: tmpl.checkQuestionFn(goalLabel),
    checkOptions: tmpl.checkOptions,
    checkCorrect: tmpl.checkCorrect,
    goalLabel,
    goalIcon,
  }));
}

// ─── Quest Type Icons ────────────────────────────────────────────

export const TYPE_ICONS: Record<string, { icon: NeonIconType; label: string }> = {
  article: { icon: 'book', label: 'Scroll' },
  video:   { icon: 'play', label: 'Vision' },
  quiz:    { icon: 'quiz', label: 'Trial' },
  project: { icon: 'rocket', label: 'Forge' },
};

// ─── Challenge Tier (RPG vocabulary for difficulty) ──────────────

export const CHALLENGE_TIER: Record<string, { label: string; color: string }> = {
  common:    { label: 'Tier I',  color: rarity.common.color },
  uncommon:  { label: 'Tier II', color: rarity.uncommon.color },
  rare:      { label: 'Tier III', color: rarity.rare.color },
  epic:      { label: 'Tier IV', color: rarity.epic.color },
  legendary: { label: 'Tier V',  color: rarity.legendary.color },
};
