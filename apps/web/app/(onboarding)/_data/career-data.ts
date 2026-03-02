// ═══════════════════════════════════════════
// CAREER DATA — pain points, career targets
// Step 2C: Career Path
// Icons use NeonIcon SVG system (no emojis)
// ═══════════════════════════════════════════

import type { NeonIconType } from '../_components/NeonIcon';

export interface PainPointConfig {
  id: string;
  label: string;
  icon: NeonIconType;
  color: string;
}

export interface CareerTargetConfig {
  id: string;
  name: string;
  description: string;
  icon: NeonIconType;
  color: string;
  suggestedDomain: string;
}

export const PAIN_POINTS: PainPointConfig[] = [
  { id: 'salary',      label: 'Low salary / compensation', icon: 'coins',   color: '#FFD166' },
  { id: 'growth',      label: 'No growth opportunities',   icon: 'trendUp', color: '#9D7AFF' },
  { id: 'balance',     label: 'Poor work-life balance',    icon: 'clock',   color: '#818CF8' },
  { id: 'toxic',       label: 'Toxic environment',         icon: 'shield',  color: '#FF6B8A' },
  { id: 'security',    label: 'Job insecurity',            icon: 'lock',    color: '#4ECDC4' },
  { id: 'boredom',     label: 'Boredom / no challenge',    icon: 'fire',    color: '#E879F9' },
];

export const CAREER_TARGETS: CareerTargetConfig[] = [
  {
    id: 'tech-transition',
    name: 'Tech & Engineering',
    description: 'Software development, data, or DevOps',
    icon: 'code',
    color: '#4ECDC4',
    suggestedDomain: 'tech',
  },
  {
    id: 'product-transition',
    name: 'Product & Strategy',
    description: 'Product management, UX, or consulting',
    icon: 'chart',
    color: '#9D7AFF',
    suggestedDomain: 'business',
  },
  {
    id: 'creative-transition',
    name: 'Creative & Design',
    description: 'UI/UX, content creation, or brand design',
    icon: 'sparkle',
    color: '#E879F9',
    suggestedDomain: 'creative',
  },
  {
    id: 'data-transition',
    name: 'Data & AI',
    description: 'Data science, analytics, or AI/ML',
    icon: 'target',
    color: '#FFD166',
    suggestedDomain: 'data',
  },
  {
    id: 'marketing-transition',
    name: 'Marketing & Growth',
    description: 'Digital marketing, SEO, or brand strategy',
    icon: 'volume',
    color: '#E879F9',
    suggestedDomain: 'marketing',
  },
  {
    id: 'leadership-transition',
    name: 'Management & Leadership',
    description: 'Team lead, people manager, or executive',
    icon: 'crown',
    color: '#6EE7B7',
    suggestedDomain: 'leadership',
  },
  {
    id: 'security-transition',
    name: 'Cybersecurity',
    description: 'Security analyst, pen tester, or compliance',
    icon: 'shield',
    color: '#FF6B8A',
    suggestedDomain: 'security',
  },
];
