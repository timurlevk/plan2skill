// ═══════════════════════════════════════════
// MILESTONE TEMPLATES — Pre-computed milestones per domain
// Used by GoalPyramid in Steps 2A/2B/2C
// AI Latency Strategy Layer 1: 0ms local data
// ═══════════════════════════════════════════

export interface MilestoneTemplate {
  id: string;
  text: string;
  weeks: number;
}

export interface GoalTemplate {
  id: string;
  keywords: string[];
  domain: string;
  dreamLabel: string;
  milestones: MilestoneTemplate[];
}

// ─── Template Matching (Layer 2: client-side) ───
export function matchTemplates(input: string, domain?: string): GoalTemplate | null {
  const lower = input.toLowerCase();
  const scored = GOAL_TEMPLATES
    .filter((t) => !domain || t.domain === domain)
    .map((t) => ({
      template: t,
      score: t.keywords.reduce((acc, kw) => acc + (lower.includes(kw) ? 1 : 0), 0),
    }))
    .filter((t) => t.score > 0)
    .sort((a, b) => b.score - a.score);
  return scored[0]?.template ?? null;
}

// ─── Default milestones per domain (fallback) ───
export function getDefaultMilestones(domain: string): MilestoneTemplate[] {
  const domainTemplates = GOAL_TEMPLATES.filter((t) => t.domain === domain);
  if (domainTemplates.length > 0) return domainTemplates[0]!.milestones;
  return GENERIC_MILESTONES;
}

const GENERIC_MILESTONES: MilestoneTemplate[] = [
  { id: 'gen-1', text: 'Learn the fundamentals', weeks: 2 },
  { id: 'gen-2', text: 'Complete a hands-on project', weeks: 4 },
  { id: 'gen-3', text: 'Build a portfolio piece', weeks: 4 },
];

export const GOAL_TEMPLATES: GoalTemplate[] = [
  // ─── Tech ───
  {
    id: 'web-fullstack',
    keywords: ['web', 'fullstack', 'full-stack', 'frontend', 'backend', 'react', 'next', 'node'],
    domain: 'tech',
    dreamLabel: 'Become a Full-Stack Developer',
    milestones: [
      { id: 'ws-1', text: 'Master HTML, CSS & JavaScript fundamentals', weeks: 3 },
      { id: 'ws-2', text: 'Build a React application with routing', weeks: 3 },
      { id: 'ws-3', text: 'Create a REST API with Node.js', weeks: 3 },
    ],
  },
  {
    id: 'mobile-dev',
    keywords: ['mobile', 'app', 'ios', 'android', 'react native', 'flutter', 'swift', 'kotlin'],
    domain: 'tech',
    dreamLabel: 'Build Mobile Apps',
    milestones: [
      { id: 'md-1', text: 'Learn mobile UI patterns & navigation', weeks: 2 },
      { id: 'md-2', text: 'Build a cross-platform app with data', weeks: 4 },
      { id: 'md-3', text: 'Publish an app to a store', weeks: 4 },
    ],
  },
  {
    id: 'ai-ml',
    keywords: ['ai', 'machine learning', 'ml', 'deep learning', 'neural', 'tensorflow', 'pytorch'],
    domain: 'tech',
    dreamLabel: 'Master AI & Machine Learning',
    milestones: [
      { id: 'ai-1', text: 'Understand ML fundamentals & Python', weeks: 3 },
      { id: 'ai-2', text: 'Train and evaluate a classification model', weeks: 3 },
      { id: 'ai-3', text: 'Build an end-to-end ML pipeline', weeks: 4 },
    ],
  },
  // ─── Business ───
  {
    id: 'product-mgmt',
    keywords: ['product', 'pm', 'product manager', 'roadmap', 'strategy', 'user research'],
    domain: 'business',
    dreamLabel: 'Become a Product Manager',
    milestones: [
      { id: 'pm-1', text: 'Learn product discovery & prioritization', weeks: 2 },
      { id: 'pm-2', text: 'Run user interviews & synthesize findings', weeks: 3 },
      { id: 'pm-3', text: 'Create a product roadmap for a real problem', weeks: 3 },
    ],
  },
  {
    id: 'startup',
    keywords: ['startup', 'entrepreneur', 'business', 'launch', 'mvp', 'founder'],
    domain: 'business',
    dreamLabel: 'Launch a Startup',
    milestones: [
      { id: 'su-1', text: 'Validate a business idea with customers', weeks: 2 },
      { id: 'su-2', text: 'Build & test an MVP', weeks: 4 },
      { id: 'su-3', text: 'Get first paying customers', weeks: 4 },
    ],
  },

  // ─── Creative ───
  {
    id: 'ui-ux',
    keywords: ['design', 'ui', 'ux', 'figma', 'interface', 'user experience', 'prototyping'],
    domain: 'creative',
    dreamLabel: 'Master UI/UX Design',
    milestones: [
      { id: 'ux-1', text: 'Learn design principles & Figma basics', weeks: 2 },
      { id: 'ux-2', text: 'Design a complete mobile app flow', weeks: 3 },
      { id: 'ux-3', text: 'Run a usability test & iterate', weeks: 3 },
    ],
  },
  {
    id: 'content-creation',
    keywords: ['content', 'writing', 'blog', 'social media', 'creator', 'storytelling'],
    domain: 'creative',
    dreamLabel: 'Become a Content Creator',
    milestones: [
      { id: 'cc-1', text: 'Define your niche & content strategy', weeks: 2 },
      { id: 'cc-2', text: 'Create & publish 10 pieces of content', weeks: 4 },
      { id: 'cc-3', text: 'Build an engaged audience of 100+', weeks: 4 },
    ],
  },

  // ─── Data ───
  {
    id: 'data-science',
    keywords: ['data', 'analytics', 'science', 'analysis', 'sql', 'visualization', 'python'],
    domain: 'data',
    dreamLabel: 'Become a Data Scientist',
    milestones: [
      { id: 'ds-1', text: 'Master SQL & data manipulation', weeks: 2 },
      { id: 'ds-2', text: 'Build a data analysis with visualizations', weeks: 3 },
      { id: 'ds-3', text: 'Create a predictive model', weeks: 4 },
    ],
  },

  // ─── Languages ───
  {
    id: 'language-learning',
    keywords: ['language', 'english', 'spanish', 'french', 'german', 'japanese', 'chinese', 'korean', 'speaking', 'fluency'],
    domain: 'languages',
    dreamLabel: 'Learn a New Language',
    milestones: [
      { id: 'll-1', text: 'Learn essential vocabulary & greetings (100 words)', weeks: 2 },
      { id: 'll-2', text: 'Hold a basic conversation on everyday topics', weeks: 4 },
      { id: 'll-3', text: 'Read a short article and write a response', weeks: 4 },
    ],
  },
  {
    id: 'business-language',
    keywords: ['business language', 'professional', 'meetings', 'presentations', 'workplace'],
    domain: 'languages',
    dreamLabel: 'Master Business Language Skills',
    milestones: [
      { id: 'bl-1', text: 'Learn professional vocabulary & email writing', weeks: 2 },
      { id: 'bl-2', text: 'Practice meeting participation & presentations', weeks: 3 },
      { id: 'bl-3', text: 'Negotiate and discuss complex topics fluently', weeks: 4 },
    ],
  },

  // ─── Marketing & Growth ───
  {
    id: 'digital-marketing',
    keywords: ['marketing', 'digital', 'social media', 'seo', 'ads', 'content', 'growth'],
    domain: 'marketing',
    dreamLabel: 'Master Digital Marketing',
    milestones: [
      { id: 'dm-1', text: 'Learn marketing fundamentals & channel strategy', weeks: 2 },
      { id: 'dm-2', text: 'Launch a campaign on one channel (social/email/ads)', weeks: 3 },
      { id: 'dm-3', text: 'Analyze results and optimize for conversions', weeks: 3 },
    ],
  },
  {
    id: 'brand-building',
    keywords: ['brand', 'branding', 'copywriting', 'storytelling', 'positioning'],
    domain: 'marketing',
    dreamLabel: 'Build a Strong Brand',
    milestones: [
      { id: 'bb-1', text: 'Define brand positioning & voice', weeks: 2 },
      { id: 'bb-2', text: 'Create a content strategy & editorial calendar', weeks: 3 },
      { id: 'bb-3', text: 'Build a consistent brand presence across channels', weeks: 4 },
    ],
  },

  // ─── People & Leadership ───
  {
    id: 'leadership',
    keywords: ['leader', 'leadership', 'management', 'manager', 'team', 'eq'],
    domain: 'leadership',
    dreamLabel: 'Become a Strong Leader',
    milestones: [
      { id: 'ld-1', text: 'Learn coaching & feedback frameworks', weeks: 2 },
      { id: 'ld-2', text: 'Practice delegation with a real team', weeks: 3 },
      { id: 'ld-3', text: 'Lead a project from start to finish', weeks: 4 },
    ],
  },
  {
    id: 'public-speaking',
    keywords: ['speaking', 'presentation', 'communication', 'influence', 'negotiate'],
    domain: 'leadership',
    dreamLabel: 'Master Public Speaking',
    milestones: [
      { id: 'ps-1', text: 'Learn storytelling & persuasion frameworks', weeks: 2 },
      { id: 'ps-2', text: 'Deliver 3 practice presentations with feedback', weeks: 3 },
      { id: 'ps-3', text: 'Speak at a meetup, team meeting, or workshop', weeks: 3 },
    ],
  },

  // ─── Cyber & Security ───
  {
    id: 'cybersecurity',
    keywords: ['security', 'cybersec', 'hacking', 'pen test', 'pentesting', 'infosec', 'ctf'],
    domain: 'security',
    dreamLabel: 'Break Into Cybersecurity',
    milestones: [
      { id: 'sec-1', text: 'Learn networking & Linux fundamentals', weeks: 3 },
      { id: 'sec-2', text: 'Complete a CTF challenge', weeks: 3 },
      { id: 'sec-3', text: 'Perform a vulnerability assessment', weeks: 4 },
    ],
  },
  {
    id: 'cloud-security',
    keywords: ['cloud', 'aws', 'azure', 'gcp', 'compliance', 'soc', 'gdpr'],
    domain: 'security',
    dreamLabel: 'Master Cloud Security',
    milestones: [
      { id: 'csec-1', text: 'Learn cloud security fundamentals (IAM, VPC, encryption)', weeks: 2 },
      { id: 'csec-2', text: 'Set up secure infrastructure on a cloud platform', weeks: 3 },
      { id: 'csec-3', text: 'Run a security audit and remediate findings', weeks: 4 },
    ],
  },

  // ─── AI & Smart Tools ───
  {
    id: 'prompt-engineering',
    keywords: ['prompt', 'llm', 'chatgpt', 'ai', 'gpt', 'claude', 'generative'],
    domain: 'ai',
    dreamLabel: 'Master Prompt Engineering',
    milestones: [
      { id: 'pe-1', text: 'Understand LLM capabilities & limitations', weeks: 1 },
      { id: 'pe-2', text: 'Build advanced prompt chains & tools', weeks: 3 },
      { id: 'pe-3', text: 'Create an AI-powered application', weeks: 3 },
    ],
  },
  {
    id: 'ai-automation',
    keywords: ['automation', 'agent', 'no-code', 'workflow', 'zapier', 'make'],
    domain: 'ai',
    dreamLabel: 'Automate Everything with AI',
    milestones: [
      { id: 'aa-1', text: 'Map your workflow and identify automation opportunities', weeks: 1 },
      { id: 'aa-2', text: 'Build 3 AI-powered automations', weeks: 3 },
      { id: 'aa-3', text: 'Create an AI agent for a real-world task', weeks: 3 },
    ],
  },
];
