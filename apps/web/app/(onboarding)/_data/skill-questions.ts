// ═══════════════════════════════════════════
// SKILL QUESTIONS — bank per goal
// 3-5 questions for top goals, generic fallback
// Each answer has a score; sum → level
// Visual card metadata: shortLabel, iconType
// ═══════════════════════════════════════════

import type { SkillLevel } from '@plan2skill/types';
import type { NeonIconType } from '../_components/NeonIcon';

export interface SkillOption {
  text: string;
  score: number;
  shortLabel: string;
  iconType: NeonIconType;
  npcReaction: 'impressed' | 'encouraging' | 'neutral';
}

export interface SkillQuestion {
  question: string;
  options: SkillOption[];
}

export interface GoalQuestions {
  goalId: string;
  questions: SkillQuestion[];
}

// Score thresholds → level
// 0-3 = beginner, 4-7 = familiar, 8-11 = intermediate, 12+ = advanced
export function scoreToLevel(totalScore: number): SkillLevel {
  if (totalScore <= 3) return 'beginner';
  if (totalScore <= 7) return 'familiar';
  if (totalScore <= 11) return 'intermediate';
  return 'advanced';
}

// ─── Goal-specific questions ───
const QUESTION_BANK: GoalQuestions[] = [
  {
    goalId: 'ai-ml',
    questions: [
      {
        question: 'What is a neural network?',
        options: [
          { text: 'Never heard of it', score: 0, shortLabel: 'New to me', iconType: 'quiz', npcReaction: 'encouraging' },
          { text: 'Something AI-related, not sure how it works', score: 1, shortLabel: 'Heard of it', iconType: 'book', npcReaction: 'neutral' },
          { text: 'Layers of connected nodes that learn patterns', score: 2, shortLabel: 'Know it', iconType: 'target', npcReaction: 'impressed' },
          { text: 'I\'ve trained models with different architectures', score: 3, shortLabel: 'Built them', iconType: 'trophy', npcReaction: 'impressed' },
        ],
      },
      {
        question: 'Have you used Python for data analysis?',
        options: [
          { text: 'I don\'t know Python', score: 0, shortLabel: 'Not yet', iconType: 'quiz', npcReaction: 'encouraging' },
          { text: 'Basic scripts and tutorials', score: 1, shortLabel: 'Basics', iconType: 'book', npcReaction: 'neutral' },
          { text: 'pandas, NumPy, and Jupyter regularly', score: 2, shortLabel: 'Regular use', iconType: 'code', npcReaction: 'impressed' },
          { text: 'Built ML pipelines with scikit-learn/PyTorch', score: 3, shortLabel: 'Pipelines', iconType: 'trophy', npcReaction: 'impressed' },
        ],
      },
      {
        question: 'What does "overfitting" mean?',
        options: [
          { text: 'No idea', score: 0, shortLabel: 'Unknown', iconType: 'quiz', npcReaction: 'encouraging' },
          { text: 'When a model performs poorly', score: 1, shortLabel: 'Roughly', iconType: 'book', npcReaction: 'neutral' },
          { text: 'Model memorizes training data, fails on new data', score: 2, shortLabel: 'Understand', iconType: 'target', npcReaction: 'impressed' },
          { text: 'I use regularization and cross-validation to prevent it', score: 3, shortLabel: 'Prevent it', iconType: 'shield', npcReaction: 'impressed' },
        ],
      },
    ],
  },
  {
    goalId: 'fullstack',
    questions: [
      {
        question: 'What is a REST API?',
        options: [
          { text: 'Not sure what that is', score: 0, shortLabel: 'New to me', iconType: 'quiz', npcReaction: 'encouraging' },
          { text: 'Something websites use to get data', score: 1, shortLabel: 'Basics', iconType: 'book', npcReaction: 'neutral' },
          { text: 'HTTP endpoints for CRUD operations', score: 2, shortLabel: 'CRUD ops', iconType: 'code', npcReaction: 'impressed' },
          { text: 'I\'ve designed and built REST + GraphQL APIs', score: 3, shortLabel: 'Built APIs', iconType: 'trophy', npcReaction: 'impressed' },
        ],
      },
      {
        question: 'How comfortable are you with React?',
        options: [
          { text: 'Haven\'t tried it', score: 0, shortLabel: 'Not yet', iconType: 'quiz', npcReaction: 'encouraging' },
          { text: 'Followed a tutorial or two', score: 1, shortLabel: 'Tutorials', iconType: 'book', npcReaction: 'neutral' },
          { text: 'Built components with hooks and state management', score: 2, shortLabel: 'Hooks & state', iconType: 'code', npcReaction: 'impressed' },
          { text: 'Built production apps with advanced patterns', score: 3, shortLabel: 'Production', iconType: 'trophy', npcReaction: 'impressed' },
        ],
      },
      {
        question: 'Have you worked with databases?',
        options: [
          { text: 'No database experience', score: 0, shortLabel: 'None yet', iconType: 'quiz', npcReaction: 'encouraging' },
          { text: 'Simple SQL queries', score: 1, shortLabel: 'Basic SQL', iconType: 'book', npcReaction: 'neutral' },
          { text: 'Schema design and complex queries', score: 2, shortLabel: 'Schemas', iconType: 'code', npcReaction: 'impressed' },
          { text: 'Optimized queries, indexing, and migrations', score: 3, shortLabel: 'Optimized', iconType: 'trophy', npcReaction: 'impressed' },
        ],
      },
    ],
  },
  {
    goalId: 'cybersec',
    questions: [
      {
        question: 'What is the OWASP Top 10?',
        options: [
          { text: 'Never heard of it', score: 0, shortLabel: 'New to me', iconType: 'quiz', npcReaction: 'encouraging' },
          { text: 'Something about web security', score: 1, shortLabel: 'Heard of it', iconType: 'book', npcReaction: 'neutral' },
          { text: 'A list of critical web application security risks', score: 2, shortLabel: 'Know them', iconType: 'shield', npcReaction: 'impressed' },
          { text: 'I actively mitigate these in my projects', score: 3, shortLabel: 'Mitigate', iconType: 'trophy', npcReaction: 'impressed' },
        ],
      },
      {
        question: 'Have you used Linux command line?',
        options: [
          { text: 'I use Windows/Mac only', score: 0, shortLabel: 'GUI only', iconType: 'quiz', npcReaction: 'encouraging' },
          { text: 'Basic navigation (cd, ls, cat)', score: 1, shortLabel: 'Basics', iconType: 'terminal', npcReaction: 'neutral' },
          { text: 'Comfortable with bash scripting', score: 2, shortLabel: 'Bash', iconType: 'code', npcReaction: 'impressed' },
          { text: 'Manage servers, configure firewalls, analyze logs', score: 3, shortLabel: 'Sysadmin', iconType: 'trophy', npcReaction: 'impressed' },
        ],
      },
      {
        question: 'What is a man-in-the-middle attack?',
        options: [
          { text: 'Not sure', score: 0, shortLabel: 'Unknown', iconType: 'quiz', npcReaction: 'encouraging' },
          { text: 'Some kind of hacking', score: 1, shortLabel: 'Roughly', iconType: 'book', npcReaction: 'neutral' },
          { text: 'Intercepting communication between two parties', score: 2, shortLabel: 'Understand', iconType: 'shield', npcReaction: 'impressed' },
          { text: 'I can explain it and know how to prevent it', score: 3, shortLabel: 'Expert', iconType: 'trophy', npcReaction: 'impressed' },
        ],
      },
    ],
  },
  {
    goalId: 'cloud',
    questions: [
      {
        question: 'What is containerization?',
        options: [
          { text: 'No idea', score: 0, shortLabel: 'New to me', iconType: 'quiz', npcReaction: 'encouraging' },
          { text: 'Heard of Docker but haven\'t used it', score: 1, shortLabel: 'Heard of it', iconType: 'book', npcReaction: 'neutral' },
          { text: 'I use Docker for development', score: 2, shortLabel: 'Docker dev', iconType: 'code', npcReaction: 'impressed' },
          { text: 'Docker + Kubernetes in production', score: 3, shortLabel: 'K8s prod', iconType: 'trophy', npcReaction: 'impressed' },
        ],
      },
      {
        question: 'Have you used any cloud platforms?',
        options: [
          { text: 'No cloud experience', score: 0, shortLabel: 'None yet', iconType: 'quiz', npcReaction: 'encouraging' },
          { text: 'Deployed a simple app to Vercel/Heroku', score: 1, shortLabel: 'Basic deploy', iconType: 'cloud', npcReaction: 'neutral' },
          { text: 'Used AWS/GCP/Azure services', score: 2, shortLabel: 'Cloud services', iconType: 'code', npcReaction: 'impressed' },
          { text: 'Managed infrastructure as code (Terraform, CDK)', score: 3, shortLabel: 'IaC', iconType: 'trophy', npcReaction: 'impressed' },
        ],
      },
      {
        question: 'What is CI/CD?',
        options: [
          { text: 'Never heard of it', score: 0, shortLabel: 'Unknown', iconType: 'quiz', npcReaction: 'encouraging' },
          { text: 'Automated deployment, roughly', score: 1, shortLabel: 'Roughly', iconType: 'book', npcReaction: 'neutral' },
          { text: 'Set up pipelines with GitHub Actions or similar', score: 2, shortLabel: 'Pipelines', iconType: 'code', npcReaction: 'impressed' },
          { text: 'Designed multi-stage pipelines with rollbacks', score: 3, shortLabel: 'Multi-stage', iconType: 'trophy', npcReaction: 'impressed' },
        ],
      },
    ],
  },
  {
    goalId: 'product',
    questions: [
      {
        question: 'What is a product roadmap?',
        options: [
          { text: 'Not sure', score: 0, shortLabel: 'Unknown', iconType: 'quiz', npcReaction: 'encouraging' },
          { text: 'A plan for building features', score: 1, shortLabel: 'Basic idea', iconType: 'book', npcReaction: 'neutral' },
          { text: 'A strategic document aligning team on priorities', score: 2, shortLabel: 'Strategic', iconType: 'map', npcReaction: 'impressed' },
          { text: 'I\'ve created and maintained roadmaps for teams', score: 3, shortLabel: 'Created them', iconType: 'trophy', npcReaction: 'impressed' },
        ],
      },
      {
        question: 'How do you prioritize features?',
        options: [
          { text: 'I go with gut feeling', score: 0, shortLabel: 'Gut feeling', iconType: 'quiz', npcReaction: 'encouraging' },
          { text: 'I ask users what they want', score: 1, shortLabel: 'User input', iconType: 'users', npcReaction: 'neutral' },
          { text: 'I use frameworks like RICE or ICE', score: 2, shortLabel: 'Frameworks', iconType: 'chart', npcReaction: 'impressed' },
          { text: 'Data-driven prioritization with outcome metrics', score: 3, shortLabel: 'Data-driven', iconType: 'trophy', npcReaction: 'impressed' },
        ],
      },
      {
        question: 'What is a user story?',
        options: [
          { text: 'No idea', score: 0, shortLabel: 'Unknown', iconType: 'quiz', npcReaction: 'encouraging' },
          { text: 'A description of a feature', score: 1, shortLabel: 'Basically', iconType: 'book', npcReaction: 'neutral' },
          { text: '"As a [user], I want [goal] so that [benefit]"', score: 2, shortLabel: 'Format', iconType: 'edit', npcReaction: 'impressed' },
          { text: 'I write them with acceptance criteria and edge cases', score: 3, shortLabel: 'Full spec', iconType: 'trophy', npcReaction: 'impressed' },
        ],
      },
    ],
  },
  {
    goalId: 'ui-ux',
    questions: [
      {
        question: 'What is a design system?',
        options: [
          { text: 'Not sure', score: 0, shortLabel: 'Unknown', iconType: 'quiz', npcReaction: 'encouraging' },
          { text: 'A collection of reusable components', score: 1, shortLabel: 'Components', iconType: 'book', npcReaction: 'neutral' },
          { text: 'Tokens, components, patterns, and guidelines', score: 2, shortLabel: 'Full system', iconType: 'sparkle', npcReaction: 'impressed' },
          { text: 'I\'ve built and maintained design systems', score: 3, shortLabel: 'Built them', iconType: 'trophy', npcReaction: 'impressed' },
        ],
      },
      {
        question: 'How comfortable are you with Figma?',
        options: [
          { text: 'Never used it', score: 0, shortLabel: 'Not yet', iconType: 'quiz', npcReaction: 'encouraging' },
          { text: 'Basic shapes and text', score: 1, shortLabel: 'Basics', iconType: 'book', npcReaction: 'neutral' },
          { text: 'Auto layout, components, and prototyping', score: 2, shortLabel: 'Prototyping', iconType: 'sparkle', npcReaction: 'impressed' },
          { text: 'Variables, advanced prototyping, and plugins', score: 3, shortLabel: 'Advanced', iconType: 'trophy', npcReaction: 'impressed' },
        ],
      },
      {
        question: 'What is accessibility in design?',
        options: [
          { text: 'Not sure what that means', score: 0, shortLabel: 'New to me', iconType: 'quiz', npcReaction: 'encouraging' },
          { text: 'Making things usable for everyone', score: 1, shortLabel: 'For everyone', iconType: 'users', npcReaction: 'neutral' },
          { text: 'WCAG guidelines, contrast ratios, screen readers', score: 2, shortLabel: 'WCAG', iconType: 'eye', npcReaction: 'impressed' },
          { text: 'I design with a11y-first approach', score: 3, shortLabel: 'A11y-first', iconType: 'trophy', npcReaction: 'impressed' },
        ],
      },
    ],
  },
  {
    goalId: 'prompt-eng',
    questions: [
      {
        question: 'Have you used ChatGPT or Claude?',
        options: [
          { text: 'Heard of them but haven\'t tried', score: 0, shortLabel: 'Not yet', iconType: 'quiz', npcReaction: 'encouraging' },
          { text: 'Basic conversations and questions', score: 1, shortLabel: 'Chatted', iconType: 'chat', npcReaction: 'neutral' },
          { text: 'Chain-of-thought, system prompts, few-shot', score: 2, shortLabel: 'Techniques', iconType: 'code', npcReaction: 'impressed' },
          { text: 'Built apps with API, function calling, RAG', score: 3, shortLabel: 'Built apps', iconType: 'trophy', npcReaction: 'impressed' },
        ],
      },
      {
        question: 'What is "chain-of-thought" prompting?',
        options: [
          { text: 'No idea', score: 0, shortLabel: 'Unknown', iconType: 'quiz', npcReaction: 'encouraging' },
          { text: 'Something about step-by-step?', score: 1, shortLabel: 'Step-by-step', iconType: 'book', npcReaction: 'neutral' },
          { text: 'Asking the model to reason step by step', score: 2, shortLabel: 'Reasoning', iconType: 'target', npcReaction: 'impressed' },
          { text: 'I use it with other techniques like self-consistency', score: 3, shortLabel: 'Combined', iconType: 'trophy', npcReaction: 'impressed' },
        ],
      },
      {
        question: 'What is RAG?',
        options: [
          { text: 'Never heard of it', score: 0, shortLabel: 'Unknown', iconType: 'quiz', npcReaction: 'encouraging' },
          { text: 'Something about retrieving data for AI', score: 1, shortLabel: 'Retrieval', iconType: 'search', npcReaction: 'neutral' },
          { text: 'Retrieval-Augmented Generation — adding context', score: 2, shortLabel: 'RAG concept', iconType: 'code', npcReaction: 'impressed' },
          { text: 'I\'ve built RAG pipelines with vector databases', score: 3, shortLabel: 'RAG pipelines', iconType: 'trophy', npcReaction: 'impressed' },
        ],
      },
    ],
  },
  {
    goalId: 'mobile',
    questions: [
      {
        question: 'Have you built a mobile app?',
        options: [
          { text: 'Never tried', score: 0, shortLabel: 'Not yet', iconType: 'quiz', npcReaction: 'encouraging' },
          { text: 'Followed a tutorial', score: 1, shortLabel: 'Tutorial', iconType: 'book', npcReaction: 'neutral' },
          { text: 'Built and shipped an app', score: 2, shortLabel: 'Shipped one', iconType: 'rocket', npcReaction: 'impressed' },
          { text: 'Multiple apps in production', score: 3, shortLabel: 'Multiple apps', iconType: 'trophy', npcReaction: 'impressed' },
        ],
      },
      {
        question: 'What is React Native?',
        options: [
          { text: 'Not sure', score: 0, shortLabel: 'Unknown', iconType: 'quiz', npcReaction: 'encouraging' },
          { text: 'A way to build mobile apps with JavaScript', score: 1, shortLabel: 'JS mobile', iconType: 'book', npcReaction: 'neutral' },
          { text: 'Cross-platform framework using React patterns', score: 2, shortLabel: 'Cross-platform', iconType: 'code', npcReaction: 'impressed' },
          { text: 'I\'ve built apps with native modules and navigation', score: 3, shortLabel: 'Native mods', iconType: 'trophy', npcReaction: 'impressed' },
        ],
      },
      {
        question: 'How comfortable are you with native APIs (camera, GPS)?',
        options: [
          { text: 'No experience', score: 0, shortLabel: 'None yet', iconType: 'quiz', npcReaction: 'encouraging' },
          { text: 'Used a library that handled it', score: 1, shortLabel: 'Via library', iconType: 'book', npcReaction: 'neutral' },
          { text: 'Integrated permissions and native features', score: 2, shortLabel: 'Integrated', iconType: 'code', npcReaction: 'impressed' },
          { text: 'Deep integration with background tasks and sensors', score: 3, shortLabel: 'Deep native', iconType: 'trophy', npcReaction: 'impressed' },
        ],
      },
    ],
  },
];

// ─── Generic fallback for goals without specific questions ───
const GENERIC_QUESTIONS: SkillQuestion[] = [
  {
    question: 'How would you describe your current knowledge in this area?',
    options: [
      { text: 'Complete beginner — starting from zero', score: 0, shortLabel: 'Beginner', iconType: 'quiz', npcReaction: 'encouraging' },
      { text: 'I know the basics — read some articles / watched videos', score: 1, shortLabel: 'Basics', iconType: 'book', npcReaction: 'neutral' },
      { text: 'Intermediate — done projects or coursework', score: 2, shortLabel: 'Projects', iconType: 'code', npcReaction: 'impressed' },
      { text: 'Advanced — professional experience or deep expertise', score: 3, shortLabel: 'Pro level', iconType: 'trophy', npcReaction: 'impressed' },
    ],
  },
  {
    question: 'Have you completed any formal learning (courses, bootcamps, degrees)?',
    options: [
      { text: 'No formal training yet', score: 0, shortLabel: 'Not yet', iconType: 'quiz', npcReaction: 'encouraging' },
      { text: 'A few online tutorials', score: 1, shortLabel: 'Tutorials', iconType: 'book', npcReaction: 'neutral' },
      { text: 'Completed a course or certification', score: 2, shortLabel: 'Certified', iconType: 'medal', npcReaction: 'impressed' },
      { text: 'Multiple courses, certifications, or a degree', score: 3, shortLabel: 'Multi-cert', iconType: 'trophy', npcReaction: 'impressed' },
    ],
  },
  {
    question: 'Have you applied this skill in real projects?',
    options: [
      { text: 'Not yet — purely theoretical', score: 0, shortLabel: 'Theory only', iconType: 'quiz', npcReaction: 'encouraging' },
      { text: 'Small personal experiments', score: 1, shortLabel: 'Experiments', iconType: 'compass', npcReaction: 'neutral' },
      { text: 'Side projects or portfolio work', score: 2, shortLabel: 'Side projects', iconType: 'code', npcReaction: 'impressed' },
      { text: 'Professional / production use', score: 3, shortLabel: 'Production', iconType: 'trophy', npcReaction: 'impressed' },
    ],
  },
];

export function getQuestionsForGoal(goalId: string): SkillQuestion[] {
  const specific = QUESTION_BANK.find(q => q.goalId === goalId);
  return specific ? specific.questions : GENERIC_QUESTIONS;
}
