// ═══════════════════════════════════════════
// DESIGN TOKENS — v8 Style Guide (single source)
// Import from here, never hardcode colors
// ═══════════════════════════════════════════

export const t = {
  // Neon palette
  violet: '#9D7AFF',
  cyan: '#4ECDC4',
  rose: '#FF6B8A',
  gold: '#FFD166',
  mint: '#6EE7B7',
  indigo: '#818CF8',
  fuchsia: '#E879F9',

  // Backgrounds (dark theme)
  bg: '#0C0C10',
  bgCard: '#18181F',
  bgElevated: '#121218',
  border: '#252530',
  borderHover: '#35354A',

  // Text
  text: '#FFFFFF',
  textSecondary: '#A1A1AA',
  textMuted: '#71717A',

  // Gradients
  gradient: 'linear-gradient(135deg, #9D7AFF 0%, #4ECDC4 100%)',

  // Typography
  display: '"Plus Jakarta Sans", system-ui, sans-serif',
  body: '"Inter", system-ui, sans-serif',
  mono: '"JetBrains Mono", monospace',
} as const;

// Rarity — double-coded (color + shape + icon + bg + glow)
// Matches v8 gamification.rarity tokens from style guide
export const rarity = {
  common:    { color: '#71717A', icon: '●',  shape: 'circle'   as const, label: 'Common',    bg: 'rgba(113,113,122,0.08)', glow: 'none' },
  uncommon:  { color: '#6EE7B7', icon: '◆',  shape: 'pentagon' as const, label: 'Uncommon',  bg: 'rgba(110,231,183,0.08)', glow: 'none' },
  rare:      { color: '#3B82F6', icon: '⬡',  shape: 'hexagon'  as const, label: 'Rare',      bg: 'rgba(59,130,246,0.08)',  glow: '0 0 12px rgba(59,130,246,0.3)' },
  epic:      { color: '#9D7AFF', icon: '◈',  shape: 'diamond'  as const, label: 'Epic',      bg: 'rgba(157,122,255,0.08)', glow: '0 0 16px rgba(157,122,255,0.35)' },
  legendary: { color: '#FFD166', icon: '★',  shape: 'octagon'  as const, label: 'Legendary', bg: 'rgba(255,209,102,0.10)', glow: '0 0 20px rgba(255,209,102,0.4)' },
} as const;

// Skill level → rarity mapping
export const skillLevelRarity = {
  beginner:     rarity.common,
  familiar:     rarity.uncommon,
  intermediate: rarity.rare,
  advanced:     rarity.epic,
} as const;

// League tier colors
export const LEAGUE_TIERS = {
  bronze:  { color: '#CD7F32', label: 'Bronze' },
  silver:  { color: '#C0C0C0', label: 'Silver' },
  gold:    { color: '#FFD700', label: 'Gold' },
  diamond: { color: '#4ECDC4', label: 'Diamond' },
} as const;

// Roadmap tier colors — ranked by user activity (diamond = most active)
export const ROADMAP_TIERS = {
  diamond: {
    bg: 'linear-gradient(180deg, #D0F8FF 0%, #8ED8EC 100%)',
    text: '#0A3040',
    shadow: 'inset 0 1px 0 rgba(255,255,255,0.5), inset 0 -1px 0 rgba(0,60,80,0.2), 0 1px 3px rgba(0,0,0,0.4)',
    textShadow: '0 1px 0 rgba(255,255,255,0.3)',
    label: 'Diamond',
  },
  gold: {
    bg: 'linear-gradient(180deg, #FFE566 0%, #D4A800 100%)',
    text: '#3D2800',
    shadow: 'inset 0 1px 0 rgba(255,255,255,0.4), inset 0 -1px 0 rgba(100,60,0,0.25), 0 1px 3px rgba(0,0,0,0.4)',
    textShadow: '0 1px 0 rgba(255,255,255,0.25)',
    label: 'Gold',
  },
  silver: {
    bg: 'linear-gradient(180deg, #D8D8D8 0%, #A0A0A0 100%)',
    text: '#1A1A1A',
    shadow: 'inset 0 1px 0 rgba(255,255,255,0.6), inset 0 -1px 0 rgba(0,0,0,0.15), 0 1px 3px rgba(0,0,0,0.4)',
    textShadow: '0 1px 0 rgba(255,255,255,0.35)',
    label: 'Silver',
  },
  bronze: {
    bg: 'linear-gradient(180deg, #D99548 0%, #A06828 100%)',
    text: '#2A1500',
    shadow: 'inset 0 1px 0 rgba(255,255,255,0.3), inset 0 -1px 0 rgba(80,30,0,0.25), 0 1px 3px rgba(0,0,0,0.4)',
    textShadow: '0 1px 0 rgba(255,255,255,0.15)',
    label: 'Bronze',
  },
} as const;

export type RoadmapTier = keyof typeof ROADMAP_TIERS;
