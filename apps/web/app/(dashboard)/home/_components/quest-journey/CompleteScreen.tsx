'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { t, rarity } from '../../../../(onboarding)/_components/tokens';
import { NeonIcon } from '../../../../(onboarding)/_components/NeonIcon';
import { NPCBubble } from '../../../../(onboarding)/_components/NPCBubble';
import { AnimatedPixelCanvas } from '../../../../(onboarding)/_components/PixelEngine';
import { charArtStrings, charPalettes, CHARACTERS } from '../../../../(onboarding)/_components/characters';
import { useI18nStore } from '@plan2skill/store';
import type { QuestTask } from '../../_utils/quest-templates';
import type { BonusResult } from '../../_utils/xp-utils';

// ===================================================
// COMPLETE SCREEN -- Victory celebration with animated
// XP counter, score, bonus, attribute growth, streaks,
// character animation, and next quest navigation.
// ===================================================

interface CompleteScreenProps {
  task: QuestTask;
  characterId: string | null;
  score: number;
  total: number;
  bonusResult: BonusResult | null;
  attributeGrowth?: { attribute: string; amount: number }[] | null;
  currentStreak: number;
  dailyCompleted: number;
  dailyTotal: number;
  onClose: () => void;
  onOpenNext: (() => void) | null;
}

/** Animated XP counter that rolls up from 0 to target */
function AnimatedXP({ target, duration = 1200 }: { target: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  const startRef = useRef<number | null>(null);
  const frameRef = useRef<number>(0);

  // Detect reduced motion
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    if (reducedMotion || target === 0) {
      setDisplay(target);
      return;
    }

    const animate = (timestamp: number) => {
      if (startRef.current === null) startRef.current = timestamp;
      const elapsed = timestamp - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out quadratic
      const eased = 1 - (1 - progress) * (1 - progress);
      setDisplay(Math.round(eased * target));

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };

    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [target, duration, reducedMotion]);

  return <>{display}</>;
}

const ATTRIBUTE_COLORS: Record<string, string> = {
  logic: t.cyan,
  creativity: t.violet,
  persistence: t.rose,
  knowledge: t.gold,
  focus: t.mint,
  intuition: t.indigo,
};

export function CompleteScreen({
  task,
  characterId,
  score,
  total,
  bonusResult,
  attributeGrowth,
  currentStreak,
  dailyCompleted,
  dailyTotal,
  onClose,
  onOpenNext,
}: CompleteScreenProps) {
  const tr = useI18nStore((s) => s.t);

  const r = rarity[task.rarity] as {
    color: string; icon: string; shape: string;
    label: string; bg: string; glow: string;
  };

  // Character celebration data
  const charCompanion = useMemo(() => {
    if (!characterId || !charArtStrings[characterId] || !charPalettes[characterId]) return null;
    return {
      id: characterId,
      artString: charArtStrings[characterId]!,
      palette: charPalettes[characterId]!,
    };
  }, [characterId]);
  const charMeta = characterId ? CHARACTERS.find((c) => c.id === characterId) : undefined;

  // Score assessment
  const scorePercent = total > 0 ? Math.round((score / total) * 100) : 100;
  const isPerfect = score === total && total > 0;

  // XP calculation
  const baseXP = task.xp;
  const bonusXP = bonusResult?.bonus ?? 0;
  const totalXP = bonusResult?.total ?? baseXP;

  // NPC celebration message
  const npcMessage = useMemo(() => {
    if (isPerfect) {
      return tr('quest.complete.perfect', 'Flawless victory! A perfect score — you are truly remarkable, hero!');
    }
    if (scorePercent >= 80) {
      return tr('quest.complete.great', 'Excellent work, hero! You have proven your mastery of this quest!');
    }
    return tr('quest.complete.good', 'Quest complete! Every step forward strengthens your abilities, hero.');
  }, [isPerfect, scorePercent, tr]);

  // Confetti particles (stable across renders)
  const confettiParticles = useRef(
    Array.from({ length: 12 }, () => ({
      left: Math.random() * 100,
      delay: Math.random() * 2,
      duration: 2 + Math.random() * 2,
      color: [t.violet, t.cyan, t.gold, t.mint, t.rose][Math.floor(Math.random() * 5)]!,
      size: 4 + Math.random() * 4,
    })),
  ).current;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 16,
      padding: '8px 0',
      animation: 'fadeUp 0.5s ease-out',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Confetti overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}>
        {confettiParticles.map((p, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${p.left}%`,
              top: -10,
              width: p.size,
              height: p.size,
              borderRadius: p.size > 6 ? 2 : '50%',
              background: p.color,
              animation: `confettiFall ${p.duration}s ease-in ${p.delay}s infinite`,
              opacity: 0.7,
            }}
          />
        ))}
      </div>

      {/* Character celebration */}
      {charCompanion && charMeta && (
        <div style={{
          animation: 'celebratePop 0.6s ease-out',
          filter: `drop-shadow(0 0 12px ${charMeta.color}66)`,
          marginBottom: 4,
        }}>
          <AnimatedPixelCanvas
            character={charCompanion}
            size={5}
            glowColor={charMeta.color}
          />
        </div>
      )}

      {/* Victory title */}
      <div style={{ textAlign: 'center' as const }}>
        <h2 style={{
          fontFamily: t.display,
          fontSize: 24,
          fontWeight: 800,
          color: t.text,
          margin: '0 0 4px 0',
          animation: 'bounceIn 0.5s ease-out 0.2s both',
        }}>
          {isPerfect
            ? tr('quest.complete.title_perfect', 'Flawless Victory!')
            : tr('quest.complete.title', 'Quest Complete!')}
        </h2>
        <p style={{
          fontFamily: t.body,
          fontSize: 14,
          color: t.textSecondary,
          margin: 0,
        }}>
          {task.title}
        </p>
      </div>

      {/* NPC bubble */}
      <div style={{ width: '100%' }}>
        <NPCBubble characterId="sage" message={npcMessage} emotion={isPerfect ? 'impressed' : 'happy'} />
      </div>

      {/* XP + Score card */}
      <div style={{
        width: '100%',
        padding: '18px 20px',
        borderRadius: 14,
        background: r.bg,
        border: `1px solid ${r.color}30`,
        boxShadow: r.glow,
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}>
        {/* XP earned */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
        }}>
          <NeonIcon type="xp" size={28} color="gold" active />
          <span style={{
            fontFamily: t.display,
            fontSize: 36,
            fontWeight: 800,
            color: t.gold,
            lineHeight: 1,
          }}>
            +<AnimatedXP target={totalXP} />
          </span>
          <span style={{
            fontFamily: t.mono,
            fontSize: 14,
            fontWeight: 700,
            color: `${t.gold}90`,
          }}>
            XP
          </span>
        </div>

        {/* Bonus XP (if applicable) */}
        {bonusResult?.hasBonus && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            padding: '6px 12px',
            borderRadius: 8,
            background: `${t.gold}14`,
            border: `1px solid ${t.gold}30`,
            animation: 'bounceIn 0.5s ease-out 0.6s both',
          }}>
            <NeonIcon type="sparkle" size={14} color="gold" active />
            <span style={{
              fontFamily: t.mono,
              fontSize: 12,
              fontWeight: 700,
              color: t.gold,
            }}>
              +{bonusXP} {tr('quest.complete.bonus_xp', 'Bonus XP!')}
            </span>
          </div>
        )}

        {/* Score display */}
        {total > 0 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}>
              <NeonIcon type="target" size={16} color={scorePercent >= 80 ? 'mint' : 'secondary'} />
              <span style={{
                fontFamily: t.mono,
                fontSize: 14,
                fontWeight: 600,
                color: scorePercent >= 80 ? t.mint : t.textSecondary,
              }}>
                {score}/{total} ({scorePercent}%)
              </span>
            </div>
            {isPerfect && (
              <span style={{
                fontFamily: t.mono,
                fontSize: 11,
                fontWeight: 700,
                color: t.gold,
                padding: '2px 8px',
                borderRadius: 6,
                background: `${t.gold}14`,
                border: `1px solid ${t.gold}30`,
              }}>
                {tr('quest.complete.perfect_badge', 'PERFECT')}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Attribute growth */}
      {attributeGrowth && attributeGrowth.length > 0 && (
        <div style={{
          width: '100%',
          padding: '14px 18px',
          borderRadius: 12,
          background: t.bgCard,
          border: `1px solid ${t.border}`,
        }}>
          <h3 style={{
            fontFamily: t.display,
            fontSize: 13,
            fontWeight: 700,
            color: t.text,
            margin: '0 0 10px 0',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}>
            <NeonIcon type="trendUp" size={14} color="cyan" />
            {tr('quest.complete.growth', 'Attribute Growth')}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {attributeGrowth.map((attr) => {
              const color = ATTRIBUTE_COLORS[attr.attribute] ?? t.violet;
              return (
                <div
                  key={attr.attribute}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '6px 10px',
                    borderRadius: 8,
                    background: `${color}08`,
                    border: `1px solid ${color}20`,
                  }}
                >
                  <span style={{
                    fontFamily: t.body,
                    fontSize: 13,
                    color: t.textSecondary,
                    textTransform: 'capitalize' as const,
                  }}>
                    {attr.attribute}
                  </span>
                  <span style={{
                    fontFamily: t.mono,
                    fontSize: 13,
                    fontWeight: 700,
                    color,
                  }}>
                    +{attr.amount}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Streak + daily progress */}
      <div style={{
        width: '100%',
        display: 'flex',
        gap: 10,
      }}>
        {/* Streak */}
        <div style={{
          flex: 1,
          padding: '12px 14px',
          borderRadius: 12,
          background: t.bgCard,
          border: `1px solid ${t.border}`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 4,
        }}>
          <NeonIcon type="fire" size={20} color={currentStreak > 0 ? 'rose' : 'muted'} active={currentStreak > 2} />
          <span style={{
            fontFamily: t.display,
            fontSize: 18,
            fontWeight: 800,
            color: currentStreak > 0 ? t.rose : t.textMuted,
          }}>
            {currentStreak}
          </span>
          <span style={{
            fontFamily: t.mono,
            fontSize: 10,
            color: t.textMuted,
            textTransform: 'uppercase' as const,
            letterSpacing: '0.04em',
          }}>
            {tr('quest.complete.streak', 'Streak')}
          </span>
        </div>

        {/* Daily progress */}
        <div style={{
          flex: 1,
          padding: '12px 14px',
          borderRadius: 12,
          background: t.bgCard,
          border: `1px solid ${t.border}`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 4,
        }}>
          <NeonIcon type="compass" size={20} color={dailyCompleted >= dailyTotal ? 'mint' : 'cyan'} active={dailyCompleted >= dailyTotal} />
          <span style={{
            fontFamily: t.display,
            fontSize: 18,
            fontWeight: 800,
            color: dailyCompleted >= dailyTotal ? t.mint : t.cyan,
          }}>
            {dailyCompleted}/{dailyTotal}
          </span>
          <span style={{
            fontFamily: t.mono,
            fontSize: 10,
            color: t.textMuted,
            textTransform: 'uppercase' as const,
            letterSpacing: '0.04em',
          }}>
            {tr('quest.complete.daily', 'Daily')}
          </span>
        </div>
      </div>

      {/* Action buttons */}
      <div style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        marginTop: 4,
      }}>
        {/* Next Quest */}
        {onOpenNext && (
          <button
            onClick={onOpenNext}
            style={{
              width: '100%',
              padding: '14px 24px',
              borderRadius: 12,
              border: 'none',
              background: t.gradient,
              color: '#FFFFFF',
              fontFamily: t.display,
              fontSize: 15,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              boxShadow: '0 4px 20px rgba(157,122,255,0.3)',
              transition: 'transform 0.15s ease',
            }}
            onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.97)'; }}
            onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
          >
            <NeonIcon type="swords" size={16} color="text" />
            {tr('quest.complete.next_quest', 'Next Quest')}
          </button>
        )}

        {/* Return to Command Center */}
        <button
          onClick={onClose}
          style={{
            width: '100%',
            padding: '13px 24px',
            borderRadius: 12,
            border: `1.5px solid ${t.border}`,
            background: 'transparent',
            color: t.textSecondary,
            fontFamily: t.display,
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            transition: 'border-color 0.2s ease, color 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = t.borderHover;
            e.currentTarget.style.color = t.text;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = t.border;
            e.currentTarget.style.color = t.textSecondary;
          }}
        >
          <NeonIcon type="compass" size={16} color="secondary" />
          {tr('quest.complete.return', 'Return to Command Center')}
        </button>
      </div>
    </div>
  );
}
