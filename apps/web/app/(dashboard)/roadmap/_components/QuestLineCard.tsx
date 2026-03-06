'use client';

import React, { useState, useEffect, useRef } from 'react';
import type { Roadmap } from '@plan2skill/types';
import { NeonIcon } from '../../../(onboarding)/_components/NeonIcon';
import type { NeonIconType } from '../../../(onboarding)/_components/NeonIcon';
import { t } from '../../../(onboarding)/_components/tokens';

// ═══════════════════════════════════════════
// QUEST LINE CARD — BL-007 + Phase 5H
// Card grid item for Quest Map hub
// Phase 5H: context menu (adjust/pause/resume), status badges
// ═══════════════════════════════════════════

// ─── Status badge config ────────────────────────────────────────

const STATUS_BADGES: Record<string, { label: string; color: string; icon: NeonIconType; shimmer?: boolean }> = {
  active:     { label: 'Active',     color: t.cyan,   icon: 'lightning' },
  paused:     { label: 'Paused',     color: '#FBBF24', icon: 'shield' },
  completed:  { label: 'Complete!',  color: t.gold,   icon: 'trophy' },
  generating: { label: 'Forging...', color: t.violet, icon: 'fire', shimmer: true },
  archived:   { label: 'Archived',   color: t.textMuted, icon: 'book' },
};

// ─── Context menu action type ───────────────────────────────────

export interface QuestLineAction {
  type: 'adjust' | 'pause' | 'resume' | 'archive';
  roadmapId: string;
}

interface QuestLineCardProps {
  roadmap: Roadmap;
  isActive: boolean;
  onClick: () => void;
  onAction?: (action: QuestLineAction) => void;
}

export function QuestLineCard({ roadmap, isActive, onClick, onAction }: QuestLineCardProps) {
  // SSR-safe reduced-motion hook (BLOCKER — Крок 9)
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    setReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  const [pressed, setPressed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  const isCompleted = roadmap.status === 'completed';
  const isPaused = roadmap.status === 'paused';
  const isGenerating = roadmap.status === 'generating';

  const totalQuests = roadmap.milestones.reduce((sum, m) => sum + m.tasks.length, 0);
  const completedQuests = roadmap.milestones.reduce(
    (sum, m) => sum + m.tasks.filter((task) => task.status === 'completed').length,
    0,
  );

  const borderColor = isCompleted ? t.gold : isPaused ? '#FBBF24' : isActive ? t.violet : t.border;
  const glowShadow = isCompleted
    ? `0 0 16px ${t.gold}30`
    : isActive
      ? `0 0 12px ${t.violet}25`
      : 'none';

  const weekStart = roadmap.milestones[0]?.weekStart ?? 1;
  const weekEnd = roadmap.milestones[roadmap.milestones.length - 1]?.weekEnd ?? weekStart;

  const badge = STATUS_BADGES[roadmap.status] ?? STATUS_BADGES.active!;

  // Build context menu items based on status
  const menuItems: { label: string; icon: NeonIconType; color: string; action: QuestLineAction['type'] }[] = [];
  if (roadmap.status === 'active') {
    menuItems.push(
      { label: 'Adjust Quest Line', icon: 'sparkle', color: t.violet, action: 'adjust' },
      { label: 'Pause Quest Line', icon: 'shield', color: '#FBBF24', action: 'pause' },
    );
  }
  if (roadmap.status === 'paused') {
    menuItems.push(
      { label: 'Resume Quest Line', icon: 'lightning', color: t.cyan, action: 'resume' },
    );
  }
  if (roadmap.status === 'completed') {
    menuItems.push(
      { label: 'Archive Quest Line', icon: 'book', color: t.textMuted, action: 'archive' },
    );
  }

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={onClick}
        role="article"
        aria-label={`${roadmap.title} — ${badge.label}, ${Math.round(roadmap.progress)}% complete, ${completedQuests} of ${totalQuests} quests`}
        style={{
          display: 'flex', flexDirection: 'column', gap: 12,
          padding: 20, borderRadius: 16,
          background: t.bgCard,
          border: `1px solid ${borderColor}`,
          boxShadow: glowShadow,
          cursor: 'pointer',
          textAlign: 'left',
          transition: 'border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease',
          animation: reducedMotion ? 'none' : 'fadeUp 0.4s ease-out both',
          transform: pressed ? 'scale(0.98) translateY(1px)' : 'translateY(0)',
          width: '100%',
          opacity: isPaused ? 0.75 : 1,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = isCompleted ? t.gold : t.violet;
          if (!pressed) e.currentTarget.style.transform = 'translateY(-2px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = borderColor;
          if (!pressed) e.currentTarget.style.transform = 'translateY(0)';
          setPressed(false);
        }}
        onMouseDown={() => setPressed(true)}
        onMouseUp={() => setPressed(false)}
      >
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 12,
            background: isCompleted ? `${t.gold}15` : isPaused ? '#FBBF2415' : `${t.violet}12`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            {isCompleted ? (
              <NeonIcon type="trophy" size={20} color={t.gold} />
            ) : isPaused ? (
              <NeonIcon type="shield" size={20} color="#FBBF24" />
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
              W{weekStart}–W{weekEnd} · {roadmap.dailyMinutes}min/day
            </span>
          </div>

          {/* Status badge */}
          <div style={{
            padding: '3px 10px', borderRadius: 12,
            background: `${badge.color}15`,
            display: 'flex', alignItems: 'center', gap: 4,
            fontFamily: t.mono, fontSize: 9, fontWeight: 800,
            color: badge.color, textTransform: 'uppercase', flexShrink: 0,
            animation: badge.shimmer ? (reducedMotion ? 'none' : 'shimmer 2s linear infinite') : 'none',
            backgroundImage: badge.shimmer
              ? `linear-gradient(90deg, ${badge.color}15, ${badge.color}30, ${badge.color}15)`
              : undefined,
            backgroundSize: badge.shimmer ? '200% 100%' : undefined,
          }}>
            <NeonIcon type={badge.icon} size={10} color={badge.color} />
            {badge.label}
          </div>
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
                    background: msCompleted ? t.cyan : msActive ? t.violet : t.border,
                    border: msActive ? `2px solid ${t.violet}` : 'none',
                    boxShadow: msActive ? `0 0 6px ${t.violet}50` : 'none',
                    animation: msActive && !isPaused ? (reducedMotion ? 'none' : 'pulse 2s ease-in-out infinite') : 'none',
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
            background: t.border, overflow: 'hidden',
          }}>
            <div style={{
              width: '100%',
              transform: `scaleX(${Math.round(roadmap.progress) / 100})`,
              transformOrigin: 'left',
              height: '100%', borderRadius: 2,
              background: isCompleted
                ? `linear-gradient(90deg, ${t.gold}, ${t.cyan})`
                : isPaused
                  ? `linear-gradient(90deg, #FBBF24, ${t.textMuted})`
                  : t.gradient,
              transition: 'transform 0.6s ease-out',
              boxShadow: roadmap.progress >= 85 ? `0 0 6px ${t.cyan}50` : 'none',
              animation: roadmap.progress >= 85 && !isPaused ? (reducedMotion ? 'none' : 'glowPulse 3s ease-in-out infinite') : 'none',
            }} />
          </div>
          <span style={{
            fontFamily: t.mono, fontSize: 10, fontWeight: 700,
            color: isCompleted ? t.gold : isPaused ? '#FBBF24' : t.cyan,
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
              animation: reducedMotion ? 'none' : 'shimmer 2s linear infinite',
              backgroundImage: `linear-gradient(90deg, ${t.violet}, ${t.cyan}, ${t.violet})`,
              backgroundSize: '200% 100%',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              Forging your quest line...
            </span>
          </div>
        )}

        {/* Paused state message */}
        {isPaused && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 12px', borderRadius: 10,
            background: '#FBBF2408',
          }}>
            <NeonIcon type="shield" size={14} color="#FBBF24" />
            <span style={{
              fontFamily: t.body, fontSize: 12, fontWeight: 600,
              color: '#FBBF24',
            }}>
              Quest line paused — resume when ready
            </span>
          </div>
        )}
      </button>

      {/* ─── Context menu trigger (⋯) ─── */}
      {menuItems.length > 0 && onAction && (
        <div ref={menuRef} style={{ position: 'absolute', top: 16, right: 16, zIndex: 10 }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen((prev) => !prev);
            }}
            aria-label="Quest line actions"
            aria-expanded={menuOpen}
            style={{
              width: 28, height: 28, borderRadius: 8,
              background: menuOpen ? `${t.violet}15` : 'transparent',
              border: `1px solid ${menuOpen ? t.violet : 'transparent'}`,
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.15s ease, border-color 0.15s ease',
            }}
            onMouseEnter={(e) => {
              if (!menuOpen) e.currentTarget.style.background = `${t.textMuted}15`;
            }}
            onMouseLeave={(e) => {
              if (!menuOpen) e.currentTarget.style.background = 'transparent';
            }}
          >
            <span style={{
              fontFamily: t.mono, fontSize: 16, fontWeight: 700,
              color: menuOpen ? t.violet : t.textMuted,
              lineHeight: 1, letterSpacing: '1px',
            }}>
              ⋯
            </span>
          </button>

          {/* Dropdown */}
          {menuOpen && (
            <div
              role="menu"
              style={{
                position: 'absolute', top: 32, right: 0,
                minWidth: 200, padding: 4,
                background: t.bgElevated,
                border: `1px solid ${t.border}`,
                borderRadius: 12,
                boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                animation: reducedMotion ? 'none' : 'fadeUp 0.15s ease-out',
              }}
            >
              {menuItems.map((item) => (
                <button
                  key={item.action}
                  role="menuitem"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(false);
                    onAction({ type: item.action, roadmapId: roadmap.id });
                  }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    width: '100%', padding: '10px 12px', borderRadius: 8,
                    background: 'transparent', border: 'none',
                    cursor: 'pointer',
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = `${item.color}10`; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <NeonIcon type={item.icon} size={14} color={item.color} />
                  <span style={{
                    fontFamily: t.display, fontSize: 13, fontWeight: 600,
                    color: t.text,
                  }}>
                    {item.label}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
