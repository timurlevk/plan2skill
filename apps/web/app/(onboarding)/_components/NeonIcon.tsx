'use client';

import React from 'react';
import { t } from './tokens';

// ═══════════════════════════════════════════
// NEON ICON — SVG icon system from v8 style guide
// Inline SVGs with drop-shadow glow on hover/active
// ~28 most-used icons for onboarding flows
// ═══════════════════════════════════════════

const colorMap: Record<string, string> = {
  violet: t.violet,
  cyan: t.cyan,
  rose: t.rose,
  gold: t.gold,
  mint: t.mint,
  indigo: t.indigo,
  fuchsia: t.fuchsia,
  text: t.text,
  muted: t.textMuted,
  secondary: t.textSecondary,
};

function resolveColor(color: string): string {
  return colorMap[color] || (color.startsWith('#') ? color : t.violet);
}

// SVG path data for each icon type
const ICON_PATHS: Record<string, (c: string) => React.ReactNode> = {
  fire: (c) => (
    <>
      <path d="M12 2C6.48 8 4 12 4 15c0 4.42 3.58 8 8 8s8-3.58 8-8c0-3-2.48-7-8-13z" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 12c-1.1 2-2 3.5-2 4.5C10 17.88 10.9 19 12 19s2-1.12 2-2.5c0-1-.9-2.5-2-4.5z" fill={c} opacity="0.6" />
    </>
  ),
  lightning: (c) => (
    <path d="M13 2L4.5 12.5H11L10 22l8.5-12.5H13L13 2z" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  ),
  trophy: (c) => (
    <>
      <path d="M6 4h12v2c0 3.31-2.69 6-6 6S6 9.31 6 6V4z" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 6H4c0 2.21 1.79 4 4 4M18 6h2c0 2.21-1.79 4-4 4M9 18h6M12 12v6" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </>
  ),
  target: (c) => (
    <>
      <circle cx="12" cy="12" r="9" fill="none" stroke={c} strokeWidth="1.8" />
      <circle cx="12" cy="12" r="5" fill="none" stroke={c} strokeWidth="1.5" />
      <circle cx="12" cy="12" r="1.5" fill={c} />
    </>
  ),
  sparkle: (c) => (
    <path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8L12 2z" fill="none" stroke={c} strokeWidth="1.8" strokeLinejoin="round" />
  ),
  check: (c) => (
    <path d="M5 13l4 4L19 7" fill="none" stroke={c} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  ),
  book: (c) => (
    <>
      <path d="M4 4.5C4 3.12 5.12 2 6.5 2H20v20H6.5C5.12 22 4 20.88 4 19.5V4.5z" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 19.5C4 18.12 5.12 17 6.5 17H20" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </>
  ),
  quiz: (c) => (
    <>
      <circle cx="12" cy="12" r="10" fill="none" stroke={c} strokeWidth="1.8" />
      <path d="M9 9c0-1.66 1.34-3 3-3s3 1.34 3 3c0 2-3 2.5-3 4.5M12 17.5v.01" stroke={c} strokeWidth="1.8" strokeLinecap="round" fill="none" />
    </>
  ),
  rocket: (c) => (
    <path d="M12 2C8 6 6 10 6 14l3 3 3-1 3 1 3-3c0-4-2-8-6-12zM9 17l-3 3M15 17l3 3M9 14a1 1 0 110-2 1 1 0 010 2z" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  ),
  shield: (c) => (
    <path d="M12 2l8 4v5c0 5.25-3.38 10.17-8 12-4.62-1.83-8-6.75-8-12V6l8-4z" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  ),
  gem: (c) => (
    <path d="M6 3h12l4 6-10 13L2 9l4-6zM2 9h20M12 22L6 9l6-6 6 6" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  ),
  gift: (c) => (
    <>
      <rect x="3" y="8" width="18" height="14" rx="2" fill="none" stroke={c} strokeWidth="1.8" />
      <path d="M12 8v14M3 12h18M7.5 8C6.12 8 5 6.66 5 5c0-1.66 1.12-3 2.5-3C9.5 2 12 5 12 8M16.5 8C17.88 8 19 6.66 19 5c0-1.66-1.12-3-2.5-3C14.5 2 12 5 12 8" stroke={c} strokeWidth="1.8" strokeLinecap="round" fill="none" />
    </>
  ),
  crown: (c) => (
    <path d="M2 18L5 8l4 4 3-8 3 8 4-4 3 10H2zM2 18h20v2H2v-2z" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  ),
  medal: (c) => (
    <>
      <circle cx="12" cy="14" r="6" fill="none" stroke={c} strokeWidth="1.8" />
      <path d="M8 2l1.5 6M16 2l-1.5 6M9 2h6" stroke={c} strokeWidth="1.8" strokeLinecap="round" fill="none" />
      <path d="M12 11v2M10.5 13.5l1.5-1 1.5 1" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </>
  ),
  coins: (c) => (
    <>
      <ellipse cx="10" cy="9" rx="7" ry="4" fill="none" stroke={c} strokeWidth="1.8" />
      <path d="M3 9v4c0 2.21 3.13 4 7 4M17 9v4c0 2.21-3.13 4-7 4" stroke={c} strokeWidth="1.8" fill="none" />
      <path d="M14 13c2.76-0.56 5-1.93 5-3.5 0-2.21-3.13-4-7-4" stroke={c} strokeWidth="1.8" fill="none" strokeLinecap="round" />
    </>
  ),
  xp: (c) => (
    <>
      <path d="M4 7l4 5-4 5M10 7l4 5-4 5" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 8h5M16 12h5M16 16h5" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
    </>
  ),
  compass: (c) => (
    <>
      <circle cx="12" cy="12" r="10" fill="none" stroke={c} strokeWidth="1.8" />
      <polygon points="16.24,7.76 14.12,14.12 7.76,16.24 9.88,9.88" fill={c} opacity="0.5" stroke={c} strokeWidth="1" />
    </>
  ),
  map: (c) => (
    <path d="M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3V6zM9 3v15M15 6v15" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  ),
  code: (c) => (
    <path d="M16 18l6-6-6-6M8 6l-6 6 6 6" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  ),
  terminal: (c) => (
    <>
      <rect x="3" y="3" width="18" height="18" rx="3" fill="none" stroke={c} strokeWidth="1.8" />
      <path d="M7 15h4M7 9l4 3-4 3" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </>
  ),
  search: (c) => (
    <>
      <circle cx="11" cy="11" r="7" fill="none" stroke={c} strokeWidth="1.8" />
      <path d="M16.5 16.5L21 21" stroke={c} strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  plus: (c) => (
    <path d="M12 5v14M5 12h14" stroke={c} strokeWidth="2.2" strokeLinecap="round" />
  ),
  close: (c) => (
    <path d="M6 6l12 12M18 6L6 18" stroke={c} strokeWidth="2.2" strokeLinecap="round" />
  ),
  star: (c) => (
    <path d="M12 2l2.9 6.3L22 9.3l-5 5.1 1.2 7.1L12 18l-6.2 3.5L7 14.4 2 9.3l7.1-1L12 2z" fill="none" stroke={c} strokeWidth="1.8" strokeLinejoin="round" />
  ),
  mic: (c) => (
    <>
      <rect x="9" y="2" width="6" height="11" rx="3" fill="none" stroke={c} strokeWidth="1.8" />
      <path d="M5 10c0 3.87 3.13 7 7 7s7-3.13 7-7M12 17v5M8 22h8" stroke={c} strokeWidth="1.8" strokeLinecap="round" fill="none" />
    </>
  ),
  clock: (c) => (
    <>
      <circle cx="12" cy="12" r="10" fill="none" stroke={c} strokeWidth="1.8" />
      <path d="M12 6v6l4 2" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </>
  ),
  chart: (c) => (
    <path d="M3 3v18h18M7 16l4-4 4 4 5-5" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  ),
  trendUp: (c) => (
    <path d="M2 17l5.5-5.5L11 15l7-7M22 8h-4v4" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  ),
  // Additional icons for goal categories & data
  globe: (c) => (
    <>
      <circle cx="12" cy="12" r="10" fill="none" stroke={c} strokeWidth="1.8" />
      <path d="M2 12h20M12 2c3 3.6 3 12.4 0 20M12 2c-3 3.6-3 12.4 0 20" stroke={c} strokeWidth="1.5" fill="none" />
    </>
  ),
  lock: (c) => (
    <>
      <rect x="5" y="11" width="14" height="10" rx="2" fill="none" stroke={c} strokeWidth="1.8" />
      <path d="M8 11V7a4 4 0 018 0v4" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
    </>
  ),
  cloud: (c) => (
    <path d="M18 10c1.1 0 2.12.37 2.93 1A4 4 0 1117.5 18H7a5 5 0 01-.42-9.97A7 7 0 0118 10z" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  ),
  refresh: (c) => (
    <path d="M3 12a9 9 0 0115-6.7V2M21 12a9 9 0 01-15 6.7V22M21 5.3h-3v3M3 18.7h3v-3" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  ),
  link: (c) => (
    <path d="M10 14a5 5 0 007.07-7.07L15 5M14 10a5 5 0 00-7.07 7.07L9 19" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  ),
  play: (c) => (
    <>
      <circle cx="12" cy="12" r="10" fill="none" stroke={c} strokeWidth="1.8" />
      <path d="M10 8l6 4-6 4V8z" fill={c} opacity="0.6" stroke={c} strokeWidth="1.2" />
    </>
  ),
  clipboard: (c) => (
    <>
      <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
      <rect x="8" y="2" width="8" height="4" rx="1" fill="none" stroke={c} strokeWidth="1.8" />
    </>
  ),
  volume: (c) => (
    <path d="M11 5L6 9H2v6h4l5 4V5zM15.54 8.46a5 5 0 010 7.07M19.07 4.93a10 10 0 010 14.14" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  ),
  film: (c) => (
    <>
      <rect x="2" y="4" width="20" height="16" rx="2" fill="none" stroke={c} strokeWidth="1.8" />
      <path d="M7 4v16M17 4v16M2 8h5M17 8h5M2 16h5M17 16h5M2 12h20" stroke={c} strokeWidth="1.2" />
    </>
  ),
  edit: (c) => (
    <path d="M17 3l4 4L7 21H3v-4L17 3zM13 7l4 4" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  ),
  camera: (c) => (
    <>
      <path d="M3 7h3l2-3h8l2 3h3a1 1 0 011 1v11a1 1 0 01-1 1H3a1 1 0 01-1-1V8a1 1 0 011-1z" fill="none" stroke={c} strokeWidth="1.8" />
      <circle cx="12" cy="13" r="4" fill="none" stroke={c} strokeWidth="1.8" />
    </>
  ),
  eye: (c) => (
    <>
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12z" fill="none" stroke={c} strokeWidth="1.8" />
      <circle cx="12" cy="12" r="3" fill="none" stroke={c} strokeWidth="1.8" />
    </>
  ),
  sun: (c) => (
    <>
      <circle cx="12" cy="12" r="4" fill="none" stroke={c} strokeWidth="1.8" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
    </>
  ),
  users: (c) => (
    <>
      <circle cx="9" cy="7" r="4" fill="none" stroke={c} strokeWidth="1.8" />
      <path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="17" cy="8" r="3" fill="none" stroke={c} strokeWidth="1.5" />
      <path d="M21 21v-2a3 3 0 00-2-2.83" stroke={c} strokeWidth="1.5" strokeLinecap="round" fill="none" />
    </>
  ),
  chat: (c) => (
    <path d="M21 12c0 4.97-4.03 9-9 9a9.86 9.86 0 01-4.26-.96L3 21l1.26-4.26A8.94 8.94 0 013 12c0-4.97 4.03-9 9-9s9 4.03 9 9z" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  ),
  atom: (c) => (
    <>
      <circle cx="12" cy="12" r="2" fill={c} />
      <ellipse cx="12" cy="12" rx="10" ry="4" fill="none" stroke={c} strokeWidth="1.5" transform="rotate(0 12 12)" />
      <ellipse cx="12" cy="12" rx="10" ry="4" fill="none" stroke={c} strokeWidth="1.5" transform="rotate(60 12 12)" />
      <ellipse cx="12" cy="12" rx="10" ry="4" fill="none" stroke={c} strokeWidth="1.5" transform="rotate(120 12 12)" />
    </>
  ),
  // Wand icon for "all" category
  wand: (c) => (
    <>
      <path d="M3 21l10-10M14 7l3 3" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" />
      <path d="M18 2l4 4-3 3-4-4 3-3z" fill="none" stroke={c} strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M10 3v2M3 10h2M10 17v2M17 10h2" stroke={c} strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
    </>
  ),
  briefcase: (c) => (
    <>
      <rect x="2" y="7" width="20" height="14" rx="2" fill="none" stroke={c} strokeWidth="1.8" />
      <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2M2 12h20" stroke={c} strokeWidth="1.8" fill="none" />
    </>
  ),
  gear: (c) => (
    <>
      <circle cx="12" cy="12" r="3" fill="none" stroke={c} strokeWidth="1.8" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
};

export type NeonIconType = keyof typeof ICON_PATHS;

interface NeonIconProps {
  type: NeonIconType;
  size?: number;
  color?: string;
  active?: boolean;
  style?: React.CSSProperties;
}

export function NeonIcon({ type, size = 24, color = 'violet', active = false, style: extraStyle = {} }: NeonIconProps) {
  const hex = resolveColor(color);
  const render = ICON_PATHS[type];

  if (!render) {
    // Fallback: render a small circle if icon type not found
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={extraStyle}>
        <circle cx="12" cy="12" r="4" fill={hex} opacity="0.5" />
      </svg>
    );
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      style={{
        filter: active ? `drop-shadow(0 0 6px ${hex}80)` : 'none',
        transition: 'filter 0.2s ease, transform 0.15s ease',
        transform: active ? 'scale(1.1)' : 'scale(1)',
        flexShrink: 0,
        ...extraStyle,
      }}
    >
      {render(hex)}
    </svg>
  );
}
