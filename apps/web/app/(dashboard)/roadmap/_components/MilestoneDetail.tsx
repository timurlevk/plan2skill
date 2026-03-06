'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { Milestone } from '@plan2skill/types';
import { NeonIcon } from '../../../(onboarding)/_components/NeonIcon';
import { t, rarity as rarityTokens } from '../../../(onboarding)/_components/tokens';

// ═══════════════════════════════════════════
// MILESTONE DETAIL — BL-007
// Expandable detail panel below timeline on node click
// ═══════════════════════════════════════════

interface MilestoneDetailProps {
  milestone: Milestone;
  isActive: boolean;
}

// Task type → icon mapping
const TASK_TYPE_ICONS: Record<string, 'book' | 'code' | 'sparkle' | 'rocket' | 'refresh' | 'crown'> = {
  video: 'book',
  article: 'book',
  quiz: 'sparkle',
  project: 'rocket',
  review: 'refresh',
  boss: 'crown',
};

export function MilestoneDetail({ milestone, isActive }: MilestoneDetailProps) {
  const router = useRouter();

  // SSR-safe reduced-motion hook (BLOCKER — Крок 9)
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    setReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  // Button press feedback
  const [pressed, setPressed] = useState(false);

  const completedTasks = milestone.tasks.filter((task) => task.status === 'completed').length;
  const totalTasks = milestone.tasks.length;

  return (
    <div
      style={{
        padding: 20, borderRadius: 16,
        background: t.bgCard,
        border: `1px solid ${isActive ? `${t.violet}40` : t.border}`,
        animation: reducedMotion ? 'none' : 'fadeUp 0.3s ease-out',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 10,
          background: isActive ? `${t.violet}15` : `${t.cyan}15`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <NeonIcon
            type={milestone.status === 'completed' ? 'check' : isActive ? 'target' : 'lock'}
            size={18}
            color={milestone.status === 'completed' ? 'cyan' : isActive ? 'violet' : 'muted'}
          />
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{
            fontFamily: t.display, fontSize: 16, fontWeight: 700,
            color: t.text, margin: 0,
          }}>
            {milestone.title}
          </h3>
          <span style={{
            fontFamily: t.mono, fontSize: 10, fontWeight: 700,
            color: t.textMuted,
          }}>
            W{milestone.weekStart}–W{milestone.weekEnd} · {completedTasks}/{totalTasks} quests
          </span>
        </div>
      </div>

      {/* Description */}
      <p style={{
        fontFamily: t.body, fontSize: 13, color: t.textSecondary,
        margin: '0 0 12px', lineHeight: 1.5,
      }}>
        {milestone.description}
      </p>

      {/* Progress bar */}
      <div style={{
        height: 4, borderRadius: 2,
        background: t.border, overflow: 'hidden',
        marginBottom: 16,
      }}>
        <div style={{
          width: '100%',
          transform: `scaleX(${Math.round(milestone.progress) / 100})`,
          transformOrigin: 'left',
          height: '100%', borderRadius: 2,
          background: t.gradient,
          transition: 'transform 0.6s ease-out',
        }} />
      </div>

      {/* Quest list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {milestone.tasks.map((task) => {
          const r = rarityTokens[task.rarity] || rarityTokens.common;
          const isTaskCompleted = task.status === 'completed';
          const typeIcon = TASK_TYPE_ICONS[task.taskType] || 'book';

          return (
            <div
              key={task.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 12px', borderRadius: 10,
                background: isTaskCompleted ? `${t.cyan}06` : 'transparent',
                border: `1px solid ${isTaskCompleted ? `${t.cyan}20` : t.border}`,
                opacity: task.status === 'locked' ? 0.5 : 1,
              }}
            >
              {/* Type icon */}
              <NeonIcon
                type={typeIcon}
                size={14}
                color={isTaskCompleted ? 'cyan' : task.status === 'locked' ? 'muted' : 'violet'}
              />

              {/* Rarity badge (double-coded: color + shape + icon) */}
              <span
                aria-label={`${r.label} rarity`}
                style={{
                  fontFamily: t.mono, fontSize: 9, fontWeight: 700,
                  color: r.color,
                  width: 14, textAlign: 'center',
                }}
              >
                {r.icon}
              </span>

              {/* Title */}
              <span style={{
                fontFamily: t.body, fontSize: 12, fontWeight: 500,
                color: isTaskCompleted ? t.textSecondary : t.text,
                flex: 1,
                textDecoration: isTaskCompleted ? 'line-through' : 'none',
              }}>
                {task.title}
              </span>

              {/* XP reward */}
              <span style={{
                fontFamily: t.mono, fontSize: 10, fontWeight: 700,
                color: t.gold, whiteSpace: 'nowrap',
              }}>
                +{task.xpReward} XP
              </span>

              {/* Status */}
              {isTaskCompleted && (
                <NeonIcon type="check" size={14} color="cyan" />
              )}
            </div>
          );
        })}
      </div>

      {/* CTA — Start Quest */}
      {isActive && (
        <button
          onClick={() => router.push('/home')}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 8, width: '100%', marginTop: 16,
            padding: '12px 20px', borderRadius: 12,
            background: t.gradient, border: 'none',
            cursor: 'pointer',
            transition: 'transform 0.2s ease',
            transform: pressed ? 'scale(0.98)' : 'translateY(0)',
          }}
          onMouseEnter={(e) => { if (!pressed) e.currentTarget.style.transform = 'translateY(-1px)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; setPressed(false); }}
          onMouseDown={() => setPressed(true)}
          onMouseUp={() => setPressed(false)}
        >
          <NeonIcon type="lightning" size={16} color={t.text} />
          <span style={{
            fontFamily: t.display, fontSize: 14, fontWeight: 700, color: t.text,
          }}>
            Start Quest
          </span>
        </button>
      )}
    </div>
  );
}
