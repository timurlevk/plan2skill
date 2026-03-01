// ═══════════════════════════════════════════
// ARCHETYPES — 5 learning archetypes
// Extracted for shared use across onboarding + dashboard
// ═══════════════════════════════════════════

export interface ArchetypeData {
  icon: string;
  name: string;
  color: string;
  tagline: string;
  bestFor: string;
  stats: { label: string; value: number }[];
}

export const ARCHETYPES: Record<string, ArchetypeData> = {
  strategist: {
    icon: '◈', name: 'Strategist', color: '#5B7FCC',
    tagline: 'Plan first, execute with precision',
    bestFor: 'People who love structure, roadmaps, and systematic approaches',
    stats: [
      { label: 'Planning', value: 95 },
      { label: 'Analysis', value: 85 },
      { label: 'Focus', value: 80 },
    ],
  },
  explorer: {
    icon: '◎', name: 'Explorer', color: '#2A9D8F',
    tagline: 'Curiosity-driven, always discovering new horizons',
    bestFor: 'People who thrive on variety, experimentation, and new tech',
    stats: [
      { label: 'Discovery', value: 95 },
      { label: 'Adaptability', value: 85 },
      { label: 'Creativity', value: 80 },
    ],
  },
  connector: {
    icon: '◉', name: 'Connector', color: '#E05580',
    tagline: 'Learn through community and collaboration',
    bestFor: 'People who learn best by teaching, sharing, and teaming up',
    stats: [
      { label: 'Influence', value: 95 },
      { label: 'Empathy', value: 85 },
      { label: 'Communication', value: 80 },
    ],
  },
  builder: {
    icon: '▣', name: 'Builder', color: '#E8852E',
    tagline: 'Hands-on, learn by creating real things',
    bestFor: 'People who learn by doing — projects, prototypes, code',
    stats: [
      { label: 'Execution', value: 95 },
      { label: 'Resilience', value: 85 },
      { label: 'Mastery', value: 80 },
    ],
  },
  innovator: {
    icon: '★', name: 'Innovator', color: '#DAA520',
    tagline: 'Think differently, find creative solutions',
    bestFor: 'People who challenge the status quo and find novel approaches',
    stats: [
      { label: 'Creativity', value: 95 },
      { label: 'Vision', value: 85 },
      { label: 'Discovery', value: 80 },
    ],
  },
};
