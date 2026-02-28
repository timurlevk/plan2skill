import React from 'react';

export interface StreakBadgeProps {
  streak: number;
  compact?: boolean;
  style?: React.CSSProperties;
}

export function StreakBadge({ streak, compact = false, style }: StreakBadgeProps) {
  const isHot = streak >= 7;
  const color = isHot ? '#FF6B8A' : '#FBBF24';

  if (compact) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          fontSize: 12,
          fontFamily: '"JetBrains Mono", monospace',
          fontWeight: 700,
          color,
          ...style,
        }}
      >
        <span style={{ fontSize: 14 }}>🔥</span>
        {streak}
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '10px 14px',
        borderRadius: 12,
        background: `${color}10`,
        border: `1px solid ${color}20`,
        ...style,
      }}
    >
      <span style={{ fontSize: 20 }}>🔥</span>
      <div>
        <div
          style={{
            fontSize: 16,
            fontWeight: 800,
            fontFamily: '"Plus Jakarta Sans", system-ui',
            color,
          }}
        >
          {streak} day{streak !== 1 ? 's' : ''}
        </div>
        <div style={{ fontSize: 10, color: '#71717A', fontFamily: '"Inter", system-ui' }}>
          {isHot ? 'On fire!' : 'Keep going!'}
        </div>
      </div>
    </div>
  );
}
