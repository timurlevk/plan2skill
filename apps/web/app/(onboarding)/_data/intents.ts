// ═══════════════════════════════════════════
// INTENTS — 4 onboarding intent configs
// Step 1: Intent Discovery
// Icons use NeonIcon SVG system (no emojis)
// ═══════════════════════════════════════════

import type { NeonIconType } from '../_components/NeonIcon';
import type { OnboardingIntent } from '@plan2skill/types';

export interface IntentConfig {
  id: OnboardingIntent;
  title: string;
  description: string;
  icon: NeonIconType;
  color: string;
  nextRoute: string;
}

export const INTENTS: IntentConfig[] = [
  {
    id: 'know',
    title: 'I know what to learn',
    description: 'I have a specific skill or topic in mind',
    icon: 'target',
    color: '#9D7AFF', // violet
    nextRoute: '/goal/direct',
  },
  {
    id: 'explore_guided',
    title: 'I need direction',
    description: 'I want to grow but not sure where to start',
    icon: 'compass',
    color: '#4ECDC4', // cyan
    nextRoute: '/goal/guided',
  },
  {
    id: 'career',
    title: 'Career change',
    description: 'I want to switch careers or grow in my role',
    icon: 'briefcase',
    color: '#FFD166', // gold
    nextRoute: '/goal/career',
  },
  {
    id: 'exploring',
    title: 'Just exploring',
    description: 'Show me what\'s possible — no commitment',
    icon: 'gem',
    color: '#6EE7B7', // mint
    nextRoute: '/home',
  },
];
