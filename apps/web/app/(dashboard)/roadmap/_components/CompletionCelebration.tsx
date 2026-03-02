'use client';

import React, { useMemo } from 'react';
import { useOnboardingStore } from '@plan2skill/store';
import { NeonIcon } from '../../../(onboarding)/_components/NeonIcon';
import { t } from '../../../(onboarding)/_components/tokens';
import { charArtStrings, charPalettes, CHARACTERS } from '../../../(onboarding)/_components/characters';
import { parseArt, AnimatedPixelCanvas } from '../../../(onboarding)/_components/PixelEngine';
import type { RoadmapCompletionStats } from '@plan2skill/types';

// ═══════════════════════════════════════════
// COMPLETION CELEBRATION — BL-008
// Full-viewport overlay, Macro tier (2500ms), interruptible (UX-R164)
// Confetti → title → character → trophy → stats → CTA
// ═══════════════════════════════════════════

interface CompletionCelebrationProps {
  stats: RoadmapCompletionStats | null;
  isTrophyClaim: boolean;
  onSkip: () => void;
  onClaimTrophy: () => void;
}

// Stat row data
function buildStatRows(stats: RoadmapCompletionStats | null) {
  if (!stats) return [];
  return [
    { icon: 'target' as const, label: 'Quests Completed', value: stats.totalQuestsCompleted, color: t.cyan },
    { icon: 'xp' as const, label: 'XP Earned', value: `${stats.totalXpEarned} XP`, color: t.gold },
    { icon: 'fire' as const, label: 'Best Streak', value: `${stats.bestStreak} days`, color: t.gold },
    { icon: 'book' as const, label: 'Skills Mastered', value: stats.skillsMastered.length, color: t.mint },
    { icon: 'clock' as const, label: 'Time Invested', value: `${stats.timeInvestedMinutes} min`, color: t.indigo },
    { icon: 'trophy' as const, label: 'Achievements Unlocked', value: stats.achievementsUnlockedCount, color: t.violet },
  ];
}

// Confetti particles
function ConfettiParticles() {
  const particles = useMemo(() =>
    Array.from({ length: 30 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 2}s`,
      duration: `${2 + Math.random() * 2}s`,
      color: [t.violet, t.cyan, t.gold, t.rose, t.mint, t.fuchsia][i % 6],
      size: 4 + Math.random() * 6,
    })),
  []);

  return (
    <>
      {particles.map((p) => (
        <div
          key={p.id}
          style={{
            position: 'absolute', top: -10,
            left: p.left,
            width: p.size, height: p.size,
            borderRadius: p.id % 3 === 0 ? '50%' : 2,
            background: p.color,
            animation: `confettiFall ${p.duration} ease-in ${p.delay} both`,
            pointerEvents: 'none',
          }}
        />
      ))}
    </>
  );
}

export function CompletionCelebration({
  stats,
  isTrophyClaim,
  onSkip,
  onClaimTrophy,
}: CompletionCelebrationProps) {
  const characterId = useOnboardingStore((s) => s.characterId);
  const charMeta = CHARACTERS.find((c) => c.id === characterId);

  const charData = useMemo(() => {
    if (!characterId || !charArtStrings[characterId] || !charPalettes[characterId]) return null;
    return {
      id: characterId,
      artString: charArtStrings[characterId]!,
      palette: charPalettes[characterId]!,
      art: parseArt(charArtStrings[characterId]!, charPalettes[characterId]!),
    };
  }, [characterId]);

  const statRows = buildStatRows(stats);

  return (
    <div
      onClick={isTrophyClaim ? undefined : onSkip}
      role="dialog"
      aria-label="Quest Line Complete! Celebration"
      aria-modal="true"
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: `${t.bg}F5`,
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        padding: 24,
        overflow: 'auto',
        cursor: isTrophyClaim ? 'default' : 'pointer',
      }}
    >
      {/* Confetti */}
      <ConfettiParticles />

      {/* Title */}
      <h1 style={{
        fontFamily: t.display, fontSize: 32, fontWeight: 900,
        color: t.gold, textAlign: 'center',
        animation: 'celebratePop 0.6s ease-out 0.3s both',
        textShadow: `0 0 20px ${t.gold}40`,
        marginBottom: 16,
      }}>
        Quest Line Complete!
      </h1>

      {/* Character */}
      {charData && (
        <div style={{
          animation: 'bounceIn 0.5s ease-out 0.6s both',
          marginBottom: 16,
        }}>
          <AnimatedPixelCanvas
            character={charData}
            size={4}
            glowColor={charMeta?.color || t.gold}
          />
        </div>
      )}

      {/* Trophy badge */}
      <div style={{
        width: 64, height: 64, borderRadius: 16,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: `${t.gold}15`, border: `2px solid ${t.gold}`,
        boxShadow: `0 0 20px ${t.gold}30`,
        animation: 'slideUp 0.5s ease-out 0.9s both',
        marginBottom: 24,
      }}>
        <NeonIcon type="trophy" size={32} color={t.gold} />
      </div>

      {/* Stats summary card */}
      {stats && (
        <div style={{
          width: '100%', maxWidth: 360,
          padding: 20, borderRadius: 16,
          background: t.bgCard, border: `1px solid ${t.border}`,
          animation: 'fadeUp 0.4s ease-out 1.2s both',
          marginBottom: 24,
        }}>
          {statRows.map((row, i) => (
            <div
              key={row.label}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 0',
                borderBottom: i < statRows.length - 1 ? `1px solid ${t.border}` : 'none',
                animation: `fadeUp 0.3s ease-out ${1.3 + i * 0.1}s both`,
              }}
            >
              <NeonIcon type={row.icon} size={16} color={row.color} />
              <span style={{
                fontFamily: t.body, fontSize: 13, color: t.textSecondary, flex: 1,
              }}>
                {row.label}
              </span>
              <span style={{
                fontFamily: t.mono, fontSize: 14, fontWeight: 800, color: row.color,
              }}>
                {row.value}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* CTA */}
      {isTrophyClaim && (
        <button
          onClick={(e) => { e.stopPropagation(); onClaimTrophy(); }}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '14px 28px', borderRadius: 14,
            background: `linear-gradient(135deg, ${t.gold}, ${t.violet})`,
            border: 'none', cursor: 'pointer',
            animation: 'fadeUp 0.4s ease-out 1.8s both',
            transition: 'transform 0.2s ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
        >
          <NeonIcon type="trophy" size={18} color="#FFF" />
          <span style={{
            fontFamily: t.display, fontSize: 16, fontWeight: 800, color: '#FFF',
          }}>
            Claim Trophy & Continue
          </span>
        </button>
      )}

      {/* Tap to skip hint (during auto-play) */}
      {!isTrophyClaim && (
        <p style={{
          fontFamily: t.body, fontSize: 11, color: t.textMuted,
          position: 'absolute', bottom: 24,
          animation: 'fadeUp 0.3s ease-out 1s both',
        }}>
          Tap anywhere to skip
        </p>
      )}
    </div>
  );
}
