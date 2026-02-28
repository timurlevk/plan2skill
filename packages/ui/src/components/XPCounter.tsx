import React from 'react';

export interface XPCounterProps {
  totalXp: number;
  level: number;
  progress: number; // 0-1
  animated?: boolean;
  compact?: boolean;
  style?: React.CSSProperties;
}

export function XPCounter({
  totalXp,
  level,
  progress,
  animated = true,
  compact = false,
  style,
}: XPCounterProps) {
  if (compact) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          ...style,
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            background: 'linear-gradient(135deg, #9D7AFF 0%, #4ECDC4 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12,
            fontWeight: 700,
            fontFamily: '"JetBrains Mono", monospace',
            color: '#FFF',
          }}
        >
          {level}
        </div>
        <span
          style={{
            fontSize: 12,
            fontFamily: '"JetBrains Mono", monospace',
            color: '#9D7AFF',
            fontWeight: 600,
          }}
        >
          {totalXp.toLocaleString()} XP
        </span>
      </div>
    );
  }

  return (
    <div style={{ ...style }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: 'linear-gradient(135deg, #9D7AFF 0%, #4ECDC4 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 18,
            fontWeight: 800,
            fontFamily: '"Plus Jakarta Sans", system-ui',
            color: '#FFF',
          }}
        >
          {level}
        </div>
        <div>
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              fontFamily: '"Plus Jakarta Sans", system-ui',
              color: '#FFF',
            }}
          >
            Level {level}
          </div>
          <div
            style={{
              fontSize: 12,
              fontFamily: '"JetBrains Mono", monospace',
              color: '#9D7AFF',
              fontWeight: 600,
            }}
          >
            {totalXp.toLocaleString()} XP
          </div>
        </div>
      </div>
      {/* Progress bar */}
      <div
        style={{
          width: '100%',
          height: 6,
          borderRadius: 3,
          background: '#252530',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${Math.round(progress * 100)}%`,
            height: '100%',
            borderRadius: 3,
            background: 'linear-gradient(90deg, #9D7AFF, #4ECDC4)',
            transition: animated ? 'width 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)' : undefined,
          }}
        />
      </div>
    </div>
  );
}
