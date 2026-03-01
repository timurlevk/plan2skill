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

// Rarity — double-coded (color + shape + icon)
export const rarity = {
  common:    { color: '#71717A', icon: '●',  shape: 'circle'   as const, label: 'Common' },
  uncommon:  { color: '#6EE7B7', icon: '◆',  shape: 'pentagon' as const, label: 'Uncommon' },
  rare:      { color: '#3B82F6', icon: '⬡',  shape: 'hexagon'  as const, label: 'Rare' },
  epic:      { color: '#9D7AFF', icon: '◈',  shape: 'diamond'  as const, label: 'Epic' },
  legendary: { color: '#FFD166', icon: '★',  shape: 'octagon'  as const, label: 'Legendary' },
} as const;

// Skill level → rarity mapping
export const skillLevelRarity = {
  beginner:     rarity.common,
  familiar:     rarity.uncommon,
  intermediate: rarity.rare,
  advanced:     rarity.epic,
} as const;
