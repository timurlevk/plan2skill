'use client';

import React, { useState, useEffect, useRef } from 'react';
import type { Milestone } from '@plan2skill/types';
import { NeonIcon } from '../../../(onboarding)/_components/NeonIcon';
import { t } from '../../../(onboarding)/_components/tokens';

// ═══════════════════════════════════════════
// TIMELINE NODE — BL-007
// Individual milestone node on the horizontal timeline
// ═══════════════════════════════════════════

interface TimelineNodeProps {
  milestone: Milestone;
  index: number;
  totalCount: number;
  isSelected: boolean;
  onClick: () => void;
}

export function TimelineNode({ milestone, index, totalCount, isSelected, onClick }: TimelineNodeProps) {
  // SSR-safe reduced-motion hook (BLOCKER — Крок 9)
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    setReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  // Button press feedback
  const [pressed, setPressed] = useState(false);

  // Completed state flash — briefly flash border cyan when node becomes completed
  const [completedFlash, setCompletedFlash] = useState(false);
  const prevStatusRef = useRef(milestone.status);
  useEffect(() => {
    if (prevStatusRef.current !== 'completed' && milestone.status === 'completed' && !reducedMotion) {
      setCompletedFlash(true);
      const timer = setTimeout(() => setCompletedFlash(false), 300);
      return () => clearTimeout(timer);
    }
    prevStatusRef.current = milestone.status;
  }, [milestone.status, reducedMotion]);

  const isCompleted = milestone.status === 'completed';
  const isActive = milestone.status === 'active';
  const isLocked = milestone.status === 'locked';
  const isBoss = index === totalCount - 1;

  const nodeSize = isBoss ? 36 : 28;

  const bgColor = isCompleted ? t.cyan : isActive ? t.violet : t.border;
  const borderColor = isCompleted ? t.cyan : isActive ? t.violet : t.border;
  const glowShadow = isCompleted
    ? `0 0 10px ${t.cyan}40`
    : isActive
      ? `0 0 12px ${t.violet}40`
      : 'none';

  return (
    <div
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: 6, minWidth: 80, maxWidth: 120,
        scrollSnapAlign: 'center',
      }}
    >
      {/* Node circle */}
      <button
        onClick={onClick}
        role="button"
        aria-label={`Milestone ${index + 1}: ${milestone.title} — ${milestone.status}${isSelected ? ', selected' : ''}`}
        aria-pressed={isSelected}
        style={{
          width: nodeSize, height: nodeSize,
          borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: bgColor,
          border: completedFlash ? `2px solid ${t.cyan}` : `2px solid ${borderColor}`,
          boxShadow: completedFlash
            ? `0 0 16px ${t.cyan}80`
            : isSelected
              ? `0 0 16px ${t.violet}60, ${glowShadow}`
              : glowShadow,
          cursor: isLocked ? 'default' : 'pointer',
          transition: 'box-shadow 0.2s ease, transform 0.2s ease, border-color 0.15s ease',
          animation: isActive ? (reducedMotion ? 'none' : 'pulse 2s ease-in-out infinite') : isBoss && !isLocked ? (reducedMotion ? 'none' : 'glowPulse 8s ease-in-out infinite') : 'none',
          transform: pressed ? 'scale(0.98) translateY(1px)' : 'scale(1)',
          position: 'relative',
          padding: 0,
        }}
        tabIndex={isLocked ? -1 : 0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } }}
        onMouseDown={() => { if (!isLocked) setPressed(true); }}
        onMouseUp={() => setPressed(false)}
        onMouseLeave={() => setPressed(false)}
      >
        {isBoss ? (
          <NeonIcon type="crown" size={16} color={isLocked ? 'muted' : isCompleted ? '#FFF' : t.gold} />
        ) : isCompleted ? (
          <NeonIcon type="check" size={14} color="#FFF" />
        ) : (
          <span style={{
            fontFamily: t.mono, fontSize: 11, fontWeight: 800,
            color: isActive ? '#FFF' : t.textMuted,
          }}>
            {index + 1}
          </span>
        )}
      </button>

      {/* Label */}
      <span style={{
        fontFamily: t.body, fontSize: 10, fontWeight: isSelected ? 700 : 500,
        color: isLocked ? t.textMuted : isSelected ? t.text : t.textSecondary,
        textAlign: 'center',
        lineHeight: 1.2,
        maxWidth: 100,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
      }}>
        {milestone.title}
      </span>
    </div>
  );
}
