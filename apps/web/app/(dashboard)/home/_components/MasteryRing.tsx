'use client';

import React, { useState, useEffect, useRef } from 'react';
import { t } from '../../../(onboarding)/_components/tokens';
import { useI18nStore } from '@plan2skill/store';

// ─── Mastery Ring — per-skill mastery indicator (Phase 5D) ──────
// Displays SM-2 mastery level as a circular progress ring.
// Design tokens from EFA §6.5 + MASTERY_RING_SPEC.md

const MASTERY_TOKENS = [
  { level: 0, color: t.textMuted, ring: 0.0, label: 'New', labelKey: 'mastery.new', glow: false },
  { level: 1, color: t.mint, ring: 0.2, label: 'Attempted', labelKey: 'mastery.attempted', glow: false },
  { level: 2, color: t.indigo, ring: 0.4, label: 'Familiar', labelKey: 'mastery.familiar', glow: false },
  { level: 3, color: t.violet, ring: 0.6, label: 'Proficient', labelKey: 'mastery.proficient', glow: false },
  { level: 4, color: t.cyan, ring: 0.8, label: 'Advanced', labelKey: 'mastery.advanced', glow: false },
  { level: 5, color: t.gold, ring: 1.0, label: 'Mastered', labelKey: 'mastery.mastered', glow: true },
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
  const tr = useI18nStore((s) => s.t);
  const token = MASTERY_TOKENS[masteryLevel] ?? MASTERY_TOKENS[0];
  const dim = SIZES[size];
  const circumference = 2 * Math.PI * dim.radius;
  const dashOffset = circumference * (1 - (token?.ring ?? 0));
  const domainIcon = DOMAIN_ICONS[skillDomain] ?? DOMAIN_ICONS.general;

  // Hover state for interactive rings
  const [isHovered, setIsHovered] = useState(false);

  // prefers-reduced-motion guard
  const prefersReduced = useRef(false);
  useEffect(() => {
    prefersReduced.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  const isMastered = masteryLevel === 5;

  return (
    <div
      onClick={onClick}
      onMouseEnter={onClick ? () => setIsHovered(true) : undefined}
      onMouseLeave={onClick ? () => setIsHovered(false) : undefined}
      role="img"
      aria-label={tr('mastery.aria_ring', 'Skill: {domain}, Mastery: {label} ({level}/5)').replace('{domain}', skillDomain).replace('{label}', tr(token?.labelKey ?? 'mastery.new', token?.label ?? 'New')).replace('{level}', String(masteryLevel))}
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
        cursor: onClick ? 'pointer' : 'default',
        position: 'relative',
        transform: isHovered && onClick ? 'scale(1.05)' : 'scale(1)',
        transition: 'transform 0.2s ease',
        ...style,
      }}
    >
      {/* Mastered glow wrapper — animated boxShadow for level 5, guarded */}
      <div style={{
        position: 'relative', width: dim.size, height: dim.size,
        borderRadius: '50%',
        ...(isMastered && !prefersReduced.current
          ? { animation: 'glowPulse 8s ease-in-out infinite', boxShadow: `0 0 12px ${token?.color ?? t.gold}40` }
          : {}),
      }}>
        <svg
          viewBox={`0 0 ${dim.size} ${dim.size}`}
          width={dim.size}
          height={dim.size}
          style={{
            ...(token?.glow && prefersReduced.current
              ? { filter: `drop-shadow(0 0 8px ${token.color}60)` }
              : {}),
            ...(token?.glow && !prefersReduced.current
              ? {} // glow handled by wrapper animation
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
              stroke={token?.color ?? t.textMuted}
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

        {/* Overdue dot — pulse animation when due, guarded by reduced-motion */}
        {isOverdue && (
          <div
            aria-label={tr('mastery.aria_overdue', 'Review overdue')}
            role="status"
            style={{
              position: 'absolute',
              top: 2,
              right: 2,
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: t.rose,
              animation: prefersReduced.current ? 'none' : 'pulse 2s ease-in-out infinite',
            }}
          />
        )}
      </div>

      {/* Label */}
      {showLabel && (
        <span
          style={{
            fontFamily: t.body,
            fontSize: size === 'sm' ? 9 : 11,
            fontWeight: 600,
            color: token?.color ?? t.textMuted,
            textAlign: 'center',
            lineHeight: 1.2,
            maxWidth: dim.size + 8,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {tr(token?.labelKey ?? 'mastery.new', token?.label ?? 'New')}
        </span>
      )}
    </div>
  );
}
