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
