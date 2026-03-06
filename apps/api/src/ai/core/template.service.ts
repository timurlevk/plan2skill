import { Injectable, Logger } from '@nestjs/common';
import { TranslationService } from '../../i18n/translation.service';

/**
 * Template Fallback Service
 *
 * Provides hardcoded template responses when LLM calls fail.
 * Ensures graceful degradation — users get reasonable defaults
 * in the user's locale instead of error screens.
 */

// ─── Quest templates ──────────────────────────────────────────────
const QUEST_TEMPLATES = {
  quests: [
    {
      title: 'Review Core Concepts',
      description: 'Revisit the fundamental concepts of your current skill domain. Read through the key documentation and take notes.',
      taskType: 'article',
      questType: 'knowledge',
      estimatedMinutes: 15,
      xpReward: 20,
      coinReward: 5,
      rarity: 'common',
      skillDomain: 'general',
      bloomLevel: 'remember',
      flowCategory: 'review',
      difficultyTier: 1,
      knowledgeCheck: {
        question: 'What is the primary benefit of reviewing foundational concepts regularly?',
        options: [
          'It helps reinforce long-term memory',
          'It makes you type faster',
          'It replaces the need for practice',
          'It only helps beginners',
        ],
        correctIndex: 0,
        explanation: 'Regular review strengthens neural pathways and aids long-term retention through spaced repetition.',
      },
    },
    {
      title: 'Hands-On Practice Session',
      description: 'Apply what you have learned by completing a small practical exercise. Build something simple using the skills you are developing.',
      taskType: 'project',
      questType: 'practice',
      estimatedMinutes: 30,
      xpReward: 40,
      coinReward: 10,
      rarity: 'uncommon',
      skillDomain: 'general',
      bloomLevel: 'apply',
      flowCategory: 'mastery',
      difficultyTier: 2,
      knowledgeCheck: {
        question: 'Why is hands-on practice important for skill development?',
        options: [
          'It is not — reading is enough',
          'Practice builds muscle memory and deepens understanding',
          'It only works for physical skills',
          'You should only practice after mastering all theory',
        ],
        correctIndex: 1,
        explanation: 'Active practice engages deeper cognitive processes than passive reading, accelerating skill acquisition.',
      },
    },
    {
      title: 'Quick Knowledge Check',
      description: 'Test your understanding with a quick self-assessment. Identify areas where you need more practice.',
      taskType: 'quiz',
      questType: 'knowledge',
      estimatedMinutes: 10,
      xpReward: 15,
      coinReward: 3,
      rarity: 'common',
      skillDomain: 'general',
      bloomLevel: 'understand',
      flowCategory: 'mastery',
      difficultyTier: 1,
      knowledgeCheck: {
        question: 'What is the purpose of self-assessment in learning?',
        options: [
          'To prove you are smarter than others',
          'To identify knowledge gaps and focus study efforts',
          'Self-assessment is not useful',
          'To memorize answers for exams',
        ],
        correctIndex: 1,
        explanation: 'Self-assessment reveals knowledge gaps, allowing you to target your study efforts where they matter most.',
      },
    },
  ],
};

// ─── Motivational message templates ───────────────────────────────
const MOTIVATIONAL_TEMPLATES = [
  {
    message: 'Every expert was once a beginner. Keep pushing forward — your consistency is building something remarkable.',
    tone: 'encouraging',
    emoji: '💪',
  },
  {
    message: 'Small daily improvements compound into extraordinary results. You are closer to your goal than you think.',
    tone: 'encouraging',
    emoji: '📈',
  },
  {
    message: 'The path of mastery is not a straight line — every challenge you face is forging your skills stronger.',
    tone: 'epic',
    emoji: '⚔️',
  },
  {
    message: 'Your dedication sets you apart. While others wait for the perfect moment, you are already building your future.',
    tone: 'celebratory',
    emoji: '🏆',
  },
  {
    message: 'Learning is a superpower that compounds over time. Each session adds another layer to your growing expertise.',
    tone: 'encouraging',
    emoji: '🚀',
  },
];

// ─── Fun fact templates ───────────────────────────────────────────
const FUN_FACT_TEMPLATES = [
  {
    fact: 'The first computer programmer was Ada Lovelace, who wrote algorithms for Charles Babbage\'s Analytical Engine in the 1840s — over a century before modern computers existed.',
    category: 'history',
    source: 'Computer Science History',
  },
  {
    fact: 'Git, the version control system used by most developers worldwide, was created by Linus Torvalds in just 10 days in 2005 to manage Linux kernel development.',
    category: 'industry',
    source: 'Software Engineering',
  },
  {
    fact: 'The term "bug" in computing dates back to 1947 when Grace Hopper found an actual moth stuck in a relay of the Harvard Mark II computer.',
    category: 'history',
    source: 'Computer Science History',
  },
  {
    fact: 'TypeScript, created by Microsoft in 2012, compiles to plain JavaScript and has become one of the most popular programming languages, used by over 78% of professional developers.',
    category: 'science',
    source: 'Developer Surveys',
  },
  {
    fact: 'The average developer writes about 50-100 lines of production code per day. Quality and design thinking take far more time than the actual typing.',
    category: 'surprising',
    source: 'Software Engineering Research',
  },
];

// ─── Template registry ────────────────────────────────────────────
const TEMPLATE_REGISTRY: Record<string, unknown> = {
  quest: QUEST_TEMPLATES,
  motivational: MOTIVATIONAL_TEMPLATES,
  'fun-fact': FUN_FACT_TEMPLATES,
};

@Injectable()
export class TemplateService {
  private readonly logger = new Logger(TemplateService.name);

  constructor(private readonly translationService: TranslationService) {}

  /**
   * Get a fallback template for a given generator type.
   * Returns null if no template is available for that generator.
   * When locale is provided, translates user-facing text via TranslationService.
   */
  getFallback<T>(generatorType: string, _input: unknown, locale?: string): T | null {
    const template = TEMPLATE_REGISTRY[generatorType];

    if (!template) {
      this.logger.debug(`No template available for generator: ${generatorType}`);
      return null;
    }

    // For array templates (motivational, fun-fact), pick random item(s)
    if (Array.isArray(template)) {
      const randomIndex = Math.floor(Math.random() * template.length);
      const item = { ...template[randomIndex] } as Record<string, unknown>;
      if (locale) {
        this.localizeTemplate(generatorType, item, randomIndex, locale);
      }
      // Fun-fact schema expects { facts: [...] } wrapper
      if (generatorType === 'fun-fact') {
        const items = template.slice(0, 3).map((t, i) => {
          const copy = { ...t } as Record<string, unknown>;
          if (locale) this.localizeTemplate(generatorType, copy, i, locale);
          return copy;
        });
        return { facts: items } as T;
      }
      return item as T;
    }

    // For object templates (quest), return localized copy
    if (locale && generatorType === 'quest') {
      return this.localizeQuestTemplate(template as typeof QUEST_TEMPLATES, locale) as T;
    }

    return template as T;
  }

  private t(entityId: string, locale: string, fallback: string): string {
    return this.translationService.get('ui', entityId, 'value', locale, fallback);
  }

  private localizeTemplate(type: string, item: Record<string, unknown>, index: number, locale: string): void {
    if (type === 'motivational') {
      const key = `template.motivational_${index + 1}`;
      item.message = this.t(key, locale, item.message as string);
    } else if (type === 'fun-fact') {
      const key = `template.funfact_${index + 1}`;
      item.fact = this.t(key, locale, item.fact as string);
    }
  }

  private localizeQuestTemplate(template: typeof QUEST_TEMPLATES, locale: string) {
    const QUEST_KEYS = ['quest_review', 'quest_practice', 'quest_knowledge'] as const;

    // Ensure QUEST_KEYS stays in sync with quest templates
    if (QUEST_KEYS.length !== template.quests.length) {
      this.logger.error(
        `QUEST_KEYS length (${QUEST_KEYS.length}) !== quest templates length (${template.quests.length}). ` +
        'Template localization may produce undefined keys.',
      );
    }

    return {
      quests: template.quests.map((q, i) => ({
        ...q,
        title: this.t(`template.${QUEST_KEYS[i]}`, locale, q.title),
        description: this.t(`template.${QUEST_KEYS[i]}_desc`, locale, q.description),
      })),
    };
  }
}
