// ═══════════════════════════════════════════
// DOMAINS — 9 skill domains + interests per domain
// Step 2B: Guided Discovery
// Icons use NeonIcon SVG system (no emojis)
// IT/non-IT interleaved for balanced display
// ═══════════════════════════════════════════

import type { NeonIconType } from '../_components/NeonIcon';

export interface DomainConfig {
  id: string;
  name: string;
  description: string;
  icon: NeonIconType;
  color: string;
}

export interface InterestConfig {
  id: string;
  label: string;
  domain: string;
  icon: NeonIconType;
  color: string;
  trending?: boolean;
}

// Grid order: IT / non-IT interleaved
export const DOMAINS: DomainConfig[] = [
  {
    id: 'ai',
    name: 'AI & Smart Tools',
    description: 'Build with AI, automate, and prompt like a pro',
    icon: 'sparkle',
    color: '#818CF8',
  },
  {
    id: 'business',
    name: 'Business & Startups',
    description: 'Launch, lead, and grow ventures',
    icon: 'briefcase',
    color: '#FFD166',
  },
  {
    id: 'tech',
    name: 'Code & Apps',
    description: 'Build software, websites, and apps',
    icon: 'code',
    color: '#4ECDC4',
  },
  {
    id: 'creative',
    name: 'Design & Create',
    description: 'Design, illustrate, and tell visual stories',
    icon: 'edit',
    color: '#3B82F6',
  },
  {
    id: 'data',
    name: 'Data & Insights',
    description: 'Analyze, visualize, and make smart decisions',
    icon: 'chart',
    color: '#9D7AFF',
  },
  {
    id: 'languages',
    name: 'Languages',
    description: 'Learn new languages and communicate globally',
    icon: 'globe',
    color: '#E8C35A',
  },
  {
    id: 'marketing',
    name: 'Marketing & Growth',
    description: 'Grow audiences, brands, and revenue',
    icon: 'volume',
    color: '#E879F9',
  },
  {
    id: 'leadership',
    name: 'People & Leadership',
    description: 'Communicate, lead, and level up your career',
    icon: 'crown',
    color: '#6EE7B7',
  },
  {
    id: 'security',
    name: 'Cyber & Security',
    description: 'Protect systems, find vulnerabilities, stay safe',
    icon: 'shield',
    color: '#FF6B8A',
  },
];

export const INTERESTS: InterestConfig[] = [
  // ─── AI & Smart Tools ───
  { id: 'ai-llm',        label: 'AI & Large Language Models', domain: 'ai', icon: 'chat',     color: '#818CF8', trending: true },
  { id: 'prompt-eng',    label: 'Prompt Engineering',        domain: 'ai', icon: 'sparkle',  color: '#9D7AFF', trending: true },
  { id: 'ai-automation', label: 'AI Automation & Agents',    domain: 'ai', icon: 'gear',     color: '#4ECDC4' },
  { id: 'ai-art',        label: 'AI Art & Image Generation', domain: 'ai', icon: 'camera',   color: '#E879F9' },
  { id: 'ai-coding',     label: 'AI-Assisted Coding',        domain: 'ai', icon: 'code',     color: '#6EE7B7' },
  { id: 'chatbots',      label: 'Chatbots & Assistants',     domain: 'ai', icon: 'chat',     color: '#FFD166' },
  { id: 'ai-no-code',    label: 'No-Code AI Tools',          domain: 'ai', icon: 'wand',     color: '#FF6B8A' },
  { id: 'rag',           label: 'RAG & Knowledge Systems',   domain: 'ai', icon: 'book',     color: '#3B82F6' },

  // ─── Business & Startups ───
  { id: 'product-mgmt',  label: 'Product Management',        domain: 'business', icon: 'clipboard', color: '#FFD166', trending: true },
  { id: 'startup',       label: 'Startups & Ventures',       domain: 'business', icon: 'rocket',    color: '#FF6B8A' },
  { id: 'sales',         label: 'Sales & Growth',            domain: 'business', icon: 'trendUp',   color: '#4ECDC4' },
  { id: 'project-mgmt',  label: 'Project Management',        domain: 'business', icon: 'target',    color: '#818CF8' },
  { id: 'consulting',    label: 'Consulting',                domain: 'business', icon: 'users',     color: '#6EE7B7' },
  { id: 'finance-biz',   label: 'Finance & Accounting',      domain: 'business', icon: 'coins',     color: '#E879F9' },
  { id: 'operations',    label: 'Operations',                domain: 'business', icon: 'gear',      color: '#3B82F6' },
  { id: 'ecommerce',     label: 'E-Commerce',                domain: 'business', icon: 'globe',     color: '#9D7AFF' },

  // ─── Code & Apps ───
  { id: 'web-dev',       label: 'Web Development',           domain: 'tech', icon: 'globe',    color: '#4ECDC4' },
  { id: 'mobile-dev',    label: 'Mobile Apps',               domain: 'tech', icon: 'code',     color: '#3B82F6' },
  { id: 'backend',       label: 'Backend & APIs',            domain: 'tech', icon: 'terminal', color: '#818CF8' },
  { id: 'devops',        label: 'DevOps & Cloud',            domain: 'tech', icon: 'cloud',    color: '#6EE7B7' },
  { id: 'gamedev',       label: 'Game Development',          domain: 'tech', icon: 'play',     color: '#E879F9' },
  { id: 'embedded',      label: 'Embedded & IoT',            domain: 'tech', icon: 'terminal', color: '#FFD166' },
  { id: 'testing',       label: 'QA & Testing',              domain: 'tech', icon: 'check',    color: '#9D7AFF' },
  { id: 'blockchain',    label: 'Blockchain & Web3',         domain: 'tech', icon: 'link',     color: '#FF6B8A' },

  // ─── Design & Create ───
  { id: 'ui-ux-design',  label: 'UI/UX Design',              domain: 'creative', icon: 'sparkle',  color: '#3B82F6', trending: true },
  { id: 'graphic-design', label: 'Graphic Design',           domain: 'creative', icon: 'edit',     color: '#FF6B8A' },
  { id: 'motion-design', label: 'Motion & Animation',        domain: 'creative', icon: 'film',     color: '#9D7AFF' },
  { id: 'content',       label: 'Content Creation',          domain: 'creative', icon: 'edit',     color: '#4ECDC4' },
  { id: 'video-prod',    label: 'Video Production',          domain: 'creative', icon: 'camera',   color: '#FFD166' },
  { id: 'music-audio',   label: 'Music & Audio',             domain: 'creative', icon: 'mic',      color: '#818CF8' },
  { id: 'writing',       label: 'Creative Writing',          domain: 'creative', icon: 'book',     color: '#6EE7B7' },
  { id: 'photography',   label: 'Photography',               domain: 'creative', icon: 'camera',   color: '#E879F9' },

  // ─── Data & Insights ───
  { id: 'data-analysis', label: 'Data Analysis',             domain: 'data', icon: 'chart',    color: '#9D7AFF', trending: true },
  { id: 'machine-learn', label: 'Machine Learning',          domain: 'data', icon: 'target',   color: '#4ECDC4' },
  { id: 'data-eng',      label: 'Data Engineering',          domain: 'data', icon: 'refresh',  color: '#FFD166' },
  { id: 'visualization', label: 'Data Visualization',        domain: 'data', icon: 'eye',      color: '#E879F9' },
  { id: 'statistics',    label: 'Statistics',                domain: 'data', icon: 'gem',      color: '#818CF8' },
  { id: 'sql',           label: 'SQL & Databases',           domain: 'data', icon: 'terminal', color: '#6EE7B7' },
  { id: 'python-data',   label: 'Python for Data',           domain: 'data', icon: 'code',     color: '#FF6B8A' },
  { id: 'bi-tools',      label: 'BI Tools',                  domain: 'data', icon: 'clipboard', color: '#3B82F6' },

  // ─── Languages ───
  { id: 'lang-english',   label: 'English',                  domain: 'languages', icon: 'chat',     color: '#E8C35A', trending: true },
  { id: 'lang-spanish',   label: 'Spanish',                  domain: 'languages', icon: 'chat',     color: '#FF6B8A' },
  { id: 'lang-german',    label: 'German',                   domain: 'languages', icon: 'chat',     color: '#4ECDC4' },
  { id: 'lang-french',    label: 'French',                   domain: 'languages', icon: 'chat',     color: '#9D7AFF' },
  { id: 'lang-japanese',  label: 'Japanese',                 domain: 'languages', icon: 'chat',     color: '#E879F9' },
  { id: 'lang-chinese',   label: 'Chinese (Mandarin)',       domain: 'languages', icon: 'chat',     color: '#818CF8' },
  { id: 'lang-korean',    label: 'Korean',                   domain: 'languages', icon: 'chat',     color: '#6EE7B7' },
  { id: 'lang-other',     label: 'Other Language',           domain: 'languages', icon: 'globe',    color: '#FFD166' },

  // ─── Marketing & Growth ───
  { id: 'digital-mktg',  label: 'Digital Marketing',         domain: 'marketing', icon: 'volume',   color: '#E879F9', trending: true },
  { id: 'social-media',  label: 'Social Media',              domain: 'marketing', icon: 'chat',     color: '#FF6B8A' },
  { id: 'seo',           label: 'SEO & Organic Growth',      domain: 'marketing', icon: 'search',   color: '#4ECDC4' },
  { id: 'copywriting',   label: 'Copywriting',               domain: 'marketing', icon: 'edit',     color: '#FFD166' },
  { id: 'email-mktg',    label: 'Email Marketing',           domain: 'marketing', icon: 'chat',     color: '#818CF8' },
  { id: 'analytics-mktg', label: 'Marketing Analytics',      domain: 'marketing', icon: 'chart',    color: '#9D7AFF' },
  { id: 'brand-strategy', label: 'Brand Strategy',           domain: 'marketing', icon: 'star',     color: '#6EE7B7' },
  { id: 'paid-ads',      label: 'Paid Advertising',          domain: 'marketing', icon: 'trendUp',  color: '#3B82F6' },

  // ─── People & Leadership ───
  { id: 'leadership-eq', label: 'Leadership & EQ',           domain: 'leadership', icon: 'crown',     color: '#6EE7B7', trending: true },
  { id: 'communication', label: 'Communication',             domain: 'leadership', icon: 'chat',      color: '#4ECDC4' },
  { id: 'public-speak',  label: 'Public Speaking',           domain: 'leadership', icon: 'mic',       color: '#FF6B8A' },
  { id: 'negotiation',   label: 'Negotiation',               domain: 'leadership', icon: 'users',     color: '#818CF8' },
  { id: 'productivity',  label: 'Productivity Systems',      domain: 'leadership', icon: 'lightning', color: '#FFD166' },
  { id: 'coaching',      label: 'Coaching & Mentoring',      domain: 'leadership', icon: 'star',      color: '#9D7AFF' },
  { id: 'conflict-res',  label: 'Conflict Resolution',       domain: 'leadership', icon: 'shield',    color: '#E879F9' },
  { id: 'career-growth', label: 'Career Growth',             domain: 'leadership', icon: 'trendUp',   color: '#3B82F6' },

  // ─── Cyber & Security ───
  { id: 'cybersec-fund', label: 'Cybersecurity Fundamentals', domain: 'security', icon: 'shield',   color: '#FF6B8A', trending: true },
  { id: 'ethical-hack',  label: 'Ethical Hacking',           domain: 'security', icon: 'terminal', color: '#4ECDC4' },
  { id: 'network-sec',   label: 'Network Security',          domain: 'security', icon: 'globe',    color: '#818CF8' },
  { id: 'cloud-sec',     label: 'Cloud Security',            domain: 'security', icon: 'cloud',    color: '#6EE7B7' },
  { id: 'sec-ops',       label: 'Security Operations',       domain: 'security', icon: 'gear',     color: '#9D7AFF' },
  { id: 'app-sec',       label: 'Application Security',      domain: 'security', icon: 'lock',     color: '#FFD166' },
  { id: 'compliance',    label: 'Compliance & Risk',          domain: 'security', icon: 'clipboard', color: '#E879F9' },
  { id: 'forensics',     label: 'Digital Forensics',          domain: 'security', icon: 'search',   color: '#3B82F6' },
];

export function getInterestsForDomain(domainId: string): InterestConfig[] {
  return INTERESTS.filter((i) => i.domain === domainId);
}
