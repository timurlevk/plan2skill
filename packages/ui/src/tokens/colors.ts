// ─── Brand / Neon Colors ─────────────────────────────────────────
export const colors = {
  violet: '#9D7AFF',
  indigo: '#818CF8',
  rose: '#FF6B8A',
  coral: '#FF8A80',
  cyan: '#4ECDC4',
  mint: '#6EE7B7',
  gold: '#FFD166',
  amber: '#FBBF24',
  fuchsia: '#E879F9',
} as const;

// ─── Dark Palette ────────────────────────────────────────────────
export const dark = {
  950: '#09090B',
  900: '#0C0C10',
  850: '#121218',
  800: '#18181F',
  700: '#252530',
  600: '#35354A',
} as const;

// ─── Light Palette ───────────────────────────────────────────────
export const light = {
  50: '#FAFAFA',
  100: '#F5F5F7',
  150: '#EFEFEF',
  200: '#E5E5E8',
  300: '#D4D4D8',
  400: '#A1A1AA',
  500: '#71717A',
  600: '#52525B',
  900: '#18181B',
} as const;

// ─── Gradients ───────────────────────────────────────────────────
export const gradients = {
  primary: 'linear-gradient(135deg, #9D7AFF 0%, #4ECDC4 100%)',
  success: 'linear-gradient(135deg, #4ECDC4 0%, #6EE7B7 100%)',
  warm: 'linear-gradient(135deg, #FFD166 0%, #FF8A80 100%)',
  violet: 'linear-gradient(135deg, #9D7AFF 0%, #818CF8 100%)',
  rose: 'linear-gradient(135deg, #FF6B8A 0%, #E879F9 100%)',
} as const;

// ─── Glow Effects ────────────────────────────────────────────────
export const glows = {
  violet: '0 0 20px rgba(157, 122, 255, 0.3)',
  rose: '0 0 20px rgba(255, 107, 138, 0.3)',
  cyan: '0 0 20px rgba(78, 205, 196, 0.3)',
  gold: '0 0 20px rgba(255, 209, 102, 0.3)',
  fuchsia: '0 0 20px rgba(232, 121, 249, 0.3)',
} as const;

// ─── Theme Tokens ────────────────────────────────────────────────
export const themeDark = {
  bg: dark[900],
  bgElevated: dark[850],
  bgCard: dark[800],
  border: dark[700],
  text: '#FFFFFF',
  textSecondary: light[400],
  textMuted: light[500],
} as const;

export const themeLight = {
  bg: light[50],
  bgElevated: light[100],
  bgCard: '#FFFFFF',
  border: light[200],
  text: light[900],
  textSecondary: light[500],
  textMuted: light[400],
} as const;

export type Theme = typeof themeDark;

// ─── Archetype Colors ────────────────────────────────────────────
export const archetypeColors = {
  strategist: '#5B7FCC',
  explorer: '#2A9D8F',
  connector: '#E05580',
  builder: '#E8852E',
  innovator: '#DAA520',
} as const;

// ─── Rarity Colors ──────────────────────────────────────────────
export const rarityColors = {
  common: { color: '#71717A', bg: 'rgba(113,113,122,0.08)', glow: null },
  uncommon: { color: '#6EE7B7', bg: 'rgba(110,231,183,0.08)', glow: null },
  rare: { color: '#3B82F6', bg: 'rgba(59,130,246,0.08)', glow: '0 0 12px rgba(59,130,246,0.3)' },
  epic: {
    color: '#9D7AFF',
    bg: 'rgba(157,122,255,0.08)',
    glow: '0 0 16px rgba(157,122,255,0.3)',
  },
  legendary: {
    color: '#FFD166',
    bg: 'rgba(255,209,102,0.1)',
    glow: '0 0 20px rgba(255,209,102,0.4)',
  },
} as const;

// ─── Attribute Colors ────────────────────────────────────────────
export const attributeColors = {
  MAS: '#9D7AFF',
  INS: '#3B82F6',
  INF: '#FF6B8A',
  RES: '#6EE7B7',
  VER: '#4ECDC4',
  DIS: '#FFD166',
} as const;
