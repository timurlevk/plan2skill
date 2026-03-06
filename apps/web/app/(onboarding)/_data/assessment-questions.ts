// ═══════════════════════════════════════════
// ASSESSMENT QUESTIONS — Adaptive question bank
// Step 3: Adaptive Assessment (IRT-style)
// Difficulty 1=easy, 2=medium, 3=hard
// ═══════════════════════════════════════════

type NPCEmotion = 'neutral' | 'happy' | 'impressed' | 'thinking';

export interface AssessmentOption {
  id: string;
  text: string;
  correct: boolean;
}

export interface AssessmentQuestion {
  id: string;
  domain: string;
  difficulty: 1 | 2 | 3;
  question: string;
  options: AssessmentOption[];
  npcReaction: {
    correct: string;
    wrong: string;
    correctEmotion: NPCEmotion;
    wrongEmotion: NPCEmotion;
  };
}

// ─── Adaptive Logic ───

export function getNextQuestion(
  domain: string,
  answered: { questionId: string; correct: boolean }[],
  pool: AssessmentQuestion[] = QUESTIONS,
): AssessmentQuestion | null {
  const domainQuestions = pool.filter((q) => q.domain === domain);
  if (domainQuestions.length === 0) return null;

  const answeredIds = new Set(answered.map((a) => a.questionId));
  const remaining = domainQuestions.filter((q) => !answeredIds.has(q.id));
  if (remaining.length === 0) return null;

  // Determine target difficulty based on streak
  const lastAnswers = answered.slice(-2);
  const recentCorrect = lastAnswers.filter((a) => a.correct).length;

  let targetDifficulty: 1 | 2 | 3;
  if (answered.length === 0) {
    targetDifficulty = 1; // Start easy
  } else if (recentCorrect === 2) {
    targetDifficulty = 3; // Two correct → go hard
  } else if (recentCorrect === 1) {
    targetDifficulty = 2; // Mixed → medium
  } else {
    targetDifficulty = 1; // Two wrong → go easy
  }

  // Find closest difficulty
  const sorted = remaining.sort((a, b) =>
    Math.abs(a.difficulty - targetDifficulty) - Math.abs(b.difficulty - targetDifficulty)
  );
  return sorted[0] ?? null;
}

export function shouldStopAssessment(
  answered: { questionId: string; correct: boolean }[],
  pool: AssessmentQuestion[] = QUESTIONS,
): boolean {
  if (answered.length < 2) return false;
  if (answered.length >= 5) return true;

  // Early stop: 2 correct at high difficulty = advanced
  const highCorrect = answered.filter(
    (a) => a.correct && pool.find((q) => q.id === a.questionId)?.difficulty === 3
  ).length;
  if (highCorrect >= 1 && answered.length >= 3) return true;

  // Early stop: 2 wrong at easy = beginner
  const easyWrong = answered.filter(
    (a) => !a.correct && pool.find((q) => q.id === a.questionId)?.difficulty === 1
  ).length;
  if (easyWrong >= 2) return true;

  return false;
}

export function computeLevel(
  answered: { questionId: string; correct: boolean }[],
  pool: AssessmentQuestion[] = QUESTIONS,
): 'beginner' | 'familiar' | 'intermediate' | 'advanced' {
  if (answered.length === 0) return 'beginner';

  const score = answered.reduce((acc, a) => {
    const q = pool.find((q) => q.id === a.questionId);
    if (!q || !a.correct) return acc;
    return acc + q.difficulty;
  }, 0);

  const maxScore = answered.length * 3;
  const pct = score / maxScore;

  if (pct >= 0.7) return 'advanced';
  if (pct >= 0.45) return 'intermediate';
  if (pct >= 0.2) return 'familiar';
  return 'beginner';
}

// ─── Question Bank ───

export const QUESTIONS: AssessmentQuestion[] = [
  // ═══ TECH ═══
  {
    id: 'tech-e1', domain: 'tech', difficulty: 1,
    question: 'What does HTML stand for?',
    options: [
      { id: 'a', text: 'Hyper Text Markup Language', correct: true },
      { id: 'b', text: 'High Tech Modern Language', correct: false },
      { id: 'c', text: 'Hybrid Text Media Language', correct: false },
      { id: 'd', text: 'Home Tool Markup Language', correct: false },
    ],
    npcReaction: {
      correct: 'Nice! The fundamentals are strong with you.',
      wrong: 'No worries! HTML is the building block of the web.',
      correctEmotion: 'happy', wrongEmotion: 'neutral',
    },
  },
  {
    id: 'tech-e2', domain: 'tech', difficulty: 1,
    question: 'Which language is primarily used for web styling?',
    options: [
      { id: 'a', text: 'CSS', correct: true },
      { id: 'b', text: 'Java', correct: false },
      { id: 'c', text: 'Python', correct: false },
      { id: 'd', text: 'SQL', correct: false },
    ],
    npcReaction: {
      correct: 'Spot on! CSS makes the web beautiful.',
      wrong: 'CSS is the right answer — it controls how web pages look.',
      correctEmotion: 'happy', wrongEmotion: 'neutral',
    },
  },
  {
    id: 'tech-m1', domain: 'tech', difficulty: 2,
    question: 'What is a closure in JavaScript?',
    options: [
      { id: 'a', text: 'A function that has access to its outer scope', correct: true },
      { id: 'b', text: 'A way to close browser tabs', correct: false },
      { id: 'c', text: 'A method for ending loops', correct: false },
      { id: 'd', text: 'A type of CSS selector', correct: false },
    ],
    npcReaction: {
      correct: 'Impressive! Closures are a key concept.',
      wrong: 'A closure captures variables from its surrounding scope — powerful stuff!',
      correctEmotion: 'impressed', wrongEmotion: 'thinking',
    },
  },
  {
    id: 'tech-m2', domain: 'tech', difficulty: 2,
    question: 'What is the time complexity of binary search?',
    options: [
      { id: 'a', text: 'O(log n)', correct: true },
      { id: 'b', text: 'O(n)', correct: false },
      { id: 'c', text: 'O(n²)', correct: false },
      { id: 'd', text: 'O(1)', correct: false },
    ],
    npcReaction: {
      correct: 'Your algorithmic knowledge is sharp!',
      wrong: 'Binary search halves the search space each time — O(log n).',
      correctEmotion: 'impressed', wrongEmotion: 'thinking',
    },
  },
  {
    id: 'tech-h1', domain: 'tech', difficulty: 3,
    question: 'What is the CAP theorem about?',
    options: [
      { id: 'a', text: 'Distributed systems can have at most 2 of: Consistency, Availability, Partition tolerance', correct: true },
      { id: 'b', text: 'A method for capping API rate limits', correct: false },
      { id: 'c', text: 'A design pattern for component architecture', correct: false },
      { id: 'd', text: 'A testing strategy for concurrent applications', correct: false },
    ],
    npcReaction: {
      correct: 'A true architect! The CAP theorem is fundamental to distributed systems.',
      wrong: 'The CAP theorem is about trade-offs in distributed databases.',
      correctEmotion: 'impressed', wrongEmotion: 'thinking',
    },
  },

  // ═══ BUSINESS ═══
  {
    id: 'biz-e1', domain: 'business', difficulty: 1,
    question: 'What does MVP stand for in product development?',
    options: [
      { id: 'a', text: 'Minimum Viable Product', correct: true },
      { id: 'b', text: 'Most Valuable Player', correct: false },
      { id: 'c', text: 'Maximum Value Proposition', correct: false },
      { id: 'd', text: 'Market Validation Process', correct: false },
    ],
    npcReaction: {
      correct: 'Right! Start small, learn fast.',
      wrong: 'MVP = Minimum Viable Product — the simplest version that delivers value.',
      correctEmotion: 'happy', wrongEmotion: 'neutral',
    },
  },
  {
    id: 'biz-m1', domain: 'business', difficulty: 2,
    question: 'What is a key metric for SaaS business health?',
    options: [
      { id: 'a', text: 'Monthly Recurring Revenue (MRR)', correct: true },
      { id: 'b', text: 'Total website visits', correct: false },
      { id: 'c', text: 'Number of employees', correct: false },
      { id: 'd', text: 'Social media followers count', correct: false },
    ],
    npcReaction: {
      correct: 'Strategic thinking! MRR is the lifeblood of SaaS.',
      wrong: 'MRR measures predictable revenue — the most important SaaS metric.',
      correctEmotion: 'impressed', wrongEmotion: 'thinking',
    },
  },
  {
    id: 'biz-h1', domain: 'business', difficulty: 3,
    question: 'What is the "Jobs to Be Done" framework?',
    options: [
      { id: 'a', text: 'Understanding what progress customers are trying to make', correct: true },
      { id: 'b', text: 'A hiring framework for job descriptions', correct: false },
      { id: 'c', text: 'A project management methodology', correct: false },
      { id: 'd', text: 'A task automation framework', correct: false },
    ],
    npcReaction: {
      correct: 'You think like a product visionary! JTBD is powerful.',
      wrong: 'JTBD focuses on the "job" a customer hires a product to do.',
      correctEmotion: 'impressed', wrongEmotion: 'thinking',
    },
  },

  // ═══ CREATIVE ═══
  {
    id: 'cre-e1', domain: 'creative', difficulty: 1,
    question: 'What is the rule of thirds in design?',
    options: [
      { id: 'a', text: 'Dividing the canvas into a 3×3 grid for balanced composition', correct: true },
      { id: 'b', text: 'Using exactly three colors in every design', correct: false },
      { id: 'c', text: 'A font pairing technique', correct: false },
      { id: 'd', text: 'Limiting designs to three layers', correct: false },
    ],
    npcReaction: {
      correct: 'Your creative eye is sharp!',
      wrong: 'The rule of thirds creates visually appealing compositions with a grid.',
      correctEmotion: 'happy', wrongEmotion: 'neutral',
    },
  },
  {
    id: 'cre-m1', domain: 'creative', difficulty: 2,
    question: 'What does "kerning" refer to in typography?',
    options: [
      { id: 'a', text: 'The spacing between individual letter pairs', correct: true },
      { id: 'b', text: 'The height of lowercase letters', correct: false },
      { id: 'c', text: 'The thickness of a font stroke', correct: false },
      { id: 'd', text: 'The angle of italic text', correct: false },
    ],
    npcReaction: {
      correct: 'A true type artisan! Kerning makes text sing.',
      wrong: 'Kerning adjusts the space between specific letter pairs for readability.',
      correctEmotion: 'impressed', wrongEmotion: 'thinking',
    },
  },
  {
    id: 'cre-h1', domain: 'creative', difficulty: 3,
    question: 'What is Gestalt theory in design?',
    options: [
      { id: 'a', text: 'How humans perceive visual elements as unified wholes', correct: true },
      { id: 'b', text: 'A color theory for gradients', correct: false },
      { id: 'c', text: 'A layout system for responsive design', correct: false },
      { id: 'd', text: 'A German printing press technique', correct: false },
    ],
    npcReaction: {
      correct: 'Master-level knowledge! Gestalt principles are the foundation of perception.',
      wrong: 'Gestalt theory explains how we see patterns and groups in visual elements.',
      correctEmotion: 'impressed', wrongEmotion: 'thinking',
    },
  },

  // ═══ DATA ═══
  {
    id: 'dat-e1', domain: 'data', difficulty: 1,
    question: 'What does SQL stand for?',
    options: [
      { id: 'a', text: 'Structured Query Language', correct: true },
      { id: 'b', text: 'Simple Question Logic', correct: false },
      { id: 'c', text: 'System Quality Level', correct: false },
      { id: 'd', text: 'Sequential Query Loader', correct: false },
    ],
    npcReaction: {
      correct: 'The data quest begins! SQL is your sword.',
      wrong: 'SQL = Structured Query Language — the language of databases.',
      correctEmotion: 'happy', wrongEmotion: 'neutral',
    },
  },
  {
    id: 'dat-m1', domain: 'data', difficulty: 2,
    question: 'What is the difference between a LEFT JOIN and an INNER JOIN?',
    options: [
      { id: 'a', text: 'LEFT JOIN keeps all rows from the left table; INNER JOIN only keeps matches', correct: true },
      { id: 'b', text: 'LEFT JOIN is faster than INNER JOIN', correct: false },
      { id: 'c', text: 'INNER JOIN works with multiple tables, LEFT JOIN with only two', correct: false },
      { id: 'd', text: 'LEFT JOIN excludes NULL values; INNER JOIN includes them', correct: false },
    ],
    npcReaction: {
      correct: 'Your SQL mastery grows! JOINs are essential.',
      wrong: 'LEFT JOIN preserves all left table rows, even without matches.',
      correctEmotion: 'impressed', wrongEmotion: 'thinking',
    },
  },
  {
    id: 'dat-h1', domain: 'data', difficulty: 3,
    question: 'What is the purpose of a window function in SQL?',
    options: [
      { id: 'a', text: 'Perform calculations across rows related to the current row', correct: true },
      { id: 'b', text: 'Create a new table from a subquery', correct: false },
      { id: 'c', text: 'Filter rows before aggregation', correct: false },
      { id: 'd', text: 'Display results in a graphical window', correct: false },
    ],
    npcReaction: {
      correct: 'Elite-level SQL! Window functions are powerful analytical tools.',
      wrong: 'Window functions let you compute across row sets without grouping.',
      correctEmotion: 'impressed', wrongEmotion: 'thinking',
    },
  },

  // ═══ LEADERSHIP (was PERSONAL) ═══
  {
    id: 'per-e1', domain: 'leadership', difficulty: 1,
    question: 'What is the Eisenhower Matrix used for?',
    options: [
      { id: 'a', text: 'Prioritizing tasks by urgency and importance', correct: true },
      { id: 'b', text: 'Tracking daily habits', correct: false },
      { id: 'c', text: 'Setting long-term career goals', correct: false },
      { id: 'd', text: 'Delegating tasks to team members', correct: false },
    ],
    npcReaction: {
      correct: 'Wise prioritization! The Matrix of a true leader.',
      wrong: 'The Eisenhower Matrix sorts tasks into 4 quadrants: urgent/important.',
      correctEmotion: 'happy', wrongEmotion: 'neutral',
    },
  },
  {
    id: 'per-m1', domain: 'leadership', difficulty: 2,
    question: 'What is "active listening"?',
    options: [
      { id: 'a', text: 'Fully concentrating, understanding, and responding to the speaker', correct: true },
      { id: 'b', text: 'Listening while doing other tasks', correct: false },
      { id: 'c', text: 'Repeating back exactly what someone said', correct: false },
      { id: 'd', text: 'Taking detailed notes during meetings', correct: false },
    ],
    npcReaction: {
      correct: 'A true connector! Active listening is a superpower.',
      wrong: 'Active listening means being fully present and engaged with the speaker.',
      correctEmotion: 'impressed', wrongEmotion: 'thinking',
    },
  },

  // ═══ AI & SMART TOOLS (was EMERGING) ═══
  {
    id: 'emr-e1', domain: 'ai', difficulty: 1,
    question: 'What is a "prompt" in the context of AI?',
    options: [
      { id: 'a', text: 'An instruction or input given to an AI model', correct: true },
      { id: 'b', text: 'A type of programming language', correct: false },
      { id: 'c', text: 'A hardware component for AI processing', correct: false },
      { id: 'd', text: 'A debugging tool for machine learning', correct: false },
    ],
    npcReaction: {
      correct: 'The AI quest begins! Prompting is your new spell.',
      wrong: 'A prompt is the text you give to an AI to guide its response.',
      correctEmotion: 'happy', wrongEmotion: 'neutral',
    },
  },
  {
    id: 'emr-m1', domain: 'ai', difficulty: 2,
    question: 'What is "chain-of-thought" prompting?',
    options: [
      { id: 'a', text: 'Asking the AI to reason step by step before answering', correct: true },
      { id: 'b', text: 'Connecting multiple AI models in sequence', correct: false },
      { id: 'c', text: 'A blockchain consensus mechanism', correct: false },
      { id: 'd', text: 'Training an AI on sequential data', correct: false },
    ],
    npcReaction: {
      correct: 'Advanced prompting! Chain-of-thought unlocks deeper reasoning.',
      wrong: 'Chain-of-thought = asking the AI to show its reasoning process.',
      correctEmotion: 'impressed', wrongEmotion: 'thinking',
    },
  },
  {
    id: 'emr-h1', domain: 'ai', difficulty: 3,
    question: 'What is "retrieval-augmented generation" (RAG)?',
    options: [
      { id: 'a', text: 'Combining search results with LLM generation for grounded answers', correct: true },
      { id: 'b', text: 'A technique for generating random data', correct: false },
      { id: 'c', text: 'A method for compressing AI models', correct: false },
      { id: 'd', text: 'A reinforcement learning reward function', correct: false },
    ],
    npcReaction: {
      correct: 'Legendary knowledge! RAG is the frontier of AI applications.',
      wrong: 'RAG grounds AI responses in real data by retrieving relevant documents first.',
      correctEmotion: 'impressed', wrongEmotion: 'thinking',
    },
  },
  // ═══ LANGUAGES ═══
  {
    id: 'lang-e1', domain: 'languages', difficulty: 1,
    question: 'What is the most effective way to memorize new vocabulary?',
    options: [
      { id: 'a', text: 'Spaced repetition — reviewing words at increasing intervals', correct: true },
      { id: 'b', text: 'Reading the dictionary cover to cover', correct: false },
      { id: 'c', text: 'Writing each word 100 times', correct: false },
      { id: 'd', text: 'Memorizing words alphabetically', correct: false },
    ],
    npcReaction: {
      correct: 'Smart approach! Spaced repetition is a proven memory technique.',
      wrong: 'Spaced repetition is the most effective way — review at growing intervals.',
      correctEmotion: 'happy', wrongEmotion: 'neutral',
    },
  },
  {
    id: 'lang-m1', domain: 'languages', difficulty: 2,
    question: 'What does "immersion learning" mean?',
    options: [
      { id: 'a', text: 'Surrounding yourself with the target language in daily life', correct: true },
      { id: 'b', text: 'Only studying grammar rules intensively', correct: false },
      { id: 'c', text: 'Using translation apps for every sentence', correct: false },
      { id: 'd', text: 'Studying one word per day consistently', correct: false },
    ],
    npcReaction: {
      correct: 'You understand the power of immersion! Context is everything.',
      wrong: 'Immersion means surrounding yourself with the language — media, conversations, thinking in it.',
      correctEmotion: 'impressed', wrongEmotion: 'thinking',
    },
  },
  {
    id: 'lang-h1', domain: 'languages', difficulty: 3,
    question: 'What is the CEFR framework?',
    options: [
      { id: 'a', text: 'A European standard for measuring language proficiency (A1 to C2)', correct: true },
      { id: 'b', text: 'A method for teaching grammar through music', correct: false },
      { id: 'c', text: 'A certification program for language teachers', correct: false },
      { id: 'd', text: 'A test for native speaker fluency', correct: false },
    ],
    npcReaction: {
      correct: 'You know the global standard! CEFR levels guide your path to fluency.',
      wrong: 'CEFR defines 6 levels (A1-C2) — the international standard for language skills.',
      correctEmotion: 'impressed', wrongEmotion: 'thinking',
    },
  },

  // ═══ MARKETING & GROWTH ═══
  {
    id: 'mkt-e1', domain: 'marketing', difficulty: 1,
    question: 'What is a "call to action" (CTA)?',
    options: [
      { id: 'a', text: 'A prompt that encourages the audience to take a specific step', correct: true },
      { id: 'b', text: 'A phone number on a website', correct: false },
      { id: 'c', text: 'A type of social media post', correct: false },
      { id: 'd', text: 'An automated email response', correct: false },
    ],
    npcReaction: {
      correct: 'Every great marketer knows their CTAs! Well done.',
      wrong: 'A CTA tells your audience what to do next — "Sign up", "Learn more", etc.',
      correctEmotion: 'happy', wrongEmotion: 'neutral',
    },
  },
  {
    id: 'mkt-m1', domain: 'marketing', difficulty: 2,
    question: 'What is the difference between organic and paid marketing?',
    options: [
      { id: 'a', text: 'Organic is free/earned visibility; paid is bought advertising', correct: true },
      { id: 'b', text: 'Organic uses images; paid uses text only', correct: false },
      { id: 'c', text: 'They are the same thing with different names', correct: false },
      { id: 'd', text: 'Organic targets B2B; paid targets B2C', correct: false },
    ],
    npcReaction: {
      correct: 'Strategic thinking! Knowing when to use each is a superpower.',
      wrong: 'Organic = content, SEO, word-of-mouth. Paid = ads you pay for.',
      correctEmotion: 'impressed', wrongEmotion: 'thinking',
    },
  },
  {
    id: 'mkt-h1', domain: 'marketing', difficulty: 3,
    question: 'What is Customer Lifetime Value (CLV)?',
    options: [
      { id: 'a', text: 'The total revenue a business can expect from a single customer over time', correct: true },
      { id: 'b', text: 'The cost of acquiring one new customer', correct: false },
      { id: 'c', text: 'The average time a customer stays subscribed', correct: false },
      { id: 'd', text: 'The maximum discount offered to loyal customers', correct: false },
    ],
    npcReaction: {
      correct: 'Growth-level mastery! CLV drives smart business decisions.',
      wrong: 'CLV measures the total value a customer brings over their entire relationship.',
      correctEmotion: 'impressed', wrongEmotion: 'thinking',
    },
  },

  // ═══ CYBER & SECURITY ═══
  {
    id: 'sec-e1', domain: 'security', difficulty: 1,
    question: 'What is phishing?',
    options: [
      { id: 'a', text: 'A social engineering attack using fake emails or messages to steal data', correct: true },
      { id: 'b', text: 'A type of network cable', correct: false },
      { id: 'c', text: 'A method for encrypting files', correct: false },
      { id: 'd', text: 'A password recovery technique', correct: false },
    ],
    npcReaction: {
      correct: 'Good awareness! Recognizing phishing is the first line of defense.',
      wrong: 'Phishing uses deceptive messages to trick people into revealing sensitive info.',
      correctEmotion: 'happy', wrongEmotion: 'neutral',
    },
  },
  {
    id: 'sec-m1', domain: 'security', difficulty: 2,
    question: 'What is the CIA triad in cybersecurity?',
    options: [
      { id: 'a', text: 'Confidentiality, Integrity, and Availability', correct: true },
      { id: 'b', text: 'A US intelligence agency security protocol', correct: false },
      { id: 'c', text: 'Certificate, Identity, and Authentication', correct: false },
      { id: 'd', text: 'Control, Inspection, and Authorization', correct: false },
    ],
    npcReaction: {
      correct: 'You know the fundamentals! CIA triad is the bedrock of security.',
      wrong: 'The CIA triad — Confidentiality, Integrity, Availability — guides all security decisions.',
      correctEmotion: 'impressed', wrongEmotion: 'thinking',
    },
  },
  {
    id: 'sec-h1', domain: 'security', difficulty: 3,
    question: 'What is a zero-day vulnerability?',
    options: [
      { id: 'a', text: 'A flaw that is exploited before the vendor releases a patch', correct: true },
      { id: 'b', text: 'A virus that activates on day zero of installation', correct: false },
      { id: 'c', text: 'A firewall with zero configuration', correct: false },
      { id: 'd', text: 'An attack that resets a system to factory settings', correct: false },
    ],
    npcReaction: {
      correct: 'Elite security knowledge! Zero-days are the most dangerous threats.',
      wrong: 'A zero-day is unknown to the vendor — no patch exists yet when it\'s exploited.',
      correctEmotion: 'impressed', wrongEmotion: 'thinking',
    },
  },
];

// ─── Self-Assessment Fallback Options ───
// Icons reference NeonIcon component types from the style guide
export const SELF_ASSESSMENT_OPTIONS = [
  { id: 'beginner', label: 'Complete Beginner', description: 'I\'ve never explored this area', level: 'beginner' as const, icon: 'compass', color: '#71717A' },
  { id: 'familiar', label: 'Somewhat Familiar', description: 'I know the basics but haven\'t practiced much', level: 'familiar' as const, icon: 'book', color: '#6EE7B7' },
  { id: 'intermediate', label: 'Intermediate', description: 'I\'ve done projects and can work independently', level: 'intermediate' as const, icon: 'shield', color: '#9D7AFF' },
  { id: 'advanced', label: 'Advanced', description: 'I can teach others and solve hard problems', level: 'advanced' as const, icon: 'crown', color: '#FFD166' },
];
