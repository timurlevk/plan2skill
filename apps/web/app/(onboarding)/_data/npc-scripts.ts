// ═══════════════════════════════════════════
// NPC SCRIPTS — Conversation scripts for skills quiz
// Per-goal intro, per-question reactions, summary
// NPC character: user's characterId or 'kofi' default
// ═══════════════════════════════════════════

type Emotion = 'neutral' | 'happy' | 'impressed' | 'thinking';

interface NPCReaction {
  message: string;
  emotion: Emotion;
}

interface GoalScript {
  goalId: string;
  intro: string;
  // Per question-index, per score-tier (0=wrong, 1=partial, 2-3=correct)
  reactions: NPCReaction[][];
  summary: Record<string, NPCReaction>; // keyed by SkillLevel
}

// ─── Per-goal scripts ───

const GOAL_SCRIPTS: GoalScript[] = [
  {
    goalId: 'ai-ml',
    intro: "So, you want to master the arcane arts of AI? Let's see what potions you already know, adventurer!",
    reactions: [
      [
        { message: "No worries — every master started as an apprentice!", emotion: 'happy' },
        { message: "You've heard whispers of the ancient scrolls... good start!", emotion: 'neutral' },
        { message: "Impressive knowledge! You've been studying the tomes!", emotion: 'impressed' },
      ],
      [
        { message: "Python is the mage's staff — you'll learn to wield it!", emotion: 'happy' },
        { message: "Basic incantations mastered. Time for advanced spells!", emotion: 'neutral' },
        { message: "You know your potions! The guild is impressed.", emotion: 'impressed' },
      ],
      [
        { message: "That's a tricky one — we'll cover it on your quest!", emotion: 'happy' },
        { message: "Close! The oracle appreciates your reasoning.", emotion: 'neutral' },
        { message: "Not bad, adventurer! You clearly know your craft.", emotion: 'impressed' },
      ],
    ],
    summary: {
      beginner: { message: "You're just starting your journey — exciting times ahead! I'll forge a beginner-friendly path for you.", emotion: 'happy' },
      familiar: { message: "You have some knowledge of the basics. Let's build on that foundation!", emotion: 'happy' },
      intermediate: { message: "You've clearly been on quests before. Time for advanced challenges!", emotion: 'impressed' },
      advanced: { message: "A seasoned mage! Your roadmap will focus on mastery-level quests.", emotion: 'impressed' },
    },
  },
  {
    goalId: 'fullstack',
    intro: "Full-stack, huh? The legendary dual-wielder path! Let me assess your arsenal.",
    reactions: [
      [
        { message: "APIs are the bridges between realms — you'll learn!", emotion: 'happy' },
        { message: "You know the concept! Let's sharpen those skills.", emotion: 'neutral' },
        { message: "A true architect! You've built bridges before.", emotion: 'impressed' },
      ],
      [
        { message: "React is a powerful weapon — we'll train you!", emotion: 'happy' },
        { message: "Tutorial warrior! Ready for real battles.", emotion: 'neutral' },
        { message: "Production-grade skills! The guild master nods approvingly.", emotion: 'impressed' },
      ],
      [
        { message: "Databases are the treasure vaults — essential knowledge!", emotion: 'happy' },
        { message: "You can query the archives! Good foundation.", emotion: 'neutral' },
        { message: "Schema master! You've organized many treasure vaults.", emotion: 'impressed' },
      ],
    ],
    summary: {
      beginner: { message: "A fresh recruit! Your path will cover both frontend and backend fundamentals.", emotion: 'happy' },
      familiar: { message: "You know one side of the blade. Time to master both!", emotion: 'happy' },
      intermediate: { message: "Solid dual-wielding skills! Let's push to expert level.", emotion: 'impressed' },
      advanced: { message: "A master of both realms! Your quests will be legendary.", emotion: 'impressed' },
    },
  },
  {
    goalId: 'cybersec',
    intro: "The shadow arts of security! Let me test your defenses, guardian.",
    reactions: [
      [
        { message: "Every fortress needs a guardian — let's train you!", emotion: 'happy' },
        { message: "You sense danger on the horizon. Good instincts!", emotion: 'neutral' },
        { message: "You know the enemy's playbook! Impressive, guardian.", emotion: 'impressed' },
      ],
      [
        { message: "The command line is your sword — we'll forge it!", emotion: 'happy' },
        { message: "Basic navigation mastered. Time for stealth ops!", emotion: 'neutral' },
        { message: "A true shadow operative! The terminal bends to your will.", emotion: 'impressed' },
      ],
      [
        { message: "Threat awareness comes with training — stay vigilant!", emotion: 'happy' },
        { message: "You know the threats exist. Now let's learn to counter them!", emotion: 'neutral' },
        { message: "You can explain it AND prevent it — outstanding!", emotion: 'impressed' },
      ],
    ],
    summary: {
      beginner: { message: "New to the watchtower! I'll start you with fundamentals and safe practice environments.", emotion: 'happy' },
      familiar: { message: "You have basic awareness. Let's turn you into a proper guardian!", emotion: 'happy' },
      intermediate: { message: "Solid security instincts! Time for advanced threat hunting.", emotion: 'impressed' },
      advanced: { message: "A master guardian! Your path leads to elite challenges.", emotion: 'impressed' },
    },
  },
  {
    goalId: 'prompt-eng',
    intro: "Ah, the art of speaking to the ancient oracles! Show me what you know.",
    reactions: [
      [
        { message: "The oracles await your first words!", emotion: 'happy' },
        { message: "You've chatted with the oracle. Now let's go deeper!", emotion: 'neutral' },
        { message: "Advanced oracle techniques! You speak their language.", emotion: 'impressed' },
      ],
      [
        { message: "Chain-of-thought is a powerful incantation — we'll teach it!", emotion: 'happy' },
        { message: "You've heard of the technique. Time to master it!", emotion: 'neutral' },
        { message: "You wield multiple techniques at once. Masterful!", emotion: 'impressed' },
      ],
      [
        { message: "RAG is a rare scroll — you'll learn to read it!", emotion: 'happy' },
        { message: "You know the concept! Let's build the pipeline.", emotion: 'neutral' },
        { message: "RAG pipeline builder! The guild is truly impressed.", emotion: 'impressed' },
      ],
    ],
    summary: {
      beginner: { message: "Every oracle master started as a curious apprentice. Let's begin!", emotion: 'happy' },
      familiar: { message: "You have the basics! Time to learn advanced incantations.", emotion: 'happy' },
      intermediate: { message: "You speak the oracle's language fluently! Advanced quests await.", emotion: 'impressed' },
      advanced: { message: "A true oracle whisperer! You'll master the cutting edge.", emotion: 'impressed' },
    },
  },
];

// ─── Generic script for goals without specific scripts ───

const GENERIC_SCRIPT: Omit<GoalScript, 'goalId'> = {
  intro: "Interesting quest choice! Let me assess where you stand on this path.",
  reactions: [
    [
      { message: "We all start somewhere — that's why I'm here to guide you!", emotion: 'happy' },
      { message: "Some knowledge already! We'll build on that.", emotion: 'neutral' },
      { message: "You've been on this path before. Well done, adventurer!", emotion: 'impressed' },
    ],
    [
      { message: "Formal training shapes the foundation — let's build it!", emotion: 'happy' },
      { message: "Self-learner! That takes dedication.", emotion: 'neutral' },
      { message: "Multiple credentials! You're well-prepared.", emotion: 'impressed' },
    ],
    [
      { message: "Theory is step one — practice makes mastery!", emotion: 'happy' },
      { message: "Personal projects show initiative. Keep going!", emotion: 'neutral' },
      { message: "Production experience! You're already on the path.", emotion: 'impressed' },
    ],
  ],
  summary: {
    beginner: { message: "A fresh start! I'll craft a path that builds your skills from the ground up.", emotion: 'happy' },
    familiar: { message: "You have a foundation. Let's turn knowledge into mastery!", emotion: 'happy' },
    intermediate: { message: "Solid skills! Your path will focus on advanced techniques and real projects.", emotion: 'impressed' },
    advanced: { message: "Nearly a master! Your roadmap targets the elite tier of expertise.", emotion: 'impressed' },
  },
};

export function getScriptForGoal(goalId: string): GoalScript {
  const specific = GOAL_SCRIPTS.find(s => s.goalId === goalId);
  if (specific) return specific;
  return { ...GENERIC_SCRIPT, goalId };
}

/**
 * Get the NPC reaction for a given question answer
 * @param script - The goal script
 * @param questionIndex - Which question (0-indexed)
 * @param score - The answer score (0-3)
 */
export function getNPCReaction(
  script: GoalScript,
  questionIndex: number,
  score: number
): NPCReaction {
  const qReactions = script.reactions[questionIndex] || script.reactions[0];
  if (!qReactions) {
    return { message: "Interesting answer, adventurer!", emotion: 'neutral' };
  }

  // Map score to reaction tier: 0=encouraging, 1=neutral, 2-3=impressed
  const fallback: NPCReaction = { message: "Interesting answer, adventurer!", emotion: 'neutral' };
  if (score >= 2) return qReactions[2] ?? qReactions[qReactions.length - 1] ?? fallback;
  if (score >= 1) return qReactions[1] ?? qReactions[0] ?? fallback;
  return qReactions[0] ?? fallback;
}
