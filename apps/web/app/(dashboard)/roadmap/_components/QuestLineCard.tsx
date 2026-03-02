'use client';

import React from 'react';
import type { Roadmap } from '@plan2skill/types';
import { NeonIcon } from '../../../(onboarding)/_components/NeonIcon';
import { t } from '../../../(onboarding)/_components/tokens';

// ═══════════════════════════════════════════
// QUEST LINE CARD — BL-007
// Card grid item for Quest Map hub
// ═══════════════════════════════════════════

interface QuestLineCardProps {
  roadmap: Roadmap;
  isActive: boolean;
  onClick: () => void;
}

export function QuestLineCard({ roadmap, isActive, onClick }: QuestLineCardProps) {
  const isCompleted = roadmap.status === 'completed';
  const isGenerating = roadmap.status === 'generating';

  const totalQuests = roadmap.milestones.reduce((sum, m) => sum + m.tasks.length, 0);
  const completedQuests = roadmap.milestones.reduce(
    (sum, m) => sum + m.tasks.filter((task) => task.status === 'completed').length,
    0,
  );

  const borderColor = isCompleted ? t.gold : isActive ? t.violet : t.border;
  const glowShadow = isCompleted
    ? `0 0 16px ${t.gold}30`
    : isActive
      ? `0 0 12px ${t.violet}25`
      : 'none';

  // Week range from milestones
  const weekStart = roadmap.milestones[0]?.weekStart ?? 1;
  const weekEnd = roadmap.milestones[roadmap.milestones.length - 1]?.weekEnd ?? weekStart;

  return (
    <button
      onClick={onClick}
      role="article"
      aria-label={`${roadmap.title} — ${Math.round(roadmap.progress)}% complete, ${completedQuests} of ${totalQuests} quests`}
      style={{
        display: 'flex', flexDirection: 'column', gap: 12,
        padding: 20, borderRadius: 16,
        background: t.bgCard,
        border: `1px solid ${borderColor}`,
        boxShadow: glowShadow,
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'all 0.2s ease',
        animation: 'fadeUp 0.4s ease-out both',
        width: '100%',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = isCompleted ? t.gold : t.violet;
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = borderColor;
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 12,
          background: isCompleted ? `${t.gold}15` : `${t.violet}12`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          {isCompleted ? (
            <NeonIcon type="trophy" size={20} color={t.gold} />
          ) : isGenerating ? (
            <NeonIcon type="fire" size={20} color="violet" />
          ) : (
            <NeonIcon type="target" size={20} color="violet" />
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{
            fontFamily: t.display, fontSize: 15, fontWeight: 700,
            color: t.text, margin: 0,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {roadmap.title}
          </h3>
          <span style={{
            fontFamily: t.mono, fontSize: 10, fontWeight: 700,
            color: t.textMuted,
          }}>
            W{weekStart}–W{weekEnd}
          </span>
        </div>
        {isCompleted && (
          <div style={{
            padding: '3px 10px', borderRadius: 12,
            background: `${t.gold}15`,
            fontFamily: t.mono, fontSize: 9, fontWeight: 800,
            color: t.gold, textTransform: 'uppercase', flexShrink: 0,
          }}>
            Quest Line Complete!
          </div>
        )}
      </div>

      {/* Mini-timeline strip */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 4,
        padding: '6px 0',
      }}>
        {roadmap.milestones.map((ms, i) => {
          const msCompleted = ms.status === 'completed';
          const msActive = ms.status === 'active';
          const isBoss = i === roadmap.milestones.length - 1;

          return (
            <React.Fragment key={ms.id}>
              {i > 0 && (
                <div style={{
                  flex: 1, height: 2, borderRadius: 1,
                  background: msCompleted
                    ? `linear-gradient(90deg, ${t.cyan}, ${t.violet})`
                    : t.border,
                }} />
              )}
              <div
                aria-label={`Milestone ${i + 1}: ${ms.title} — ${ms.status}`}
                style={{
                  width: isBoss ? 12 : 8,
                  height: isBoss ? 12 : 8,
                  borderRadius: '50%',
                  flexShrink: 0,
                  background: msCompleted ? t.cyan : msActive ? t.violet : '#252530',
                  border: msActive ? `2px solid ${t.violet}` : 'none',
                  boxShadow: msActive ? `0 0 6px ${t.violet}50` : 'none',
                  animation: msActive ? 'pulse 2s ease-in-out infinite' : 'none',
                }}
              />
            </React.Fragment>
          );
        })}
      </div>

      {/* Progress bar + stats */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          flex: 1, height: 4, borderRadius: 2,
          background: '#252530', overflow: 'hidden',
        }}>
          <div style={{
            width: `${Math.round(roadmap.progress)}%`,
            height: '100%', borderRadius: 2,
            background: isCompleted
              ? `linear-gradient(90deg, ${t.gold}, ${t.cyan})`
              : t.gradient,
            transition: 'width 0.6s ease-out',
          }} />
        </div>
        <span style={{
          fontFamily: t.mono, fontSize: 10, fontWeight: 700,
          color: isCompleted ? t.gold : t.cyan,
          whiteSpace: 'nowrap',
        }}>
          {completedQuests}/{totalQuests} quests
        </span>
      </div>

      {/* Generating state */}
      {isGenerating && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 12px', borderRadius: 10,
          background: `${t.violet}08`,
        }}>
          <NeonIcon type="fire" size={14} color="violet" />
          <span style={{
            fontFamily: t.body, fontSize: 12, fontWeight: 600,
            color: t.violet,
            animation: 'shimmer 2s linear infinite',
            backgroundImage: `linear-gradient(90deg, ${t.violet}, ${t.cyan}, ${t.violet})`,
            backgroundSize: '200% 100%',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            Forging...
          </span>
        </div>
      )}
    </button>
  );
}
