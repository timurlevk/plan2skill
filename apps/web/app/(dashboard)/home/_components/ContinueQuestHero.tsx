'use client';

import React from 'react';
import { NeonIcon } from '../../../(onboarding)/_components/NeonIcon';
import { useReducedMotion } from '../_hooks/useReducedMotion';
import { t, rarity as rarityTokens, ROADMAP_TIERS } from '../../../(onboarding)/_components/tokens';
import { useI18nStore } from '@plan2skill/store';
import type { QuestTask } from '../_utils/quest-templates';

export function getDaysSince(dateStr: string | null): number {
  if (!dateStr) return 999;
  const last = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - last.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

interface ContinueQuestHeroProps {
  /** The next quest to continue (highest priority) */
  nextQuest: QuestTask | null;
  /** Whether all daily quests are completed */
  allDone: boolean;
  /** Number of completed / total quests today */
  dailyCompleted: number;
  dailyTotal: number;
  /** Callback to open the quest modal */
  onStartQuest: (taskId: string) => void;
  /** Days since last activity (absence tier) */
  daysAbsent: number;
  /** First dashboard visit after onboarding */
  isFirstVisit?: boolean;
}

/** Icon map for quest types */
const typeIcon: Record<string, string> = {
  article: 'book',
  quiz: 'quiz',
  project: 'rocket',
  review: 'book',
  boss: 'crown',
  reflection: 'compass',
};

export function ContinueQuestHero({
  nextQuest,
  allDone,
  dailyCompleted,
  dailyTotal,
  onStartQuest,
  daysAbsent,
  isFirstVisit = false,
}: ContinueQuestHeroProps) {
  const tr = useI18nStore((s) => s.t);
  const prefersReduced = useReducedMotion();

  // ── All-Done Celebration ──
  if (allDone && dailyTotal > 0) {
    return (
      <div style={{
        position: 'relative',
        padding: '32px 24px',
        borderRadius: 20,
        background: `radial-gradient(ellipse at 50% 30%, ${t.cyan}12 0%, ${t.bgCard} 70%)`,
        border: `1.5px solid ${t.cyan}25`,
        textAlign: 'center',
        overflow: 'hidden',
        marginBottom: 24,
        animation: prefersReduced.current ? 'none' : 'doneGlow 3s ease-in-out infinite',
      }}>
        <div style={{
          fontSize: 40,
          marginBottom: 12,
          animation: prefersReduced.current ? 'none' : 'celebrateBounce 2s ease-in-out infinite',
        }}>
          <NeonIcon type="trophy" size={40} color={t.gold} />
        </div>
        <div style={{
          fontFamily: t.display, fontSize: 20, fontWeight: 900,
          color: t.text, marginBottom: 6,
        }}>
          {tr('dashboard.all_done', 'All quests completed!')}
        </div>
        <div style={{
          fontFamily: t.body, fontSize: 14, color: t.textSecondary,
        }}>
          {tr('dashboard.all_done_sub', 'Amazing work today, hero! Come back tomorrow for new quests.')}
        </div>
        <div style={{
          fontFamily: t.mono, fontSize: 12, fontWeight: 700,
          color: t.cyan, marginTop: 12,
        }}>
          {dailyCompleted}/{dailyTotal} {tr('dashboard.quests_done', 'quests conquered')}
        </div>
      </div>
    );
  }

  // ── No quest available ──
  if (!nextQuest) {
    return null;
  }

  const r = rarityTokens[nextQuest.rarity] ?? rarityTokens.common;
  const tier = nextQuest.roadmapTier ?? 'diamond';
  const tierStyle = ROADMAP_TIERS[tier];
  const icon = typeIcon[nextQuest.type] ?? 'scroll';

  return (
    <div
      style={{
        position: 'relative',
        padding: '24px 20px',
        borderRadius: 20,
        background: t.bgCard,
        border: '1.5px solid rgba(157,122,255,0.15)',
        overflow: 'hidden',
        marginBottom: 24,
        animation: prefersReduced.current ? 'none' : 'ctaAmbient 6s ease-in-out infinite',
      }}
    >
      {/* ── Scene layer: particles ── */}
      {!prefersReduced.current && (
        <>
          <div aria-hidden="true" style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            boxShadow: '18px 15px 0 0.5px rgba(157,122,255,0.4), 45px 35px 0 0.5px rgba(78,205,196,0.3), 80px 12px 0 0.5px rgba(255,215,0,0.3), 120px 40px 0 0.5px rgba(157,122,255,0.3), 160px 20px 0 0.5px rgba(78,205,196,0.4), 200px 45px 0 0.5px rgba(255,215,0,0.2), 35px 50px 0 0.5px rgba(157,122,255,0.3), 75px 55px 0 0.5px rgba(78,205,196,0.2), 140px 8px 0 0.5px rgba(255,215,0,0.3), 180px 52px 0 0.5px rgba(157,122,255,0.4)',
            animation: 'particleDrift1 9s ease-in-out infinite',
          }} />
          <div aria-hidden="true" style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            boxShadow: '25px 8px 0 0.5px rgba(78,205,196,0.3), 60px 42px 0 0.5px rgba(157,122,255,0.3), 95px 18px 0 0.5px rgba(255,215,0,0.4), 130px 48px 0 0.5px rgba(78,205,196,0.2), 170px 30px 0 0.5px rgba(157,122,255,0.4), 210px 10px 0 0.5px rgba(255,215,0,0.3), 50px 28px 0 0.5px rgba(78,205,196,0.3), 110px 55px 0 0.5px rgba(157,122,255,0.2), 150px 5px 0 0.5px rgba(255,215,0,0.4), 190px 38px 0 0.5px rgba(78,205,196,0.3)',
            animation: 'particleDrift2 13s ease-in-out infinite',
          }} />
        </>
      )}

      {/* ── Scene layer: mystical fog ── */}
      {!prefersReduced.current && (
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.4,
          background: 'radial-gradient(ellipse at 20% 50%, rgba(157,122,255,0.15) 0%, transparent 50%), radial-gradient(ellipse at 80% 30%, rgba(78,205,196,0.1) 0%, transparent 50%), radial-gradient(ellipse at 50% 80%, rgba(255,215,0,0.06) 0%, transparent 50%)',
          backgroundSize: '60% 60%, 50% 50%, 40% 40%',
          animation: 'mistDrift 16s ease-in-out infinite',
        }} />
      )}

      {/* ── Content ── */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Label + absence greeting */}
        <div style={{ marginBottom: 14 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <NeonIcon type="compass" size={16} color="violet" />
            <span style={{
              fontFamily: t.mono, fontSize: 10, fontWeight: 800,
              color: t.violet, textTransform: 'uppercase', letterSpacing: '0.1em',
            }}>
              {tr('dashboard.next_quest', 'Next Quest')}
            </span>
          </div>
          {(isFirstVisit || daysAbsent >= 3) && (
            <div style={{
              fontFamily: t.body, fontSize: 13, color: t.textSecondary,
              marginTop: 6,
            }}>
              {isFirstVisit
                ? tr('welcome.subtitle_new', 'Your first quest awaits, hero!')
                : daysAbsent <= 7
                  ? tr('welcome.subtitle_missed', 'Pick up where you left off with an easy quest.')
                  : daysAbsent <= 30
                    ? tr('welcome.subtitle_refresh', 'Start with something light to rebuild momentum.')
                    : tr('welcome.subtitle_longabsent', 'Great to see you again! Ready for a fresh start?')}
            </div>
          )}
        </div>

        {/* Quest info */}
        <div style={{
          fontFamily: t.display, fontSize: 18, fontWeight: 800,
          color: t.text, marginBottom: 6, lineHeight: 1.3,
        }}>
          {nextQuest.title}
        </div>

        <div style={{
          fontFamily: t.body, fontSize: 13, color: t.textSecondary,
          marginBottom: 14, lineHeight: 1.5,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const,
          overflow: 'hidden',
        }}>
          {nextQuest.desc}
        </div>

        {/* Tags row */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
          marginBottom: 16,
        }}>
          {/* Roadmap tier chip */}
          {nextQuest.roadmapTitle && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              fontFamily: t.mono, fontSize: 9, fontWeight: 800,
              padding: '3px 10px', borderRadius: 10,
              background: tierStyle.bg,
              color: tierStyle.text,
              boxShadow: tierStyle.shadow,
              textShadow: tierStyle.textShadow,
              textTransform: 'uppercase',
            }}>
              {nextQuest.roadmapTitle}
            </span>
          )}

          {/* Type + rarity */}
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            fontFamily: t.mono, fontSize: 9, fontWeight: 700,
            padding: '2px 8px', borderRadius: 8,
            color: r.color, background: `${r.color}12`,
            textTransform: 'uppercase',
          }}>
            <NeonIcon type={icon as any} size={10} color={r.color} />
            {nextQuest.type}
          </span>

          {/* Time estimate */}
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 3,
            fontFamily: t.body, fontSize: 11, color: t.textMuted,
          }}>
            <NeonIcon type="clock" size={11} color="muted" />
            {nextQuest.mins} min
          </span>

          {/* XP */}
          <span style={{
            fontFamily: t.mono, fontSize: 11, fontWeight: 800, color: t.violet,
          }}>
            +{nextQuest.xp} XP
          </span>
        </div>

        {/* CTA button */}
        <button
          onClick={() => onStartQuest(nextQuest.id)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '12px 28px', borderRadius: 14,
            background: t.gradient,
            border: 'none', cursor: 'pointer',
            fontFamily: t.display, fontSize: 14, fontWeight: 800,
            color: '#fff', letterSpacing: '0.02em',
            animation: prefersReduced.current ? 'none' : 'btnGlow 4s ease-in-out infinite',
            transition: 'transform 0.15s ease',
          }}
          onMouseDown={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(0.97)'; }}
          onMouseUp={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
        >
          <NeonIcon type="swords" size={16} color="#fff" />
          {tr('dashboard.begin_quest', 'Begin Quest')}
        </button>
      </div>
    </div>
  );
}
