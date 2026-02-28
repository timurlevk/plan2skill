import React from 'react';

export interface ProgressBarProps {
  progress: number; // 0-100
  color?: string;
  gradient?: string;
  height?: number;
  showLabel?: boolean;
  animated?: boolean;
  style?: React.CSSProperties;
}

export function ProgressBar({
  progress,
  color = '#9D7AFF',
  gradient,
  height = 6,
  showLabel = false,
  animated = true,
  style,
}: ProgressBarProps) {
  const clampedProgress = Math.max(0, Math.min(100, progress));
  const fill = gradient || color;

  return (
    <div style={{ width: '100%', ...style }}>
      {showLabel && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            marginBottom: 4,
            fontSize: 10,
            fontFamily: '"JetBrains Mono", monospace',
            color: '#A1A1AA',
          }}
        >
          {Math.round(clampedProgress)}%
        </div>
      )}
      <div
        style={{
          width: '100%',
          height,
          borderRadius: height / 2,
          background: '#252530',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${clampedProgress}%`,
            height: '100%',
            borderRadius: height / 2,
            background: fill,
            transition: animated ? 'width 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)' : undefined,
          }}
        />
      </div>
    </div>
  );
}
