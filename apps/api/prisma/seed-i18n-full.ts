/**
 * seed-i18n-full.ts
 *
 * Comprehensive i18n seed script that replaces seed-translations.ts.
 * Seeds ALL translations into ref_translations AND all onboarding
 * reference content into ref_content.
 *
 * Usage:
 *   npx ts-node prisma/seed-i18n-full.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ═══════════════════════════════════════════════════════════════════
// SECTION 1: RefContent Data
// ═══════════════════════════════════════════════════════════════════

interface RefContentRow {
  entityType: string;
  entityId: string;
  parentId?: string;
  data: Record<string, unknown>;
  sortOrder: number;
}

// ─── Intents ─────────────────────────────────────────────────────

const INTENTS: RefContentRow[] = [
  { entityType: 'intent', entityId: 'know', data: { icon: 'target', color: '#9D7AFF', nextRoute: '/legend' }, sortOrder: 0 },
  { entityType: 'intent', entityId: 'explore_guided', data: { icon: 'compass', color: '#4ECDC4', nextRoute: '/goal/guided' }, sortOrder: 1 },
  { entityType: 'intent', entityId: 'career', data: { icon: 'briefcase', color: '#FFD166', nextRoute: '/legend' }, sortOrder: 2 },
  { entityType: 'intent', entityId: 'exploring', data: { icon: 'gem', color: '#6EE7B7', nextRoute: '/home' }, sortOrder: 3 },
];

// ─── Domains ─────────────────────────────────────────────────────

const DOMAINS: RefContentRow[] = [
  { entityType: 'domain', entityId: 'ai', data: { icon: 'sparkle', color: '#818CF8' }, sortOrder: 0 },
  { entityType: 'domain', entityId: 'business', data: { icon: 'briefcase', color: '#FFD166' }, sortOrder: 1 },
  { entityType: 'domain', entityId: 'tech', data: { icon: 'code', color: '#4ECDC4' }, sortOrder: 2 },
  { entityType: 'domain', entityId: 'creative', data: { icon: 'edit', color: '#3B82F6' }, sortOrder: 3 },
  { entityType: 'domain', entityId: 'data', data: { icon: 'chart', color: '#9D7AFF' }, sortOrder: 4 },
  { entityType: 'domain', entityId: 'languages', data: { icon: 'globe', color: '#E8C35A' }, sortOrder: 5 },
  { entityType: 'domain', entityId: 'marketing', data: { icon: 'volume', color: '#E879F9' }, sortOrder: 6 },
  { entityType: 'domain', entityId: 'leadership', data: { icon: 'crown', color: '#6EE7B7' }, sortOrder: 7 },
  { entityType: 'domain', entityId: 'security', data: { icon: 'shield', color: '#FF6B8A' }, sortOrder: 8 },
];

// ─── Interests (64 total, 8 per domain) ──────────────────────────

const INTERESTS: RefContentRow[] = [
  // AI & Smart Tools
  { entityType: 'interest', entityId: 'ai-llm', parentId: 'ai', data: { icon: 'chat', color: '#818CF8', trending: true }, sortOrder: 0 },
  { entityType: 'interest', entityId: 'prompt-eng', parentId: 'ai', data: { icon: 'sparkle', color: '#9D7AFF', trending: true }, sortOrder: 1 },
  { entityType: 'interest', entityId: 'ai-automation', parentId: 'ai', data: { icon: 'gear', color: '#4ECDC4', trending: false }, sortOrder: 2 },
  { entityType: 'interest', entityId: 'ai-art', parentId: 'ai', data: { icon: 'camera', color: '#E879F9', trending: false }, sortOrder: 3 },
  { entityType: 'interest', entityId: 'ai-coding', parentId: 'ai', data: { icon: 'code', color: '#6EE7B7', trending: false }, sortOrder: 4 },
  { entityType: 'interest', entityId: 'chatbots', parentId: 'ai', data: { icon: 'chat', color: '#FFD166', trending: false }, sortOrder: 5 },
  { entityType: 'interest', entityId: 'ai-no-code', parentId: 'ai', data: { icon: 'wand', color: '#FF6B8A', trending: false }, sortOrder: 6 },
  { entityType: 'interest', entityId: 'rag', parentId: 'ai', data: { icon: 'book', color: '#3B82F6', trending: false }, sortOrder: 7 },

  // Business & Startups
  { entityType: 'interest', entityId: 'product-mgmt', parentId: 'business', data: { icon: 'clipboard', color: '#FFD166', trending: true }, sortOrder: 0 },
  { entityType: 'interest', entityId: 'startup', parentId: 'business', data: { icon: 'rocket', color: '#FF6B8A', trending: false }, sortOrder: 1 },
  { entityType: 'interest', entityId: 'sales', parentId: 'business', data: { icon: 'trendUp', color: '#4ECDC4', trending: false }, sortOrder: 2 },
  { entityType: 'interest', entityId: 'project-mgmt', parentId: 'business', data: { icon: 'target', color: '#818CF8', trending: false }, sortOrder: 3 },
  { entityType: 'interest', entityId: 'consulting', parentId: 'business', data: { icon: 'users', color: '#6EE7B7', trending: false }, sortOrder: 4 },
  { entityType: 'interest', entityId: 'finance-biz', parentId: 'business', data: { icon: 'coins', color: '#E879F9', trending: false }, sortOrder: 5 },
  { entityType: 'interest', entityId: 'operations', parentId: 'business', data: { icon: 'gear', color: '#3B82F6', trending: false }, sortOrder: 6 },
  { entityType: 'interest', entityId: 'ecommerce', parentId: 'business', data: { icon: 'globe', color: '#9D7AFF', trending: false }, sortOrder: 7 },

  // Code & Apps
  { entityType: 'interest', entityId: 'web-dev', parentId: 'tech', data: { icon: 'globe', color: '#4ECDC4', trending: false }, sortOrder: 0 },
  { entityType: 'interest', entityId: 'mobile-dev', parentId: 'tech', data: { icon: 'code', color: '#3B82F6', trending: false }, sortOrder: 1 },
  { entityType: 'interest', entityId: 'backend', parentId: 'tech', data: { icon: 'terminal', color: '#818CF8', trending: false }, sortOrder: 2 },
  { entityType: 'interest', entityId: 'devops', parentId: 'tech', data: { icon: 'cloud', color: '#6EE7B7', trending: false }, sortOrder: 3 },
  { entityType: 'interest', entityId: 'gamedev', parentId: 'tech', data: { icon: 'play', color: '#E879F9', trending: false }, sortOrder: 4 },
  { entityType: 'interest', entityId: 'embedded', parentId: 'tech', data: { icon: 'terminal', color: '#FFD166', trending: false }, sortOrder: 5 },
  { entityType: 'interest', entityId: 'testing', parentId: 'tech', data: { icon: 'check', color: '#9D7AFF', trending: false }, sortOrder: 6 },
  { entityType: 'interest', entityId: 'blockchain', parentId: 'tech', data: { icon: 'link', color: '#FF6B8A', trending: false }, sortOrder: 7 },

  // Design & Create
  { entityType: 'interest', entityId: 'ui-ux-design', parentId: 'creative', data: { icon: 'sparkle', color: '#3B82F6', trending: true }, sortOrder: 0 },
  { entityType: 'interest', entityId: 'graphic-design', parentId: 'creative', data: { icon: 'edit', color: '#FF6B8A', trending: false }, sortOrder: 1 },
  { entityType: 'interest', entityId: 'motion-design', parentId: 'creative', data: { icon: 'film', color: '#9D7AFF', trending: false }, sortOrder: 2 },
  { entityType: 'interest', entityId: 'content', parentId: 'creative', data: { icon: 'edit', color: '#4ECDC4', trending: false }, sortOrder: 3 },
  { entityType: 'interest', entityId: 'video-prod', parentId: 'creative', data: { icon: 'camera', color: '#FFD166', trending: false }, sortOrder: 4 },
  { entityType: 'interest', entityId: 'music-audio', parentId: 'creative', data: { icon: 'mic', color: '#818CF8', trending: false }, sortOrder: 5 },
  { entityType: 'interest', entityId: 'writing', parentId: 'creative', data: { icon: 'book', color: '#6EE7B7', trending: false }, sortOrder: 6 },
  { entityType: 'interest', entityId: 'photography', parentId: 'creative', data: { icon: 'camera', color: '#E879F9', trending: false }, sortOrder: 7 },

  // Data & Insights
  { entityType: 'interest', entityId: 'data-analysis', parentId: 'data', data: { icon: 'chart', color: '#9D7AFF', trending: true }, sortOrder: 0 },
  { entityType: 'interest', entityId: 'machine-learn', parentId: 'data', data: { icon: 'target', color: '#4ECDC4', trending: false }, sortOrder: 1 },
  { entityType: 'interest', entityId: 'data-eng', parentId: 'data', data: { icon: 'refresh', color: '#FFD166', trending: false }, sortOrder: 2 },
  { entityType: 'interest', entityId: 'visualization', parentId: 'data', data: { icon: 'eye', color: '#E879F9', trending: false }, sortOrder: 3 },
  { entityType: 'interest', entityId: 'statistics', parentId: 'data', data: { icon: 'gem', color: '#818CF8', trending: false }, sortOrder: 4 },
  { entityType: 'interest', entityId: 'sql', parentId: 'data', data: { icon: 'terminal', color: '#6EE7B7', trending: false }, sortOrder: 5 },
  { entityType: 'interest', entityId: 'python-data', parentId: 'data', data: { icon: 'code', color: '#FF6B8A', trending: false }, sortOrder: 6 },
  { entityType: 'interest', entityId: 'bi-tools', parentId: 'data', data: { icon: 'clipboard', color: '#3B82F6', trending: false }, sortOrder: 7 },

  // Languages
  { entityType: 'interest', entityId: 'lang-english', parentId: 'languages', data: { icon: 'chat', color: '#E8C35A', trending: true }, sortOrder: 0 },
  { entityType: 'interest', entityId: 'lang-spanish', parentId: 'languages', data: { icon: 'chat', color: '#FF6B8A', trending: false }, sortOrder: 1 },
  { entityType: 'interest', entityId: 'lang-german', parentId: 'languages', data: { icon: 'chat', color: '#4ECDC4', trending: false }, sortOrder: 2 },
  { entityType: 'interest', entityId: 'lang-french', parentId: 'languages', data: { icon: 'chat', color: '#9D7AFF', trending: false }, sortOrder: 3 },
  { entityType: 'interest', entityId: 'lang-japanese', parentId: 'languages', data: { icon: 'chat', color: '#E879F9', trending: false }, sortOrder: 4 },
  { entityType: 'interest', entityId: 'lang-chinese', parentId: 'languages', data: { icon: 'chat', color: '#818CF8', trending: false }, sortOrder: 5 },
  { entityType: 'interest', entityId: 'lang-korean', parentId: 'languages', data: { icon: 'chat', color: '#6EE7B7', trending: false }, sortOrder: 6 },
  { entityType: 'interest', entityId: 'lang-other', parentId: 'languages', data: { icon: 'globe', color: '#FFD166', trending: false }, sortOrder: 7 },

  // Marketing & Growth
  { entityType: 'interest', entityId: 'digital-mktg', parentId: 'marketing', data: { icon: 'volume', color: '#E879F9', trending: true }, sortOrder: 0 },
  { entityType: 'interest', entityId: 'social-media', parentId: 'marketing', data: { icon: 'chat', color: '#FF6B8A', trending: false }, sortOrder: 1 },
  { entityType: 'interest', entityId: 'seo', parentId: 'marketing', data: { icon: 'search', color: '#4ECDC4', trending: false }, sortOrder: 2 },
  { entityType: 'interest', entityId: 'copywriting', parentId: 'marketing', data: { icon: 'edit', color: '#FFD166', trending: false }, sortOrder: 3 },
  { entityType: 'interest', entityId: 'email-mktg', parentId: 'marketing', data: { icon: 'chat', color: '#818CF8', trending: false }, sortOrder: 4 },
  { entityType: 'interest', entityId: 'analytics-mktg', parentId: 'marketing', data: { icon: 'chart', color: '#9D7AFF', trending: false }, sortOrder: 5 },
  { entityType: 'interest', entityId: 'brand-strategy', parentId: 'marketing', data: { icon: 'star', color: '#6EE7B7', trending: false }, sortOrder: 6 },
  { entityType: 'interest', entityId: 'paid-ads', parentId: 'marketing', data: { icon: 'trendUp', color: '#3B82F6', trending: false }, sortOrder: 7 },

  // People & Leadership
  { entityType: 'interest', entityId: 'leadership-eq', parentId: 'leadership', data: { icon: 'crown', color: '#6EE7B7', trending: true }, sortOrder: 0 },
  { entityType: 'interest', entityId: 'communication', parentId: 'leadership', data: { icon: 'chat', color: '#4ECDC4', trending: false }, sortOrder: 1 },
  { entityType: 'interest', entityId: 'public-speak', parentId: 'leadership', data: { icon: 'mic', color: '#FF6B8A', trending: false }, sortOrder: 2 },
  { entityType: 'interest', entityId: 'negotiation', parentId: 'leadership', data: { icon: 'users', color: '#818CF8', trending: false }, sortOrder: 3 },
  { entityType: 'interest', entityId: 'productivity', parentId: 'leadership', data: { icon: 'lightning', color: '#FFD166', trending: false }, sortOrder: 4 },
  { entityType: 'interest', entityId: 'coaching', parentId: 'leadership', data: { icon: 'star', color: '#9D7AFF', trending: false }, sortOrder: 5 },
  { entityType: 'interest', entityId: 'conflict-res', parentId: 'leadership', data: { icon: 'shield', color: '#E879F9', trending: false }, sortOrder: 6 },
  { entityType: 'interest', entityId: 'career-growth', parentId: 'leadership', data: { icon: 'trendUp', color: '#3B82F6', trending: false }, sortOrder: 7 },

  // Cyber & Security
  { entityType: 'interest', entityId: 'cybersec-fund', parentId: 'security', data: { icon: 'shield', color: '#FF6B8A', trending: true }, sortOrder: 0 },
  { entityType: 'interest', entityId: 'ethical-hack', parentId: 'security', data: { icon: 'terminal', color: '#4ECDC4', trending: false }, sortOrder: 1 },
  { entityType: 'interest', entityId: 'network-sec', parentId: 'security', data: { icon: 'globe', color: '#818CF8', trending: false }, sortOrder: 2 },
  { entityType: 'interest', entityId: 'cloud-sec', parentId: 'security', data: { icon: 'cloud', color: '#6EE7B7', trending: false }, sortOrder: 3 },
  { entityType: 'interest', entityId: 'sec-ops', parentId: 'security', data: { icon: 'gear', color: '#9D7AFF', trending: false }, sortOrder: 4 },
  { entityType: 'interest', entityId: 'app-sec', parentId: 'security', data: { icon: 'lock', color: '#FFD166', trending: false }, sortOrder: 5 },
  { entityType: 'interest', entityId: 'compliance', parentId: 'security', data: { icon: 'clipboard', color: '#E879F9', trending: false }, sortOrder: 6 },
  { entityType: 'interest', entityId: 'forensics', parentId: 'security', data: { icon: 'search', color: '#3B82F6', trending: false }, sortOrder: 7 },
];

// ─── Pain Points ─────────────────────────────────────────────────

const PAIN_POINTS: RefContentRow[] = [
  { entityType: 'pain_point', entityId: 'salary', data: { icon: 'coins', color: '#FFD166' }, sortOrder: 0 },
  { entityType: 'pain_point', entityId: 'growth', data: { icon: 'trendUp', color: '#9D7AFF' }, sortOrder: 1 },
  { entityType: 'pain_point', entityId: 'balance', data: { icon: 'clock', color: '#818CF8' }, sortOrder: 2 },
  { entityType: 'pain_point', entityId: 'toxic', data: { icon: 'shield', color: '#FF6B8A' }, sortOrder: 3 },
  { entityType: 'pain_point', entityId: 'security', data: { icon: 'lock', color: '#4ECDC4' }, sortOrder: 4 },
  { entityType: 'pain_point', entityId: 'boredom', data: { icon: 'fire', color: '#E879F9' }, sortOrder: 5 },
];

// ─── Career Targets ──────────────────────────────────────────────

const CAREER_TARGETS: RefContentRow[] = [
  { entityType: 'career_target', entityId: 'tech-transition', data: { icon: 'code', color: '#4ECDC4', suggestedDomain: 'tech' }, sortOrder: 0 },
  { entityType: 'career_target', entityId: 'product-transition', data: { icon: 'chart', color: '#9D7AFF', suggestedDomain: 'business' }, sortOrder: 1 },
  { entityType: 'career_target', entityId: 'creative-transition', data: { icon: 'sparkle', color: '#E879F9', suggestedDomain: 'creative' }, sortOrder: 2 },
  { entityType: 'career_target', entityId: 'data-transition', data: { icon: 'target', color: '#FFD166', suggestedDomain: 'data' }, sortOrder: 3 },
  { entityType: 'career_target', entityId: 'marketing-transition', data: { icon: 'volume', color: '#E879F9', suggestedDomain: 'marketing' }, sortOrder: 4 },
  { entityType: 'career_target', entityId: 'leadership-transition', data: { icon: 'crown', color: '#6EE7B7', suggestedDomain: 'leadership' }, sortOrder: 5 },
  { entityType: 'career_target', entityId: 'security-transition', data: { icon: 'shield', color: '#FF6B8A', suggestedDomain: 'security' }, sortOrder: 6 },
];

// ─── Archetypes ──────────────────────────────────────────────────

const ARCHETYPES: RefContentRow[] = [
  {
    entityType: 'archetype', entityId: 'strategist', sortOrder: 0,
    data: {
      icon: '◈', color: '#5B7FCC',
      stats: [
        { label: 'Planning', value: 95 },
        { label: 'Analysis', value: 85 },
        { label: 'Focus', value: 80 },
      ],
    },
  },
  {
    entityType: 'archetype', entityId: 'explorer', sortOrder: 1,
    data: {
      icon: '◎', color: '#2A9D8F',
      stats: [
        { label: 'Discovery', value: 95 },
        { label: 'Adaptability', value: 85 },
        { label: 'Creativity', value: 80 },
      ],
    },
  },
  {
    entityType: 'archetype', entityId: 'connector', sortOrder: 2,
    data: {
      icon: '◉', color: '#E05580',
      stats: [
        { label: 'Influence', value: 95 },
        { label: 'Empathy', value: 85 },
        { label: 'Communication', value: 80 },
      ],
    },
  },
  {
    entityType: 'archetype', entityId: 'builder', sortOrder: 3,
    data: {
      icon: '▣', color: '#E8852E',
      stats: [
        { label: 'Execution', value: 95 },
        { label: 'Resilience', value: 85 },
        { label: 'Mastery', value: 80 },
      ],
    },
  },
  {
    entityType: 'archetype', entityId: 'innovator', sortOrder: 4,
    data: {
      icon: '★', color: '#DAA520',
      stats: [
        { label: 'Creativity', value: 95 },
        { label: 'Vision', value: 85 },
        { label: 'Discovery', value: 80 },
      ],
    },
  },
];

// ASSESSMENT_CONTENT is appended after expandAssessmentSeed() runs below
const ALL_REF_CONTENT: RefContentRow[] = [
  ...INTENTS,
  ...DOMAINS,
  ...INTERESTS,
  ...PAIN_POINTS,
  ...CAREER_TARGETS,
  ...ARCHETYPES,
];

// ═══════════════════════════════════════════════════════════════════
// SECTION 2: Translations Data
// ═══════════════════════════════════════════════════════════════════

interface TranslationRow {
  entityType: string;
  entityId: string;
  field: string;
  en: string;
  uk: string;
  pl: string;
}

// ─── Intent Translations ─────────────────────────────────────────

const INTENT_TRANSLATIONS: TranslationRow[] = [
  // know
  { entityType: 'intent', entityId: 'know', field: 'title', en: 'I know what to learn', uk: 'Я знаю, що вивчати', pl: 'Wiem, czego się uczyć' },
  { entityType: 'intent', entityId: 'know', field: 'description', en: 'I have a specific skill or topic in mind', uk: 'Я маю конкретну навичку чи тему', pl: 'Mam na myśli konkretną umiejętność lub temat' },
  // explore_guided
  { entityType: 'intent', entityId: 'explore_guided', field: 'title', en: 'I need direction', uk: 'Мені потрібен напрямок', pl: 'Potrzebuję kierunku' },
  { entityType: 'intent', entityId: 'explore_guided', field: 'description', en: 'I want to grow but not sure where to start', uk: 'Хочу розвиватись, але не знаю з чого почати', pl: 'Chcę się rozwijać, ale nie wiem od czego zacząć' },
  // career
  { entityType: 'intent', entityId: 'career', field: 'title', en: 'Career change', uk: 'Зміна кар\'єри', pl: 'Zmiana kariery' },
  { entityType: 'intent', entityId: 'career', field: 'description', en: 'I want to switch careers or grow in my role', uk: 'Хочу змінити кар\'єру або рости в ролі', pl: 'Chcę zmienić karierę lub rozwijać się w roli' },
  // exploring
  { entityType: 'intent', entityId: 'exploring', field: 'title', en: 'Just exploring', uk: 'Просто дивлюсь', pl: 'Po prostu oglądam' },
  { entityType: 'intent', entityId: 'exploring', field: 'description', en: 'Show me what\'s possible — no commitment', uk: 'Покажіть що можливо — без зобов\'язань', pl: 'Pokaż mi co możliwe — bez zobowiązań' },
];

// ─── Domain Translations ─────────────────────────────────────────

const DOMAIN_TRANSLATIONS: TranslationRow[] = [
  // ai
  { entityType: 'domain', entityId: 'ai', field: 'name', en: 'AI & Smart Tools', uk: 'ШІ та розумні інструменти', pl: 'AI i inteligentne narzędzia' },
  { entityType: 'domain', entityId: 'ai', field: 'description', en: 'Build with AI, automate, and prompt like a pro', uk: 'Будуй з ШІ, автоматизуй та пиши промпти як професіонал', pl: 'Twórz z AI, automatyzuj i pisz prompty jak pro' },
  // business
  { entityType: 'domain', entityId: 'business', field: 'name', en: 'Business & Startups', uk: 'Бізнес і стартапи', pl: 'Biznes i startupy' },
  { entityType: 'domain', entityId: 'business', field: 'description', en: 'Launch, lead, and grow ventures', uk: 'Запускай, веди та розвивай бізнес', pl: 'Uruchamiaj, zarządzaj i rozwijaj biznesy' },
  // tech
  { entityType: 'domain', entityId: 'tech', field: 'name', en: 'Code & Apps', uk: 'Код і додатки', pl: 'Kod i aplikacje' },
  { entityType: 'domain', entityId: 'tech', field: 'description', en: 'Build software, websites, and apps', uk: 'Створюй програми, вебсайти та додатки', pl: 'Twórz oprogramowanie, strony i aplikacje' },
  // creative
  { entityType: 'domain', entityId: 'creative', field: 'name', en: 'Design & Create', uk: 'Дизайн і творчість', pl: 'Projektowanie i kreacja' },
  { entityType: 'domain', entityId: 'creative', field: 'description', en: 'Design, illustrate, and tell visual stories', uk: 'Проектуй, ілюструй та розказуй візуальні історії', pl: 'Projektuj, ilustruj i opowiadaj wizualne historie' },
  // data
  { entityType: 'domain', entityId: 'data', field: 'name', en: 'Data & Insights', uk: 'Дані та аналітика', pl: 'Dane i analityka' },
  { entityType: 'domain', entityId: 'data', field: 'description', en: 'Analyze, visualize, and make smart decisions', uk: 'Аналізуй, візуалізуй та приймай розумні рішення', pl: 'Analizuj, wizualizuj i podejmuj mądre decyzje' },
  // languages
  { entityType: 'domain', entityId: 'languages', field: 'name', en: 'Languages', uk: 'Мови', pl: 'Języki' },
  { entityType: 'domain', entityId: 'languages', field: 'description', en: 'Learn new languages and communicate globally', uk: 'Вивчай нові мови та спілкуйся з усім світом', pl: 'Ucz się nowych języków i komunikuj się globalnie' },
  // marketing
  { entityType: 'domain', entityId: 'marketing', field: 'name', en: 'Marketing & Growth', uk: 'Маркетинг і зростання', pl: 'Marketing i wzrost' },
  { entityType: 'domain', entityId: 'marketing', field: 'description', en: 'Grow audiences, brands, and revenue', uk: 'Нарощуй аудиторію, бренди та доходи', pl: 'Rozwijaj publiczność, marki i przychody' },
  // leadership
  { entityType: 'domain', entityId: 'leadership', field: 'name', en: 'People & Leadership', uk: 'Люди та лідерство', pl: 'Ludzie i przywództwo' },
  { entityType: 'domain', entityId: 'leadership', field: 'description', en: 'Communicate, lead, and level up your career', uk: 'Спілкуйся, веди та піднімай кар\'єру', pl: 'Komunikuj się, przewódź i rozwijaj karierę' },
  // security
  { entityType: 'domain', entityId: 'security', field: 'name', en: 'Cyber & Security', uk: 'Кібер і безпека', pl: 'Cyber i bezpieczeństwo' },
  { entityType: 'domain', entityId: 'security', field: 'description', en: 'Protect systems, find vulnerabilities, stay safe', uk: 'Захищай системи, знаходь вразливості, будь в безпеці', pl: 'Chroń systemy, znajduj luki, bądź bezpieczny' },
];

// ─── Interest Translations (64 interests) ────────────────────────

const INTEREST_TRANSLATIONS: TranslationRow[] = [
  // AI domain
  { entityType: 'interest', entityId: 'ai-llm', field: 'label', en: 'AI & Large Language Models', uk: 'ШІ та великі мовні моделі', pl: 'AI i duże modele językowe' },
  { entityType: 'interest', entityId: 'prompt-eng', field: 'label', en: 'Prompt Engineering', uk: 'Промпт-інженерія', pl: 'Prompt engineering' },
  { entityType: 'interest', entityId: 'ai-automation', field: 'label', en: 'AI Automation & Agents', uk: 'Автоматизація ШІ та агенти', pl: 'Automatyzacja AI i agenci' },
  { entityType: 'interest', entityId: 'ai-art', field: 'label', en: 'AI Art & Image Generation', uk: 'ШІ-арт та генерація зображень', pl: 'AI art i generowanie obrazów' },
  { entityType: 'interest', entityId: 'ai-coding', field: 'label', en: 'AI-Assisted Coding', uk: 'Кодинг з допомогою ШІ', pl: 'Kodowanie wspomagane AI' },
  { entityType: 'interest', entityId: 'chatbots', field: 'label', en: 'Chatbots & Assistants', uk: 'Чат-боти та асистенти', pl: 'Chatboty i asystenci' },
  { entityType: 'interest', entityId: 'ai-no-code', field: 'label', en: 'No-Code AI Tools', uk: 'No-Code ШІ інструменти', pl: 'Narzędzia AI bez kodu' },
  { entityType: 'interest', entityId: 'rag', field: 'label', en: 'RAG & Knowledge Systems', uk: 'RAG та системи знань', pl: 'RAG i systemy wiedzy' },

  // Business domain
  { entityType: 'interest', entityId: 'product-mgmt', field: 'label', en: 'Product Management', uk: 'Управління продуктом', pl: 'Zarządzanie produktem' },
  { entityType: 'interest', entityId: 'startup', field: 'label', en: 'Startups & Ventures', uk: 'Стартапи та підприємства', pl: 'Startupy i przedsięwzięcia' },
  { entityType: 'interest', entityId: 'sales', field: 'label', en: 'Sales & Growth', uk: 'Продажі та зростання', pl: 'Sprzedaż i wzrost' },
  { entityType: 'interest', entityId: 'project-mgmt', field: 'label', en: 'Project Management', uk: 'Управління проектами', pl: 'Zarządzanie projektami' },
  { entityType: 'interest', entityId: 'consulting', field: 'label', en: 'Consulting', uk: 'Консалтинг', pl: 'Konsulting' },
  { entityType: 'interest', entityId: 'finance-biz', field: 'label', en: 'Finance & Accounting', uk: 'Фінанси та бухгалтерія', pl: 'Finanse i księgowość' },
  { entityType: 'interest', entityId: 'operations', field: 'label', en: 'Operations', uk: 'Операційна діяльність', pl: 'Operacje' },
  { entityType: 'interest', entityId: 'ecommerce', field: 'label', en: 'E-Commerce', uk: 'Електронна комерція', pl: 'E-commerce' },

  // Tech domain
  { entityType: 'interest', entityId: 'web-dev', field: 'label', en: 'Web Development', uk: 'Веб-розробка', pl: 'Tworzenie stron' },
  { entityType: 'interest', entityId: 'mobile-dev', field: 'label', en: 'Mobile Apps', uk: 'Мобільні додатки', pl: 'Aplikacje mobilne' },
  { entityType: 'interest', entityId: 'backend', field: 'label', en: 'Backend & APIs', uk: 'Бекенд та API', pl: 'Backend i API' },
  { entityType: 'interest', entityId: 'devops', field: 'label', en: 'DevOps & Cloud', uk: 'DevOps та хмара', pl: 'DevOps i chmura' },
  { entityType: 'interest', entityId: 'gamedev', field: 'label', en: 'Game Development', uk: 'Розробка ігор', pl: 'Tworzenie gier' },
  { entityType: 'interest', entityId: 'embedded', field: 'label', en: 'Embedded & IoT', uk: 'Вбудовані системи та IoT', pl: 'Systemy wbudowane i IoT' },
  { entityType: 'interest', entityId: 'testing', field: 'label', en: 'QA & Testing', uk: 'QA та тестування', pl: 'QA i testowanie' },
  { entityType: 'interest', entityId: 'blockchain', field: 'label', en: 'Blockchain & Web3', uk: 'Блокчейн та Web3', pl: 'Blockchain i Web3' },

  // Creative domain
  { entityType: 'interest', entityId: 'ui-ux-design', field: 'label', en: 'UI/UX Design', uk: 'UI/UX дизайн', pl: 'Projektowanie UI/UX' },
  { entityType: 'interest', entityId: 'graphic-design', field: 'label', en: 'Graphic Design', uk: 'Графічний дизайн', pl: 'Projektowanie graficzne' },
  { entityType: 'interest', entityId: 'motion-design', field: 'label', en: 'Motion & Animation', uk: 'Моушн та анімація', pl: 'Motion i animacja' },
  { entityType: 'interest', entityId: 'content', field: 'label', en: 'Content Creation', uk: 'Створення контенту', pl: 'Tworzenie treści' },
  { entityType: 'interest', entityId: 'video-prod', field: 'label', en: 'Video Production', uk: 'Відеовиробництво', pl: 'Produkcja wideo' },
  { entityType: 'interest', entityId: 'music-audio', field: 'label', en: 'Music & Audio', uk: 'Музика та аудіо', pl: 'Muzyka i audio' },
  { entityType: 'interest', entityId: 'writing', field: 'label', en: 'Creative Writing', uk: 'Творче письмо', pl: 'Pisarstwo kreatywne' },
  { entityType: 'interest', entityId: 'photography', field: 'label', en: 'Photography', uk: 'Фотографія', pl: 'Fotografia' },

  // Data domain
  { entityType: 'interest', entityId: 'data-analysis', field: 'label', en: 'Data Analysis', uk: 'Аналіз даних', pl: 'Analiza danych' },
  { entityType: 'interest', entityId: 'machine-learn', field: 'label', en: 'Machine Learning', uk: 'Машинне навчання', pl: 'Uczenie maszynowe' },
  { entityType: 'interest', entityId: 'data-eng', field: 'label', en: 'Data Engineering', uk: 'Інженерія даних', pl: 'Inżynieria danych' },
  { entityType: 'interest', entityId: 'visualization', field: 'label', en: 'Data Visualization', uk: 'Візуалізація даних', pl: 'Wizualizacja danych' },
  { entityType: 'interest', entityId: 'statistics', field: 'label', en: 'Statistics', uk: 'Статистика', pl: 'Statystyka' },
  { entityType: 'interest', entityId: 'sql', field: 'label', en: 'SQL & Databases', uk: 'SQL та бази даних', pl: 'SQL i bazy danych' },
  { entityType: 'interest', entityId: 'python-data', field: 'label', en: 'Python for Data', uk: 'Python для даних', pl: 'Python dla danych' },
  { entityType: 'interest', entityId: 'bi-tools', field: 'label', en: 'BI Tools', uk: 'BI інструменти', pl: 'Narzędzia BI' },

  // Languages domain
  { entityType: 'interest', entityId: 'lang-english', field: 'label', en: 'English', uk: 'Англійська', pl: 'Angielski' },
  { entityType: 'interest', entityId: 'lang-spanish', field: 'label', en: 'Spanish', uk: 'Іспанська', pl: 'Hiszpański' },
  { entityType: 'interest', entityId: 'lang-german', field: 'label', en: 'German', uk: 'Німецька', pl: 'Niemiecki' },
  { entityType: 'interest', entityId: 'lang-french', field: 'label', en: 'French', uk: 'Французька', pl: 'Francuski' },
  { entityType: 'interest', entityId: 'lang-japanese', field: 'label', en: 'Japanese', uk: 'Японська', pl: 'Japoński' },
  { entityType: 'interest', entityId: 'lang-chinese', field: 'label', en: 'Chinese (Mandarin)', uk: 'Китайська (мандарин)', pl: 'Chiński (mandaryński)' },
  { entityType: 'interest', entityId: 'lang-korean', field: 'label', en: 'Korean', uk: 'Корейська', pl: 'Koreański' },
  { entityType: 'interest', entityId: 'lang-other', field: 'label', en: 'Other Language', uk: 'Інша мова', pl: 'Inny język' },

  // Marketing domain
  { entityType: 'interest', entityId: 'digital-mktg', field: 'label', en: 'Digital Marketing', uk: 'Цифровий маркетинг', pl: 'Marketing cyfrowy' },
  { entityType: 'interest', entityId: 'social-media', field: 'label', en: 'Social Media', uk: 'Соціальні мережі', pl: 'Media społecznościowe' },
  { entityType: 'interest', entityId: 'seo', field: 'label', en: 'SEO & Organic Growth', uk: 'SEO та органічне зростання', pl: 'SEO i wzrost organiczny' },
  { entityType: 'interest', entityId: 'copywriting', field: 'label', en: 'Copywriting', uk: 'Копірайтинг', pl: 'Copywriting' },
  { entityType: 'interest', entityId: 'email-mktg', field: 'label', en: 'Email Marketing', uk: 'Email-маркетинг', pl: 'Email marketing' },
  { entityType: 'interest', entityId: 'analytics-mktg', field: 'label', en: 'Marketing Analytics', uk: 'Маркетингова аналітика', pl: 'Analityka marketingowa' },
  { entityType: 'interest', entityId: 'brand-strategy', field: 'label', en: 'Brand Strategy', uk: 'Бренд-стратегія', pl: 'Strategia marki' },
  { entityType: 'interest', entityId: 'paid-ads', field: 'label', en: 'Paid Advertising', uk: 'Платна реклама', pl: 'Reklama płatna' },

  // Leadership domain
  { entityType: 'interest', entityId: 'leadership-eq', field: 'label', en: 'Leadership & EQ', uk: 'Лідерство та EQ', pl: 'Przywództwo i EQ' },
  { entityType: 'interest', entityId: 'communication', field: 'label', en: 'Communication', uk: 'Комунікація', pl: 'Komunikacja' },
  { entityType: 'interest', entityId: 'public-speak', field: 'label', en: 'Public Speaking', uk: 'Публічні виступи', pl: 'Wystąpienia publiczne' },
  { entityType: 'interest', entityId: 'negotiation', field: 'label', en: 'Negotiation', uk: 'Переговори', pl: 'Negocjacje' },
  { entityType: 'interest', entityId: 'productivity', field: 'label', en: 'Productivity Systems', uk: 'Системи продуктивності', pl: 'Systemy produktywności' },
  { entityType: 'interest', entityId: 'coaching', field: 'label', en: 'Coaching & Mentoring', uk: 'Коучинг та менторство', pl: 'Coaching i mentoring' },
  { entityType: 'interest', entityId: 'conflict-res', field: 'label', en: 'Conflict Resolution', uk: 'Вирішення конфліктів', pl: 'Rozwiązywanie konfliktów' },
  { entityType: 'interest', entityId: 'career-growth', field: 'label', en: 'Career Growth', uk: 'Кар\'єрне зростання', pl: 'Rozwój kariery' },

  // Security domain
  { entityType: 'interest', entityId: 'cybersec-fund', field: 'label', en: 'Cybersecurity Fundamentals', uk: 'Основи кібербезпеки', pl: 'Podstawy cyberbezpieczeństwa' },
  { entityType: 'interest', entityId: 'ethical-hack', field: 'label', en: 'Ethical Hacking', uk: 'Етичний хакінг', pl: 'Etyczny hacking' },
  { entityType: 'interest', entityId: 'network-sec', field: 'label', en: 'Network Security', uk: 'Мережева безпека', pl: 'Bezpieczeństwo sieci' },
  { entityType: 'interest', entityId: 'cloud-sec', field: 'label', en: 'Cloud Security', uk: 'Хмарна безпека', pl: 'Bezpieczeństwo chmury' },
  { entityType: 'interest', entityId: 'sec-ops', field: 'label', en: 'Security Operations', uk: 'Операції безпеки', pl: 'Operacje bezpieczeństwa' },
  { entityType: 'interest', entityId: 'app-sec', field: 'label', en: 'Application Security', uk: 'Безпека додатків', pl: 'Bezpieczeństwo aplikacji' },
  { entityType: 'interest', entityId: 'compliance', field: 'label', en: 'Compliance & Risk', uk: 'Комплаєнс та ризики', pl: 'Compliance i ryzyko' },
  { entityType: 'interest', entityId: 'forensics', field: 'label', en: 'Digital Forensics', uk: 'Цифрова криміналістика', pl: 'Informatyka śledcza' },
];

// ─── Pain Point Translations ─────────────────────────────────────

const PAIN_POINT_TRANSLATIONS: TranslationRow[] = [
  { entityType: 'pain_point', entityId: 'salary', field: 'label', en: 'Low salary / compensation', uk: 'Низька зарплата', pl: 'Niska pensja' },
  { entityType: 'pain_point', entityId: 'growth', field: 'label', en: 'No growth opportunities', uk: 'Немає можливостей для зростання', pl: 'Brak możliwości rozwoju' },
  { entityType: 'pain_point', entityId: 'balance', field: 'label', en: 'Poor work-life balance', uk: 'Поганий баланс роботи-життя', pl: 'Zły balans praca-życie' },
  { entityType: 'pain_point', entityId: 'toxic', field: 'label', en: 'Toxic environment', uk: 'Токсичне середовище', pl: 'Toksyczne środowisko' },
  { entityType: 'pain_point', entityId: 'security', field: 'label', en: 'Job insecurity', uk: 'Нестабільність роботи', pl: 'Niestabilność pracy' },
  { entityType: 'pain_point', entityId: 'boredom', field: 'label', en: 'Boredom / no challenge', uk: 'Нудьга / немає виклику', pl: 'Nuda / brak wyzwań' },
];

// ─── Career Target Translations ──────────────────────────────────

const CAREER_TARGET_TRANSLATIONS: TranslationRow[] = [
  // tech-transition
  { entityType: 'career_target', entityId: 'tech-transition', field: 'name', en: 'Tech & Engineering', uk: 'Техніка та інженерія', pl: 'Technologia i inżynieria' },
  { entityType: 'career_target', entityId: 'tech-transition', field: 'description', en: 'Software development, data, or DevOps', uk: 'Розробка ПЗ, дані або DevOps', pl: 'Rozwój oprogramowania, dane lub DevOps' },
  // product-transition
  { entityType: 'career_target', entityId: 'product-transition', field: 'name', en: 'Product & Strategy', uk: 'Продукт і стратегія', pl: 'Produkt i strategia' },
  { entityType: 'career_target', entityId: 'product-transition', field: 'description', en: 'Product management, UX, or consulting', uk: 'Управління продуктом, UX або консалтинг', pl: 'Zarządzanie produktem, UX lub konsulting' },
  // creative-transition
  { entityType: 'career_target', entityId: 'creative-transition', field: 'name', en: 'Creative & Design', uk: 'Творчість і дизайн', pl: 'Kreacja i projektowanie' },
  { entityType: 'career_target', entityId: 'creative-transition', field: 'description', en: 'UI/UX, content creation, or brand design', uk: 'UI/UX, створення контенту або дизайн бренду', pl: 'UI/UX, tworzenie treści lub projektowanie marki' },
  // data-transition
  { entityType: 'career_target', entityId: 'data-transition', field: 'name', en: 'Data & AI', uk: 'Дані та ШІ', pl: 'Dane i AI' },
  { entityType: 'career_target', entityId: 'data-transition', field: 'description', en: 'Data science, analytics, or AI/ML', uk: 'Data science, аналітика або AI/ML', pl: 'Data science, analityka lub AI/ML' },
  // marketing-transition
  { entityType: 'career_target', entityId: 'marketing-transition', field: 'name', en: 'Marketing & Growth', uk: 'Маркетинг і зростання', pl: 'Marketing i wzrost' },
  { entityType: 'career_target', entityId: 'marketing-transition', field: 'description', en: 'Digital marketing, SEO, or brand strategy', uk: 'Цифровий маркетинг, SEO або бренд-стратегія', pl: 'Marketing cyfrowy, SEO lub strategia marki' },
  // leadership-transition
  { entityType: 'career_target', entityId: 'leadership-transition', field: 'name', en: 'Management & Leadership', uk: 'Менеджмент і лідерство', pl: 'Zarządzanie i przywództwo' },
  { entityType: 'career_target', entityId: 'leadership-transition', field: 'description', en: 'Team lead, people manager, or executive', uk: 'Тімлід, менеджер або керівник', pl: 'Team lead, menedżer lub dyrektor' },
  // security-transition
  { entityType: 'career_target', entityId: 'security-transition', field: 'name', en: 'Cybersecurity', uk: 'Кібербезпека', pl: 'Cyberbezpieczeństwo' },
  { entityType: 'career_target', entityId: 'security-transition', field: 'description', en: 'Security analyst, pen tester, or compliance', uk: 'Аналітик безпеки, пентестер або комплаєнс', pl: 'Analityk bezpieczeństwa, pentester lub compliance' },
];

// ─── Archetype Translations ──────────────────────────────────────

const ARCHETYPE_TRANSLATIONS: TranslationRow[] = [
  // strategist
  { entityType: 'archetype', entityId: 'strategist', field: 'name', en: 'Strategist', uk: 'Стратег', pl: 'Strateg' },
  { entityType: 'archetype', entityId: 'strategist', field: 'tagline', en: 'Plan first, execute with precision', uk: 'Спочатку план, потім точне виконання', pl: 'Najpierw plan, potem precyzyjne wykonanie' },
  { entityType: 'archetype', entityId: 'strategist', field: 'bestFor', en: 'People who love structure, roadmaps, and systematic approaches', uk: 'Для тих, хто любить структуру, дорожні карти та системний підхід', pl: 'Dla tych, którzy kochają strukturę, plany i systematyczne podejście' },
  // explorer
  { entityType: 'archetype', entityId: 'explorer', field: 'name', en: 'Explorer', uk: 'Дослідник', pl: 'Odkrywca' },
  { entityType: 'archetype', entityId: 'explorer', field: 'tagline', en: 'Curiosity-driven, always discovering new horizons', uk: 'Рухомий цікавістю, завжди відкриває нові горизонти', pl: 'Napędzany ciekawością, zawsze odkrywa nowe horyzonty' },
  { entityType: 'archetype', entityId: 'explorer', field: 'bestFor', en: 'People who thrive on variety, experimentation, and new tech', uk: 'Для тих, хто процвітає в різноманітності та експериментах', pl: 'Dla tych, którzy rozwijają się dzięki różnorodności i eksperymentom' },
  // connector
  { entityType: 'archetype', entityId: 'connector', field: 'name', en: 'Connector', uk: 'Зв\'язковий', pl: 'Łącznik' },
  { entityType: 'archetype', entityId: 'connector', field: 'tagline', en: 'Learn through community and collaboration', uk: 'Навчання через спільноту та співпрацю', pl: 'Nauka przez społeczność i współpracę' },
  { entityType: 'archetype', entityId: 'connector', field: 'bestFor', en: 'People who learn best by teaching, sharing, and teaming up', uk: 'Для тих, хто найкраще вчиться навчаючи інших', pl: 'Dla tych, którzy najlepiej uczą się ucząc innych' },
  // builder
  { entityType: 'archetype', entityId: 'builder', field: 'name', en: 'Builder', uk: 'Будівник', pl: 'Budowniczy' },
  { entityType: 'archetype', entityId: 'builder', field: 'tagline', en: 'Hands-on, learn by creating real things', uk: 'Практик — вчиться створюючи реальні речі', pl: 'Praktyk — uczy się tworząc rzeczywiste rzeczy' },
  { entityType: 'archetype', entityId: 'builder', field: 'bestFor', en: 'People who learn by doing — projects, prototypes, code', uk: 'Для тих, хто вчиться на практиці — проекти, прототипи, код', pl: 'Dla tych, którzy uczą się w praktyce — projekty, prototypy, kod' },
  // innovator
  { entityType: 'archetype', entityId: 'innovator', field: 'name', en: 'Innovator', uk: 'Інноватор', pl: 'Innowator' },
  { entityType: 'archetype', entityId: 'innovator', field: 'tagline', en: 'Think differently, find creative solutions', uk: 'Думай інакше, знаходь креативні рішення', pl: 'Myśl inaczej, znajduj kreatywne rozwiązania' },
  { entityType: 'archetype', entityId: 'innovator', field: 'bestFor', en: 'People who challenge the status quo and find novel approaches', uk: 'Для тих, хто кидає виклик статусу кво', pl: 'Dla tych, którzy kwestionują status quo' },
];

// ─── Self-Assessment Translations ────────────────────────────────

const SELF_ASSESSMENT_TRANSLATIONS: TranslationRow[] = [
  // Stored as 'ui' entityType so getUiMessages() serves them to the frontend
  { entityType: 'ui', entityId: 'self_assessment.beginner_label', field: 'label', en: 'Complete Beginner', uk: 'Повний початківець', pl: 'Całkowity początkujący' },
  { entityType: 'ui', entityId: 'self_assessment.beginner_desc', field: 'label', en: 'I\'ve never explored this area', uk: 'Я ніколи не досліджував цю сферу', pl: 'Nigdy nie eksplorowałem tego obszaru' },
  { entityType: 'ui', entityId: 'self_assessment.familiar_label', field: 'label', en: 'Somewhat Familiar', uk: 'Трохи знайомий', pl: 'Nieco zaznajomiony' },
  { entityType: 'ui', entityId: 'self_assessment.familiar_desc', field: 'label', en: 'I know the basics but haven\'t practiced much', uk: 'Знаю основи, але мало практикував', pl: 'Znam podstawy, ale mało ćwiczyłem' },
  { entityType: 'ui', entityId: 'self_assessment.intermediate_label', field: 'label', en: 'Intermediate', uk: 'Середній рівень', pl: 'Średniozaawansowany' },
  { entityType: 'ui', entityId: 'self_assessment.intermediate_desc', field: 'label', en: 'I\'ve done projects and can work independently', uk: 'Робив проекти та можу працювати самостійно', pl: 'Realizowałem projekty i mogę pracować samodzielnie' },
  { entityType: 'ui', entityId: 'self_assessment.advanced_label', field: 'label', en: 'Advanced', uk: 'Просунутий', pl: 'Zaawansowany' },
  { entityType: 'ui', entityId: 'self_assessment.advanced_desc', field: 'label', en: 'I can teach others and solve hard problems', uk: 'Можу навчати інших та вирішувати складні задачі', pl: 'Mogę uczyć innych i rozwiązywać trudne problemy' },
];

// ─── Assessment Questions (compact trilingual format) ────────────

interface I18nText { en: string; uk: string; pl: string; }
interface AssessmentSeedQ {
  id: string; domain: string; difficulty: 1 | 2 | 3;
  correctEmotion: string; wrongEmotion: string;
  question: I18nText;
  options: { id: string; text: I18nText; correct: boolean }[];
  npcCorrect: I18nText; npcWrong: I18nText;
}

const ASSESSMENT_SEED: AssessmentSeedQ[] = [
  // ═══ TECH ═══
  { id: 'tech-e1', domain: 'tech', difficulty: 1, correctEmotion: 'happy', wrongEmotion: 'neutral',
    question: { en: 'What does HTML stand for?', uk: 'Що означає HTML?', pl: 'Co oznacza HTML?' },
    options: [
      { id: 'a', text: { en: 'Hyper Text Markup Language', uk: 'Hyper Text Markup Language', pl: 'Hyper Text Markup Language' }, correct: true },
      { id: 'b', text: { en: 'High Tech Modern Language', uk: 'High Tech Modern Language', pl: 'High Tech Modern Language' }, correct: false },
      { id: 'c', text: { en: 'Hybrid Text Media Language', uk: 'Hybrid Text Media Language', pl: 'Hybrid Text Media Language' }, correct: false },
      { id: 'd', text: { en: 'Home Tool Markup Language', uk: 'Home Tool Markup Language', pl: 'Home Tool Markup Language' }, correct: false },
    ],
    npcCorrect: { en: 'Nice! The fundamentals are strong with you.', uk: 'Чудово! Основи міцні!', pl: 'Świetnie! Podstawy są mocne!' },
    npcWrong: { en: 'No worries! HTML is the building block of the web.', uk: 'Нічого! HTML — це основа вебу.', pl: 'Spokojnie! HTML to fundament stron internetowych.' },
  },
  { id: 'tech-e2', domain: 'tech', difficulty: 1, correctEmotion: 'happy', wrongEmotion: 'neutral',
    question: { en: 'Which language is primarily used for web styling?', uk: 'Яка мова використовується для стилізації вебу?', pl: 'Który język służy do stylizacji stron?' },
    options: [
      { id: 'a', text: { en: 'CSS', uk: 'CSS', pl: 'CSS' }, correct: true },
      { id: 'b', text: { en: 'Java', uk: 'Java', pl: 'Java' }, correct: false },
      { id: 'c', text: { en: 'Python', uk: 'Python', pl: 'Python' }, correct: false },
      { id: 'd', text: { en: 'SQL', uk: 'SQL', pl: 'SQL' }, correct: false },
    ],
    npcCorrect: { en: 'Spot on! CSS makes the web beautiful.', uk: 'Точно! CSS робить веб красивим.', pl: 'Dokładnie! CSS czyni sieć piękną.' },
    npcWrong: { en: 'CSS is the right answer — it controls how web pages look.', uk: 'CSS — правильна відповідь, він контролює вигляд сторінок.', pl: 'CSS to poprawna odpowiedź — kontroluje wygląd stron.' },
  },
  { id: 'tech-m1', domain: 'tech', difficulty: 2, correctEmotion: 'impressed', wrongEmotion: 'thinking',
    question: { en: 'What is a closure in JavaScript?', uk: 'Що таке замикання в JavaScript?', pl: 'Czym jest domknięcie w JavaScript?' },
    options: [
      { id: 'a', text: { en: 'A function that has access to its outer scope', uk: 'Функція з доступом до зовнішньої області видимості', pl: 'Funkcja mająca dostęp do zewnętrznego zakresu' }, correct: true },
      { id: 'b', text: { en: 'A way to close browser tabs', uk: 'Спосіб закрити вкладки браузера', pl: 'Sposób zamykania kart przeglądarki' }, correct: false },
      { id: 'c', text: { en: 'A method for ending loops', uk: 'Метод завершення циклів', pl: 'Metoda kończenia pętli' }, correct: false },
      { id: 'd', text: { en: 'A type of CSS selector', uk: 'Тип CSS-селектора', pl: 'Typ selektora CSS' }, correct: false },
    ],
    npcCorrect: { en: 'Impressive! Closures are a key concept.', uk: 'Вражає! Замикання — ключова концепція.', pl: 'Imponujące! Domknięcia to kluczowy koncept.' },
    npcWrong: { en: 'A closure captures variables from its surrounding scope — powerful stuff!', uk: 'Замикання захоплює змінні з оточуючої області — потужна річ!', pl: 'Domknięcie przechwytuje zmienne z otaczającego zakresu — potężna rzecz!' },
  },
  { id: 'tech-m2', domain: 'tech', difficulty: 2, correctEmotion: 'impressed', wrongEmotion: 'thinking',
    question: { en: 'What is the time complexity of binary search?', uk: 'Яка часова складність бінарного пошуку?', pl: 'Jaka jest złożoność czasowa wyszukiwania binarnego?' },
    options: [
      { id: 'a', text: { en: 'O(log n)', uk: 'O(log n)', pl: 'O(log n)' }, correct: true },
      { id: 'b', text: { en: 'O(n)', uk: 'O(n)', pl: 'O(n)' }, correct: false },
      { id: 'c', text: { en: 'O(n²)', uk: 'O(n²)', pl: 'O(n²)' }, correct: false },
      { id: 'd', text: { en: 'O(1)', uk: 'O(1)', pl: 'O(1)' }, correct: false },
    ],
    npcCorrect: { en: 'Your algorithmic knowledge is sharp!', uk: 'Твої знання алгоритмів на висоті!', pl: 'Twoja wiedza algorytmiczna jest na wysokim poziomie!' },
    npcWrong: { en: 'Binary search halves the search space each time — O(log n).', uk: 'Бінарний пошук кожен раз ділить простір навпіл — O(log n).', pl: 'Wyszukiwanie binarne dzieli przestrzeń na pół — O(log n).' },
  },
  { id: 'tech-h1', domain: 'tech', difficulty: 3, correctEmotion: 'impressed', wrongEmotion: 'thinking',
    question: { en: 'What is the CAP theorem about?', uk: 'Про що теорема CAP?', pl: 'Czego dotyczy twierdzenie CAP?' },
    options: [
      { id: 'a', text: { en: 'Distributed systems can have at most 2 of: Consistency, Availability, Partition tolerance', uk: 'Розподілені системи можуть мати максимум 2 з: Узгодженість, Доступність, Толерантність до поділу', pl: 'Systemy rozproszone mogą mieć max 2 z: Spójność, Dostępność, Tolerancja partycji' }, correct: true },
      { id: 'b', text: { en: 'A method for capping API rate limits', uk: 'Метод обмеження API rate limits', pl: 'Metoda ograniczania limitów API' }, correct: false },
      { id: 'c', text: { en: 'A design pattern for component architecture', uk: 'Патерн для архітектури компонентів', pl: 'Wzorzec architektury komponentów' }, correct: false },
      { id: 'd', text: { en: 'A testing strategy for concurrent applications', uk: 'Стратегія тестування конкурентних додатків', pl: 'Strategia testowania aplikacji współbieżnych' }, correct: false },
    ],
    npcCorrect: { en: 'A true architect! The CAP theorem is fundamental to distributed systems.', uk: 'Справжній архітектор! Теорема CAP — основа розподілених систем.', pl: 'Prawdziwy architekt! Twierdzenie CAP jest fundamentalne dla systemów rozproszonych.' },
    npcWrong: { en: 'The CAP theorem is about trade-offs in distributed databases.', uk: 'Теорема CAP — про компроміси в розподілених базах даних.', pl: 'Twierdzenie CAP dotyczy kompromisów w rozproszonych bazach danych.' },
  },
  // ═══ BUSINESS ═══
  { id: 'biz-e1', domain: 'business', difficulty: 1, correctEmotion: 'happy', wrongEmotion: 'neutral',
    question: { en: 'What does MVP stand for in product development?', uk: 'Що означає MVP у розробці продуктів?', pl: 'Co oznacza MVP w tworzeniu produktów?' },
    options: [
      { id: 'a', text: { en: 'Minimum Viable Product', uk: 'Мінімально життєздатний продукт', pl: 'Minimalny wartościowy produkt' }, correct: true },
      { id: 'b', text: { en: 'Most Valuable Player', uk: 'Найцінніший гравець', pl: 'Najcenniejszy gracz' }, correct: false },
      { id: 'c', text: { en: 'Maximum Value Proposition', uk: 'Максимальна ціннісна пропозиція', pl: 'Maksymalna propozycja wartości' }, correct: false },
      { id: 'd', text: { en: 'Market Validation Process', uk: 'Процес валідації ринку', pl: 'Proces walidacji rynku' }, correct: false },
    ],
    npcCorrect: { en: 'Right! Start small, learn fast.', uk: 'Вірно! Починай з малого, вчись швидко.', pl: 'Zgadza się! Zacznij od małego, ucz się szybko.' },
    npcWrong: { en: 'MVP = Minimum Viable Product — the simplest version that delivers value.', uk: 'MVP = мінімально життєздатний продукт — найпростіша версія, що дає цінність.', pl: 'MVP = minimalny wartościowy produkt — najprostsza wersja dostarczająca wartość.' },
  },
  { id: 'biz-m1', domain: 'business', difficulty: 2, correctEmotion: 'impressed', wrongEmotion: 'thinking',
    question: { en: 'What is a key metric for SaaS business health?', uk: 'Яка ключова метрика здоров\'я SaaS-бізнесу?', pl: 'Jaka jest kluczowa metryka kondycji biznesu SaaS?' },
    options: [
      { id: 'a', text: { en: 'Monthly Recurring Revenue (MRR)', uk: 'Щомісячний рекурентний дохід (MRR)', pl: 'Miesięczny przychód cykliczny (MRR)' }, correct: true },
      { id: 'b', text: { en: 'Total website visits', uk: 'Загальна кількість відвідувань сайту', pl: 'Łączna liczba odwiedzin strony' }, correct: false },
      { id: 'c', text: { en: 'Number of employees', uk: 'Кількість працівників', pl: 'Liczba pracowników' }, correct: false },
      { id: 'd', text: { en: 'Social media followers count', uk: 'Кількість підписників у соцмережах', pl: 'Liczba obserwujących w mediach społecznościowych' }, correct: false },
    ],
    npcCorrect: { en: 'Strategic thinking! MRR is the lifeblood of SaaS.', uk: 'Стратегічне мислення! MRR — кров SaaS.', pl: 'Strategiczne myślenie! MRR to krew SaaS.' },
    npcWrong: { en: 'MRR measures predictable revenue — the most important SaaS metric.', uk: 'MRR вимірює передбачуваний дохід — найважливіша метрика SaaS.', pl: 'MRR mierzy przewidywalny przychód — najważniejsza metryka SaaS.' },
  },
  { id: 'biz-h1', domain: 'business', difficulty: 3, correctEmotion: 'impressed', wrongEmotion: 'thinking',
    question: { en: 'What is the "Jobs to Be Done" framework?', uk: 'Що таке фреймворк "Jobs to Be Done"?', pl: 'Czym jest framework "Jobs to Be Done"?' },
    options: [
      { id: 'a', text: { en: 'Understanding what progress customers are trying to make', uk: 'Розуміння прогресу, якого намагаються досягти клієнти', pl: 'Zrozumienie postępu, którego szukają klienci' }, correct: true },
      { id: 'b', text: { en: 'A hiring framework for job descriptions', uk: 'Фреймворк найму для опису вакансій', pl: 'Framework rekrutacyjny dla opisów stanowisk' }, correct: false },
      { id: 'c', text: { en: 'A project management methodology', uk: 'Методологія управління проектами', pl: 'Metodologia zarządzania projektami' }, correct: false },
      { id: 'd', text: { en: 'A task automation framework', uk: 'Фреймворк автоматизації задач', pl: 'Framework automatyzacji zadań' }, correct: false },
    ],
    npcCorrect: { en: 'You think like a product visionary! JTBD is powerful.', uk: 'Мислиш як продуктовий візіонер! JTBD — потужний.', pl: 'Myślisz jak wizjoner produktowy! JTBD jest potężny.' },
    npcWrong: { en: 'JTBD focuses on the "job" a customer hires a product to do.', uk: 'JTBD фокусується на "роботі", для якої клієнт "наймає" продукт.', pl: 'JTBD skupia się na "zadaniu", do którego klient "zatrudnia" produkt.' },
  },
  // ═══ CREATIVE ═══
  { id: 'cre-e1', domain: 'creative', difficulty: 1, correctEmotion: 'happy', wrongEmotion: 'neutral',
    question: { en: 'What is the rule of thirds in design?', uk: 'Що таке правило третин у дизайні?', pl: 'Czym jest reguła trójpodziału w projektowaniu?' },
    options: [
      { id: 'a', text: { en: 'Dividing the canvas into a 3×3 grid for balanced composition', uk: 'Поділ полотна на сітку 3×3 для збалансованої композиції', pl: 'Podział płótna na siatkę 3×3 dla zrównoważonej kompozycji' }, correct: true },
      { id: 'b', text: { en: 'Using exactly three colors in every design', uk: 'Використання рівно трьох кольорів у кожному дизайні', pl: 'Użycie dokładnie trzech kolorów w każdym projekcie' }, correct: false },
      { id: 'c', text: { en: 'A font pairing technique', uk: 'Техніка поєднання шрифтів', pl: 'Technika łączenia fontów' }, correct: false },
      { id: 'd', text: { en: 'Limiting designs to three layers', uk: 'Обмеження дизайну трьома шарами', pl: 'Ograniczenie projektów do trzech warstw' }, correct: false },
    ],
    npcCorrect: { en: 'Your creative eye is sharp!', uk: 'Твоє творче око гостре!', pl: 'Twoje oko artysty jest bystrze!' },
    npcWrong: { en: 'The rule of thirds creates visually appealing compositions with a grid.', uk: 'Правило третин створює візуально привабливі композиції за допомогою сітки.', pl: 'Reguła trójpodziału tworzy atrakcyjne wizualnie kompozycje z pomocą siatki.' },
  },
  { id: 'cre-m1', domain: 'creative', difficulty: 2, correctEmotion: 'impressed', wrongEmotion: 'thinking',
    question: { en: 'What does "kerning" refer to in typography?', uk: 'Що означає "кернінг" у типографіці?', pl: 'Co oznacza "kerning" w typografii?' },
    options: [
      { id: 'a', text: { en: 'The spacing between individual letter pairs', uk: 'Відстань між окремими парами літер', pl: 'Odstęp między poszczególnymi parami liter' }, correct: true },
      { id: 'b', text: { en: 'The height of lowercase letters', uk: 'Висота малих літер', pl: 'Wysokość małych liter' }, correct: false },
      { id: 'c', text: { en: 'The thickness of a font stroke', uk: 'Товщина штриху шрифту', pl: 'Grubość kreski fontu' }, correct: false },
      { id: 'd', text: { en: 'The angle of italic text', uk: 'Кут нахилу курсиву', pl: 'Kąt nachylenia kursywy' }, correct: false },
    ],
    npcCorrect: { en: 'A true type artisan! Kerning makes text sing.', uk: 'Справжній майстер типографіки! Кернінг оживляє текст.', pl: 'Prawdziwy artysta typografii! Kerning ożywia tekst.' },
    npcWrong: { en: 'Kerning adjusts the space between specific letter pairs for readability.', uk: 'Кернінг регулює відстань між парами літер для зручності читання.', pl: 'Kerning reguluje odstęp między parami liter dla czytelności.' },
  },
  { id: 'cre-h1', domain: 'creative', difficulty: 3, correctEmotion: 'impressed', wrongEmotion: 'thinking',
    question: { en: 'What is Gestalt theory in design?', uk: 'Що таке гештальт-теорія в дизайні?', pl: 'Czym jest teoria Gestalt w projektowaniu?' },
    options: [
      { id: 'a', text: { en: 'How humans perceive visual elements as unified wholes', uk: 'Як люди сприймають візуальні елементи як єдине ціле', pl: 'Jak ludzie postrzegają elementy wizualne jako spójne całości' }, correct: true },
      { id: 'b', text: { en: 'A color theory for gradients', uk: 'Теорія кольору для градієнтів', pl: 'Teoria koloru dla gradientów' }, correct: false },
      { id: 'c', text: { en: 'A layout system for responsive design', uk: 'Система макетів для адаптивного дизайну', pl: 'System layoutu dla responsywnego projektowania' }, correct: false },
      { id: 'd', text: { en: 'A German printing press technique', uk: 'Німецька техніка друкарського пресу', pl: 'Niemiecka technika drukarska' }, correct: false },
    ],
    npcCorrect: { en: 'Master-level knowledge! Gestalt principles are the foundation of perception.', uk: 'Знання рівня майстра! Принципи гештальту — основа сприйняття.', pl: 'Wiedza na poziomie mistrza! Zasady Gestalt to fundament percepcji.' },
    npcWrong: { en: 'Gestalt theory explains how we see patterns and groups in visual elements.', uk: 'Гештальт-теорія пояснює як ми бачимо патерни та групи у візуальних елементах.', pl: 'Teoria Gestalt wyjaśnia jak dostrzegamy wzorce i grupy w elementach wizualnych.' },
  },
  // ═══ DATA ═══
  { id: 'dat-e1', domain: 'data', difficulty: 1, correctEmotion: 'happy', wrongEmotion: 'neutral',
    question: { en: 'What does SQL stand for?', uk: 'Що означає SQL?', pl: 'Co oznacza SQL?' },
    options: [
      { id: 'a', text: { en: 'Structured Query Language', uk: 'Structured Query Language', pl: 'Structured Query Language' }, correct: true },
      { id: 'b', text: { en: 'Simple Question Logic', uk: 'Simple Question Logic', pl: 'Simple Question Logic' }, correct: false },
      { id: 'c', text: { en: 'System Quality Level', uk: 'System Quality Level', pl: 'System Quality Level' }, correct: false },
      { id: 'd', text: { en: 'Sequential Query Loader', uk: 'Sequential Query Loader', pl: 'Sequential Query Loader' }, correct: false },
    ],
    npcCorrect: { en: 'The data quest begins! SQL is your sword.', uk: 'Квест з даними починається! SQL — твій меч.', pl: 'Quest danych się zaczyna! SQL to twój miecz.' },
    npcWrong: { en: 'SQL = Structured Query Language — the language of databases.', uk: 'SQL = Structured Query Language — мова баз даних.', pl: 'SQL = Structured Query Language — język baz danych.' },
  },
  { id: 'dat-m1', domain: 'data', difficulty: 2, correctEmotion: 'impressed', wrongEmotion: 'thinking',
    question: { en: 'What is the difference between a LEFT JOIN and an INNER JOIN?', uk: 'Яка різниця між LEFT JOIN та INNER JOIN?', pl: 'Jaka jest różnica między LEFT JOIN a INNER JOIN?' },
    options: [
      { id: 'a', text: { en: 'LEFT JOIN keeps all rows from the left table; INNER JOIN only keeps matches', uk: 'LEFT JOIN зберігає всі рядки лівої таблиці; INNER JOIN — лише збіги', pl: 'LEFT JOIN zachowuje wszystkie wiersze lewej tabeli; INNER JOIN tylko dopasowania' }, correct: true },
      { id: 'b', text: { en: 'LEFT JOIN is faster than INNER JOIN', uk: 'LEFT JOIN швидший за INNER JOIN', pl: 'LEFT JOIN jest szybszy niż INNER JOIN' }, correct: false },
      { id: 'c', text: { en: 'INNER JOIN works with multiple tables, LEFT JOIN with only two', uk: 'INNER JOIN працює з кількома таблицями, LEFT JOIN лише з двома', pl: 'INNER JOIN działa z wieloma tabelami, LEFT JOIN tylko z dwiema' }, correct: false },
      { id: 'd', text: { en: 'LEFT JOIN excludes NULL values; INNER JOIN includes them', uk: 'LEFT JOIN виключає NULL; INNER JOIN включає', pl: 'LEFT JOIN wyklucza NULL; INNER JOIN je włącza' }, correct: false },
    ],
    npcCorrect: { en: 'Your SQL mastery grows! JOINs are essential.', uk: 'Твоя майстерність SQL зростає! JOIN — це основа.', pl: 'Twoja biegłość w SQL rośnie! JOINy są niezbędne.' },
    npcWrong: { en: 'LEFT JOIN preserves all left table rows, even without matches.', uk: 'LEFT JOIN зберігає всі рядки лівої таблиці, навіть без збігів.', pl: 'LEFT JOIN zachowuje wszystkie wiersze lewej tabeli, nawet bez dopasowań.' },
  },
  { id: 'dat-h1', domain: 'data', difficulty: 3, correctEmotion: 'impressed', wrongEmotion: 'thinking',
    question: { en: 'What is the purpose of a window function in SQL?', uk: 'Для чого потрібна віконна функція в SQL?', pl: 'Jaki jest cel funkcji okna w SQL?' },
    options: [
      { id: 'a', text: { en: 'Perform calculations across rows related to the current row', uk: 'Виконувати обчислення по рядках, пов\'язаних з поточним', pl: 'Wykonywać obliczenia na wierszach powiązanych z bieżącym' }, correct: true },
      { id: 'b', text: { en: 'Create a new table from a subquery', uk: 'Створити нову таблицю з підзапиту', pl: 'Utworzyć nową tabelę z podzapytania' }, correct: false },
      { id: 'c', text: { en: 'Filter rows before aggregation', uk: 'Фільтрувати рядки перед агрегацією', pl: 'Filtrować wiersze przed agregacją' }, correct: false },
      { id: 'd', text: { en: 'Display results in a graphical window', uk: 'Відображати результати у графічному вікні', pl: 'Wyświetlać wyniki w oknie graficznym' }, correct: false },
    ],
    npcCorrect: { en: 'Elite-level SQL! Window functions are powerful analytical tools.', uk: 'SQL елітного рівня! Віконні функції — потужні аналітичні інструменти.', pl: 'SQL na elitarnym poziomie! Funkcje okna to potężne narzędzia analityczne.' },
    npcWrong: { en: 'Window functions let you compute across row sets without grouping.', uk: 'Віконні функції дозволяють обчислювати по наборах рядків без групування.', pl: 'Funkcje okna pozwalają obliczać na zbiorach wierszy bez grupowania.' },
  },
  // ═══ LEADERSHIP ═══
  { id: 'per-e1', domain: 'leadership', difficulty: 1, correctEmotion: 'happy', wrongEmotion: 'neutral',
    question: { en: 'What is the Eisenhower Matrix used for?', uk: 'Для чого використовується матриця Ейзенхауера?', pl: 'Do czego służy macierz Eisenhowera?' },
    options: [
      { id: 'a', text: { en: 'Prioritizing tasks by urgency and importance', uk: 'Пріоритезація задач за терміновістю та важливістю', pl: 'Priorytetyzacja zadań według pilności i ważności' }, correct: true },
      { id: 'b', text: { en: 'Tracking daily habits', uk: 'Відстеження щоденних звичок', pl: 'Śledzenie codziennych nawyków' }, correct: false },
      { id: 'c', text: { en: 'Setting long-term career goals', uk: 'Встановлення довгострокових кар\'єрних цілей', pl: 'Wyznaczanie długoterminowych celów zawodowych' }, correct: false },
      { id: 'd', text: { en: 'Delegating tasks to team members', uk: 'Делегування задач членам команди', pl: 'Delegowanie zadań członkom zespołu' }, correct: false },
    ],
    npcCorrect: { en: 'Wise prioritization! The Matrix of a true leader.', uk: 'Мудра пріоритезація! Матриця справжнього лідера.', pl: 'Mądra priorytetyzacja! Macierz prawdziwego lidera.' },
    npcWrong: { en: 'The Eisenhower Matrix sorts tasks into 4 quadrants: urgent/important.', uk: 'Матриця Ейзенхауера розділяє задачі на 4 квадранти: терміново/важливо.', pl: 'Macierz Eisenhowera dzieli zadania na 4 ćwiartki: pilne/ważne.' },
  },
  { id: 'per-m1', domain: 'leadership', difficulty: 2, correctEmotion: 'impressed', wrongEmotion: 'thinking',
    question: { en: 'What is "active listening"?', uk: 'Що таке "активне слухання"?', pl: 'Czym jest "aktywne słuchanie"?' },
    options: [
      { id: 'a', text: { en: 'Fully concentrating, understanding, and responding to the speaker', uk: 'Повна концентрація, розуміння та реагування на мовця', pl: 'Pełne skupienie, zrozumienie i reagowanie na mówcę' }, correct: true },
      { id: 'b', text: { en: 'Listening while doing other tasks', uk: 'Слухання під час інших справ', pl: 'Słuchanie podczas wykonywania innych zadań' }, correct: false },
      { id: 'c', text: { en: 'Repeating back exactly what someone said', uk: 'Точне повторення сказаного', pl: 'Dokładne powtarzanie tego, co ktoś powiedział' }, correct: false },
      { id: 'd', text: { en: 'Taking detailed notes during meetings', uk: 'Ведення детальних нотаток під час зустрічей', pl: 'Sporządzanie szczegółowych notatek podczas spotkań' }, correct: false },
    ],
    npcCorrect: { en: 'A true connector! Active listening is a superpower.', uk: 'Справжній комунікатор! Активне слухання — це суперсила.', pl: 'Prawdziwy łącznik! Aktywne słuchanie to supermoc.' },
    npcWrong: { en: 'Active listening means being fully present and engaged with the speaker.', uk: 'Активне слухання — це повна присутність та залученість у розмову.', pl: 'Aktywne słuchanie to pełna obecność i zaangażowanie w rozmowę z mówcą.' },
  },
  // ═══ AI ═══
  { id: 'emr-e1', domain: 'ai', difficulty: 1, correctEmotion: 'happy', wrongEmotion: 'neutral',
    question: { en: 'What is a "prompt" in the context of AI?', uk: 'Що таке "промпт" у контексті ШІ?', pl: 'Czym jest "prompt" w kontekście AI?' },
    options: [
      { id: 'a', text: { en: 'An instruction or input given to an AI model', uk: 'Інструкція або вхідні дані для моделі ШІ', pl: 'Instrukcja lub dane wejściowe dla modelu AI' }, correct: true },
      { id: 'b', text: { en: 'A type of programming language', uk: 'Тип мови програмування', pl: 'Typ języka programowania' }, correct: false },
      { id: 'c', text: { en: 'A hardware component for AI processing', uk: 'Апаратний компонент для обробки ШІ', pl: 'Komponent sprzętowy do przetwarzania AI' }, correct: false },
      { id: 'd', text: { en: 'A debugging tool for machine learning', uk: 'Інструмент відладки для машинного навчання', pl: 'Narzędzie do debugowania uczenia maszynowego' }, correct: false },
    ],
    npcCorrect: { en: 'The AI quest begins! Prompting is your new spell.', uk: 'Квест ШІ починається! Промптінг — твоє нове заклинання.', pl: 'Quest AI się zaczyna! Promptowanie to twoje nowe zaklęcie.' },
    npcWrong: { en: 'A prompt is the text you give to an AI to guide its response.', uk: 'Промпт — текст, який ти даєш ШІ для спрямування відповіді.', pl: 'Prompt to tekst, który dajesz AI, aby kierować jego odpowiedzią.' },
  },
  { id: 'emr-m1', domain: 'ai', difficulty: 2, correctEmotion: 'impressed', wrongEmotion: 'thinking',
    question: { en: 'What is "chain-of-thought" prompting?', uk: 'Що таке "chain-of-thought" промптінг?', pl: 'Czym jest promptowanie "chain-of-thought"?' },
    options: [
      { id: 'a', text: { en: 'Asking the AI to reason step by step before answering', uk: 'Прохання до ШІ міркувати крок за кроком перед відповіддю', pl: 'Proszenie AI o rozumowanie krok po kroku przed odpowiedzią' }, correct: true },
      { id: 'b', text: { en: 'Connecting multiple AI models in sequence', uk: 'З\'єднання кількох моделей ШІ послідовно', pl: 'Łączenie wielu modeli AI w sekwencji' }, correct: false },
      { id: 'c', text: { en: 'A blockchain consensus mechanism', uk: 'Механізм консенсусу блокчейну', pl: 'Mechanizm konsensusu blockchain' }, correct: false },
      { id: 'd', text: { en: 'Training an AI on sequential data', uk: 'Навчання ШІ на послідовних даних', pl: 'Trenowanie AI na danych sekwencyjnych' }, correct: false },
    ],
    npcCorrect: { en: 'Advanced prompting! Chain-of-thought unlocks deeper reasoning.', uk: 'Просунутий промптінг! Chain-of-thought розблоковує глибше міркування.', pl: 'Zaawansowane promptowanie! Chain-of-thought odblokowuje głębsze rozumowanie.' },
    npcWrong: { en: 'Chain-of-thought = asking the AI to show its reasoning process.', uk: 'Chain-of-thought = прохання до ШІ показати процес міркування.', pl: 'Chain-of-thought = proszenie AI o pokazanie procesu rozumowania.' },
  },
  { id: 'emr-h1', domain: 'ai', difficulty: 3, correctEmotion: 'impressed', wrongEmotion: 'thinking',
    question: { en: 'What is "retrieval-augmented generation" (RAG)?', uk: 'Що таке "retrieval-augmented generation" (RAG)?', pl: 'Czym jest "retrieval-augmented generation" (RAG)?' },
    options: [
      { id: 'a', text: { en: 'Combining search results with LLM generation for grounded answers', uk: 'Поєднання результатів пошуку з генерацією LLM для обґрунтованих відповідей', pl: 'Łączenie wyników wyszukiwania z generacją LLM dla ugruntowanych odpowiedzi' }, correct: true },
      { id: 'b', text: { en: 'A technique for generating random data', uk: 'Техніка генерації випадкових даних', pl: 'Technika generowania losowych danych' }, correct: false },
      { id: 'c', text: { en: 'A method for compressing AI models', uk: 'Метод стиснення моделей ШІ', pl: 'Metoda kompresji modeli AI' }, correct: false },
      { id: 'd', text: { en: 'A reinforcement learning reward function', uk: 'Функція винагороди в навчанні з підкріпленням', pl: 'Funkcja nagrody w uczeniu ze wzmocnieniem' }, correct: false },
    ],
    npcCorrect: { en: 'Legendary knowledge! RAG is the frontier of AI applications.', uk: 'Легендарні знання! RAG — передовий край застосувань ШІ.', pl: 'Legendarna wiedza! RAG to awangarda zastosowań AI.' },
    npcWrong: { en: 'RAG grounds AI responses in real data by retrieving relevant documents first.', uk: 'RAG обґрунтовує відповіді ШІ реальними даними, спочатку знаходячи релевантні документи.', pl: 'RAG uzasadnia odpowiedzi AI realnymi danymi, najpierw wyszukując odpowiednie dokumenty.' },
  },
  // ═══ LANGUAGES ═══
  { id: 'lang-e1', domain: 'languages', difficulty: 1, correctEmotion: 'happy', wrongEmotion: 'neutral',
    question: { en: 'What is the most effective way to memorize new vocabulary?', uk: 'Який найефективніший спосіб запам\'ятовування нових слів?', pl: 'Jaki jest najskuteczniejszy sposób zapamiętywania nowego słownictwa?' },
    options: [
      { id: 'a', text: { en: 'Spaced repetition — reviewing words at increasing intervals', uk: 'Інтервальне повторення — перегляд слів через зростаючі проміжки', pl: 'Powtórki rozłożone — przegląd słów w rosnących odstępach' }, correct: true },
      { id: 'b', text: { en: 'Reading the dictionary cover to cover', uk: 'Читання словника від корки до корки', pl: 'Czytanie słownika od deski do deski' }, correct: false },
      { id: 'c', text: { en: 'Writing each word 100 times', uk: 'Написання кожного слова 100 разів', pl: 'Pisanie każdego słowa 100 razy' }, correct: false },
      { id: 'd', text: { en: 'Memorizing words alphabetically', uk: 'Запам\'ятовування слів за алфавітом', pl: 'Zapamiętywanie słów alfabetycznie' }, correct: false },
    ],
    npcCorrect: { en: 'Smart approach! Spaced repetition is a proven memory technique.', uk: 'Розумний підхід! Інтервальне повторення — перевірена техніка пам\'яті.', pl: 'Mądre podejście! Powtórki rozłożone to sprawdzona technika pamięci.' },
    npcWrong: { en: 'Spaced repetition is the most effective way — review at growing intervals.', uk: 'Інтервальне повторення — найефективніший спосіб — перегляд через зростаючі проміжки.', pl: 'Powtórki rozłożone to najskuteczniejszy sposób — przegląd w rosnących odstępach.' },
  },
  { id: 'lang-m1', domain: 'languages', difficulty: 2, correctEmotion: 'impressed', wrongEmotion: 'thinking',
    question: { en: 'What does "immersion learning" mean?', uk: 'Що означає "іммерсивне навчання"?', pl: 'Co oznacza "nauka przez immersję"?' },
    options: [
      { id: 'a', text: { en: 'Surrounding yourself with the target language in daily life', uk: 'Оточення себе цільовою мовою у повсякденному житті', pl: 'Otaczanie się docelowym językiem w codziennym życiu' }, correct: true },
      { id: 'b', text: { en: 'Only studying grammar rules intensively', uk: 'Лише інтенсивне вивчення правил граматики', pl: 'Wyłącznie intensywna nauka zasad gramatyki' }, correct: false },
      { id: 'c', text: { en: 'Using translation apps for every sentence', uk: 'Використання перекладачів для кожного речення', pl: 'Używanie aplikacji tłumaczących do każdego zdania' }, correct: false },
      { id: 'd', text: { en: 'Studying one word per day consistently', uk: 'Вивчення одного слова на день', pl: 'Konsekwentna nauka jednego słowa dziennie' }, correct: false },
    ],
    npcCorrect: { en: 'You understand the power of immersion! Context is everything.', uk: 'Розумієш силу занурення! Контекст — це все.', pl: 'Rozumiesz siłę immersji! Kontekst to wszystko.' },
    npcWrong: { en: 'Immersion means surrounding yourself with the language — media, conversations, thinking in it.', uk: 'Занурення — це оточення себе мовою: медіа, розмови, думки нею.', pl: 'Immersja to otaczanie się językiem: media, rozmowy, myślenie w nim.' },
  },
  { id: 'lang-h1', domain: 'languages', difficulty: 3, correctEmotion: 'impressed', wrongEmotion: 'thinking',
    question: { en: 'What is the CEFR framework?', uk: 'Що таке рамка CEFR?', pl: 'Czym jest framework CEFR?' },
    options: [
      { id: 'a', text: { en: 'A European standard for measuring language proficiency (A1 to C2)', uk: 'Європейський стандарт вимірювання мовних навичок (A1 — C2)', pl: 'Europejski standard pomiaru biegłości językowej (A1 do C2)' }, correct: true },
      { id: 'b', text: { en: 'A method for teaching grammar through music', uk: 'Метод навчання граматики через музику', pl: 'Metoda nauki gramatyki przez muzykę' }, correct: false },
      { id: 'c', text: { en: 'A certification program for language teachers', uk: 'Програма сертифікації для вчителів мов', pl: 'Program certyfikacji dla nauczycieli języków' }, correct: false },
      { id: 'd', text: { en: 'A test for native speaker fluency', uk: 'Тест на рівень носія мови', pl: 'Test biegłości natywnego mówcy' }, correct: false },
    ],
    npcCorrect: { en: 'You know the global standard! CEFR levels guide your path to fluency.', uk: 'Знаєш глобальний стандарт! Рівні CEFR ведуть до вільного володіння.', pl: 'Znasz globalny standard! Poziomy CEFR prowadzą do biegłości.' },
    npcWrong: { en: 'CEFR defines 6 levels (A1-C2) — the international standard for language skills.', uk: 'CEFR визначає 6 рівнів (A1-C2) — міжнародний стандарт мовних навичок.', pl: 'CEFR definiuje 6 poziomów (A1-C2) — międzynarodowy standard umiejętności językowych.' },
  },
  // ═══ MARKETING ═══
  { id: 'mkt-e1', domain: 'marketing', difficulty: 1, correctEmotion: 'happy', wrongEmotion: 'neutral',
    question: { en: 'What is a "call to action" (CTA)?', uk: 'Що таке "заклик до дії" (CTA)?', pl: 'Czym jest "wezwanie do działania" (CTA)?' },
    options: [
      { id: 'a', text: { en: 'A prompt that encourages the audience to take a specific step', uk: 'Заклик, що спонукає аудиторію до конкретної дії', pl: 'Zachęta skłaniająca odbiorców do konkretnego kroku' }, correct: true },
      { id: 'b', text: { en: 'A phone number on a website', uk: 'Номер телефону на сайті', pl: 'Numer telefonu na stronie' }, correct: false },
      { id: 'c', text: { en: 'A type of social media post', uk: 'Тип допису в соцмережах', pl: 'Typ posta w mediach społecznościowych' }, correct: false },
      { id: 'd', text: { en: 'An automated email response', uk: 'Автоматична відповідь на email', pl: 'Automatyczna odpowiedź e-mail' }, correct: false },
    ],
    npcCorrect: { en: 'Every great marketer knows their CTAs! Well done.', uk: 'Кожен великий маркетолог знає свої CTA! Молодець.', pl: 'Każdy wielki marketer zna swoje CTA! Brawo.' },
    npcWrong: { en: 'A CTA tells your audience what to do next — "Sign up", "Learn more", etc.', uk: 'CTA каже аудиторії, що робити далі — "Зареєструватись", "Дізнатись більше" тощо.', pl: 'CTA mówi odbiorcom co robić dalej — "Zarejestruj się", "Dowiedz się więcej" itp.' },
  },
  { id: 'mkt-m1', domain: 'marketing', difficulty: 2, correctEmotion: 'impressed', wrongEmotion: 'thinking',
    question: { en: 'What is the difference between organic and paid marketing?', uk: 'Яка різниця між органічним та платним маркетингом?', pl: 'Jaka jest różnica między marketingiem organicznym a płatnym?' },
    options: [
      { id: 'a', text: { en: 'Organic is free/earned visibility; paid is bought advertising', uk: 'Органічний — безкоштовна/зароблена видимість; платний — купована реклама', pl: 'Organiczny to darmowa/wypracowana widoczność; płatny to kupowana reklama' }, correct: true },
      { id: 'b', text: { en: 'Organic uses images; paid uses text only', uk: 'Органічний використовує зображення; платний — лише текст', pl: 'Organiczny używa obrazów; płatny tylko tekstu' }, correct: false },
      { id: 'c', text: { en: 'They are the same thing with different names', uk: 'Це те саме з різними назвами', pl: 'To to samo, tylko pod innymi nazwami' }, correct: false },
      { id: 'd', text: { en: 'Organic targets B2B; paid targets B2C', uk: 'Органічний для B2B; платний для B2C', pl: 'Organiczny celuje w B2B; płatny w B2C' }, correct: false },
    ],
    npcCorrect: { en: 'Strategic thinking! Knowing when to use each is a superpower.', uk: 'Стратегічне мислення! Знати коли що використовувати — суперсила.', pl: 'Strategiczne myślenie! Wiedza kiedy co użyć to supermoc.' },
    npcWrong: { en: 'Organic = content, SEO, word-of-mouth. Paid = ads you pay for.', uk: 'Органічний = контент, SEO, сарафанне радіо. Платний = реклама за гроші.', pl: 'Organiczny = treści, SEO, poczta pantoflowa. Płatny = reklamy za pieniądze.' },
  },
  { id: 'mkt-h1', domain: 'marketing', difficulty: 3, correctEmotion: 'impressed', wrongEmotion: 'thinking',
    question: { en: 'What is Customer Lifetime Value (CLV)?', uk: 'Що таке довічна цінність клієнта (CLV)?', pl: 'Czym jest wartość życiowa klienta (CLV)?' },
    options: [
      { id: 'a', text: { en: 'The total revenue a business can expect from a single customer over time', uk: 'Загальний дохід від одного клієнта за весь час співпраці', pl: 'Łączny przychód, jakiego firma może oczekiwać od jednego klienta w czasie' }, correct: true },
      { id: 'b', text: { en: 'The cost of acquiring one new customer', uk: 'Вартість залучення одного нового клієнта', pl: 'Koszt pozyskania jednego nowego klienta' }, correct: false },
      { id: 'c', text: { en: 'The average time a customer stays subscribed', uk: 'Середній час підписки клієнта', pl: 'Średni czas subskrypcji klienta' }, correct: false },
      { id: 'd', text: { en: 'The maximum discount offered to loyal customers', uk: 'Максимальна знижка для лояльних клієнтів', pl: 'Maksymalny rabat dla lojalnych klientów' }, correct: false },
    ],
    npcCorrect: { en: 'Growth-level mastery! CLV drives smart business decisions.', uk: 'Майстерність рівня зростання! CLV рухає розумні бізнес-рішення.', pl: 'Mistrzostwo na poziomie wzrostu! CLV napędza mądre decyzje biznesowe.' },
    npcWrong: { en: 'CLV measures the total value a customer brings over their entire relationship.', uk: 'CLV вимірює загальну цінність клієнта за весь час відносин.', pl: 'CLV mierzy łączną wartość klienta przez cały okres relacji.' },
  },
  // ═══ SECURITY ═══
  { id: 'sec-e1', domain: 'security', difficulty: 1, correctEmotion: 'happy', wrongEmotion: 'neutral',
    question: { en: 'What is phishing?', uk: 'Що таке фішинг?', pl: 'Czym jest phishing?' },
    options: [
      { id: 'a', text: { en: 'A social engineering attack using fake emails or messages to steal data', uk: 'Атака соціальної інженерії з фальшивими листами чи повідомленнями для крадіжки даних', pl: 'Atak socjotechniczny z fałszywymi e-mailami lub wiadomościami do kradzieży danych' }, correct: true },
      { id: 'b', text: { en: 'A type of network cable', uk: 'Тип мережевого кабелю', pl: 'Typ kabla sieciowego' }, correct: false },
      { id: 'c', text: { en: 'A method for encrypting files', uk: 'Метод шифрування файлів', pl: 'Metoda szyfrowania plików' }, correct: false },
      { id: 'd', text: { en: 'A password recovery technique', uk: 'Техніка відновлення паролів', pl: 'Technika odzyskiwania haseł' }, correct: false },
    ],
    npcCorrect: { en: 'Good awareness! Recognizing phishing is the first line of defense.', uk: 'Гарна обізнаність! Розпізнавання фішингу — перша лінія захисту.', pl: 'Dobra świadomość! Rozpoznawanie phishingu to pierwsza linia obrony.' },
    npcWrong: { en: 'Phishing uses deceptive messages to trick people into revealing sensitive info.', uk: 'Фішинг використовує обманливі повідомлення для отримання конфіденційної інформації.', pl: 'Phishing używa zwodniczych wiadomości, aby skłonić ludzi do ujawnienia poufnych informacji.' },
  },
  { id: 'sec-m1', domain: 'security', difficulty: 2, correctEmotion: 'impressed', wrongEmotion: 'thinking',
    question: { en: 'What is the CIA triad in cybersecurity?', uk: 'Що таке тріада CIA в кібербезпеці?', pl: 'Czym jest triada CIA w cyberbezpieczeństwie?' },
    options: [
      { id: 'a', text: { en: 'Confidentiality, Integrity, and Availability', uk: 'Конфіденційність, Цілісність та Доступність', pl: 'Poufność, Integralność i Dostępność' }, correct: true },
      { id: 'b', text: { en: 'A US intelligence agency security protocol', uk: 'Протокол безпеки розвідки США', pl: 'Protokół bezpieczeństwa amerykańskiego wywiadu' }, correct: false },
      { id: 'c', text: { en: 'Certificate, Identity, and Authentication', uk: 'Сертифікат, Ідентичність та Автентифікація', pl: 'Certyfikat, Tożsamość i Uwierzytelnienie' }, correct: false },
      { id: 'd', text: { en: 'Control, Inspection, and Authorization', uk: 'Контроль, Інспекція та Авторизація', pl: 'Kontrola, Inspekcja i Autoryzacja' }, correct: false },
    ],
    npcCorrect: { en: 'You know the fundamentals! CIA triad is the bedrock of security.', uk: 'Знаєш основи! Тріада CIA — фундамент безпеки.', pl: 'Znasz fundamenty! Triada CIA to fundament bezpieczeństwa.' },
    npcWrong: { en: 'The CIA triad — Confidentiality, Integrity, Availability — guides all security decisions.', uk: 'Тріада CIA — Конфіденційність, Цілісність, Доступність — керує всіма рішеннями з безпеки.', pl: 'Triada CIA — Poufność, Integralność, Dostępność — kieruje wszystkimi decyzjami bezpieczeństwa.' },
  },
  { id: 'sec-h1', domain: 'security', difficulty: 3, correctEmotion: 'impressed', wrongEmotion: 'thinking',
    question: { en: 'What is a zero-day vulnerability?', uk: 'Що таке вразливість нульового дня?', pl: 'Czym jest luka zero-day?' },
    options: [
      { id: 'a', text: { en: 'A flaw that is exploited before the vendor releases a patch', uk: 'Вразливість, яка експлуатується до випуску патча вендором', pl: 'Luka wykorzystywana przed wydaniem łatki przez producenta' }, correct: true },
      { id: 'b', text: { en: 'A virus that activates on day zero of installation', uk: 'Вірус, що активується в день встановлення', pl: 'Wirus aktywujący się w dniu instalacji' }, correct: false },
      { id: 'c', text: { en: 'A firewall with zero configuration', uk: 'Файрвол без налаштувань', pl: 'Firewall bez konfiguracji' }, correct: false },
      { id: 'd', text: { en: 'An attack that resets a system to factory settings', uk: 'Атака, що скидає систему до заводських налаштувань', pl: 'Atak resetujący system do ustawień fabrycznych' }, correct: false },
    ],
    npcCorrect: { en: 'Elite security knowledge! Zero-days are the most dangerous threats.', uk: 'Елітні знання безпеки! Zero-day — найнебезпечніші загрози.', pl: 'Elitarna wiedza o bezpieczeństwie! Zero-day to najniebezpieczniejsze zagrożenia.' },
    npcWrong: { en: 'A zero-day is unknown to the vendor — no patch exists yet when it\'s exploited.', uk: 'Zero-day невідомий вендору — патча ще не існує, коли його експлуатують.', pl: 'Zero-day jest nieznany producentowi — łatka jeszcze nie istnieje, gdy jest wykorzystywany.' },
  },
];

// Helper: expand compact assessment data → refContent + refTranslation rows
function expandAssessmentSeed() {
  const contentRows: RefContentRow[] = [];
  const translationRows: TranslationRow[] = [];
  let sortOrder = 0;

  for (const q of ASSESSMENT_SEED) {
    // Question refContent row
    contentRows.push({
      entityType: 'assessment_question',
      entityId: q.id,
      data: {
        domain: q.domain,
        difficulty: q.difficulty,
        question: q.question.en,
        npcCorrect: q.npcCorrect.en,
        npcWrong: q.npcWrong.en,
        correctEmotion: q.correctEmotion,
        wrongEmotion: q.wrongEmotion,
      },
      sortOrder: sortOrder++,
    });

    // Question translation rows
    translationRows.push(
      { entityType: 'assessment_question', entityId: q.id, field: 'question', ...q.question },
      { entityType: 'assessment_question', entityId: q.id, field: 'npcCorrect', ...q.npcCorrect },
      { entityType: 'assessment_question', entityId: q.id, field: 'npcWrong', ...q.npcWrong },
    );

    // Option refContent + translation rows
    for (let oi = 0; oi < q.options.length; oi++) {
      const opt = q.options[oi]!;
      const optId = `${q.id}-${opt.id}`;
      contentRows.push({
        entityType: 'assessment_option',
        entityId: optId,
        parentId: q.id,
        data: { text: opt.text.en, correct: opt.correct },
        sortOrder: oi,
      });
      translationRows.push(
        { entityType: 'assessment_option', entityId: optId, field: 'text', ...opt.text },
      );
    }
  }

  return { contentRows, translationRows };
}

const { contentRows: ASSESSMENT_CONTENT, translationRows: ASSESSMENT_TRANSLATIONS } = expandAssessmentSeed();
ALL_REF_CONTENT.push(...ASSESSMENT_CONTENT);

// ─── UI Translations ─────────────────────────────────────────────
// Includes all existing translations from seed-translations.ts plus
// new onboarding and assessment UI strings.

interface UiTranslationRow {
  entityId: string;
  en: string;
  uk: string;
  pl: string;
}

const UI_TRANSLATIONS: UiTranslationRow[] = [
  // ── Existing from seed-translations.ts (33 entries) ──

  // Navigation
  { entityId: 'nav.home', en: 'Home', uk: 'Головна', pl: 'Strona główna' },
  { entityId: 'nav.quests', en: 'Quests', uk: 'Квести', pl: 'Zadania' },
  { entityId: 'nav.roadmap', en: 'Roadmap', uk: 'Дорожня карта', pl: 'Plan nauki' },
  { entityId: 'nav.narrative', en: 'Story', uk: 'Історія', pl: 'Historia' },
  { entityId: 'nav.inventory', en: 'Inventory', uk: 'Інвентар', pl: 'Ekwipunek' },
  { entityId: 'nav.forge', en: 'Forge', uk: 'Кузня', pl: 'Kuźnia' },
  { entityId: 'nav.shop', en: 'Shop', uk: 'Крамниця', pl: 'Sklep' },
  { entityId: 'nav.profile', en: 'Profile', uk: 'Профіль', pl: 'Profil' },

  // Common actions
  { entityId: 'action.start', en: 'Start', uk: 'Почати', pl: 'Rozpocznij' },
  { entityId: 'action.continue', en: 'Continue', uk: 'Продовжити', pl: 'Kontynuuj' },
  { entityId: 'action.complete', en: 'Complete', uk: 'Завершити', pl: 'Ukończ' },
  { entityId: 'action.cancel', en: 'Cancel', uk: 'Скасувати', pl: 'Anuluj' },
  { entityId: 'action.save', en: 'Save', uk: 'Зберегти', pl: 'Zapisz' },
  { entityId: 'action.back', en: 'Back', uk: 'Назад', pl: 'Wstecz' },
  { entityId: 'action.next', en: 'Next', uk: 'Далі', pl: 'Dalej' },

  // Dashboard
  { entityId: 'dashboard.welcome', en: 'Welcome back!', uk: 'З поверненням!', pl: 'Witaj ponownie!' },
  { entityId: 'dashboard.daily_quests', en: 'Daily Quests', uk: 'Щоденні квести', pl: 'Codzienne zadania' },
  { entityId: 'dashboard.streak', en: 'Day Streak', uk: 'Серія днів', pl: 'Seria dni' },
  { entityId: 'dashboard.level', en: 'Level', uk: 'Рівень', pl: 'Poziom' },
  { entityId: 'dashboard.xp', en: 'Experience', uk: 'Досвід', pl: 'Doświadczenie' },
  { entityId: 'dashboard.coins', en: 'Coins', uk: 'Монети', pl: 'Monety' },
  { entityId: 'dashboard.energy', en: 'Energy', uk: 'Енергія', pl: 'Energia' },

  // Onboarding (existing)
  { entityId: 'onboarding.welcome_title', en: 'Welcome to Plan2Skill', uk: 'Ласкаво просимо до Plan2Skill', pl: 'Witamy w Plan2Skill' },
  { entityId: 'onboarding.choose_goal', en: 'What do you want to learn?', uk: 'Що ви хочете вивчити?', pl: 'Czego chcesz się nauczyć?' },
  { entityId: 'onboarding.choose_pace', en: 'How much time per day?', uk: 'Скільки часу на день?', pl: 'Ile czasu dziennie?' },
  { entityId: 'onboarding.choose_character', en: 'Choose your character', uk: 'Оберіть свого персонажа', pl: 'Wybierz swoją postać' },

  // Quest types
  { entityId: 'quest.knowledge', en: 'Knowledge', uk: 'Знання', pl: 'Wiedza' },
  { entityId: 'quest.practice', en: 'Practice', uk: 'Практика', pl: 'Praktyka' },
  { entityId: 'quest.creative', en: 'Creative', uk: 'Творчість', pl: 'Kreatywność' },
  { entityId: 'quest.boss', en: 'Boss Challenge', uk: 'Бос-виклик', pl: 'Wyzwanie bossa' },

  // Narrative
  { entityId: 'narrative.new_episode', en: 'New Episode', uk: 'Новий епізод', pl: 'Nowy odcinek' },
  { entityId: 'narrative.continue_reading', en: 'Continue Reading', uk: 'Продовжити читання', pl: 'Kontynuuj czytanie' },

  // Errors
  { entityId: 'error.generic', en: 'Something went wrong', uk: 'Щось пішло не так', pl: 'Coś poszło nie tak' },
  { entityId: 'error.network', en: 'Check your connection', uk: 'Перевірте підключення', pl: 'Sprawdź połączenie' },
  { entityId: 'error.rate_limit', en: 'Too many requests, try later', uk: 'Забагато запитів, спробуйте пізніше', pl: 'Za dużo żądań, spróbuj później' },

  // ── New onboarding UI strings ──

  { entityId: 'onboarding.step1_title', en: 'What brings you here?', uk: 'Що привело вас сюди?', pl: 'Co cię tu sprowadza?' },
  { entityId: 'onboarding.step1_subtitle', en: 'Choose your path', uk: 'Оберіть свій шлях', pl: 'Wybierz swoją ścieżkę' },
  { entityId: 'onboarding.step1_footer', en: 'You can always change your path later in Hero Settings', uk: 'Ви завжди можете змінити шлях пізніше в Налаштуваннях героя', pl: 'Zawsze możesz zmienić ścieżkę później w Ustawieniach bohatera' },
  { entityId: 'onboarding.pick_realm', en: 'Pick your realm', uk: 'Оберіть свою сферу', pl: 'Wybierz swoją sferę' },
  { entityId: 'onboarding.pick_realm_desc', en: 'Choose the area that interests you most', uk: 'Оберіть сферу, яка цікавить вас найбільше', pl: 'Wybierz obszar, który najbardziej cię interesuje' },
  { entityId: 'onboarding.interests_title', en: 'What interests you in {domain}?', uk: 'Що вас цікавить в {domain}?', pl: 'Co cię interesuje w {domain}?' },
  { entityId: 'onboarding.interests_subtitle', en: 'Pick at least 1 interest', uk: 'Оберіть хоча б 1 інтерес', pl: 'Wybierz co najmniej 1 zainteresowanie' },
  { entityId: 'onboarding.interests_add', en: 'Add custom interest...', uk: 'Додати свій інтерес...', pl: 'Dodaj własne zainteresowanie...' },
  { entityId: 'onboarding.proposal_title', en: 'Your proposed quest path', uk: 'Ваш запропонований шлях квестів', pl: 'Twoja proponowana ścieżka questów' },
  { entityId: 'onboarding.accept_quest', en: 'Accept quest path', uk: 'Прийняти шлях квестів', pl: 'Zaakceptuj ścieżkę questów' },
  { entityId: 'onboarding.change_interests', en: 'Change my interests', uk: 'Змінити мої інтереси', pl: 'Zmień moje zainteresowania' },
  { entityId: 'onboarding.career_role', en: 'Your current role', uk: 'Ваша поточна роль', pl: 'Twoja obecna rola' },
  { entityId: 'onboarding.career_role_placeholder', en: 'e.g., Marketing Manager, Student, Teacher...', uk: 'напр., Маркетолог, Студент, Вчитель...', pl: 'np. Kierownik marketingu, Student, Nauczyciel...' },
  { entityId: 'onboarding.career_driving', en: 'What\'s driving the change?', uk: 'Що спонукає до зміни?', pl: 'Co napędza zmianę?' },
  { entityId: 'onboarding.career_pain_subtitle', en: 'Select 1\u20133 pain points', uk: 'Оберіть 1\u20133 проблеми', pl: 'Wybierz 1\u20133 problemy' },
  { entityId: 'onboarding.career_target_title', en: 'Choose your target realm', uk: 'Оберіть свою цільову сферу', pl: 'Wybierz swoją docelową sferę' },
  { entityId: 'onboarding.career_target_desc', en: 'Where do you see yourself next?', uk: 'Де ви бачите себе далі?', pl: 'Gdzie widzisz siebie dalej?' },
  { entityId: 'onboarding.career_path_title', en: 'Your career quest path', uk: 'Ваш кар\'єрний шлях квестів', pl: 'Twoja karierowa ścieżka questów' },
  { entityId: 'onboarding.accept_career', en: 'Accept career path', uk: 'Прийняти кар\'єрний шлях', pl: 'Zaakceptuj ścieżkę kariery' },
  { entityId: 'onboarding.change_target', en: 'Choose a different target', uk: 'Обрати іншу ціль', pl: 'Wybierz inny cel' },
  { entityId: 'onboarding.assessment_intro', en: 'Time to gauge your power level, hero!', uk: 'Час оцінити твій рівень сили, герою!', pl: 'Czas ocenić twój poziom mocy, bohaterze!' },
  { entityId: 'onboarding.assessment_complete', en: 'Assessment complete!', uk: 'Оцінку завершено!', pl: 'Ocena zakończona!' },
  { entityId: 'onboarding.gauge_mastery', en: 'Gauge your mastery', uk: 'Оцініть свою майстерність', pl: 'Oceń swoje umiejętności' },
  { entityId: 'onboarding.onward', en: 'Onward!', uk: 'Вперед!', pl: 'Naprzód!' },
  { entityId: 'onboarding.choose_hero', en: 'Choose Your Hero', uk: 'Оберіть свого героя', pl: 'Wybierz swojego bohatera' },
  { entityId: 'onboarding.create_custom', en: 'Create custom', uk: 'Створити свого', pl: 'Stwórz własnego' },
  { entityId: 'onboarding.forge_hero', en: 'Forge my hero', uk: 'Створити мого героя', pl: 'Wykuj mojego bohatera' },
  { entityId: 'onboarding.cosmetic_note', en: 'Purely cosmetic — you can change anytime in Hero Settings', uk: 'Лише косметичне — можна змінити будь-коли в Налаштуваннях героя', pl: 'Czysto kosmetyczne — możesz zmienić w dowolnym momencie w Ustawieniach bohatera' },
  { entityId: 'onboarding.hair_style', en: 'Hair style', uk: 'Зачіска', pl: 'Fryzura' },
  { entityId: 'onboarding.skin_tone', en: 'Skin tone', uk: 'Тон шкіри', pl: 'Karnacja' },
  { entityId: 'onboarding.hair_color', en: 'Hair color', uk: 'Колір волосся', pl: 'Kolor włosów' },
  { entityId: 'onboarding.outfit_color', en: 'Outfit color', uk: 'Колір одягу', pl: 'Kolor stroju' },
  { entityId: 'onboarding.live_preview', en: 'Live preview', uk: 'Попередній перегляд', pl: 'Podgląd na żywo' },
  { entityId: 'onboarding.trending', en: 'Trending', uk: 'Популярне', pl: 'Na topie' },
  { entityId: 'onboarding.selected', en: 'selected', uk: 'обрано', pl: 'wybrano' },
  { entityId: 'onboarding.interest', en: 'interest', uk: 'інтерес', pl: 'zainteresowanie' },
  { entityId: 'onboarding.interests', en: 'interests', uk: 'інтересів', pl: 'zainteresowań' },
  { entityId: 'onboarding.more', en: '+{n} more', uk: 'ще +{n}', pl: '+{n} więcej' },

  // Assessment UI strings
  { entityId: 'assessment.trials', en: 'Trials', uk: 'Випробувань', pl: 'Prób' },
  { entityId: 'assessment.correct', en: 'Correct', uk: 'Правильно', pl: 'Poprawnie' },
  { entityId: 'assessment.xp', en: 'XP', uk: 'ДС', pl: 'PD' },
  { entityId: 'assessment.level', en: 'Level', uk: 'Рівень', pl: 'Poziom' },
  { entityId: 'assessment.self_rated', en: 'Self-rated', uk: 'Самооцінка', pl: 'Samoocena' },
  { entityId: 'assessment.ai_generating_subtitle', en: 'Generating quick questions to gauge your level — this helps craft a precise roadmap', uk: 'Генерую швидкі питання для визначення рівня — це допоможе створити точний роадмап', pl: 'Generuję szybkie pytania do oceny poziomu — to pomoże stworzyć precyzyjną mapę drogową' },
  { entityId: 'assessment.beginner', en: 'Beginner', uk: 'Початківець', pl: 'Początkujący' },
  { entityId: 'assessment.familiar', en: 'Familiar', uk: 'Знайомий', pl: 'Zaznajomiony' },
  { entityId: 'assessment.intermediate', en: 'Intermediate', uk: 'Середній', pl: 'Średniozaawansowany' },
  { entityId: 'assessment.advanced', en: 'Advanced', uk: 'Просунутий', pl: 'Zaawansowany' },
  { entityId: 'assessment.beginner_desc', en: 'Every hero starts somewhere! Your quests will guide you from the basics.', uk: 'Кожен герой з чогось починає! Квести проведуть вас з основ.', pl: 'Każdy bohater od czegoś zaczyna! Questy przeprowadzą cię od podstaw.' },
  { entityId: 'assessment.familiar_desc', en: 'You know the terrain! Your quests will build on your existing awareness.', uk: 'Ви знаєте місцевість! Квести побудують на вашій обізнаності.', pl: 'Znasz teren! Questy będą budować na twojej dotychczasowej wiedzy.' },
  { entityId: 'assessment.intermediate_desc', en: 'Solid foundations! Your quests will build on what you already know.', uk: 'Міцний фундамент! Квести побудують на тому, що ви вже знаєте.', pl: 'Solidne fundamenty! Questy będą budować na tym, co już wiesz.' },
  { entityId: 'assessment.advanced_desc', en: 'Impressive power level! Your quests will challenge you at a high tier.', uk: 'Вражаючий рівень сили! Квести будуть високого рівня складності.', pl: 'Imponujący poziom mocy! Questy będą na wysokim poziomie trudności.' },

  // ══════════════════════════════════════════════════════════════════
  // NEW: NPC Bubble Messages
  // ══════════════════════════════════════════════════════════════════
  { entityId: 'npc.intent_welcome', en: 'Welcome, hero! Every great quest begins with a single choice.', uk: 'Ласкаво просимо, герою! Кожен великий квест починається з одного вибору.', pl: 'Witaj, bohaterze! Każda wielka misja zaczyna się od jednego wyboru.' },
  { entityId: 'npc.goal_direct_prompt', en: "What's your dream skill, hero? Think big — the quest map comes later.", uk: 'Яка твоя мрія, герою? Думай масштабно — карта квестів буде далі.', pl: 'Jaka jest twoja wymarzona umiejętność, bohaterze? Myśl wielko — mapa questów przyjdzie później.' },
  { entityId: 'npc.goal_direct_loading', en: "I'm consulting the ancient scrolls to craft your path...", uk: 'Вивчаю стародавні сувої, щоб прокласти твій шлях...', pl: 'Konsultuję starożytne zwoje, by wytyczyć twoją ścieżkę...' },
  { entityId: 'npc.goal_direct_success', en: "I've crafted these milestones just for you!", uk: 'Ось віхи, які я створив спеціально для тебе!', pl: 'Oto kamienie milowe stworzone specjalnie dla ciebie!' },
  { entityId: 'npc.goal_guided_domain', en: "Let's explore your interests, hero. Which realm calls to you?", uk: 'Дослідимо твої інтереси, герою. Яка сфера тебе приваблює?', pl: 'Zbadajmy twoje zainteresowania, bohaterze. Która dziedzina cię przyciąga?' },
  { entityId: 'npc.goal_guided_interests', en: 'Pick the skill that sparks your curiosity, hero!', uk: 'Обери навичку, яка розпалює твою цікавість, герою!', pl: 'Wybierz umiejętność, która rozpala twoją ciekawość, bohaterze!' },
  { entityId: 'npc.goal_guided_assessment', en: "Before I chart your quest path, hero — how experienced are you in this realm?", uk: 'Перш ніж прокласти шлях квестів, герою — який твій досвід у цій сфері?', pl: 'Zanim wyznaczę twoją ścieżkę questów, bohaterze — jakie masz doświadczenie w tej dziedzinie?' },
  { entityId: 'npc.goal_guided_goals', en: 'Do you have specific milestones in mind, hero?', uk: 'Чи маєш конкретні віхи на думці, герою?', pl: 'Czy masz na myśli konkretne kamienie milowe, bohaterze?' },
  { entityId: 'npc.goal_guided_loading', en: "I'm consulting the ancient scrolls to craft your quest path...", uk: 'Вивчаю стародавні сувої, щоб прокласти шлях квестів...', pl: 'Konsultuję starożytne zwoje, by wytyczyć ścieżkę questów...' },
  { entityId: 'npc.goal_career_intro', en: 'Career change is a bold quest! Tell me about your current situation.', uk: "Зміна кар'єри — сміливий квест! Розкажи про свою поточну ситуацію.", pl: 'Zmiana kariery to odważna misja! Opowiedz mi o swojej obecnej sytuacji.' },
  { entityId: 'npc.goal_career_target', en: "Where do you want to be? Let's chart your new path.", uk: 'Де ти хочеш бути? Прокладемо твій новий шлях.', pl: 'Gdzie chcesz być? Wyznaczmy twoją nową ścieżkę.' },
  { entityId: 'npc.goal_career_result', en: "Here's your career quest map. The journey of a thousand miles begins with a single step.", uk: "Ось твоя кар'єрна карта квестів. Шлях у тисячу миль починається з одного кроку.", pl: 'Oto twoja mapa kariery. Podróż tysiąca mil zaczyna się od jednego kroku.' },
  { entityId: 'npc.assessment_intro', en: "Time to gauge your power level, hero! Don't worry — there are no wrong answers, only XP to gain.", uk: 'Час оцінити твій рівень сили, герою! Не хвилюйся — немає неправильних відповідей, тільки досвід.', pl: 'Czas ocenić twój poziom mocy, bohaterze! Nie martw się — nie ma złych odpowiedzi, tylko doświadczenie do zdobycia.' },
  { entityId: 'npc.assessment_self', en: 'How would you describe your experience with this realm?', uk: 'Як би ти описав свій досвід у цій сфері?', pl: 'Jak opisałbyś swoje doświadczenie w tej dziedzinie?' },
  { entityId: 'npc.assessment_complete', en: "Assessment complete! I've measured your abilities.", uk: 'Оцінку завершено! Я виміряв твої здібності.', pl: 'Ocena zakończona! Zmierzyłem twoje umiejętności.' },
  { entityId: 'npc.assessment_feedback_correct', en: 'Well done, hero!', uk: 'Чудова робота, герою!', pl: 'Świetna robota, bohaterze!' },
  { entityId: 'npc.assessment_feedback_wrong', en: 'Not quite — keep learning!', uk: 'Не зовсім — продовжуй вчитися!', pl: 'Nie do końca — ucz się dalej!' },
  { entityId: 'npc.character_intro', en: 'Choose your hero, brave adventurer! Pick a preset or create your own.', uk: 'Обери свого героя, сміливий шукачу пригод! Обери готового або створи свого.', pl: 'Wybierz swojego bohatera, dzielny poszukiwaczu przygód! Wybierz gotowego lub stwórz własnego.' },
  { entityId: 'npc.character_create', en: 'A custom hero! Craft your look — hair, skin, outfit.', uk: 'Унікальний герой! Створи свій вигляд — зачіска, шкіра, одяг.', pl: 'Własny bohater! Stwórz swój wygląd — fryzura, skóra, strój.' },

  // ══════════════════════════════════════════════════════════════════
  // NEW: Goal/Direct Screen
  // ══════════════════════════════════════════════════════════════════
  { entityId: 'goal.direct_title', en: 'Describe your dream quest', uk: 'Опишіть свій квест мрії', pl: 'Opisz swój wymarzony quest' },
  { entityId: 'goal.direct_subtitle', en: 'What skill or topic do you want to master?', uk: 'Яку навичку або тему ви хочете опанувати?', pl: 'Jaką umiejętność lub temat chcesz opanować?' },
  { entityId: 'goal.direct_placeholder', en: 'e.g., Become a full-stack developer, Master AI/ML...', uk: 'напр., Стати full-stack розробником, Опанувати AI/ML...', pl: 'np. Zostać programistą full-stack, Opanować AI/ML...' },
  { entityId: 'goal.direct_submit', en: 'Set my dream quest', uk: 'Встановити мій квест мрії', pl: 'Ustaw mój wymarzony quest' },
  { entityId: 'goal.direct_generating', en: 'Generating milestones...', uk: 'Генерую віхи...', pl: 'Generuję kamienie milowe...' },
  { entityId: 'goal.direct_choose', en: 'Choose your milestones', uk: 'Оберіть свої віхи', pl: 'Wybierz swoje kamienie milowe' },
  { entityId: 'goal.direct_quest_map', en: 'Your Quest Map', uk: 'Ваша карта квестів', pl: 'Twoja mapa questów' },
  { entityId: 'goal.direct_continue', en: 'Looks good — continue', uk: 'Виглядає добре — продовжити', pl: 'Wygląda dobrze — kontynuuj' },

  // ══════════════════════════════════════════════════════════════════
  // NEW: Goal/Guided New Phases (Assessment + Custom Goals)
  // ══════════════════════════════════════════════════════════════════
  { entityId: 'onboarding.skill_level', en: 'Your skill level', uk: 'Ваш рівень навичок', pl: 'Twój poziom umiejętności' },
  { entityId: 'onboarding.skill_level_in', en: 'in {domain}', uk: 'в {domain}', pl: 'w {domain}' },
  { entityId: 'onboarding.milestones_title', en: 'Your milestones', uk: 'Ваші віхи', pl: 'Twoje kamienie milowe' },
  { entityId: 'onboarding.milestones_count', en: '{count}/5 milestones added', uk: '{count}/5 віх додано', pl: '{count}/5 kamieni milowych dodanych' },
  { entityId: 'onboarding.milestones_empty', en: 'No milestones yet. Add your own or skip to let AI decide.', uk: 'Віх ще немає. Додайте свої або пропустіть — AI вирішить.', pl: 'Brak kamieni milowych. Dodaj własne lub pomiń — AI zdecyduje.' },
  { entityId: 'onboarding.milestones_placeholder', en: 'e.g., Build a REST API with authentication...', uk: 'напр., Створити REST API з автентифікацією...', pl: 'np. Zbudować REST API z uwierzytelnianiem...' },
  { entityId: 'onboarding.milestones_skip', en: 'Skip — let AI decide', uk: 'Пропустити — нехай AI вирішить', pl: 'Pomiń — niech AI zdecyduje' },
  { entityId: 'onboarding.milestones_continue', en: 'Continue with {count} goals', uk: 'Продовжити з {count} цілями', pl: 'Kontynuuj z {count} celami' },
  { entityId: 'onboarding.change_goals', en: 'Change my goals', uk: 'Змінити мої цілі', pl: 'Zmień moje cele' },

  // ══════════════════════════════════════════════════════════════════
  // NEW: Dashboard Extensions
  // ══════════════════════════════════════════════════════════════════
  { entityId: 'dashboard.todays_focus', en: "Today's focus: Level up your skills", uk: 'Сьогоднішній фокус: прокачай свої навички', pl: 'Dzisiejszy cel: podnieś swoje umiejętności' },
  { entityId: 'dashboard.levelup_title', en: 'Ascension!', uk: 'Підвищення!', pl: 'Awans!' },
  { entityId: 'dashboard.levelup_level', en: 'Level {level}', uk: 'Рівень {level}', pl: 'Poziom {level}' },
  { entityId: 'dashboard.levelup_tap', en: 'Tap anywhere to continue', uk: 'Натисніть будь-де, щоб продовжити', pl: 'Kliknij gdziekolwiek, aby kontynuować' },
  { entityId: 'dashboard.streak_7', en: '7-Day Streak!', uk: 'Серія 7 днів!', pl: 'Seria 7 dni!' },
  { entityId: 'dashboard.streak_30', en: '30-Day Legend!', uk: 'Легенда 30 днів!', pl: 'Legenda 30 dni!' },
  { entityId: 'dashboard.streak_100', en: '100-Day Master!', uk: 'Майстер 100 днів!', pl: 'Mistrz 100 dni!' },
  { entityId: 'dashboard.streak_365', en: '365-Day Immortal!', uk: 'Безсмертний 365 днів!', pl: 'Nieśmiertelny 365 dni!' },
  { entityId: 'dashboard.welcome_new', en: 'Your adventure begins', uk: 'Твоя пригода починається', pl: 'Twoja przygoda się zaczyna' },
  { entityId: 'dashboard.welcome_return', en: 'Ready for more', uk: 'Готовий до нового', pl: 'Gotowy na więcej' },
  { entityId: 'dashboard.welcome_missed', en: 'We missed you', uk: 'Ми за тобою скучили', pl: 'Tęskniliśmy za tobą' },
  { entityId: 'dashboard.welcome_refresh', en: "Let's refresh", uk: 'Оновимо знання', pl: 'Odświeżmy wiedzę' },
  { entityId: 'dashboard.welcome_bonus', en: 'Welcome back bonus: 2x XP!', uk: 'Бонус за повернення: 2x досвіду!', pl: 'Bonus powitalny: 2x PD!' },
  { entityId: 'dashboard.quest_lines', en: 'Quest Lines', uk: 'Лінії квестів', pl: 'Linie questów' },
  { entityId: 'dashboard.no_quest_lines', en: 'No quest lines yet, hero!', uk: 'Ліній квестів ще немає, герою!', pl: 'Brak linii questów, bohaterze!' },
  { entityId: 'dashboard.greeting_morning', en: 'Good morning, {name}!', uk: 'Доброго ранку, {name}!', pl: 'Dzień dobry, {name}!' },
  { entityId: 'dashboard.greeting_afternoon', en: 'Good afternoon, {name}!', uk: 'Доброго дня, {name}!', pl: 'Dzień dobry, {name}!' },
  { entityId: 'dashboard.greeting_evening', en: 'Good evening, {name}!', uk: 'Доброго вечора, {name}!', pl: 'Dobry wieczór, {name}!' },
  { entityId: 'dashboard.episode_chronicle', en: 'Chronicle →', uk: 'Хроніка →', pl: 'Kronika →' },
  { entityId: 'dashboard.episode_readmore', en: 'Read More ▼', uk: 'Читати далі ▼', pl: 'Czytaj więcej ▼' },
  { entityId: 'dashboard.episode_read', en: '✓ Read', uk: '✓ Прочитано', pl: '✓ Przeczytano' },
  { entityId: 'dashboard.episode_dismiss', en: 'Dismiss', uk: 'Закрити', pl: 'Zamknij' },

  // Dashboard Redesign — Phase 1
  { entityId: 'dashboard.next_quest', en: 'Next Quest', uk: 'Наступний квест', pl: 'Następna misja' },
  { entityId: 'dashboard.begin_quest', en: 'Begin Quest', uk: 'Розпочати квест', pl: 'Rozpocznij misję' },
  { entityId: 'dashboard.all_done', en: 'All quests completed!', uk: 'Всі квести виконано!', pl: 'Wszystkie misje ukończone!' },
  { entityId: 'dashboard.all_done_sub', en: 'Amazing work today, hero! Come back tomorrow for new quests.', uk: 'Чудова робота сьогодні, герою! Повертайся завтра за новими квестами.', pl: 'Świetna robota, bohaterze! Wróć jutro po nowe misje.' },
  { entityId: 'dashboard.quests_done', en: 'quests conquered', uk: 'квестів пройдено', pl: 'misji ukończonych' },
  { entityId: 'dashboard.completed_today', en: 'Completed ({n})', uk: 'Виконано ({n})', pl: 'Ukończone ({n})' },

  // Dashboard Redesign — Phase 2
  { entityId: 'dashboard.roadmaps', en: 'Roadmaps', uk: 'Роадмапи', pl: 'Mapy drogowe' },
  { entityId: 'dashboard.manage', en: 'Manage...', uk: 'Керувати...', pl: 'Zarządzaj...' },
  { entityId: 'dashboard.filter_all', en: 'All', uk: 'Всі', pl: 'Wszystkie' },
  { entityId: 'welcome.subtitle_new', en: 'Your first quest awaits, hero!', uk: 'Твій перший квест чекає, герою!', pl: 'Twoja pierwsza misja czeka, bohaterze!' },
  { entityId: 'welcome.subtitle_missed', en: 'Pick up where you left off with an easy quest.', uk: 'Продовж звідки зупинився з легкого квесту.', pl: 'Wróć tam, gdzie skończyłeś, od łatwej misji.' },
  { entityId: 'welcome.subtitle_refresh', en: 'Start with something light to rebuild momentum.', uk: 'Почни з чогось легкого, щоб набрати темп.', pl: 'Zacznij od czegoś lekkiego, aby odbudować tempo.' },
  { entityId: 'welcome.subtitle_longabsent', en: 'Great to see you again! Ready for a fresh start?', uk: 'Раді бачити знову! Готовий до нового старту?', pl: 'Miło cię znów widzieć! Gotowy na nowy start?' },
  { entityId: 'quest.close_review', en: 'Close Review', uk: 'Закрити огляд', pl: 'Zamknij przegląd' },
  { entityId: 'quest.review', en: 'Review', uk: 'Огляд', pl: 'Przegląd' },
  { entityId: 'quest.phase.review', en: 'Review', uk: 'Огляд', pl: 'Przegląd' },
  { entityId: 'tier.diamond', en: 'Diamond', uk: 'Діамант', pl: 'Diament' },
  { entityId: 'tier.gold', en: 'Gold', uk: 'Золото', pl: 'Złoto' },
  { entityId: 'tier.silver', en: 'Silver', uk: 'Срібло', pl: 'Srebro' },
  { entityId: 'tier.bronze', en: 'Bronze', uk: 'Бронза', pl: 'Brąz' },

  // ── Roadmap archive/history ──
  { entityId: 'roadmap.tab_active', en: 'Active', uk: 'Активні', pl: 'Aktywne' },
  { entityId: 'roadmap.tab_history', en: 'History', uk: 'Історія', pl: 'Historia' },
  { entityId: 'roadmap.archive_confirm_title', en: 'Deactivate Quest Line?', uk: 'Деактивувати квест-лінію?', pl: 'Dezaktywować linię questów?' },
  { entityId: 'roadmap.archive_confirm_body', en: 'You can restore it from History. All progress is saved.', uk: 'Ви можете відновити її з Історії. Весь прогрес збережено.', pl: 'Możesz przywrócić ją z Historii. Cały postęp jest zapisany.' },
  { entityId: 'roadmap.archived_banner', en: 'This Quest Line is archived', uk: 'Ця квест-лінія архівована', pl: 'Ta linia questów jest zarchiwizowana' },
  { entityId: 'roadmap.reactivate', en: 'Reactivate', uk: 'Відновити', pl: 'Przywróć' },
  { entityId: 'roadmap.reactivate_tier_blocked', en: 'Upgrade your tier to reactivate more quest lines', uk: 'Оновіть тір, щоб відновити більше квест-ліній', pl: 'Ulepsz swój poziom, aby przywrócić więcej linii questów' },
  { entityId: 'roadmap.quest_history', en: 'Quest History', uk: 'Історія квестів', pl: 'Historia questów' },
  { entityId: 'roadmap.completed_on', en: 'Last completed: {date}', uk: 'Останнє виконання: {date}', pl: 'Ostatnio ukończono: {date}' },
  { entityId: 'roadmap.xp_earned', en: '{xp} XP earned', uk: '{xp} XP отримано', pl: '{xp} XP zdobyte' },
  { entityId: 'roadmap.history_empty', en: 'No archived or completed quest lines yet', uk: 'Ще немає архівованих або завершених квест-ліній', pl: 'Brak zarchiwizowanych ani ukończonych linii questów' },
  { entityId: 'roadmap.archive_confirm_action', en: 'Deactivate', uk: 'Деактивувати', pl: 'Dezaktywuj' },
  { entityId: 'roadmap.quests_completed', en: 'quests completed', uk: 'квестів виконано', pl: 'questów ukończonych' },
  { entityId: 'roadmap.archive_action', en: 'Archive Quest Line', uk: 'Архівувати квест-лінію', pl: 'Archiwizuj linię questów' },
  { entityId: 'roadmap.reactivate_action', en: 'Reactivate Quest Line', uk: 'Відновити квест-лінію', pl: 'Przywróć linię questów' },
  { entityId: 'roadmap.archived_message', en: 'Archived — view history or reactivate', uk: 'Архівовано — перегляньте історію або відновіть', pl: 'Zarchiwizowano — zobacz historię lub przywróć' },

  // Dashboard Redesign — Phase 3
  { entityId: 'dashboard.training_grounds', en: 'Training Grounds', uk: 'Тренувальні поля', pl: 'Poligon treningowy' },
  { entityId: 'dashboard.reviews_due', en: 'reviews due', uk: 'повторень заплановано', pl: 'powtórek zaplanowanych' },
  { entityId: 'dashboard.overall_mastery', en: 'Overall Mastery', uk: 'Загальна майстерність', pl: 'Ogólne opanowanie' },
  { entityId: 'dashboard.knowledge_codex', en: 'Knowledge Codex ({n} skills)', uk: 'Кодекс знань ({n} навичок)', pl: 'Kodeks wiedzy ({n} umiejętności)' },
  { entityId: 'mastery.review_now', en: 'Review now to maintain mastery', uk: 'Повторіть зараз, щоб зберегти рівень', pl: 'Powtórz teraz, aby utrzymać poziom' },
  { entityId: 'review.how_well', en: 'How well do you remember this topic?', uk: 'Наскільки добре ви пам\'ятаєте цю тему?', pl: 'Jak dobrze pamiętasz ten temat?' },
  { entityId: 'review.forgot', en: 'Forgot', uk: 'Забув', pl: 'Zapomniałem' },
  { entityId: 'review.hard', en: 'Hard', uk: 'Важко', pl: 'Trudne' },
  { entityId: 'review.ok', en: 'OK', uk: 'Ок', pl: 'OK' },
  { entityId: 'review.easy', en: 'Easy', uk: 'Легко', pl: 'Łatwe' },
  { entityId: 'review.perfect', en: 'Perfect', uk: 'Ідеально', pl: 'Idealnie' },
  { entityId: 'review.submit', en: 'Submit Review', uk: 'Надіслати відгук', pl: 'Wyślij ocenę' },
  { entityId: 'review.submitting', en: 'Submitting...', uk: 'Надсилається...', pl: 'Wysyłanie...' },

  // ══════════════════════════════════════════════════════════════════
  // NEW: Quest Map Screen
  // ══════════════════════════════════════════════════════════════════
  { entityId: 'questmap.title', en: 'Quest Map', uk: 'Карта квестів', pl: 'Mapa questów' },
  { entityId: 'questmap.subtitle', en: 'Your quest lines, mapped and ready for adventure', uk: 'Ваші лінії квестів — змапленo і готово до пригод', pl: 'Twoje linie questów, zmapowane i gotowe na przygodę' },
  { entityId: 'questmap.add', en: 'Add Quest Line', uk: 'Додати лінію квестів', pl: 'Dodaj linię questów' },
  { entityId: 'questmap.count', en: '{count}/{limit} quest lines', uk: '{count}/{limit} ліній квестів', pl: '{count}/{limit} linii questów' },
  { entityId: 'questmap.empty_title', en: 'No quest lines yet, hero!', uk: 'Ліній квестів ще немає, герою!', pl: 'Brak linii questów, bohaterze!' },
  { entityId: 'questmap.empty_subtitle', en: 'Begin your journey by forging a quest line', uk: 'Почни подорож, створивши лінію квестів', pl: 'Rozpocznij podróż, tworząc linię questów' },
  { entityId: 'questmap.forge', en: 'Forge Quest Line', uk: 'Створити лінію квестів', pl: 'Wykuj linię questów' },

  // ══════════════════════════════════════════════════════════════════
  // NEW: The Forge Screen
  // ══════════════════════════════════════════════════════════════════
  { entityId: 'forge.title', en: 'The Forge', uk: 'Кузня', pl: 'Kuźnia' },
  { entityId: 'forge.subtitle', en: 'Combine 3 artifacts of the same rarity to forge a more powerful one', uk: 'Об\'єднайте 3 артефакти однакової рідкості, щоб створити потужніший', pl: 'Połącz 3 artefakty tej samej rzadkości, by wykuć potężniejszy' },
  { entityId: 'forge.slot', en: 'Slot {n}', uk: 'Слот {n}', pl: 'Slot {n}' },
  { entityId: 'forge.remove', en: 'Remove', uk: 'Видалити', pl: 'Usuń' },
  { entityId: 'forge.forging', en: 'Forging...', uk: 'Кування...', pl: 'Kucie...' },
  { entityId: 'forge.skip', en: 'Tap to skip', uk: 'Натисніть, щоб пропустити', pl: 'Kliknij, aby pominąć' },
  { entityId: 'forge.coins', en: '+5 coins awarded!', uk: '+5 монет отримано!', pl: '+5 monet zdobytych!' },
  { entityId: 'forge.again', en: 'Forge Again', uk: 'Кувати ще', pl: 'Kuj ponownie' },
  { entityId: 'forge.retry', en: 'Try again, hero', uk: 'Спробуй ще, герою', pl: 'Spróbuj ponownie, bohaterze' },
  { entityId: 'forge.artifacts', en: 'Available Artifacts', uk: 'Доступні артефакти', pl: 'Dostępne artefakty' },
  { entityId: 'forge.no_artifacts', en: 'No artifacts available for forging.', uk: 'Немає артефактів для кування.', pl: 'Brak artefaktów do kucia.' },

  // ══════════════════════════════════════════════════════════════════
  // NEW: Shop Screen
  // ══════════════════════════════════════════════════════════════════
  { entityId: 'shop.title', en: 'The Merchant', uk: 'Торговець', pl: 'Kupiec' },
  { entityId: 'shop.subtitle', en: 'Spend your hard-earned coins on cosmetics and utilities.', uk: 'Витрачайте важко зароблені монети на косметику та корисності.', pl: 'Wydaj ciężko zarobione monety na kosmetyki i narzędzia.' },
  { entityId: 'shop.confirm', en: 'Acquire {item}?', uk: 'Придбати {item}?', pl: 'Nabyć {item}?' },
  { entityId: 'shop.cost', en: '{cost} coins', uk: '{cost} монет', pl: '{cost} monet' },
  { entityId: 'shop.acquire', en: 'Acquire', uk: 'Придбати', pl: 'Nabądź' },
  { entityId: 'shop.not_now', en: 'Not now', uk: 'Не зараз', pl: 'Nie teraz' },
  { entityId: 'shop.success', en: 'Artifact Acquired!', uk: 'Артефакт придбано!', pl: 'Artefakt nabyty!' },
  { entityId: 'shop.success_desc', en: 'Check your inventory.', uk: 'Перевірте інвентар.', pl: 'Sprawdź ekwipunek.' },
  { entityId: 'shop.insufficient', en: 'Not enough coins, hero!', uk: 'Недостатньо монет, герою!', pl: 'Za mało monet, bohaterze!' },
  { entityId: 'shop.insufficient_desc', en: 'Complete more quests to earn gold.', uk: 'Виконай більше квестів, щоб заробити золото.', pl: 'Wykonaj więcej questów, by zarobić złoto.' },
  { entityId: 'shop.loading', en: 'Loading wares...', uk: 'Завантаження товарів...', pl: 'Ładowanie towarów...' },
  { entityId: 'shop.error', en: 'The merchant is unavailable', uk: 'Торговець недоступний', pl: 'Kupiec jest niedostępny' },
  { entityId: 'shop.acquiring', en: 'Acquiring artifact...', uk: 'Придбання артефакту...', pl: 'Nabywanie artefaktu...' },
  { entityId: 'shop.back', en: 'Back', uk: 'Назад', pl: 'Wróć' },
  { entityId: 'shop.retry', en: 'Try again', uk: 'Спробувати ще', pl: 'Spróbuj ponownie' },

  // ── Progress Messages (daily quest proximity) ──
  { entityId: 'progress.begin', en: 'Begin your journey, hero!', uk: 'Починай свою подорож, герою!', pl: 'Rozpocznij swoją podróż, bohaterze!' },
  { entityId: 'progress.all_done', en: 'All quests conquered! Glorious!', uk: 'Всі квести виконано! Славно!', pl: 'Wszystkie questy ukończone! Chwała!' },
  { entityId: 'progress.one_left', en: 'One quest away from glory!', uk: 'Один квест до слави!', pl: 'Jeden quest do chwały!' },
  { entityId: 'progress.halfway', en: 'Over halfway — keep the momentum!', uk: 'Більше половини — тримай темп!', pl: 'Ponad połowa — trzymaj tempo!' },
  { entityId: 'progress.remaining', en: '{n} quests remain on your path', uk: '{n} квестів залишилось на твоєму шляху', pl: '{n} questów pozostało na twojej drodze' },

  // ══════════════════════════════════════════════════════════════════
  // NEW: Hero Card Screen
  // ══════════════════════════════════════════════════════════════════
  { entityId: 'herocard.title', en: 'Hero Card', uk: 'Картка героя', pl: 'Karta bohatera' },
  { entityId: 'herocard.section_attributes', en: 'Hero Attributes', uk: 'Атрибути героя', pl: 'Atrybuty bohatera' },
  { entityId: 'herocard.section_equipment', en: 'Equipment Loadout', uk: 'Спорядження', pl: 'Wyposażenie' },
  { entityId: 'herocard.section_skills', en: 'Skill Mastery', uk: 'Майстерність навичок', pl: 'Mistrzostwo umiejętności' },
  { entityId: 'herocard.section_achievements', en: 'Achievement Board', uk: 'Дошка досягнень', pl: 'Tablica osiągnięć' },
  { entityId: 'herocard.section_archetype', en: 'Your Archetype', uk: 'Ваш архетип', pl: 'Twój archetyp' },
  { entityId: 'herocard.attr_strength', en: 'Strength', uk: 'Сила', pl: 'Siła' },
  { entityId: 'herocard.attr_strength_desc', en: 'Physical and technical prowess', uk: 'Технічна та фізична майстерність', pl: 'Sprawność techniczna i fizyczna' },
  { entityId: 'herocard.attr_intelligence', en: 'Intelligence', uk: 'Інтелект', pl: 'Inteligencja' },
  { entityId: 'herocard.attr_intelligence_desc', en: 'Problem solving and analytical thinking', uk: 'Вирішення проблем та аналітичне мислення', pl: 'Rozwiązywanie problemów i myślenie analityczne' },
  { entityId: 'herocard.attr_charisma', en: 'Charisma', uk: 'Харизма', pl: 'Charyzma' },
  { entityId: 'herocard.attr_charisma_desc', en: 'Communication and influence', uk: 'Комунікація та вплив', pl: 'Komunikacja i wpływ' },
  { entityId: 'herocard.attr_constitution', en: 'Constitution', uk: 'Витривалість', pl: 'Kondycja' },
  { entityId: 'herocard.attr_constitution_desc', en: 'Resilience and consistency', uk: 'Стійкість та послідовність', pl: 'Odporność i konsekwencja' },
  { entityId: 'herocard.attr_dexterity', en: 'Dexterity', uk: 'Спритність', pl: 'Zręczność' },
  { entityId: 'herocard.attr_dexterity_desc', en: 'Adaptability and quick learning', uk: 'Адаптивність та швидке навчання', pl: 'Adaptacyjność i szybka nauka' },
  { entityId: 'herocard.attr_wisdom', en: 'Wisdom', uk: 'Мудрість', pl: 'Mądrość' },
  { entityId: 'herocard.attr_wisdom_desc', en: 'Strategic thinking and insight', uk: 'Стратегічне мислення та інтуїція', pl: 'Myślenie strategiczne i wnikliwość' },
  { entityId: 'herocard.slot_weapon', en: 'Weapon', uk: 'Зброя', pl: 'Broń' },
  { entityId: 'herocard.slot_shield', en: 'Shield', uk: 'Щит', pl: 'Tarcza' },
  { entityId: 'herocard.slot_armor', en: 'Armor', uk: 'Броня', pl: 'Zbroja' },
  { entityId: 'herocard.slot_helmet', en: 'Helmet', uk: 'Шолом', pl: 'Hełm' },
  { entityId: 'herocard.slot_boots', en: 'Boots', uk: 'Чоботи', pl: 'Buty' },
  { entityId: 'herocard.slot_ring', en: 'Ring', uk: 'Перстень', pl: 'Pierścień' },
  { entityId: 'herocard.slot_companion', en: 'Companion', uk: 'Компаньйон', pl: 'Towarzysz' },
  { entityId: 'herocard.slot_empty', en: 'Complete quests to unlock', uk: 'Виконай квести, щоб відкрити', pl: 'Wykonaj questy, aby odblokować' },
  { entityId: 'herocard.archetype_bonus', en: '+10% XP bonus', uk: '+10% бонус досвіду', pl: '+10% bonus PD' },

  // ══════════════════════════════════════════════════════════════════
  // NEW: Settings Screen
  // ══════════════════════════════════════════════════════════════════
  { entityId: 'settings.title', en: 'Hero Settings', uk: 'Налаштування героя', pl: 'Ustawienia bohatera' },
  { entityId: 'settings.subtitle', en: 'Customize your identity and preferences', uk: 'Налаштуйте свою ідентичність та вподобання', pl: 'Dostosuj swoją tożsamość i preferencje' },
  { entityId: 'settings.section_identity', en: 'Identity', uk: 'Ідентичність', pl: 'Tożsamość' },
  { entityId: 'settings.label_name', en: 'Display Name', uk: "Ім'я", pl: 'Nazwa wyświetlana' },
  { entityId: 'settings.section_prefs', en: 'Preferences', uk: 'Вподобання', pl: 'Preferencje' },
  { entityId: 'settings.label_quiet', en: 'Quiet Mode', uk: 'Тихий режим', pl: 'Tryb cichy' },
  { entityId: 'settings.quiet_desc', en: 'Hide social features, badges, and notifications', uk: 'Приховати соціальні функції, бейджі та сповіщення', pl: 'Ukryj funkcje społeczne, odznaki i powiadomienia' },
  { entityId: 'settings.label_lang', en: 'Language', uk: 'Мова', pl: 'Język' },
  { entityId: 'settings.lang_desc', en: 'Changing language will refresh your quests', uk: 'Зміна мови оновить ваші квести', pl: 'Zmiana języka odświeży twoje questy' },
  { entityId: 'settings.label_tz', en: 'Timezone', uk: 'Часовий пояс', pl: 'Strefa czasowa' },
  { entityId: 'settings.section_account', en: 'Account', uk: 'Акаунт', pl: 'Konto' },
  { entityId: 'settings.toast_name', en: 'Name updated!', uk: "Ім'я оновлено!", pl: 'Nazwa zaktualizowana!' },
  { entityId: 'settings.toast_prefs', en: 'Preferences saved!', uk: 'Вподобання збережено!', pl: 'Preferencje zapisane!' },
  { entityId: 'settings.btn_saving', en: 'Saving...', uk: 'Збереження...', pl: 'Zapisywanie...' },

  // ══════════════════════════════════════════════════════════════════
  // NEW: Chronicle Screen
  // ══════════════════════════════════════════════════════════════════
  { entityId: 'chronicle.title', en: 'The Chronicle of Lumen', uk: 'Хроніка Люмена', pl: 'Kronika Lumen' },
  { entityId: 'chronicle.subtitle', en: "Every episode of your hero's journey, preserved in the Archive.", uk: 'Кожен епізод подорожі вашого героя, збережений в Архіві.', pl: 'Każdy odcinek podróży twojego bohatera, zachowany w Archiwum.' },
  { entityId: 'chronicle.season', en: 'Season {n}', uk: 'Сезон {n}', pl: 'Sezon {n}' },
  { entityId: 'chronicle.episodes', en: '{count} Episodes', uk: '{count} епізодів', pl: '{count} odcinków' },
  { entityId: 'chronicle.badge_read', en: '✓ Read', uk: '✓ Прочитано', pl: '✓ Przeczytano' },
  { entityId: 'chronicle.badge_new', en: 'NEW', uk: 'НОВЕ', pl: 'NOWE' },
  { entityId: 'chronicle.badge_readtime', en: '~{n} min read', uk: '~{n} хв читання', pl: '~{n} min czytania' },
  { entityId: 'chronicle.mode_label', en: 'Narrative Mode', uk: 'Режим наративу', pl: 'Tryb narracji' },
  { entityId: 'chronicle.mode_full', en: 'Full', uk: 'Повний', pl: 'Pełny' },
  { entityId: 'chronicle.mode_minimal', en: 'Minimal', uk: 'Мінімальний', pl: 'Minimalny' },
  { entityId: 'chronicle.mode_off', en: 'Off', uk: 'Вимкнено', pl: 'Wyłączony' },

  // ══════════════════════════════════════════════════════════════════
  // NEW: Sidebar + User Menu
  // ══════════════════════════════════════════════════════════════════
  { entityId: 'sidebar.section_skills', en: 'Skill Mastery', uk: 'Майстерність навичок', pl: 'Mistrzostwo umiejętności' },
  { entityId: 'sidebar.section_equipment', en: 'Equipment', uk: 'Спорядження', pl: 'Wyposażenie' },
  { entityId: 'sidebar.section_community', en: 'Community', uk: 'Спільнота', pl: 'Społeczność' },
  { entityId: 'sidebar.empty_title', en: 'Your quest board awaits', uk: 'Ваша дошка квестів чекає', pl: 'Twoja tablica questów czeka' },
  { entityId: 'sidebar.empty_subtitle', en: 'Complete quests to unlock skills and equipment', uk: 'Виконуйте квести, щоб відкрити навички та спорядження', pl: 'Wykonaj questy, aby odblokować umiejętności i wyposażenie' },
  { entityId: 'sidebar.level', en: 'Lv.{n}', uk: 'Рв.{n}', pl: 'Poz.{n}' },
  { entityId: 'usermenu.settings', en: 'Hero Settings', uk: 'Налаштування героя', pl: 'Ustawienia bohatera' },
  { entityId: 'usermenu.quiet', en: 'Quiet Mode', uk: 'Тихий режим', pl: 'Tryb cichy' },
  { entityId: 'usermenu.restart', en: 'Restart Journey', uk: 'Почати подорож заново', pl: 'Rozpocznij podróż od nowa' },
  { entityId: 'usermenu.leave', en: 'Leave Guild', uk: 'Покинути гільдію', pl: 'Opuść gildię' },

  // ══════════════════════════════════════════════════════════════════
  // NEW: Shared Components
  // ══════════════════════════════════════════════════════════════════
  { entityId: 'steps.intent', en: 'Intent', uk: 'Намір', pl: 'Zamiar' },
  { entityId: 'steps.goal', en: 'Goal', uk: 'Ціль', pl: 'Cel' },
  { entityId: 'steps.assessment', en: 'Assessment', uk: 'Оцінка', pl: 'Ocena' },
  { entityId: 'steps.hero', en: 'Hero', uk: 'Герой', pl: 'Bohater' },
  { entityId: 'common.xp', en: '{xp} XP', uk: '{xp} ДС', pl: '{xp} PD' },
  { entityId: 'common.level_short', en: 'L{level}', uk: 'Р{level}', pl: 'P{level}' },
  { entityId: 'common.btn_back', en: 'Go back', uk: 'Повернутися', pl: 'Wróć' },
  { entityId: 'common.btn_retry', en: 'Try again, hero', uk: 'Спробуй ще, герою', pl: 'Spróbuj ponownie, bohaterze' },
  { entityId: 'common.saving', en: 'Saving...', uk: 'Збереження...', pl: 'Zapisywanie...' },
  { entityId: 'common.change', en: 'Change', uk: 'Змінити', pl: 'Zmień' },
  { entityId: 'common.loading', en: 'Loading...', uk: 'Завантаження...', pl: 'Ładowanie...' },
  { entityId: 'pyramid.dream', en: 'Dream Quest', uk: 'Квест мрії', pl: 'Quest marzeń' },
  { entityId: 'pyramid.milestones', en: 'Performance Milestones', uk: 'Віхи досягнень', pl: 'Kamienie milowe' },
  { entityId: 'pyramid.weeks', en: '~{n}w', uk: '~{n}т', pl: '~{n}tyg' },
  { entityId: 'pyramid.footer', en: 'Daily quests and practice routines will be generated from these milestones', uk: 'Щоденні квести та практичні завдання будуть згенеровані з цих віх', pl: 'Codzienne questy i ćwiczenia praktyczne będą generowane z tych kamieni milowych' },
  { entityId: 'rarity.common', en: 'Common', uk: 'Звичайний', pl: 'Zwykły' },
  { entityId: 'rarity.uncommon', en: 'Uncommon', uk: 'Незвичайний', pl: 'Niezwykły' },
  { entityId: 'rarity.rare', en: 'Rare', uk: 'Рідкісний', pl: 'Rzadki' },
  { entityId: 'rarity.epic', en: 'Epic', uk: 'Епічний', pl: 'Epicki' },
  { entityId: 'rarity.legendary', en: 'Legendary', uk: 'Легендарний', pl: 'Legendarny' },
  { entityId: 'error.quest_title', en: 'The path is blocked', uk: 'Шлях заблоковано', pl: 'Ścieżka zablokowana' },
  { entityId: 'error.quest_subtitle', en: 'Something went wrong loading your quests.', uk: 'Щось пішло не так при завантаженні квестів.', pl: 'Coś poszło nie tak podczas ładowania questów.' },

  // ══════════════════════════════════════════════════════════════════
  // NEW: Template Fallbacks (for TemplateService)
  // ══════════════════════════════════════════════════════════════════
  { entityId: 'template.quest_review', en: 'Review Core Concepts', uk: 'Огляд основних концепцій', pl: 'Przegląd kluczowych koncepcji' },
  { entityId: 'template.quest_review_desc', en: 'Revisit the fundamentals to strengthen your foundation.', uk: 'Поверніться до основ, щоб зміцнити фундамент.', pl: 'Wróć do podstaw, aby wzmocnić fundamenty.' },
  { entityId: 'template.quest_practice', en: 'Practice Session', uk: 'Практичне заняття', pl: 'Sesja praktyczna' },
  { entityId: 'template.quest_practice_desc', en: 'Apply what you\'ve learned through hands-on exercises.', uk: 'Застосуйте вивчене через практичні вправи.', pl: 'Zastosuj to, czego się nauczyłeś, w praktycznych ćwiczeniach.' },
  { entityId: 'template.quest_knowledge', en: 'Knowledge Check', uk: 'Перевірка знань', pl: 'Sprawdzian wiedzy' },
  { entityId: 'template.quest_knowledge_desc', en: 'Test your understanding of key concepts.', uk: 'Перевірте розуміння ключових концепцій.', pl: 'Sprawdź zrozumienie kluczowych koncepcji.' },
  { entityId: 'template.motivational_1', en: 'Every expert was once a beginner.', uk: 'Кожен експерт колись був початківцем.', pl: 'Każdy ekspert kiedyś był początkującym.' },
  { entityId: 'template.motivational_2', en: 'The journey of a thousand miles begins with a single step.', uk: 'Шлях у тисячу миль починається з одного кроку.', pl: 'Podróż tysiąca mil zaczyna się od jednego kroku.' },
  { entityId: 'template.motivational_3', en: 'Progress, not perfection.', uk: 'Прогрес, а не досконалість.', pl: 'Postęp, nie perfekcja.' },
  { entityId: 'template.motivational_4', en: 'Small daily improvements lead to stunning results.', uk: 'Маленькі щоденні покращення ведуть до вражаючих результатів.', pl: 'Małe codzienne ulepszenia prowadzą do zdumiewających rezultatów.' },
  { entityId: 'template.motivational_5', en: "You're doing better than you think.", uk: 'Ви справляєтесь краще, ніж думаєте.', pl: 'Radzisz sobie lepiej, niż myślisz.' },
  { entityId: 'template.funfact_1', en: 'Ada Lovelace wrote the first computer program in 1843.', uk: 'Ада Лавлейс написала першу комп\'ютерну програму у 1843 році.', pl: 'Ada Lovelace napisała pierwszy program komputerowy w 1843 roku.' },
  { entityId: 'template.funfact_2', en: 'Linus Torvalds created Git in just 10 days.', uk: 'Лінус Торвальдс створив Git всього за 10 днів.', pl: 'Linus Torvalds stworzył Gita w zaledwie 10 dni.' },
  { entityId: 'template.funfact_3', en: 'The first computer bug was a real moth found in a Mark II computer.', uk: 'Перший комп\'ютерний баг був справжнім метеликом, знайденим у комп\'ютері Mark II.', pl: 'Pierwszy bug komputerowy był prawdziwą ćmą znalezioną w komputerze Mark II.' },
  { entityId: 'template.funfact_4', en: 'JavaScript was created in just 10 days.', uk: 'JavaScript було створено всього за 10 днів.', pl: 'JavaScript został stworzony w zaledwie 10 dni.' },
  { entityId: 'template.funfact_5', en: 'The term "debugging" comes from removing an actual bug from hardware.', uk: 'Термін "дебагінг" походить від видалення справжнього жука з апаратури.', pl: 'Termin "debugging" pochodzi od usuwania prawdziwego owada ze sprzętu.' },

  // ══════════════════════════════════════════════════════════════════
  // NEW: Achievement translations (31 achievements × title + desc)
  // ══════════════════════════════════════════════════════════════════

  // Quest milestones
  { entityId: 'achievement.first-quest.title', en: 'First Steps', uk: 'Перші кроки', pl: 'Pierwsze kroki' },
  { entityId: 'achievement.first-quest.desc', en: 'Complete your first quest', uk: 'Виконай свій перший квест', pl: 'Wykonaj swój pierwszy quest' },
  { entityId: 'achievement.five-quests.title', en: 'Adventurer', uk: 'Шукач пригод', pl: 'Poszukiwacz przygód' },
  { entityId: 'achievement.five-quests.desc', en: 'Complete 5 quests', uk: 'Виконай 5 квестів', pl: 'Wykonaj 5 questów' },
  { entityId: 'achievement.ten-quests.title', en: 'Apprentice', uk: 'Учень', pl: 'Uczeń' },
  { entityId: 'achievement.ten-quests.desc', en: 'Complete 10 quests', uk: 'Виконай 10 квестів', pl: 'Wykonaj 10 questów' },
  { entityId: 'achievement.twenty-five-quests.title', en: 'Journeyman', uk: 'Підмайстер', pl: 'Czeladnik' },
  { entityId: 'achievement.twenty-five-quests.desc', en: 'Complete 25 quests', uk: 'Виконай 25 квестів', pl: 'Wykonaj 25 questów' },
  { entityId: 'achievement.fifty-quests.title', en: 'Master Adventurer', uk: 'Майстер-шукач', pl: 'Mistrz poszukiwacz' },
  { entityId: 'achievement.fifty-quests.desc', en: 'Complete 50 quests', uk: 'Виконай 50 квестів', pl: 'Wykonaj 50 questów' },
  { entityId: 'achievement.hundred-quests.title', en: 'Centurion', uk: 'Центуріон', pl: 'Centurion' },
  { entityId: 'achievement.hundred-quests.desc', en: 'Complete 100 quests', uk: 'Виконай 100 квестів', pl: 'Wykonaj 100 questów' },
  // Streak milestones
  { entityId: 'achievement.streak-3.title', en: 'Getting Warmed Up', uk: 'Розігрів', pl: 'Rozgrzewka' },
  { entityId: 'achievement.streak-3.desc', en: '3-day streak', uk: 'Серія 3 дні', pl: 'Seria 3 dni' },
  { entityId: 'achievement.streak-7.title', en: 'On Fire', uk: 'У вогні', pl: 'W ogniu' },
  { entityId: 'achievement.streak-7.desc', en: '7-day streak', uk: 'Серія 7 днів', pl: 'Seria 7 dni' },
  { entityId: 'achievement.streak-14.title', en: 'Dedicated', uk: 'Відданий', pl: 'Oddany' },
  { entityId: 'achievement.streak-14.desc', en: '14-day streak', uk: 'Серія 14 днів', pl: 'Seria 14 dni' },
  { entityId: 'achievement.streak-30.title', en: 'Unstoppable', uk: 'Незупинний', pl: 'Niepohamowany' },
  { entityId: 'achievement.streak-30.desc', en: '30-day streak', uk: 'Серія 30 днів', pl: 'Seria 30 dni' },
  { entityId: 'achievement.streak-60.title', en: 'Legend of Discipline', uk: 'Легенда дисципліни', pl: 'Legenda dyscypliny' },
  { entityId: 'achievement.streak-60.desc', en: '60-day streak', uk: 'Серія 60 днів', pl: 'Seria 60 dni' },
  // Level milestones
  { entityId: 'achievement.level-3.title', en: 'Rising Hero', uk: 'Зростаючий герой', pl: 'Wschodzący bohater' },
  { entityId: 'achievement.level-3.desc', en: 'Reach level 3', uk: 'Досягни 3 рівня', pl: 'Osiągnij poziom 3' },
  { entityId: 'achievement.level-5.title', en: 'Rank Up', uk: 'Підвищення', pl: 'Awans' },
  { entityId: 'achievement.level-5.desc', en: 'Reach level 5', uk: 'Досягни 5 рівня', pl: 'Osiągnij poziom 5' },
  { entityId: 'achievement.level-10.title', en: 'Veteran', uk: 'Ветеран', pl: 'Weteran' },
  { entityId: 'achievement.level-10.desc', en: 'Reach level 10', uk: 'Досягни 10 рівня', pl: 'Osiągnij poziom 10' },
  { entityId: 'achievement.level-25.title', en: 'Elite Guardian', uk: 'Елітний охоронець', pl: 'Elitarny strażnik' },
  { entityId: 'achievement.level-25.desc', en: 'Reach level 25', uk: 'Досягни 25 рівня', pl: 'Osiągnij poziom 25' },
  // XP milestones
  { entityId: 'achievement.xp-500.title', en: 'XP Collector', uk: 'Збирач XP', pl: 'Kolekcjoner XP' },
  { entityId: 'achievement.xp-500.desc', en: 'Earn 500 total XP', uk: 'Набери 500 XP', pl: 'Zdobądź łącznie 500 XP' },
  { entityId: 'achievement.xp-1000.title', en: 'XP Hoarder', uk: 'Накопичувач XP', pl: 'Gromadzący XP' },
  { entityId: 'achievement.xp-1000.desc', en: 'Earn 1,000 total XP', uk: 'Набери 1 000 XP', pl: 'Zdobądź łącznie 1 000 XP' },
  { entityId: 'achievement.xp-5000.title', en: 'XP Legend', uk: 'Легенда XP', pl: 'Legenda XP' },
  { entityId: 'achievement.xp-5000.desc', en: 'Earn 5,000 total XP', uk: 'Набери 5 000 XP', pl: 'Zdobądź łącznie 5 000 XP' },
  // Mastery
  { entityId: 'achievement.first-mastery.title', en: 'Knowledge Keeper', uk: 'Хранитель знань', pl: 'Strażnik wiedzy' },
  { entityId: 'achievement.first-mastery.desc', en: 'Master your first skill', uk: 'Опануй першу навичку', pl: 'Opanuj pierwszą umiejętność' },
  { entityId: 'achievement.mastery-3.title', en: 'Scholar', uk: 'Вчений', pl: 'Uczony' },
  { entityId: 'achievement.mastery-3.desc', en: 'Master 3 skills', uk: 'Опануй 3 навички', pl: 'Opanuj 3 umiejętności' },
  { entityId: 'achievement.review-10.title', en: 'Memory Training', uk: 'Тренування пам\'яті', pl: 'Trening pamięci' },
  { entityId: 'achievement.review-10.desc', en: 'Complete 10 reviews', uk: 'Пройди 10 повторень', pl: 'Wykonaj 10 powtórek' },
  { entityId: 'achievement.review-50.title', en: 'Recall Master', uk: 'Майстер згадування', pl: 'Mistrz przypominania' },
  { entityId: 'achievement.review-50.desc', en: 'Complete 50 reviews', uk: 'Пройди 50 повторень', pl: 'Wykonaj 50 powtórek' },
  // Daily
  { entityId: 'achievement.daily-all-5.title', en: 'Perfect Day', uk: 'Ідеальний день', pl: 'Perfekcyjny dzień' },
  { entityId: 'achievement.daily-all-5.desc', en: 'Complete all 5 daily quests in one day', uk: 'Виконай усі 5 щоденних квестів за один день', pl: 'Wykonaj wszystkie 5 codziennych questów jednego dnia' },
  // Economy
  { entityId: 'achievement.coins-100.title', en: 'Coin Purse', uk: 'Гаманець', pl: 'Sakiewka' },
  { entityId: 'achievement.coins-100.desc', en: 'Accumulate 100 coins', uk: 'Накопич 100 монет', pl: 'Zgromadź 100 monet' },
  { entityId: 'achievement.coins-500.title', en: 'Treasure Hunter', uk: 'Мисливець за скарбами', pl: 'Łowca skarbów' },
  { entityId: 'achievement.coins-500.desc', en: 'Accumulate 500 coins', uk: 'Накопич 500 монет', pl: 'Zgromadź 500 monet' },
  // Roadmap
  { entityId: 'achievement.roadmap_complete.title', en: 'Quest Line Conqueror', uk: 'Підкорювач квест-ліній', pl: 'Zdobywca linii questów' },
  { entityId: 'achievement.roadmap_complete.desc', en: 'Complete your first quest line', uk: 'Заверши свою першу квест-лінію', pl: 'Ukończ swoją pierwszą linię questów' },
  { entityId: 'achievement.milestone_first.title', en: 'First Milestone', uk: 'Перша віха', pl: 'Pierwszy kamień milowy' },
  { entityId: 'achievement.milestone_first.desc', en: 'Complete your first milestone', uk: 'Досягни першої віхи', pl: 'Osiągnij pierwszy kamień milowy' },
  { entityId: 'achievement.milestone_five.title', en: 'Wayfinder', uk: 'Шукач шляхів', pl: 'Odkrywca dróg' },
  { entityId: 'achievement.milestone_five.desc', en: 'Complete 5 milestones', uk: 'Досягни 5 віх', pl: 'Osiągnij 5 kamieni milowych' },

  // ══════════════════════════════════════════════════════════════════
  // NEW: Equipment slot translations
  // ══════════════════════════════════════════════════════════════════
  { entityId: 'equipment.weapon', en: 'Weapon', uk: 'Зброя', pl: 'Broń' },
  { entityId: 'equipment.shield', en: 'Shield', uk: 'Щит', pl: 'Tarcza' },
  { entityId: 'equipment.armor', en: 'Armor', uk: 'Броня', pl: 'Zbroja' },
  { entityId: 'equipment.helmet', en: 'Helmet', uk: 'Шолом', pl: 'Hełm' },
  { entityId: 'equipment.boots', en: 'Boots', uk: 'Чоботи', pl: 'Buty' },
  { entityId: 'equipment.ring', en: 'Ring', uk: 'Каблучка', pl: 'Pierścień' },
  { entityId: 'equipment.companion', en: 'Companion', uk: 'Компаньйон', pl: 'Towarzysz' },
  { entityId: 'equipment.skill.weapon', en: 'Hard Skills', uk: 'Тверді навички', pl: 'Twarde umiejętności' },
  { entityId: 'equipment.skill.shield', en: 'Communication', uk: 'Комунікація', pl: 'Komunikacja' },
  { entityId: 'equipment.skill.armor', en: 'Personal Brand', uk: 'Особистий бренд', pl: 'Marka osobista' },
  { entityId: 'equipment.skill.helmet', en: 'Strategy', uk: 'Стратегія', pl: 'Strategia' },
  { entityId: 'equipment.skill.boots', en: 'Adaptability', uk: 'Адаптивність', pl: 'Adaptacyjność' },
  { entityId: 'equipment.skill.ring', en: 'Expertise', uk: 'Експертиза', pl: 'Ekspertyza' },
  { entityId: 'equipment.skill.companion', en: 'Hobbies', uk: 'Хобі', pl: 'Hobby' },
  { entityId: 'herocard.no_equipment', en: 'No equipment yet', uk: 'Спорядження ще немає', pl: 'Brak wyposażenia' },

  // ══════════════════════════════════════════════════════════════════
  // Dashboard i18n — full component coverage
  // ══════════════════════════════════════════════════════════════════

  // ── nav.* — dashboard navigation labels ──
  { entityId: 'nav.command_center', en: 'Command Center', uk: 'Командний центр', pl: 'Centrum dowodzenia' },
  { entityId: 'nav.quest_map', en: 'Quest Map', uk: 'Карта квестів', pl: 'Mapa questów' },
  { entityId: 'nav.forge_label', en: 'The Forge', uk: 'Кузня', pl: 'Kuźnia' },
  { entityId: 'nav.merchant', en: 'Merchant', uk: 'Торговець', pl: 'Kupiec' },
  { entityId: 'nav.guild_arena', en: 'Guild Arena', uk: 'Арена гільдії', pl: 'Arena gildii' },
  { entityId: 'nav.hero_card', en: 'Hero Card', uk: 'Картка героя', pl: 'Karta bohatera' },
  { entityId: 'nav.hero_settings', en: 'Hero Settings', uk: 'Налаштування героя', pl: 'Ustawienia bohatera' },
  { entityId: 'nav.quiet_mode', en: 'Quiet Mode', uk: 'Тихий режим', pl: 'Tryb cichy' },
  { entityId: 'nav.restart_journey', en: 'Restart Journey', uk: 'Почати спочатку', pl: 'Zacznij od nowa' },
  { entityId: 'nav.leave_guild', en: 'Leave Guild', uk: 'Покинути гільдію', pl: 'Opuść gildię' },
  { entityId: 'nav.restart_confirm', en: 'Restart your journey? All progress will be reset.', uk: 'Почати подорож спочатку? Весь прогрес буде скинуто.', pl: 'Rozpocząć podróż od nowa? Cały postęp zostanie zresetowany.' },

  // ── dashboard.* — sidebar stat labels ──
  { entityId: 'dashboard.streak_label', en: 'streak', uk: 'серія', pl: 'seria' },
  { entityId: 'dashboard.energy_label', en: 'energy', uk: 'енергія', pl: 'energia' },
  { entityId: 'dashboard.coins_label', en: 'coins', uk: 'монети', pl: 'monety' },

  // ── character.* ──
  { entityId: 'character.hero_fallback', en: 'Hero', uk: 'Герой', pl: 'Bohater' },

  // ── stats.* — StatsRow component ──
  { entityId: 'stats.days', en: 'days', uk: 'днів', pl: 'dni' },
  { entityId: 'stats.aria_level', en: 'Level {n}', uk: 'Рівень {n}', pl: 'Poziom {n}' },
  { entityId: 'stats.aria_streak', en: '{n} day streak', uk: 'Серія {n} днів', pl: 'Seria {n} dni' },
  { entityId: 'stats.recharge_hint', en: ', click to recharge', uk: ', натисніть для перезарядки', pl: ', kliknij, aby naładować' },

  // ── welcome.* — ContinueQuestHero component ──
  // NOTE: welcome.subtitle_new/missed/refresh/longabsent moved to Phase 2 block above
  { entityId: 'welcome.open_details', en: 'Open quest details', uk: 'Відкрити деталі квесту', pl: 'Otwórz szczegóły questu' },
  { entityId: 'welcome.refresh_goals', en: 'Refresh goals?', uk: 'Оновити цілі?', pl: 'Odświeżyć cele?' },
  { entityId: 'welcome.choose_different', en: 'Choose a different quest', uk: 'Обрати інший квест', pl: 'Wybierz inny quest' },
  { entityId: 'welcome.completed', en: 'Completed', uk: 'Завершено', pl: 'Ukończono' },

  // ── quest.* — quest-related UI strings ──
  { entityId: 'quest.complete', en: 'Quest Complete!', uk: 'Квест завершено!', pl: 'Quest ukończony!' },
  { entityId: 'quest.no_quests', en: 'No quests available yet', uk: 'Квестів поки немає', pl: 'Brak dostępnych questów' },
  { entityId: 'quest.count', en: '{done}/{total} quests', uk: '{done}/{total} квестів', pl: '{done}/{total} questów' },
  { entityId: 'quest.xp_earned', en: '+{n} XP', uk: '+{n} ДС', pl: '+{n} PD' },
  { entityId: 'quest.mins', en: '{n} min', uk: '{n} хв', pl: '{n} min' },
  { entityId: 'quest.begin_journey', en: 'Complete onboarding to begin your journey', uk: 'Завершіть знайомство, щоб почати подорож', pl: 'Ukończ wdrożenie, aby rozpocząć podróż' },
  { entityId: 'quest.line_complete', en: 'Quest Line Complete!', uk: 'Лінію квестів завершено!', pl: 'Linia questów ukończona!' },
  { entityId: 'quest.forging', en: 'Forging your quest line...', uk: 'Створюю вашу лінію квестів...', pl: 'Tworzę twoją linię questów...' },
  { entityId: 'quest.all_conquered', en: 'All milestones conquered!', uk: 'Всі віхи підкорено!', pl: 'Wszystkie kamienie milowe zdobyte!' },
  { entityId: 'quest.current_milestone', en: 'Current milestone: {title}', uk: 'Поточна віха: {title}', pl: 'Obecny kamień milowy: {title}' },
  { entityId: 'quest.ready', en: 'Ready to begin', uk: 'Готовий до старту', pl: 'Gotowy do startu' },
  { entityId: 'quest.bounty', en: 'Quest Bounty', uk: 'Нагорода за квест', pl: 'Nagroda za quest' },
  { entityId: 'quest.lucky_bonus', en: 'Lucky Bonus!', uk: 'Бонус удачі!', pl: 'Szczęśliwy bonus!' },
  { entityId: 'quest.total', en: 'Total', uk: 'Всього', pl: 'Łącznie' },
  { entityId: 'quest.milestone_bonus', en: 'Milestone bonus!', uk: 'Бонус за віху!', pl: 'Bonus za kamień milowy!' },
  { entityId: 'quest.day_streak', en: '{n}-day streak', uk: 'Серія {n} днів', pl: 'Seria {n} dni' },
  { entityId: 'quest.today_progress', en: "Today's Progress", uk: 'Прогрес за сьогодні', pl: 'Dzisiejszy postęp' },
  { entityId: 'quest.next', en: 'Next Quest', uk: 'Наступний квест', pl: 'Następny quest' },
  { entityId: 'quest.return_home', en: 'Return to Command Center', uk: 'Повернутися до командного центру', pl: 'Wróć do centrum dowodzenia' },
  { entityId: 'quest.all_complete', en: 'All Quests Complete!', uk: 'Всі квести завершено!', pl: 'Wszystkie questy ukończone!' },
  { entityId: 'quest.objectives', en: 'Quest Objectives', uk: 'Цілі квесту', pl: 'Cele questu' },
  { entityId: 'quest.ai_tip', en: 'AI Tip', uk: 'Підказка AI', pl: 'Wskazówka AI' },
  { entityId: 'quest.recharge_tomorrow', en: 'Recharge tomorrow', uk: 'Перезарядка завтра', pl: 'Doładowanie jutro' },
  { entityId: 'quest.fun_fact', en: 'Fun Fact', uk: 'Цікавий факт', pl: 'Ciekawostka' },
  { entityId: 'quest.knowledge_check', en: 'Knowledge Check', uk: 'Перевірка знань', pl: 'Sprawdzian wiedzy' },
  { entityId: 'quest.correct', en: 'Correct! +5 bonus XP', uk: 'Правильно! +5 бонусних ДС', pl: 'Poprawnie! +5 bonusowych PD' },
  { entityId: 'quest.incorrect', en: 'Not quite — review the material', uk: 'Не зовсім — переглянь матеріал', pl: 'Nie do końca — przejrzyj materiał' },
  { entityId: 'quest.complete_btn', en: 'Complete Quest', uk: 'Завершити квест', pl: 'Ukończ quest' },
  { entityId: 'quest.restart_btn', en: 'Restart Quest', uk: 'Перезапустити квест', pl: 'Powtórz quest' },
  { entityId: 'quest.not_now', en: 'Not now', uk: 'Не зараз', pl: 'Nie teraz' },
  { entityId: 'quest.tap_continue', en: 'Tap to continue', uk: 'Натисни, щоб продовжити', pl: 'Kliknij, aby kontynuować' },

  // ── quest journey — multi-screen modal ──
  { entityId: 'quest.briefing_title', en: 'Quest Briefing', uk: 'Брифінг квесту', pl: 'Briefing questa' },
  { entityId: 'quest.begin_quest', en: 'Begin Quest', uk: 'Почати квест', pl: 'Rozpocznij quest' },
  { entityId: 'quest.preparing', en: 'Preparing quest...', uk: 'Готую квест...', pl: 'Przygotowuję quest...' },
  { entityId: 'quest.content_title', en: 'Study Material', uk: 'Навчальний матеріал', pl: 'Materiał do nauki' },
  { entityId: 'quest.content.progress', en: '{read} of {total} scrolls', uk: '{read} з {total} сувоїв', pl: '{read} z {total} zwojów' },
  { entityId: 'quest.content.continue_trial', en: 'Continue to Trial', uk: 'Перейти до випробування', pl: 'Przejdź do próby' },
  { entityId: 'quest.content.read_more', en: 'Read at least 80% of the material to continue', uk: 'Прочитай щонайменше 80% матеріалу', pl: 'Przeczytaj co najmniej 80% materiału' },
  { entityId: 'quest.content.midpoint', en: 'Great progress, hero! You\'re halfway through. Keep going!', uk: 'Чудовий прогрес, герою! Ти вже на половині. Продовжуй!', pl: 'Świetny postęp, bohaterze! Jesteś w połowie. Kontynuuj!' },
  { entityId: 'quest.content.no_content', en: 'Content is being prepared...', uk: 'Контент готується...', pl: 'Treść jest przygotowywana...' },
  { entityId: 'quest.trial_title', en: 'Trial by Fire', uk: 'Випробування вогнем', pl: 'Próba ognia' },
  { entityId: 'quest.trial.exercise_of', en: 'Exercise {current} of {total}', uk: 'Вправа {current} з {total}', pl: 'Ćwiczenie {current} z {total}' },
  { entityId: 'quest.trial.submit', en: 'Submit Answer', uk: 'Відповісти', pl: 'Zatwierdź odpowiedź' },
  { entityId: 'quest.trial.no_exercises', en: 'No exercises available for this quest.', uk: 'Вправи для цього квесту відсутні.', pl: 'Brak ćwiczeń dla tego questa.' },
  { entityId: 'quest.trial.skip', en: 'Continue', uk: 'Продовжити', pl: 'Kontynuuj' },
  { entityId: 'quest.trial.difficulty', en: 'Difficulty', uk: 'Складність', pl: 'Trudność' },
  { entityId: 'quest.trial.crystals', en: 'crystals', uk: 'кристали', pl: 'kryształy' },
  { entityId: 'quest.score_display', en: '{score}/{total} correct', uk: '{score}/{total} правильних', pl: '{score}/{total} poprawnych' },
  { entityId: 'quest.flawless', en: 'Flawless Victory!', uk: 'Бездоганна перемога!', pl: 'Bezbłędne zwycięstwo!' },
  { entityId: 'quest.retry_trial', en: 'Retry Trial', uk: 'Спробувати знову', pl: 'Powtórz próbę' },
  { entityId: 'quest.review_material', en: 'Review Material', uk: 'Переглянути матеріал', pl: 'Przejrzyj materiał' },
  { entityId: 'quest.return_cc', en: 'Return to Command Center', uk: 'Повернутися до Центру Командування', pl: 'Wróć do Centrum Dowodzenia' },
  { entityId: 'quest.next_quest', en: 'Next Quest', uk: 'Наступний квест', pl: 'Następny quest' },
  { entityId: 'quest.need_pass', en: 'You need 60% to pass', uk: 'Потрібно 60% для проходження', pl: 'Potrzebujesz 60% aby zdać' },

  // ── exercise.* — exercise components ──
  { entityId: 'exercise.true', en: 'True', uk: 'Правда', pl: 'Prawda' },
  { entityId: 'exercise.false', en: 'False', uk: 'Хибно', pl: 'Fałsz' },
  { entityId: 'exercise.submit', en: 'Submit', uk: 'Відповісти', pl: 'Zatwierdź' },
  { entityId: 'exercise.check', en: 'Check', uk: 'Перевірити', pl: 'Sprawdź' },
  { entityId: 'exercise.skip', en: 'Skip', uk: 'Пропустити', pl: 'Pomiń' },
  { entityId: 'exercise.continue', en: 'Continue', uk: 'Продовжити', pl: 'Kontynuuj' },
  { entityId: 'exercise.correct', en: 'Correct!', uk: 'Правильно!', pl: 'Poprawnie!' },
  { entityId: 'exercise.incorrect', en: 'Incorrect', uk: 'Неправильно', pl: 'Niepoprawnie' },
  { entityId: 'exercise.partial', en: 'Almost there!', uk: 'Майже!', pl: 'Prawie!' },
  { entityId: 'exercise.points', en: '{n} pts', uk: '{n} бал.', pl: '{n} pkt' },

  // ── hint.* — hint drawer ──
  { entityId: 'hint.ask_sage', en: 'Ask the Sage', uk: 'Запитати Мудреця', pl: 'Zapytaj Mędrca' },
  { entityId: 'hint.consult_oracle', en: 'Consult the Oracle', uk: 'Консультація Оракула', pl: 'Zapytaj Wyrocznię' },
  { entityId: 'hint.reveal_scroll', en: 'Reveal Answer Scroll', uk: 'Відкрити Сувій Відповіді', pl: 'Odsłoń Zwój Odpowiedzi' },
  { entityId: 'hint.costs_crystal', en: 'Costs 1 crystal', uk: 'Коштує 1 кристал', pl: 'Kosztuje 1 kryształ' },
  { entityId: 'hint.needs_attempt', en: 'Attempt first', uk: 'Спочатку спробуй', pl: 'Najpierw spróbuj' },

  // ── weekly.* — WeeklyChallenges component ──
  { entityId: 'weekly.title', en: 'Weekly Quests', uk: 'Тижневі квести', pl: 'Tygodniowe questy' },
  { entityId: 'weekly.champion', en: 'Weekly Champion', uk: 'Чемпіон тижня', pl: 'Mistrz tygodnia' },
  { entityId: 'weekly.champion_claimed', en: 'Weekly Champion! Bonus claimed', uk: 'Чемпіон тижня! Бонус отримано', pl: 'Mistrz tygodnia! Bonus odebrany' },
  { entityId: 'weekly.champion_unclaimed', en: 'Weekly Champion!', uk: 'Чемпіон тижня!', pl: 'Mistrz tygodnia!' },
  { entityId: 'weekly.bonus_hint', en: 'Complete all 3 → +150 XP bonus', uk: 'Заверши всі 3 → +150 ДС бонус', pl: 'Ukończ wszystkie 3 → +150 PD bonusu' },
  { entityId: 'weekly.claimed', en: 'Claimed', uk: 'Отримано', pl: 'Odebrano' },
  { entityId: 'weekly.champion_compact_claimed', en: 'Weekly Champion! +150 XP claimed', uk: 'Чемпіон тижня! +150 ДС отримано', pl: 'Mistrz tygodnia! +150 PD odebrano' },
  { entityId: 'weekly.champion_compact_unclaimed', en: 'Weekly Champion! +150 XP + 🪙 50', uk: 'Чемпіон тижня! +150 ДС + 🪙 50', pl: 'Mistrz tygodnia! +150 PD + 🪙 50' },
  { entityId: 'weekly.challenge_complete_quests', en: 'Complete {n} quests', uk: 'Завершити {n} квестів', pl: 'Ukończ {n} questów' },
  { entityId: 'weekly.challenge_earn_xp', en: 'Earn {n} XP', uk: 'Заробити {n} ДС', pl: 'Zdobądź {n} PD' },
  { entityId: 'weekly.challenge_review_skills', en: 'Review {n} skills', uk: 'Переглянути {n} навичок', pl: 'Przejrzyj {n} umiejętności' },
  { entityId: 'weekly.challenge_keep_streak', en: 'Keep your streak all week', uk: 'Зберігай серію весь тиждень', pl: 'Utrzymaj serię przez cały tydzień' },
  { entityId: 'weekly.challenge_score_accuracy', en: 'Score {n}%+ accuracy', uk: 'Набрати {n}%+ точності', pl: 'Uzyskaj {n}%+ dokładności' },
  { entityId: 'weekly.challenge_quest_domains', en: 'Quest in {n} domains', uk: 'Квести в {n} сферах', pl: 'Questy w {n} dziedzinach' },
  { entityId: 'weekly.challenge_domain_focus', en: 'Complete {n} {domain} quests', uk: 'Завершити {n} квестів {domain}', pl: 'Ukończ {n} questów {domain}' },
  { entityId: 'weekly.challenge_train_minutes', en: 'Train for {n} minutes', uk: 'Тренуватися {n} хвилин', pl: 'Trenuj przez {n} minut' },
  { entityId: 'weekly.challenge_perfect_days', en: 'Have {n} Perfect Day(s)', uk: 'Мати {n} ідеальних днів', pl: 'Miej {n} idealnych dni' },
  { entityId: 'weekly.challenge_level_skills', en: 'Level up {n} skill(s)', uk: 'Підвищити {n} навичок', pl: 'Podnieś poziom {n} umiejętności' },
  { entityId: 'weekly.challenge_default', en: 'Complete {n} tasks', uk: 'Завершити {n} завдань', pl: 'Ukończ {n} zadań' },
  { entityId: 'weekly.hint_quests', en: 'Complete any quests — daily or roadmap', uk: 'Завершуй будь-які квести — щоденні чи з роадмапу', pl: 'Ukończ dowolne questy — codzienne lub z mapy' },
  { entityId: 'weekly.hint_xp', en: 'Every quest, review, and challenge earns XP', uk: 'Кожен квест, огляд і виклик приносить ДС', pl: 'Każdy quest, przegląd i wyzwanie daje PD' },
  { entityId: 'weekly.hint_review', en: 'Practice your skills in the Mastery Hub', uk: 'Практикуй навички в Центрі майстерності', pl: 'Ćwicz umiejętności w Centrum mistrzostwa' },
  { entityId: 'weekly.hint_streak', en: 'Visit each day to keep your streak alive', uk: 'Заходь щодня, щоб серія не перервалась', pl: 'Wchodź codziennie, aby utrzymać serię' },
  { entityId: 'weekly.hint_accuracy', en: 'Aim for high scores on quest answers', uk: 'Прагни високих балів у відповідях', pl: 'Celuj w wysokie wyniki w odpowiedziach' },
  { entityId: 'weekly.hint_domains', en: 'Try quests from different skill domains', uk: 'Спробуй квести з різних сфер', pl: 'Spróbuj questów z różnych dziedzin' },
  { entityId: 'weekly.hint_domain_focus', en: 'Focus on your target domain this week', uk: 'Зосередься на цільовій сфері цього тижня', pl: 'Skup się na docelowej dziedzinie w tym tygodniu' },
  { entityId: 'weekly.hint_time', en: 'Every minute of training counts', uk: 'Кожна хвилина тренування на рахунку', pl: 'Każda minuta treningu się liczy' },
  { entityId: 'weekly.hint_perfect', en: 'Complete all 5 daily quests in one day', uk: 'Заверши всі 5 щоденних квестів за один день', pl: 'Ukończ wszystkie 5 codziennych questów w jeden dzień' },
  { entityId: 'weekly.hint_mastery', en: 'Review skills to push them to the next level', uk: 'Переглядай навички для підвищення рівня', pl: 'Przeglądaj umiejętności, aby podnieść ich poziom' },

  // ── attributes.* — AttributeWidget component ──
  { entityId: 'attributes.title', en: 'Hero Attributes', uk: 'Атрибути героя', pl: 'Atrybuty bohatera' },
  { entityId: 'attributes.str', en: 'Strength', uk: 'Сила', pl: 'Siła' },
  { entityId: 'attributes.int', en: 'Intelligence', uk: 'Інтелект', pl: 'Inteligencja' },
  { entityId: 'attributes.cha', en: 'Charisma', uk: 'Харизма', pl: 'Charyzma' },
  { entityId: 'attributes.con', en: 'Constitution', uk: 'Витривалість', pl: 'Kondycja' },
  { entityId: 'attributes.dex', en: 'Dexterity', uk: 'Спритність', pl: 'Zręczność' },
  { entityId: 'attributes.wis', en: 'Wisdom', uk: 'Мудрість', pl: 'Mądrość' },
  { entityId: 'attributes.str_desc', en: 'Your technical might. Grows from Hard Skills milestones and equipment.', uk: 'Твоя технічна міць. Зростає від віх Технічних навичок та спорядження.', pl: 'Twoja techniczna moc. Rośnie dzięki kamieniom milowym Twardych umiejętności i ekwipunkowi.' },
  { entityId: 'attributes.int_desc', en: 'Strategic thinking. Grows from Strategy milestones and equipment.', uk: 'Стратегічне мислення. Зростає від віх Стратегії та спорядження.', pl: 'Myślenie strategiczne. Rośnie dzięki kamieniom milowym Strategii i ekwipunkowi.' },
  { entityId: 'attributes.cha_desc', en: 'Communication and leadership. Grows from Communication milestones.', uk: 'Комунікація та лідерство. Зростає від віх Комунікації.', pl: 'Komunikacja i przywództwo. Rośnie dzięki kamieniom milowym Komunikacji.' },
  { entityId: 'attributes.con_desc', en: 'Consistency and endurance. Grows from sustained practice.', uk: 'Стабільність та витримка. Зростає від систематичної практики.', pl: 'Konsekwencja i wytrzymałość. Rośnie dzięki systematycznej praktyce.' },
  { entityId: 'attributes.dex_desc', en: 'Adaptability and breadth. Grows from cross-domain exploration.', uk: 'Адаптивність та широта. Зростає від міждисциплінарних досліджень.', pl: 'Adaptacyjność i wszechstronność. Rośnie dzięki interdyscyplinarnej eksploracji.' },
  { entityId: 'attributes.wis_desc', en: 'Curiosity and exploration. Grows from Hobbies milestones.', uk: 'Допитливість та дослідження. Зростає від віх Хобі.', pl: 'Ciekawość i eksploracja. Rośnie dzięki kamieniom milowym Hobby.' },
  { entityId: 'attributes.base', en: 'Base: {n}', uk: 'Базове: {n}', pl: 'Bazowe: {n}' },
  { entityId: 'attributes.equip_bonus', en: 'Equip: +{n}', uk: 'Спорядження: +{n}', pl: 'Ekwipunek: +{n}' },
  { entityId: 'attributes.equip_none', en: 'Equip: —', uk: 'Спорядження: —', pl: 'Ekwipunek: —' },

  // ── episode.* — DailyEpisodeCard component ──
  { entityId: 'episode.meta', en: 'Episode {ep} · Season {s}', uk: 'Епізод {ep} · Сезон {s}', pl: 'Odcinek {ep} · Sezon {s}' },
  { entityId: 'episode.aria_read', en: 'Mark as read and earn {n} XP', uk: 'Позначити як прочитане та отримати {n} ДС', pl: 'Oznacz jako przeczytane i zdobądź {n} PD' },

  // ── inventory.* — InventoryDrawer component ──
  { entityId: 'inventory.title', en: 'Inventory', uk: 'Інвентар', pl: 'Ekwipunek' },
  { entityId: 'inventory.count', en: '({n} items)', uk: '({n} предметів)', pl: '({n} przedmiotów)' },
  { entityId: 'inventory.close', en: 'Close inventory', uk: 'Закрити інвентар', pl: 'Zamknij ekwipunek' },
  { entityId: 'inventory.filter_all', en: 'All', uk: 'Усі', pl: 'Wszystkie' },
  { entityId: 'inventory.sort_rarity', en: 'Sort by Rarity', uk: 'За рідкістю', pl: 'Wg rzadkości' },
  { entityId: 'inventory.sort_name', en: 'Sort by Name', uk: 'За назвою', pl: 'Wg nazwy' },
  { entityId: 'inventory.empty', en: 'No artifacts yet', uk: 'Артефактів поки немає', pl: 'Brak artefaktów' },
  { entityId: 'inventory.empty_hint', en: 'Complete quests to earn equipment drops!', uk: 'Завершуй квести, щоб отримати спорядження!', pl: 'Ukończ questy, aby zdobyć przedmioty!' },
  { entityId: 'inventory.equip', en: 'Equip', uk: 'Одягнути', pl: 'Załóż' },
  { entityId: 'inventory.equip_error', en: 'Failed to equip: {msg}', uk: 'Не вдалося одягнути: {msg}', pl: 'Nie udało się założyć: {msg}' },

  // ── slot.* — equipment slot names ──
  { entityId: 'slot.weapon', en: 'Weapon', uk: 'Зброя', pl: 'Broń' },
  { entityId: 'slot.shield', en: 'Shield', uk: 'Щит', pl: 'Tarcza' },
  { entityId: 'slot.armor', en: 'Armor', uk: 'Броня', pl: 'Zbroja' },
  { entityId: 'slot.helmet', en: 'Helmet', uk: 'Шолом', pl: 'Hełm' },
  { entityId: 'slot.boots', en: 'Boots', uk: 'Чоботи', pl: 'Buty' },
  { entityId: 'slot.ring', en: 'Ring', uk: 'Каблучка', pl: 'Pierścień' },
  { entityId: 'slot.companion', en: 'Companion', uk: 'Компаньйон', pl: 'Towarzysz' },

  // ── rarity.* — rarity labels ──
  { entityId: 'rarity.common', en: 'Common', uk: 'Звичайний', pl: 'Zwykły' },
  { entityId: 'rarity.uncommon', en: 'Uncommon', uk: 'Незвичайний', pl: 'Niezwykły' },
  { entityId: 'rarity.rare', en: 'Rare', uk: 'Рідкісний', pl: 'Rzadki' },
  { entityId: 'rarity.epic', en: 'Epic', uk: 'Епічний', pl: 'Epicki' },
  { entityId: 'rarity.legendary', en: 'Legendary', uk: 'Легендарний', pl: 'Legendarny' },

  // ── loot.* — LootRevealV2 component ──
  { entityId: 'loot.forging', en: 'Something is forging...', uk: 'Щось кується...', pl: 'Coś się wykuwa...' },
  { entityId: 'loot.tap_skip', en: 'Tap to skip', uk: 'Натисни, щоб пропустити', pl: 'Kliknij, aby pominąć' },
  { entityId: 'loot.claim', en: 'Claim Artifact', uk: 'Забрати артефакт', pl: 'Odbierz artefakt' },

  // ── mastery.* — MasteryRing component ──
  { entityId: 'mastery.new', en: 'New', uk: 'Новий', pl: 'Nowy' },
  { entityId: 'mastery.attempted', en: 'Attempted', uk: 'Спробований', pl: 'Próba' },
  { entityId: 'mastery.familiar', en: 'Familiar', uk: 'Знайомий', pl: 'Zaznajomiony' },
  { entityId: 'mastery.proficient', en: 'Proficient', uk: 'Вправний', pl: 'Biegły' },
  { entityId: 'mastery.advanced', en: 'Advanced', uk: 'Просунутий', pl: 'Zaawansowany' },
  { entityId: 'mastery.mastered', en: 'Mastered', uk: 'Опановано', pl: 'Opanowano' },

  // ── social.* — SocialCards component ──
  { entityId: 'social.party_quest', en: 'Party Quest', uk: 'Груповий квест', pl: 'Quest grupowy' },
  { entityId: 'social.weekly_league', en: 'Weekly League', uk: 'Тижнева ліга', pl: 'Liga tygodniowa' },

  // ── sidebar.* — RightSidebar component ──
  { entityId: 'sidebar.skill_mastery', en: 'Skill Mastery', uk: 'Майстерність навичок', pl: 'Mistrzostwo umiejętności' },
  { entityId: 'sidebar.equipment', en: 'Equipment', uk: 'Спорядження', pl: 'Wyposażenie' },
  { entityId: 'sidebar.community', en: 'Community', uk: 'Спільнота', pl: 'Społeczność' },
  { entityId: 'sidebar.empty_title', en: 'Your quest board awaits', uk: 'Твоя дошка квестів чекає', pl: 'Twoja tablica questów czeka' },
  { entityId: 'sidebar.manage_inventory', en: 'Manage inventory →', uk: 'Керувати інвентарем →', pl: 'Zarządzaj ekwipunkiem →' },

  // ── achievement.* — AchievementToast component ──
  { entityId: 'achievement.unlocked', en: 'Achievement Unlocked!', uk: 'Досягнення розблоковано!', pl: 'Osiągnięcie odblokowane!' },

  // ── error.* — QuestError component ──
  { entityId: 'error.quest_title', en: 'The path is blocked', uk: 'Шлях заблоковано', pl: 'Droga jest zablokowana' },
  { entityId: 'error.quest_subtitle', en: 'Something went wrong loading your quests.', uk: 'Щось пішло не так при завантаженні квестів.', pl: 'Coś poszło nie tak podczas ładowania questów.' },
  { entityId: 'forge.retry', en: 'Try again, hero', uk: 'Спробуй ще, герою', pl: 'Spróbuj ponownie, bohaterze' },

  // ── sidebar audit: new aria + format keys ──
  { entityId: 'nav.aria_home', en: 'Go to Command Center', uk: 'Перейти до Командного центру', pl: 'Przejdź do Centrum Dowodzenia' },
  { entityId: 'nav.aria_new_activity', en: 'New activity', uk: 'Нова активність', pl: 'Nowa aktywność' },
  { entityId: 'nav.aria_quiet_on', en: 'Quiet mode is on — click to turn off', uk: 'Тихий режим увімкнено — натисніть щоб вимкнути', pl: 'Tryb cichy włączony — kliknij aby wyłączyć' },
  { entityId: 'nav.aria_quiet_off', en: 'Quiet mode is off — click to turn on', uk: 'Тихий режим вимкнено — натисніть щоб увімкнути', pl: 'Tryb cichy wyłączony — kliknij aby włączyć' },
  { entityId: 'sidebar.aria_hero_status', en: 'Hero status', uk: 'Статус героя', pl: 'Status bohatera' },
  { entityId: 'sidebar.level_badge', en: 'Lv.{n}', uk: 'Рів.{n}', pl: 'Poz.{n}' },
  { entityId: 'sidebar.xp_progress', en: '{current} / {max} XP', uk: '{current} / {max} XP', pl: '{current} / {max} XP' },
  { entityId: 'sidebar.aria_xp_bar', en: 'Level {level}: {current} of {max} XP', uk: 'Рівень {level}: {current} з {max} XP', pl: 'Poziom {level}: {current} z {max} XP' },
  { entityId: 'sidebar.aria_energy', en: '{n} of {max} energy crystals', uk: '{n} з {max} кристалів енергії', pl: '{n} z {max} kryształów energii' },
  { entityId: 'sidebar.aria_coins', en: '{n} coins', uk: '{n} монет', pl: '{n} monet' },
  { entityId: 'sidebar.xp_short', en: '{n} XP', uk: '{n} XP', pl: '{n} XP' },
  { entityId: 'sidebar.mastery_due', en: '{n} due', uk: '{n} на черзі', pl: '{n} do powtórki' },
  { entityId: 'sidebar.mastery_more', en: '+{n} more skills →', uk: '+{n} ще навичок →', pl: '+{n} więcej umiejętności →' },
  { entityId: 'sidebar.mastery_review', en: 'Review {n} skills →', uk: 'Повторити {n} навичок →', pl: 'Powtórz {n} umiejętności →' },
  { entityId: 'sidebar.aria_slot_equipped', en: '{slot}: {item} ({rarity})', uk: '{slot}: {item} ({rarity})', pl: '{slot}: {item} ({rarity})' },
  { entityId: 'sidebar.aria_slot_empty', en: '{slot}: empty', uk: '{slot}: порожньо', pl: '{slot}: puste' },
  { entityId: 'sidebar.empty_desc', en: 'Complete quests to unlock weekly challenges, mastery rings, and equipment drops.', uk: 'Виконуйте квести щоб відкрити щотижневі виклики, кільця майстерності та випадіння спорядження.', pl: 'Wykonuj questy, aby odblokować wyzwania tygodniowe, pierścienie mistrzostwa i drop ekwipunku.' },
  { entityId: 'sidebar.aria_label', en: 'Hero sidebar — stats, quests, mastery, equipment', uk: 'Бічна панель героя — статистика, квести, майстерність, спорядження', pl: 'Panel boczny bohatera — statystyki, questy, mistrzostwo, ekwipunek' },
  { entityId: 'social.party_desc', en: '{n} heroes fighting · Join the hunt', uk: '{n} героїв битва · Приєднатись до полювання', pl: '{n} bohaterów walczy · Dołącz do łowów' },
  { entityId: 'social.league_desc', en: 'Opt-in · No pressure', uk: 'За бажанням · Без тиску', pl: 'Opcjonalnie · Bez presji' },
  { entityId: 'league.bronze', en: 'Bronze', uk: 'Бронза', pl: 'Brąz' },
  { entityId: 'league.silver', en: 'Silver', uk: 'Срібло', pl: 'Srebro' },
  { entityId: 'league.gold', en: 'Gold', uk: 'Золото', pl: 'Złoto' },
  { entityId: 'league.diamond', en: 'Diamond', uk: 'Діамант', pl: 'Diament' },
  { entityId: 'league.champion', en: 'Champion', uk: 'Чемпіон', pl: 'Mistrz' },
  { entityId: 'weekly.xp_reward', en: '+{n} XP', uk: '+{n} XP', pl: '+{n} XP' },
  { entityId: 'weekly.time_days', en: '{d}d {h}h', uk: '{d}д {h}г', pl: '{d}d {h}g' },
  { entityId: 'weekly.time_hours', en: '{h}h', uk: '{h}г', pl: '{h}g' },
  { entityId: 'weekly.aria_progress', en: '{desc}: {current} of {target}', uk: '{desc}: {current} з {target}', pl: '{desc}: {current} z {target}' },
  { entityId: 'weekly.aria_difficulty', en: 'Difficulty: {level}', uk: 'Складність: {level}', pl: 'Trudność: {level}' },
  { entityId: 'weekly.champion_reward', en: '+150 XP + 🪙 50', uk: '+150 XP + 🪙 50', pl: '+150 XP + 🪙 50' },
  { entityId: 'weekly.champion_progress', en: '{n}/3 completed → +150 XP + 🪙 50 bonus', uk: '{n}/3 виконано → +150 XP + 🪙 50 бонус', pl: '{n}/3 ukończone → +150 XP + 🪙 50 bonus' },
  { entityId: 'mastery.aria_ring', en: 'Skill: {domain}, Mastery: {label} ({level}/5)', uk: 'Навичка: {domain}, Майстерність: {label} ({level}/5)', pl: 'Umiejętność: {domain}, Mistrzostwo: {label} ({level}/5)' },
  { entityId: 'mastery.aria_overdue', en: 'Review overdue', uk: 'Повторення прострочене', pl: 'Powtórka zaległa' },
  { entityId: 'xpbar.level_badge', en: 'L{n}', uk: 'Р{n}', pl: 'P{n}' },

  // ── archetype names (UI keys for sidebar/dashboard) ──
  { entityId: 'archetype.strategist', en: 'Strategist', uk: 'Стратег', pl: 'Strateg' },
  { entityId: 'archetype.explorer', en: 'Explorer', uk: 'Дослідник', pl: 'Odkrywca' },
  { entityId: 'archetype.connector', en: 'Connector', uk: "Зв'язковий", pl: 'Łącznik' },
  { entityId: 'archetype.builder', en: 'Builder', uk: 'Будівник', pl: 'Budowniczy' },
  { entityId: 'archetype.innovator', en: 'Innovator', uk: 'Новатор', pl: 'Innowator' },

  // ══════════════════════════════════════════════════════════════════
  // League / Guild Arena Page
  // ══════════════════════════════════════════════════════════════════

  // Page title
  { entityId: 'dashboard.guild_arena', en: 'GUILD ARENA', uk: 'ГІЛЬДІЙНА АРЕНА', pl: 'ARENA GILDII' },
  { entityId: 'dashboard.guild_subtitle', en: 'Leagues, Friends, Party Quests', uk: 'Ліги, Друзі, Групові Квести', pl: 'Ligi, Przyjaciele, Questy Grupowe' },

  // Tab labels
  { entityId: 'league.tab_league', en: 'League', uk: 'Ліга', pl: 'Liga' },
  { entityId: 'league.tab_weekly', en: 'Weekly Quests', uk: 'Тижневі квести', pl: 'Questy tygodniowe' },
  { entityId: 'league.tab_friends', en: 'Friends', uk: 'Друзі', pl: 'Przyjaciele' },
  { entityId: 'league.tab_party', en: 'Party Quest', uk: 'Груповий квест', pl: 'Quest grupowy' },

  // League tab
  { entityId: 'league.league_label', en: '{tier} League', uk: 'Ліга {tier}', pl: 'Liga {tier}' },
  { entityId: 'league.week_remaining', en: 'Week {n} • {d} days remaining', uk: 'Тиждень {n} • {d} днів залишилось', pl: 'Tydzień {n} • {d} dni pozostało' },
  { entityId: 'league.heroes_count', en: '{n} heroes', uk: '{n} героїв', pl: '{n} bohaterów' },
  { entityId: 'league.promote', en: 'Top 10 → promote', uk: 'Топ 10 → підвищення', pl: 'Top 10 → awans' },
  { entityId: 'league.demote', en: 'Bottom 5 → demote', uk: 'Останні 5 → пониження', pl: 'Ostatni 5 → degradacja' },
  { entityId: 'league.join_title', en: 'Join the Arena?', uk: 'Приєднатися до Арени?', pl: 'Dołączyć do Areny?' },
  { entityId: 'league.join_desc', en: 'Compete with 30 heroes in weekly XP challenges. Earn your way from Bronze to Diamond!', uk: 'Змагайся з 30 героями у тижневих XP-челенджах. Здобудь шлях від Бронзи до Діаманта!', pl: 'Rywalizuj z 30 bohaterami w tygodniowych wyzwaniach XP. Zdobądź drogę od Brązu do Diamentu!' },
  { entityId: 'league.join_btn', en: 'Join Weekly League', uk: 'Приєднатися до Ліги', pl: 'Dołącz do Ligi' },
  { entityId: 'league.join_note', en: 'Opt-in only • Resets every Monday • Leave anytime', uk: 'За бажанням • Скидається кожного понеділка • Вихід будь-коли', pl: 'Dobrowolnie • Reset co poniedziałek • Opuść kiedy chcesz' },
  { entityId: 'league.standings', en: 'Weekly Standings', uk: 'Тижневий рейтинг', pl: 'Ranking tygodniowy' },
  { entityId: 'league.time_left', en: '{d}d {h}h left', uk: 'Залишилось {d}д {h}г', pl: 'Pozostało {d}d {h}g' },
  { entityId: 'league.you', en: 'You ({name})', uk: 'Ви ({name})', pl: 'Ty ({name})' },
  { entityId: 'league.showing', en: 'Showing top {n} of {total}', uk: 'Показано топ {n} з {total}', pl: 'Pokazano top {n} z {total}' },
  { entityId: 'league.leave', en: 'Leave league', uk: 'Вийти з ліги', pl: 'Opuść ligę' },

  // Weekly tab (extended - inside league page)
  { entityId: 'league.weekly_title', en: 'Weekly Quests', uk: 'Тижневі квести', pl: 'Questy tygodniowe' },
  { entityId: 'league.resets_monday', en: 'Resets Monday • {n}/{total} completed', uk: 'Скидається в понеділок • {n}/{total} виконано', pl: 'Reset w poniedziałek • {n}/{total} ukończone' },
  { entityId: 'league.time_remaining', en: '{d}d {h}h remaining', uk: 'Залишилось {d}д {h}г', pl: 'Pozostało {d}d {h}g' },
  { entityId: 'league.hours_remaining', en: '{h}h remaining', uk: 'Залишилось {h}г', pl: 'Pozostało {h}g' },
  { entityId: 'league.champion_claimed', en: 'Weekly Champion! Bonus claimed', uk: 'Тижневий Чемпіон! Бонус отримано', pl: 'Tygodniowy Mistrz! Bonus odebrany' },
  { entityId: 'league.champion_title', en: 'Weekly Champion!', uk: 'Тижневий Чемпіон!', pl: 'Tygodniowy Mistrz!' },
  { entityId: 'league.champion_bonus', en: 'Weekly Champion Bonus', uk: 'Бонус Тижневого Чемпіона', pl: 'Bonus Tygodniowego Mistrza' },
  { entityId: 'league.champion_awarded', en: '+150 XP + 🪙 50 awarded', uk: '+150 XP + 🪙 50 нараховано', pl: '+150 XP + 🪙 50 przyznano' },
  { entityId: 'league.champion_hint', en: 'Complete all {n} challenges for a bonus reward', uk: 'Виконай всі {n} челенджів для бонусної нагороди', pl: 'Ukończ wszystkie {n} wyzwań po nagrodę bonusową' },
  { entityId: 'league.challenges_count', en: '{n}/{total} challenges', uk: '{n}/{total} челенджів', pl: '{n}/{total} wyzwań' },
  { entityId: 'league.champion_xp', en: 'Champion Bonus', uk: 'Бонус Чемпіона', pl: 'Bonus Mistrza' },
  { entityId: 'league.coins_label', en: 'Coins', uk: 'Монети', pl: 'Monety' },
  { entityId: 'league.first_attempt', en: 'This week: 1st attempt', uk: 'Цього тижня: 1-ша спроба', pl: 'Ten tydzień: 1. próba' },

  // Challenge status
  { entityId: 'league.status_complete', en: '✓ Complete — Claimed', uk: '✓ Виконано — Отримано', pl: '✓ Ukończone — Odebrane' },
  { entityId: 'league.status_progress', en: 'In progress', uk: 'В процесі', pl: 'W trakcie' },
  { entityId: 'league.status_not_started', en: 'Not started', uk: 'Не розпочато', pl: 'Nie rozpoczęte' },

  // Challenge descriptions
  { entityId: 'league.ch_quest_count', en: 'Complete {n} quests', uk: 'Виконай {n} квестів', pl: 'Ukończ {n} questów' },
  { entityId: 'league.ch_xp_earn', en: 'Earn {n} XP', uk: 'Заробити {n} XP', pl: 'Zdobądź {n} XP' },
  { entityId: 'league.ch_review', en: 'Review {n} skills', uk: 'Повторити {n} навичок', pl: 'Powtórz {n} umiejętności' },
  { entityId: 'league.ch_streak', en: 'Keep your streak all week', uk: 'Тримай стрік весь тиждень', pl: 'Utrzymaj passę cały tydzień' },
  { entityId: 'league.ch_accuracy', en: 'Score {n}%+ accuracy', uk: 'Набери {n}%+ точності', pl: 'Uzyskaj {n}%+ dokładności' },
  { entityId: 'league.ch_domain_variety', en: 'Quest in {n} domains', uk: 'Квести в {n} доменах', pl: 'Questy w {n} domenach' },
  { entityId: 'league.ch_domain_focus', en: 'Complete {n} {domain} quests', uk: 'Виконай {n} квестів {domain}', pl: 'Ukończ {n} questów {domain}' },
  { entityId: 'league.ch_time_spent', en: 'Train for {n} minutes', uk: 'Тренуйся {n} хвилин', pl: 'Ćwicz przez {n} minut' },
  { entityId: 'league.ch_perfect_day', en: 'Have {n} Perfect Day(s)', uk: 'Проведи {n} Ідеальних Днів', pl: 'Miej {n} Idealnych Dni' },
  { entityId: 'league.ch_mastery_push', en: 'Level up {n} skill(s)', uk: 'Підвищ {n} навичок', pl: 'Awansuj {n} umiejętności' },
  { entityId: 'league.ch_default', en: 'Complete {n} tasks', uk: 'Виконай {n} завдань', pl: 'Ukończ {n} zadań' },

  // Challenge hints
  { entityId: 'league.hint_quest', en: 'Complete any quests — daily or roadmap', uk: 'Виконуй будь-які квести — денні або з роадмапу', pl: 'Wykonuj dowolne questy — dzienne lub z roadmapy' },
  { entityId: 'league.hint_xp', en: 'Every quest, review, and challenge earns XP', uk: 'Кожен квест, повторення і челендж приносить XP', pl: 'Każdy quest, powtórka i wyzwanie daje XP' },
  { entityId: 'league.hint_review', en: 'Practice your skills in the Mastery Hub', uk: 'Практикуй навички в Центрі Майстерності', pl: 'Ćwicz umiejętności w Centrum Mistrzostwa' },
  { entityId: 'league.hint_streak', en: 'Visit each day to keep your streak alive', uk: 'Заходь щодня, щоб тримати стрік', pl: 'Odwiedzaj codziennie, by utrzymać passę' },
  { entityId: 'league.hint_accuracy', en: 'Aim for high scores on quest answers', uk: 'Цілься на високі бали у відповідях', pl: 'Celuj w wysokie wyniki w odpowiedziach' },
  { entityId: 'league.hint_variety', en: 'Try quests from different skill domains', uk: 'Спробуй квести з різних доменів', pl: 'Wypróbuj questy z różnych domen' },
  { entityId: 'league.hint_focus', en: 'Focus on your target domain this week', uk: 'Сконцентруйся на цільовому домені', pl: 'Skup się na docelowej domenie' },
  { entityId: 'league.hint_time', en: 'Every minute of training counts', uk: 'Кожна хвилина тренування рахується', pl: 'Każda minuta treningu się liczy' },
  { entityId: 'league.hint_perfect', en: 'Complete all 5 daily quests in one day', uk: 'Виконай всі 5 денних квестів за один день', pl: 'Ukończ 5 dziennych questów w jeden dzień' },
  { entityId: 'league.hint_mastery', en: 'Review skills to push them to the next level', uk: 'Повторюй навички для переходу на наступний рівень', pl: 'Powtarzaj umiejętności, by awansować' },

  // Friends tab
  { entityId: 'league.friends_header', en: 'Friends ({n})', uk: 'Друзі ({n})', pl: 'Przyjaciele ({n})' },
  { entityId: 'league.this_week', en: 'this week', uk: 'цього тижня', pl: 'ten tydzień' },
  { entityId: 'league.invite_desc', en: 'Invite friends to compare progress privately', uk: 'Запрошуй друзів порівнювати прогрес приватно', pl: 'Zaproś znajomych do porównywania postępów prywatnie' },
  { entityId: 'league.invite_btn', en: 'Invite a Friend', uk: 'Запросити друга', pl: 'Zaproś znajomego' },
  { entityId: 'league.invite_note', en: 'Friends-only • No public profiles • Your progress, your circle', uk: 'Тільки друзі • Без публічних профілів • Твій прогрес, твоє коло', pl: 'Tylko znajomi • Brak profili publicznych • Twój postęp, twoje kręgi' },

  // Party tab
  { entityId: 'league.epic_boss', en: 'Epic Boss', uk: 'Епічний Бос', pl: 'Epicki Boss' },
  { entityId: 'league.weekly_challenge', en: 'Weekly Challenge', uk: 'Тижневий виклик', pl: 'Wyzwanie tygodniowe' },
  { entityId: 'league.boss_hp', en: 'Boss HP', uk: 'HP Боса', pl: 'HP Bossa' },
  { entityId: 'league.victory_bounty', en: 'Victory Bounty', uk: 'Нагорода за перемогу', pl: 'Nagroda za zwycięstwo' },
  { entityId: 'league.energy_crystals', en: 'Energy Crystals', uk: 'Кристали Енергії', pl: 'Kryształy Energii' },
  { entityId: 'league.how_it_works', en: 'How it works:', uk: 'Як це працює:', pl: 'Jak to działa:' },
  { entityId: 'league.how_it_works_desc', en: 'Complete daily quests to deal damage. Each quest = damage points. Your party fights together — when the boss reaches 0 HP, everyone gets rewards!', uk: 'Виконуй денні квести, щоб завдавати шкоду. Кожен квест = очки шкоди. Ваша група б\'ється разом — коли бос досягне 0 HP, всі отримають нагороди!', pl: 'Wykonuj dzienne questy, by zadawać obrażenia. Każdy quest = punkty obrażeń. Twoja drużyna walczy razem — gdy boss osiągnie 0 HP, wszyscy dostaną nagrody!' },
  { entityId: 'league.party_members', en: 'Party Members ({n})', uk: 'Учасники групи ({n})', pl: 'Członkowie drużyny ({n})' },
  { entityId: 'league.total_dmg', en: 'Total DMG: {n}', uk: 'Загальна ШКД: {n}', pl: 'Łączne DMG: {n}' },
  { entityId: 'league.dmg', en: '{n} DMG', uk: '{n} ШКД', pl: '{n} DMG' },
  { entityId: 'league.deal_damage', en: 'Complete quests to deal damage to the boss!', uk: 'Виконуй квести, щоб завдавати шкоду босу!', pl: 'Wykonuj questy, by zadawać obrażenia bossowi!' },
  { entityId: 'league.go_home', en: 'Go to Command Center', uk: 'До Командного Центру', pl: 'Do Centrum Dowodzenia' },

  // Party Quest — join CTA
  { entityId: 'league.join_party_title', en: 'Join a Party Quest!', uk: 'Приєднуйся до Групового Квесту!', pl: 'Dołącz do Questu Grupowego!' },
  { entityId: 'league.join_party_desc', en: 'Team up with other heroes to defeat a powerful boss. Complete quests to deal damage!', uk: 'Об\'єднайся з іншими героями, щоб перемогти могутнього боса. Виконуй квести, щоб завдавати шкоду!', pl: 'Połącz siły z innymi bohaterami, by pokonać potężnego bossa. Wykonuj questy, by zadawać obrażenia!' },
  { entityId: 'league.join_party_btn', en: 'Join Party Quest', uk: 'Приєднатися до Квесту', pl: 'Dołącz do Questu' },
  { entityId: 'league.joining', en: 'Joining...', uk: 'Приєднання...', pl: 'Dołączanie...' },

  // Friends — add friend modal
  { entityId: 'league.add_friend_title', en: 'Add Friend by Public ID', uk: 'Додати друга за Public ID', pl: 'Dodaj znajomego po Public ID' },
  { entityId: 'league.public_id_placeholder', en: 'Enter public ID...', uk: 'Введіть public ID...', pl: 'Wpisz public ID...' },
  { entityId: 'league.send_request', en: 'Send', uk: 'Надіслати', pl: 'Wyślij' },
  { entityId: 'league.cancel', en: 'Cancel', uk: 'Скасувати', pl: 'Anuluj' },

  // Boss rarity labels
  { entityId: 'league.common_boss', en: 'Common Boss', uk: 'Звичайний Бос', pl: 'Zwykły Boss' },
  { entityId: 'league.rare_boss', en: 'Rare Boss', uk: 'Рідкісний Бос', pl: 'Rzadki Boss' },
  { entityId: 'league.legendary_boss', en: 'Legendary Boss', uk: 'Легендарний Бос', pl: 'Legendarny Boss' },

  // Character fallback
  { entityId: 'character.hero_fallback', en: 'Hero', uk: 'Герой', pl: 'Bohater' },

  // AI generating state
  { entityId: 'dashboard.ai_generating', en: 'Crafting your quest line...', uk: 'Створюємо твою лінію квестів...', pl: 'Tworzymy twoją linię questów...' },
  { entityId: 'dashboard.ai_generating_sub', en: 'AI is building personalized quests based on your goals', uk: 'ШІ будує персоналізовані квести на основі твоїх цілей', pl: 'AI tworzy spersonalizowane questy na podstawie twoich celów' },
  { entityId: 'dashboard.ai_progress_hint', en: 'This usually takes 15-30 seconds', uk: 'Зазвичай це займає 15-30 секунд', pl: 'To zwykle zajmuje 15-30 sekund' },
  { entityId: 'dashboard.ai_connecting', en: 'Connecting to AI...', uk: 'Підключення до ШІ...', pl: 'Łączenie z AI...' },
];

// Combine all content translations
const ALL_CONTENT_TRANSLATIONS: TranslationRow[] = [
  ...INTENT_TRANSLATIONS,
  ...DOMAIN_TRANSLATIONS,
  ...INTEREST_TRANSLATIONS,
  ...PAIN_POINT_TRANSLATIONS,
  ...CAREER_TARGET_TRANSLATIONS,
  ...ARCHETYPE_TRANSLATIONS,
  ...SELF_ASSESSMENT_TRANSLATIONS,
  ...ASSESSMENT_TRANSLATIONS,
];

// ═══════════════════════════════════════════════════════════════════
// SEED FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

const LOCALES = ['en', 'uk', 'pl'] as const;

async function seedRefContent() {
  console.log('Seeding ref_content...');
  let count = 0;

  for (const row of ALL_REF_CONTENT) {
    await prisma.refContent.upsert({
      where: {
        uq_ref_content: { entityType: row.entityType, entityId: row.entityId },
      },
      update: { data: row.data as any, sortOrder: row.sortOrder, parentId: row.parentId ?? null, active: true },
      create: {
        entityType: row.entityType,
        entityId: row.entityId,
        parentId: row.parentId ?? null,
        data: row.data as any,
        sortOrder: row.sortOrder,
        active: true,
      },
    });
    count++;

    if (count % 20 === 0) {
      console.log(`  ref_content: ${count}/${ALL_REF_CONTENT.length}`);
    }
  }

  console.log(`Seeded ${count} ref_content rows`);
}

async function seedTranslations() {
  console.log('Seeding translations...');
  let count = 0;

  // 1. Content translations (intents, domains, interests, pain points, career targets, archetypes, self-assessment)
  for (const row of ALL_CONTENT_TRANSLATIONS) {
    for (const locale of LOCALES) {
      const value = row[locale];
      await prisma.refTranslation.upsert({
        where: {
          uq_translation: {
            entityType: row.entityType,
            entityId: row.entityId,
            field: row.field,
            locale,
          },
        },
        update: { value },
        create: {
          entityType: row.entityType,
          entityId: row.entityId,
          field: row.field,
          locale,
          value,
        },
      });
      count++;
    }

    if (count % 60 === 0) {
      console.log(`  translations: ${count} upserted...`);
    }
  }

  // 2. UI translations
  for (const row of UI_TRANSLATIONS) {
    for (const locale of LOCALES) {
      const value = row[locale];
      await prisma.refTranslation.upsert({
        where: {
          uq_translation: {
            entityType: 'ui',
            entityId: row.entityId,
            field: 'label',
            locale,
          },
        },
        update: { value },
        create: {
          entityType: 'ui',
          entityId: row.entityId,
          field: 'label',
          locale,
          value,
        },
      });
      count++;
    }
  }

  console.log(`Seeded ${count} translation rows`);
}

// ═══════════════════════════════════════════════════════════════════
// SECTION: AI Prompt Templates
// ═══════════════════════════════════════════════════════════════════

interface AiPromptTemplateSeed {
  generatorType: string;
  promptRole: 'system' | 'user';
  version: number;
  template: string;
  metadata?: Record<string, unknown>;
}

const AI_PROMPT_TEMPLATES: AiPromptTemplateSeed[] = [
  // ─── Roadmap Generator (QUALITY) ──────────────────────────────
  {
    generatorType: 'roadmap',
    promptRole: 'system',
    version: 1,
    template: `You are Plan2Skill's AI roadmap architect. You create personalized 90-day learning roadmaps.

{HEADER:json}

**Output JSON schema:**
{
  "title": "string — roadmap title (5-200 chars)",
  "description": "string — 1-2 sentence description (10-500 chars)",
  "milestones": [
    {
      "title": "string (5-200 chars)",
      "description": "string (10-500 chars)",
      "weekStart": number (1-52),
      "weekEnd": number (1-52),
      "tasks": [
        {
          "title": "string (5-200 chars)",
          "description": "string — 1-2 sentences (10-500 chars)",
          {ENUM:taskType},
          {ENUM:questType} (optional — defaults to knowledge),
          {ENUM:flowCategory} (optional — defaults to mastery),
          "estimatedMinutes": number (5-120),
          "xpReward": number (10-500),
          "coinReward": number (1-50),
          {ENUM:rarity},
          "skillDomain": "string — skill domain (1-50 chars)",
          {ENUM:bloomLevel}
        }
      ]
    }
  ]
}

**Rules:**
- Create 4-12 milestones spanning 90 days
- Each milestone has 5-20 tasks
- Mix task types across all valid values
- First milestone should be beginner-friendly with Bloom's "remember" and "understand" levels
- Include at least 1 boss-type task per milestone — bosses must be "epic" or "legendary" rarity
- Every task MUST have a skillDomain — the specific skill topic it covers
- questType classifies the learning approach: knowledge (reading), practice (hands-on), creative (build something new), boss (challenge), etc.
- flowCategory indicates the zone: stretch (new/hard), mastery (solidifying), review (reinforcing known material)
- Bloom's progression: early milestones use remember→understand, middle use apply→analyze, later use evaluate→create
{CTX:rewardRules}
{CTX:rarityDistribution}
{CTX:taskQuestMapping}
{CTX:pacingConstraint}
{CTX:archetypeHints}
{CTX:userContext}
{CTX:characterContext}
{CTX:skillElos}

## Example Output (abbreviated)
{
  "title": "Full-Stack JavaScript Mastery",
  "description": "A 90-day journey from core JS fundamentals to deploying a full-stack app with React and Node.js.",
  "milestones": [
    {
      "title": "JavaScript Foundations",
      "description": "Build a rock-solid understanding of variables, control flow, functions, and DOM basics.",
      "weekStart": 1,
      "weekEnd": 3,
      "tasks": [
        {
          "title": "Variables & Data Types Deep Dive",
          "description": "Read about let, const, primitives, and reference types in JavaScript.",
          "taskType": "article",
          "estimatedMinutes": 20,
          "xpReward": 20,
          "coinReward": 5,
          "rarity": "common",
          "skillDomain": "JavaScript Basics",
          "bloomLevel": "remember"
        }
      ]
    }
  ]
}
(Show 4-12 milestones with 5-20 tasks each in your actual output.)

{CTX:missingDataGuidance}
{CTX:locale}`,
    metadata: { modelTier: 'QUALITY', temperature: 0.7, maxTokens: 4096, cacheTTL: 0 },
  },
  {
    generatorType: 'roadmap',
    promptRole: 'user',
    version: 1,
    template: `Create a 90-day personalized learning roadmap.

**Learner Profile:**
- Goal: {INPUT:goal}
- Daily Time: {INPUT:dailyMinutes} minutes/day
{CTX:inputExtras}
{CTX:onboardingData}
{CTX:roadmapContext}
{CTX:skillProficiency}

{FOOTER:json}`,
    metadata: { modelTier: 'QUALITY', temperature: 0.7, maxTokens: 4096, cacheTTL: 0 },
  },

  // ─── Quest Generator (BALANCED) ───────────────────────────────
  {
    generatorType: 'quest',
    promptRole: 'system',
    version: 1,
    template: `You are Plan2Skill's quest generation engine. You create personalized learning quests.

{HEADER:json}

**Output JSON schema:**
{
  "quests": [
    {
      "title": "string (5-200 chars)",
      "description": "string (10-500 chars)",
      {ENUM:taskType},
      {ENUM:questType},
      "estimatedMinutes": number (5-120),
      "xpReward": number (10-500),
      "coinReward": number (1-50),
      {ENUM:rarity},
      "skillDomain": "string (1-50 chars)",
      {ENUM:bloomLevel},
      {ENUM:flowCategory},
      "difficultyTier": number (1-5),
      "knowledgeCheck": {
        "question": "string (10-500 chars)",
        "options": ["4 strings, each 1-200 chars"],
        "correctIndex": number (0-3),
        "explanation": "string (10-500 chars)"
      }
    }
  ]
}

**Rules:**
- Flow state distribution: 70% mastery, 20% stretch, 10% review
- Bloom's level should match user's skill proficiency
{CTX:rewardRules}
{CTX:rarityDistribution}
{CTX:taskQuestMapping}
- Include knowledgeCheck for knowledge and quiz questTypes. For practice and creative questTypes, knowledgeCheck is optional.
- Questions should have exactly 4 options with exactly 1 correct answer
- Distractors should be plausible (common misconceptions, partial knowledge)
{CTX:archetypeHints}
{CTX:userContext}
{CTX:skillElos}
{CTX:ledgerInsights}
{CTX:roadmapWithMilestone}

## Example Output (abbreviated)
{
  "quests": [
    {
      "title": "Flexbox Layout Patterns",
      "description": "Read an interactive article on CSS Flexbox and practice aligning items in common UI patterns.",
      "taskType": "article",
      "questType": "knowledge",
      "estimatedMinutes": 15,
      "xpReward": 20,
      "coinReward": 5,
      "rarity": "common",
      "skillDomain": "CSS Layouts",
      "bloomLevel": "understand",
      "flowCategory": "mastery",
      "difficultyTier": 2,
      "knowledgeCheck": {
        "question": "Which Flexbox property aligns items along the cross axis?",
        "options": ["justify-content", "align-items", "flex-direction", "flex-wrap"],
        "correctIndex": 1,
        "explanation": "align-items controls alignment on the cross axis, while justify-content controls the main axis."
      }
    }
  ]
}
(Generate the requested number of quests in your actual output.)

{CTX:missingDataGuidance}
{CTX:locale}`,
    metadata: { modelTier: 'BALANCED', temperature: 0.6, maxTokens: 2048, cacheTTL: 3600 },
  },
  {
    generatorType: 'quest',
    promptRole: 'user',
    version: 1,
    template: `Generate {INPUT:count} learning quests for the skill domain "{INPUT:skillDomain}".

**Constraints:**
- Daily time budget: {INPUT:dailyMinutes} minutes
- Total quest time should not exceed {INPUT:dailyMinutes} minutes
{CTX:existingTasks}
{CTX:domainElo}

{FOOTER:json}`,
    metadata: { modelTier: 'BALANCED', temperature: 0.6, maxTokens: 2048, cacheTTL: 3600 },
  },

  // ─── Assessment Generator (BALANCED) ──────────────────────────
  {
    generatorType: 'assessment',
    promptRole: 'system',
    version: 1,
    template: `You are Plan2Skill's assessment engine. You generate skill assessment questions to calibrate learner proficiency.

{HEADER:json}

**Output JSON schema:**
{
  "questions": [
    {
      "question": "string (10-500 chars)",
      "options": ["4 strings, each 1-300 chars"],
      "correctIndex": number (0-3),
      "explanation": "string (10-500 chars)",
      {ENUM:bloomLevel},
      "skillDomain": "string (1-50 chars)",
      "difficultyElo": number (800-2000),
      "distractorTypes": ["3 distractor types from: common_misconception, partial_knowledge, similar_concept, syntax_error"]
    }
  ],
  "targetBloomLevel": "{ENUM:bloomLevel}",
  "skillDomain": "string (1-50 chars)"
}

**Rules:**
- Exactly 4 options per question, exactly 1 correct answer
- correctIndex must be 0, 1, 2, or 3
- Distractor types:
  - common_misconception: popular wrong belief
  - partial_knowledge: correct for a different but related topic
  - similar_concept: confuses related concepts
  - syntax_error: surface-level plausible but fundamentally wrong
- Bloom's level progression: mix of levels around the target
- Elo difficulty targeting:
  - beginner: 800-1100
  - intermediate: 1100-1400
  - advanced: 1400-1700
  - expert: 1700-2000
- Questions should be practical and scenario-based, not trivia
- Explanations should teach, not just confirm the correct answer
{CTX:userContext}
{CTX:skillElos}
{CTX:activeMilestone}
{CTX:ledgerInsights}

## Example Output (abbreviated)
{
  "questions": [
    {
      "question": "You have an array of user objects. Which method returns a NEW array containing only users older than 18?",
      "options": [
        "users.filter(u => u.age > 18)",
        "users.find(u => u.age > 18)",
        "users.map(u => u.age > 18)",
        "users.forEach(u => u.age > 18)"
      ],
      "correctIndex": 0,
      "explanation": "Array.filter() returns a new array with all elements that pass the test. find() returns only the first match, map() transforms elements, and forEach() returns undefined.",
      "bloomLevel": "apply",
      "skillDomain": "JavaScript Arrays",
      "difficultyElo": 1150,
      "distractorTypes": ["similar_concept", "similar_concept", "common_misconception"]
    }
  ],
  "targetBloomLevel": "apply",
  "skillDomain": "JavaScript Arrays"
}
(Generate the requested number of questions in your actual output.)

{CTX:missingDataGuidance}
{CTX:locale}`,
    metadata: { modelTier: 'BALANCED', temperature: 0.4, maxTokens: 2048, cacheTTL: 86400 },
  },
  {
    generatorType: 'assessment',
    promptRole: 'user',
    version: 1,
    template: `Generate a {INPUT:questionCount}-question assessment for skill domain "{INPUT:skillDomain}".

**Parameters:**
- Experience level: {INPUT:experienceLevel}
- Target Bloom's level: {INPUT:targetBloom}
- Goal: {INPUT:goal}
- Question count: {INPUT:questionCount}

{FOOTER:json}`,
    metadata: { modelTier: 'BALANCED', temperature: 0.4, maxTokens: 2048, cacheTTL: 86400 },
  },

  // ─── Quest Assistant Generator (BALANCED) ─────────────────
  {
    generatorType: 'quest-assistant',
    promptRole: 'system',
    version: 1,
    template: `You are Plan2Skill's quest assistant — a helpful tutor embedded in a gamified learning platform. You help learners when they're stuck, give feedback on their attempts, and guide them toward mastery.

{HEADER:json}

**Output JSON schema:**
{
  "mode": "hint | feedback | reattempt | tutor",
  "message": "string (5-2000 chars) — your main response",
  "encouragement": "string (optional, max 200 chars) — a brief motivational line",
  "nextSteps": ["string (optional, max 3 items, each max 200 chars) — suggested actions"]
}

**Behavioral rules by mode:**

**hint mode:**
- Provide a progressive hint — each request should reveal slightly more
- Never reveal the correct answer directly
- Reference the learner's previous attempts if available

**feedback mode:**
- Analyze the learner's attempt (correct or incorrect)
- If correct: celebrate, explain WHY, suggest deeper understanding
- If incorrect: explain the misconception without being judgmental

**reattempt mode:**
- Provide encouragement + a teaching moment
- Explain the concept at a simpler level
- Do NOT give the answer directly — guide discovery

**tutor mode:**
- Act as a personal tutor: explain clearly and thoroughly
- Break down complex concepts with analogies
- Adapt to the learner's level

{CTX:archetypeHints}
{CTX:userContext}
{CTX:roadmapContext}
{CTX:ledgerInsights}
{CTX:missingDataGuidance}
{CTX:locale}`,
    metadata: { modelTier: 'BALANCED', temperature: 0.6, maxTokens: 1024, cacheTTL: 0 },
  },
  {
    generatorType: 'quest-assistant',
    promptRole: 'user',
    version: 1,
    template: `Mode: {INPUT:mode}

{INPUT:userMessage}

{FOOTER:json}`,
    metadata: { modelTier: 'BALANCED', temperature: 0.6, maxTokens: 1024, cacheTTL: 0 },
  },

  // ─── Article Body Generator (BALANCED) ────────────────────
  {
    generatorType: 'article-body',
    promptRole: 'system',
    version: 1,
    template: `You are Plan2Skill's expert educational content writer. You create clear, engaging, and structured learning articles.

{HEADER:json}

**Output JSON schema:**
{
  "articleBody": "string (100-10000 chars) — markdown-formatted educational article",
  "blocks": [
    // 3-10 structured content blocks with type discriminator
  ]
}

**Rules:**
- Write 200-1500 words of educational content
- Match the Bloom's taxonomy level ({ENUM:bloomLevel})
- Include 2-3 practical examples or analogies
- Do NOT include code blocks unless the domain involves programming

{CTX:userContext}
{CTX:skillElos}
{CTX:roadmapContext}
{CTX:activeMilestone}
{CTX:missingDataGuidance}
{CTX:locale}`,
    metadata: { modelTier: 'BALANCED', temperature: 0.5, maxTokens: 4096, cacheTTL: 86400 },
  },
  {
    generatorType: 'article-body',
    promptRole: 'user',
    version: 1,
    template: `Write an educational article AND structured content blocks for the task: "{INPUT:taskTitle}"

**Parameters:**
- Skill domain: {INPUT:skillDomain}
- Bloom's level: {INPUT:bloomLevel}
- Domain category: {INPUT:domainCategory}

{FOOTER:json}`,
    metadata: { modelTier: 'BALANCED', temperature: 0.5, maxTokens: 4096, cacheTTL: 86400 },
  },

  // ─── Exercise Generator (BALANCED) ────────────────────────
  {
    generatorType: 'exercise',
    promptRole: 'system',
    version: 1,
    template: `You are Plan2Skill's exercise generation engine. You create diverse, pedagogically sound exercises.

{HEADER:json}

**Output JSON schema:**
{
  "exercises": [
    // Discriminated union on "type": mcq, true_false, fill_blank, matching, drag_drop, code_completion, free_text, parsons
  ]
}

**Rules:**
- Generate EXACTLY the exercise types and difficulties requested
- Points: easy = 10, medium = 20, hard = 30
- Bloom level ({ENUM:bloomLevel}) must match the specified level
- Do NOT generate code_completion or parsons exercises unless the domain involves programming

{CTX:userContext}
{CTX:skillElos}
{CTX:roadmapContext}
{CTX:activeMilestone}
{CTX:missingDataGuidance}
{CTX:locale}`,
    metadata: { modelTier: 'BALANCED', temperature: 0.6, maxTokens: 3000, cacheTTL: 86400 },
  },
  {
    generatorType: 'exercise',
    promptRole: 'user',
    version: 1,
    template: `Generate exercises for the task: "{INPUT:taskTitle}"

**Parameters:**
- Skill domain: {INPUT:skillDomain}
- Bloom's level: {INPUT:bloomLevel}
- Domain category: {INPUT:domainCategory}

{FOOTER:json}`,
    metadata: { modelTier: 'BALANCED', temperature: 0.6, maxTokens: 3000, cacheTTL: 86400 },
  },

  // ─── Code Challenge Generator (BALANCED) ──────────────────
  {
    generatorType: 'code-challenge',
    promptRole: 'system',
    version: 1,
    template: `You are Plan2Skill's expert coding challenge designer. You create well-structured, educational coding challenges with test cases and progressive hints.

{HEADER:json}

**Output JSON schema:**
{
  "title": "string (5-200 chars)",
  "description": "string (10-2000 chars)",
  "starterCode": "string (1-2000 chars)",
  "testCases": [{ "input": "string", "expectedOutput": "string", "isHidden": boolean }],
  "hints": ["string (5-300 chars)"],
  "solutionExplanation": "string (10-1000 chars)"
}

**Rules:**
- Solvable in a single function or short program
- 3-5 test cases: first 2 visible, rest hidden with edge cases
- 2-4 progressive hints
- Bloom's level alignment ({ENUM:bloomLevel})

{CTX:userContext}
{CTX:skillElos}
{CTX:activeMilestone}
{CTX:missingDataGuidance}
{CTX:locale}`,
    metadata: { modelTier: 'BALANCED', temperature: 0.5, maxTokens: 2048, cacheTTL: 86400 },
  },
  {
    generatorType: 'code-challenge',
    promptRole: 'user',
    version: 1,
    template: `Create a coding challenge.

**Parameters:**
- Programming language: {INPUT:language}
- Skill domain: {INPUT:skillDomain}
- Bloom's taxonomy level: {INPUT:bloomLevel}
- Difficulty: {INPUT:difficulty}

{FOOTER:json}`,
    metadata: { modelTier: 'BALANCED', temperature: 0.5, maxTokens: 2048, cacheTTL: 86400 },
  },

  // ─── Quiz Generator (BUDGET) ──────────────────────────────
  {
    generatorType: 'quiz',
    promptRole: 'system',
    version: 1,
    template: `You are Plan2Skill's expert quiz designer. You generate high-quality quiz questions targeting specific Bloom's taxonomy levels.

{HEADER:json}

**Output JSON schema:**
{
  "questions": [
    {
      "question": "string (10-500 chars)",
      "options": ["4 strings, each 1-300 chars"],
      "correctIndex": number (0-3),
      "explanation": "string (10-500 chars)",
      "bloomLevel": "{ENUM:bloomLevel}",
      "distractorTypes": ["plausible-wrong|common-misconception|partial-truth|off-topic"]
    }
  ]
}

**Rules:**
- Exactly 4 options per question, exactly 1 correct answer
- Questions should be practical and scenario-based
- Explanations should teach, not just confirm

{CTX:userContext}
{CTX:skillElos}
{CTX:activeMilestone}
{CTX:missingDataGuidance}
{CTX:locale}`,
    metadata: { modelTier: 'BUDGET', temperature: 0.3, maxTokens: 2048, cacheTTL: 86400 },
  },
  {
    generatorType: 'quiz',
    promptRole: 'user',
    version: 1,
    template: `Generate {INPUT:questionCount} quiz questions for skill domain "{INPUT:skillDomain}".

**Parameters:**
- Target Bloom's level: {INPUT:bloomLevel}
- Question count: {INPUT:questionCount}

{FOOTER:json}`,
    metadata: { modelTier: 'BUDGET', temperature: 0.3, maxTokens: 2048, cacheTTL: 86400 },
  },

  // ─── Motivational Generator (BUDGET) ──────────────────────
  {
    generatorType: 'motivational',
    promptRole: 'system',
    version: 1,
    template: `You are Plan2Skill's motivational companion. You craft short, punchy, and inspiring messages for learners at key moments.

{HEADER:json}

**Output JSON schema:**
{
  "message": "string (5-500 chars)",
  "tone": "encouraging|celebratory|epic|gentle",
  "emoji": "string (optional, max 10 chars)"
}

**Rules:**
- 1-3 sentences — short and punchy
- Use RPG/gaming metaphors when appropriate
- Be genuine — avoid generic platitudes

{CTX:locale}`,
    metadata: { modelTier: 'BUDGET', temperature: 0.7, maxTokens: 512, cacheTTL: 3600 },
  },
  {
    generatorType: 'motivational',
    promptRole: 'user',
    version: 1,
    template: `Generate a motivational message for trigger: "{INPUT:triggerType}".

{FOOTER:json}`,
    metadata: { modelTier: 'BUDGET', temperature: 0.7, maxTokens: 512, cacheTTL: 3600 },
  },

  // ─── Fun Fact Generator (BUDGET) ──────────────────────────
  {
    generatorType: 'fun-fact',
    promptRole: 'system',
    version: 1,
    template: `You are Plan2Skill's engaging micro-content creator. You generate fun, surprising, and educational facts.

{HEADER:json}

**Output JSON schema:**
{
  "facts": [
    {
      "fact": "string (10-500 chars)",
      "category": "history|science|industry|surprising",
      "source": "string (optional, max 200 chars)"
    }
  ]
}

**Rules:**
- Generate 3-5 facts per call
- Mix categories for variety
- Keep facts concise — 1-3 sentences each

{CTX:locale}`,
    metadata: { modelTier: 'BUDGET', temperature: 0.8, maxTokens: 512, cacheTTL: 86400 },
  },
  {
    generatorType: 'fun-fact',
    promptRole: 'user',
    version: 1,
    template: `Generate fun educational facts about "{INPUT:skillDomain}".

{FOOTER:json}`,
    metadata: { modelTier: 'BUDGET', temperature: 0.8, maxTokens: 512, cacheTTL: 86400 },
  },

  // ─── Resource Generator (BUDGET) ──────────────────────────
  {
    generatorType: 'resource',
    promptRole: 'system',
    version: 1,
    template: `You are Plan2Skill's learning resource curator. You recommend high-quality, real-world learning resources.

{HEADER:json}

**Output JSON schema:**
{
  "resources": [
    {
      "title": "string (5-200 chars)",
      "url": "string — real URL",
      "type": "article|video|documentation|course|tool",
      "description": "string (10-500 chars)",
      "difficulty": "beginner|intermediate|advanced",
      "freeAccess": boolean
    }
  ]
}

**Rules:**
- 3-7 resources per call
- CRITICAL: Only recommend URLs you are highly confident are real and active
- NEVER fabricate or hallucinate URLs

{CTX:roadmapContext}
{CTX:activeMilestone}
{CTX:locale}`,
    metadata: { modelTier: 'BUDGET', temperature: 0.3, maxTokens: 1024, cacheTTL: 86400 },
  },
  {
    generatorType: 'resource',
    promptRole: 'user',
    version: 1,
    template: `Recommend learning resources for skill domain "{INPUT:skillDomain}".

**Parameters:**
- Difficulty level: {INPUT:level}

{FOOTER:json}`,
    metadata: { modelTier: 'BUDGET', temperature: 0.3, maxTokens: 1024, cacheTTL: 86400 },
  },

  // ─── Recommendation Generator (BUDGET) ────────────────────
  {
    generatorType: 'recommendation',
    promptRole: 'system',
    version: 1,
    template: `You are Plan2Skill's learning path advisor. You analyze a learner's skills to recommend impactful next steps.

{HEADER:json}

**Output JSON schema:**
{
  "recommendations": [
    {
      "title": "string (5-200 chars)",
      "description": "string (10-500 chars)",
      "skillDomain": "string (1-50 chars)",
      "reason": "string (10-300 chars)",
      "priority": "high|medium|low"
    }
  ]
}

**Rules:**
- 3-7 recommendations, ranked by priority
- Avoid recommending skills already completed or in progress

{CTX:userContext}
{CTX:roadmapContext}
{CTX:ledgerInsights}
{CTX:locale}`,
    metadata: { modelTier: 'BUDGET', temperature: 0.5, maxTokens: 1024, cacheTTL: 3600 },
  },
  {
    generatorType: 'recommendation',
    promptRole: 'user',
    version: 1,
    template: `Recommend next skills for this learner.

**Learner Profile:**
- User level: {INPUT:userLevel}
- Completed skill domains: {INPUT:completedSkillDomains}
- Currently learning: {INPUT:currentSkillDomains}

{FOOTER:json}`,
    metadata: { modelTier: 'BUDGET', temperature: 0.5, maxTokens: 1024, cacheTTL: 3600 },
  },

  // ─── Interest Suggestion Generator (BUDGET) ───────────────
  {
    generatorType: 'interest-suggestion',
    promptRole: 'system',
    version: 1,
    template: `You are Plan2Skill's interest discovery assistant. Given a learning domain, suggest 6-10 specific learning interests/topics.

{HEADER:json}

**Output JSON schema:**
{
  "interests": [
    {
      "id": "string — kebab-case unique id",
      "label": "string — human-readable label (2-100 chars, Title Case)"
    }
  ]
}

**Rules:**
- 6-10 specific sub-topics of the domain
- Use kebab-case IDs derived from the label
- Order from foundational to advanced

{CTX:locale}`,
    metadata: { modelTier: 'BUDGET', temperature: 0.7, maxTokens: 512, cacheTTL: 3600 },
  },
  {
    generatorType: 'interest-suggestion',
    promptRole: 'user',
    version: 1,
    template: `Suggest learning interests for this domain:

**Domain:** {INPUT:domain}
**Dream goal:** "{INPUT:dreamGoal}"

{FOOTER:json}`,
    metadata: { modelTier: 'BUDGET', temperature: 0.7, maxTokens: 512, cacheTTL: 3600 },
  },

  // ─── Milestone Suggestion Generator (BUDGET) ──────────────
  {
    generatorType: 'milestone-suggestion',
    promptRole: 'system',
    version: 1,
    template: `You are Plan2Skill's onboarding assistant. Suggest 3-6 progressive milestones that form a learning path.

{HEADER:json}

**Output JSON schema:**
{
  "milestones": [
    {
      "id": "string — kebab-case unique id",
      "text": "string — milestone title (3-200 chars)",
      "weeks": number (1-26)
    }
  ]
}

**Rules:**
- 3-6 milestones building progressively
- Total weeks: roughly 12-24 weeks
- Specific, measurable, and achievable

{CTX:locale}`,
    metadata: { modelTier: 'BUDGET', temperature: 0.6, maxTokens: 768, cacheTTL: 600 },
  },
  {
    generatorType: 'milestone-suggestion',
    promptRole: 'user',
    version: 1,
    template: `Suggest learning milestones for this learner:

**Path:** {INPUT:path}
**Dream goal:** "{INPUT:dreamGoal}"

{FOOTER:json}`,
    metadata: { modelTier: 'BUDGET', temperature: 0.6, maxTokens: 768, cacheTTL: 600 },
  },

  // ─── Onboarding Assessment Generator (BUDGET) ─────────────
  {
    generatorType: 'onboarding-assessment',
    promptRole: 'system',
    version: 1,
    template: `You are Plan2Skill's assessment quiz generator. Generate exactly 5 multiple-choice questions to evaluate knowledge level.

{HEADER:json}

**Output JSON schema:**
{
  "questions": [
    {
      "id": "string — kebab-case unique id",
      "domain": "string",
      "difficulty": 1 | 2 | 3,
      "question": "string (10-500 chars)",
      "options": [{ "id": "a"|"b"|"c"|"d", "text": "string", "correct": boolean }],
      "npcReaction": {
        "correct": "string", "wrong": "string",
        "correctEmotion": "neutral"|"happy"|"impressed"|"thinking",
        "wrongEmotion": "neutral"|"happy"|"impressed"|"thinking"
      }
    }
  ]
}

**Rules:**
- Exactly 5 questions
- Difficulty: 2× easy, 2× medium, 1× hard
- 4 options per question, 1 correct
- NPC reactions use RPG mentor tone

{CTX:locale}`,
    metadata: { modelTier: 'BUDGET', temperature: 0.5, maxTokens: 2048, cacheTTL: 86400 },
  },
  {
    generatorType: 'onboarding-assessment',
    promptRole: 'user',
    version: 1,
    template: `Generate 5 assessment questions for this learner:

**Path:** {INPUT:path}
**Dream goal:** "{INPUT:dreamGoal}"

{FOOTER:json}`,
    metadata: { modelTier: 'BUDGET', temperature: 0.5, maxTokens: 2048, cacheTTL: 86400 },
  },

  // ─── Narrative Generator (QUALITY) ────────────────────────
  {
    generatorType: 'narrative',
    promptRole: 'system',
    version: 1,
    template: `You are the narrative engine for Plan2Skill's world of Lumen. You write short, episodic fantasy stories (120-180 words per episode body).

{HEADER:json}

**Output JSON schema:**
{
  "title": "string (3-120 chars)",
  "contextSentence": "string (10-300 chars)",
  "body": "string — 120-180 words",
  "cliffhanger": "string (20-400 chars)",
  "sageReflection": "string (20-400 chars)",
  "summary": "string (20-500 chars)",
  "tone": "heroic|mysterious|whimsical|dramatic|contemplative",
  "act": number (1-5),
  "category": "standard|climax|lore_drop|character_focus|season_finale",
  "continuity": { "referencedCharacters": [], "referencedLocations": [], "plotThreadsContinued": [], "newPlotThreads": [] }
}

**Rules:**
- Tone: 70% epic grandeur, 30% warm humor
- NEVER: violence, character death, deception by Sage
- Sage's reflection must connect to personal growth / learning

{CTX:archetypeHints}
{CTX:locale}`,
    metadata: { modelTier: 'QUALITY', temperature: 0.8, maxTokens: 2048, cacheTTL: 0 },
  },
  {
    generatorType: 'narrative',
    promptRole: 'user',
    version: 1,
    template: `Generate Episode {INPUT:episodeNumber} of Season "{INPUT:seasonTitle}".

{FOOTER:json}`,
    metadata: { modelTier: 'QUALITY', temperature: 0.8, maxTokens: 2048, cacheTTL: 0 },
  },

  // ─── Domain Classifier (BUDGET) ───────────────────────────
  {
    generatorType: 'domain-classifier',
    promptRole: 'system',
    version: 1,
    template: `You are a domain classifier for an EdTech platform. Classify a learning domain into categories.

{HEADER:json}

**Output JSON schema:**
{
  "categories": ["primary_category", "secondary_category"],
  "primaryCategory": "primary_category",
  "hasCodingComponent": boolean,
  "hasPhysicalComponent": boolean,
  "hasCreativeComponent": boolean,
  "primaryLanguage": string | null,
  "suggestedTooling": ["tool1", "tool2"]
}

**Rules:**
- primaryCategory must be first element of categories
- hasCodingComponent = true only for writing code
- suggestedTooling: max 10 items`,
    metadata: { modelTier: 'BUDGET', temperature: 0.2, maxTokens: 512, cacheTTL: 0 },
  },
  {
    generatorType: 'domain-classifier',
    promptRole: 'user',
    version: 1,
    template: `Classify this learning domain:

Goal: {INPUT:goal}
Title: {INPUT:title}

{FOOTER:json}`,
    metadata: { modelTier: 'BUDGET', temperature: 0.2, maxTokens: 512, cacheTTL: 0 },
  },
];

async function seedAiPromptTemplates() {
  let count = 0;
  for (const t of AI_PROMPT_TEMPLATES) {
    await prisma.aiPromptTemplate.upsert({
      where: {
        generatorType_promptRole_version: {
          generatorType: t.generatorType,
          promptRole: t.promptRole,
          version: t.version,
        },
      },
      update: {
        template: t.template,
        metadata: t.metadata ?? undefined,
        isActive: true,
      },
      create: {
        generatorType: t.generatorType,
        promptRole: t.promptRole,
        version: t.version,
        template: t.template,
        metadata: t.metadata ?? undefined,
        isActive: true,
      },
    });
    count++;
  }
  console.log(`Seeded ${count} AI prompt templates`);
}

// ═══════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════

async function main() {
  console.log('=== seed-i18n-full: Starting ===');
  console.log(`  ref_content entries: ${ALL_REF_CONTENT.length}`);
  console.log(`  content translation entries: ${ALL_CONTENT_TRANSLATIONS.length} x 3 locales = ${ALL_CONTENT_TRANSLATIONS.length * 3}`);
  console.log(`  UI translation entries: ${UI_TRANSLATIONS.length} x 3 locales = ${UI_TRANSLATIONS.length * 3}`);
  console.log('');

  await seedRefContent();
  console.log('');
  await seedTranslations();
  console.log('');
  await seedAiPromptTemplates();

  console.log('');
  console.log('=== seed-i18n-full: Done ===');
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => { console.error(e); prisma.$disconnect(); process.exit(1); });
