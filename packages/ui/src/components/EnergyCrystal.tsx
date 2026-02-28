import React from 'react';

export interface EnergyCrystalProps {
  current: number;
  max: number;
  compact?: boolean;
  style?: React.CSSProperties;
}

function CrystalIcon({ filled, size = 20 }: { filled: boolean; size?: number }) {
  return (
    <svg
      width={size}
      height={size * 1.25}
      viewBox="0 0 16 20"
      style={{ opacity: filled ? 1 : 0.2, transition: 'opacity 0.3s ease' }}
    >
      <path
        d="M8 1L14 7L8 19L2 7L8 1Z"
        fill="#9D7AFF"
        stroke="#4ECDC4"
        strokeWidth="1.5"
      />
      <path
        d="M4 7L8 1L8 19"
        fill="none"
        stroke="rgba(255,255,255,0.5)"
        strokeWidth="0.75"
      />
    </svg>
  );
}

export function EnergyCrystal({ current, max, compact = false, style }: EnergyCrystalProps) {
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
          color: '#9D7AFF',
          ...style,
        }}
      >
        <CrystalIcon filled={current > 0} size={12} />
        {current}/{max}
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        ...style,
      }}
    >
      {Array.from({ length: max }, (_, i) => (
        <CrystalIcon key={i} filled={i < current} />
      ))}
      <span
        style={{
          marginLeft: 4,
          fontSize: 11,
          fontFamily: '"JetBrains Mono", monospace',
          color: '#71717A',
        }}
      >
        {current}/{max}
      </span>
    </div>
  );
}
