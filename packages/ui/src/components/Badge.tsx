import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  color?: string;
  bgColor?: string;
  glow?: string | null;
  size?: 'sm' | 'md';
  style?: React.CSSProperties;
}

export function Badge({
  children,
  color = '#9D7AFF',
  bgColor,
  glow,
  size = 'sm',
  style,
}: BadgeProps) {
  const bg = bgColor || `${color}14`;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: size === 'sm' ? '2px 8px' : '3px 10px',
        borderRadius: 100,
        fontSize: size === 'sm' ? 10 : 12,
        fontWeight: 700,
        fontFamily: '"JetBrains Mono", monospace',
        color,
        background: bg,
        border: `1px solid ${color}30`,
        letterSpacing: '0.04em',
        boxShadow: glow || undefined,
        ...style,
      }}
    >
      {children}
    </span>
  );
}
