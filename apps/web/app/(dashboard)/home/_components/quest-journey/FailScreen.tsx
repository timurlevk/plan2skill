'use client';

import React, { useMemo } from 'react';
import { t } from '../../../../(onboarding)/_components/tokens';
import { NeonIcon } from '../../../../(onboarding)/_components/NeonIcon';
import { NPCBubble } from '../../../../(onboarding)/_components/NPCBubble';
import { parseArt, PixelCanvas } from '../../../../(onboarding)/_components/PixelEngine';
import { charArtStrings, charPalettes, CHARACTERS } from '../../../../(onboarding)/_components/characters';
import { useI18nStore } from '@plan2skill/store';
import type { QuestTask } from '../../_utils/quest-templates';

// ===================================================
// FAIL SCREEN -- Shows when trial score is too low.
// Offers retry or review-material paths with NPC
// encouragement to keep the player motivated.
// ===================================================

interface FailScreenProps {
  task: QuestTask;
  characterId: string | null;
  score: number;
  total: number;
  onRetryTrial: () => void;
  onReviewMaterial: () => void;
}

export function FailScreen({
  task,
  characterId,
  score,
  total,
  onRetryTrial,
  onReviewMaterial,
}: FailScreenProps) {
  const tr = useI18nStore((s) => s.t);

  const scorePercent = total > 0 ? Math.round((score / total) * 100) : 0;

  // Character pixel art
  const charArt = useMemo(() => {
    if (!characterId || !charArtStrings[characterId] || !charPalettes[characterId]) return null;
    return parseArt(charArtStrings[characterId]!, charPalettes[characterId]!);
  }, [characterId]);
  const charMeta = characterId ? CHARACTERS.find((c) => c.id === characterId) : undefined;

  // NPC encouragement message
  const npcMessage = useMemo(() => {
    if (score === 0) {
      return tr(
        'quest.fail.npc_zero',
        'Every master was once a beginner, hero. Review the material and try again — you will prevail!',
      );
    }
    if (scorePercent > 0 && scorePercent < 50) {
      return tr(
        'quest.fail.npc_low',
        'You\'re on the right path! A quick review of the content will sharpen your skills. Let\'s go again!',
      );
    }
    return tr(
      'quest.fail.npc_close',
      'So close! You almost had it. A quick refresher and you\'ll conquer this trial. I believe in you!',
    );
  }, [score, scorePercent, tr]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 16,
      padding: '8px 0',
      animation: 'fadeUp 0.4s ease-out',
    }}>
      {/* Character (dimmed/shaking for dramatic effect) */}
      {charArt && charMeta && (
        <div style={{
          filter: `drop-shadow(0 0 8px ${charMeta.color}44) grayscale(0.3)`,
          animation: 'shake 0.5s ease-out',
        }}>
          <PixelCanvas data={charArt} size={5} />
        </div>
      )}

      {/* Defeat title */}
      <div style={{ textAlign: 'center' as const }}>
        <h2 style={{
          fontFamily: t.display,
          fontSize: 22,
          fontWeight: 800,
          color: t.rose,
          margin: '0 0 4px 0',
        }}>
          {tr('quest.fail.title', 'Trial Not Passed')}
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

      {/* Score display */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        padding: '18px 24px',
        borderRadius: 14,
        background: `${t.rose}08`,
        border: `1px solid ${t.rose}20`,
        width: '100%',
      }}>
        {/* Score circle */}
        <div style={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          border: `3px solid ${t.rose}50`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
        }}>
          <span style={{
            fontFamily: t.display,
            fontSize: 22,
            fontWeight: 800,
            color: t.rose,
            lineHeight: 1,
          }}>
            {score}
          </span>
          <span style={{
            fontFamily: t.mono,
            fontSize: 10,
            color: `${t.rose}90`,
          }}>
            /{total}
          </span>
        </div>

        <span style={{
          fontFamily: t.mono,
          fontSize: 12,
          color: t.textMuted,
        }}>
          {scorePercent}% — {tr('quest.fail.need_pass', 'need 60% to pass')}
        </span>
      </div>

      {/* NPC encouragement */}
      <div style={{ width: '100%' }}>
        <NPCBubble characterId="sage" message={npcMessage} emotion="thinking" />
      </div>

      {/* Action buttons */}
      <div style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        marginTop: 4,
      }}>
        {/* Retry Trial */}
        <button
          onClick={onRetryTrial}
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
          <NeonIcon type="refresh" size={16} color="text" />
          {tr('quest.fail.retry', 'Retry Trial')}
        </button>

        {/* Review Material */}
        <button
          onClick={onReviewMaterial}
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
          <NeonIcon type="book" size={16} color="secondary" />
          {tr('quest.fail.review', 'Review Material')}
        </button>
      </div>

      {/* Motivational footer */}
      <p style={{
        fontFamily: t.body,
        fontSize: 12,
        color: t.textMuted,
        textAlign: 'center' as const,
        fontStyle: 'italic',
        margin: 0,
      }}>
        {tr(
          'quest.fail.motivational',
          '"The only true failure is giving up. Every retry makes you stronger."',
        )}
      </p>
    </div>
  );
}
