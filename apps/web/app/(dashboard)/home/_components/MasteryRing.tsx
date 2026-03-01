'use client';

import React from 'react';
import { t } from '../../../(onboarding)/_components/tokens';

// ─── Mastery Ring — per-skill mastery indicator (Phase 5D) ──────
// Displays SM-2 mastery level as a circular progress ring.
// Design tokens from EFA §6.5 + MASTERY_RING_SPEC.md

const MASTERY_TOKENS = [
  { level: 0, color: '#71717A', ring: 0.0, label: 'New', glow: false },
  { level: 1, color: '#6EE7B7', ring: 0.2, label: 'Attempted', glow: false },
  { level: 2, color: '#3B82F6', ring: 0.4, label: 'Familiar', glow: false },
  { level: 3, color: '#9D7AFF', ring: 0.6, label: 'Proficient', glow: false },
  { level: 4, color: '#4ECDC4', ring: 0.8, label: 'Advanced', glow: false },
  { level: 5, color: '#FFD166', ring: 1.0, label: 'Mastered', glow: true },
];

const DOMAIN_ICONS: Record<string, string> = {
  javascript: '⚡', typescript: '🔷', react: '⚛️', python: '🐍',
  css: '🎨', html: '📄', database: '🗄️', algorithms: '🧮',
  design: '✨', devops: '⚙️', security: '🛡️', testing: '🧪',
  mobile: '📱', ai: '🤖', general: '📚',
};

const SIZES = {
  sm: { size: 48, stroke: 4, icon: 16, radius: 18 },
  md: { size: 72, stroke: 6, icon: 24, radius: 27 },
  lg: { size: 96, stroke: 8, icon: 32, radius: 36 },
} as const;

interface MasteryRingProps {
  masteryLevel: number;
  skillDomain: string;
  isOverdue?: boolean;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  style?: React.CSSProperties;
}

export function MasteryRing({
  masteryLevel,
  skillDomain,
  isOverdue = false,
  showLabel = true,
  size = 'md',
  onClick,
  style,
}: MasteryRingProps) {
  const token = MASTERY_TOKENS[masteryLevel] ?? MASTERY_TOKENS[0];
  const dim = SIZES[size];
  const circumference = 2 * Math.PI * dim.radius;
  const dashOffset = circumference * (1 - (token?.ring ?? 0));
  const domainIcon = DOMAIN_ICONS[skillDomain] ?? DOMAIN_ICONS.general;

  return (
    <div
      onClick={onClick}
      role="img"
      aria-label={`Skill: ${skillDomain}, Mastery: ${token?.label ?? 'New'} (${masteryLevel}/5)`}
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
        cursor: onClick ? 'pointer' : 'default',
        position: 'relative',
        ...style,
      }}
    >
      <div style={{ position: 'relative', width: dim.size, height: dim.size }}>
        <svg
          viewBox={`0 0 ${dim.size} ${dim.size}`}
          width={dim.size}
          height={dim.size}
          style={{
            ...(token?.glow
              ? { filter: `drop-shadow(0 0 8px ${token.color}60)` }
              : {}),
          }}
        >
          {/* Background ring */}
          <circle
            cx={dim.size / 2}
            cy={dim.size / 2}
            r={dim.radius}
            fill="none"
            stroke={t.border}
            strokeWidth={dim.stroke}
          />

          {/* Fill arc */}
          {(token?.ring ?? 0) > 0 && (
            <circle
              cx={dim.size / 2}
              cy={dim.size / 2}
              r={dim.radius}
              fill="none"
              stroke={token?.color ?? '#71717A'}
              strokeWidth={dim.stroke}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              transform={`rotate(-90 ${dim.size / 2} ${dim.size / 2})`}
              style={{ transition: 'stroke-dashoffset 0.8s ease-out, stroke 0.4s ease' }}
            />
          )}

          {/* Center icon */}
          <text
            x={dim.size / 2}
            y={dim.size / 2 + dim.icon * 0.15}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={dim.icon}
          >
            {domainIcon}
          </text>
        </svg>

        {/* Overdue dot */}
        {isOverdue && (
          <div
            aria-label="Review overdue"
            role="status"
            style={{
              position: 'absolute',
              top: 2,
              right: 2,
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#FF6B8A',
            }}
          />
        )}
      </div>

      {/* Label */}
      {showLabel && (
        <span
          style={{
            fontFamily: '"Inter", system-ui, sans-serif',
            fontSize: size === 'sm' ? 9 : 11,
            fontWeight: 600,
            color: token?.color ?? '#71717A',
            textAlign: 'center',
            lineHeight: 1.2,
            maxWidth: dim.size + 8,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {token?.label ?? 'New'}
        </span>
      )}
    </div>
  );
}
