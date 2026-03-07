'use client';

import React, { useMemo } from 'react';
import { t, rarity } from '../../../../(onboarding)/_components/tokens';
import { NeonIcon } from '../../../../(onboarding)/_components/NeonIcon';
import type { NeonIconType } from '../../../../(onboarding)/_components/NeonIcon';
import { NPCBubble } from '../../../../(onboarding)/_components/NPCBubble';
import { parseArt, PixelCanvas } from '../../../../(onboarding)/_components/PixelEngine';
import { charArtStrings, charPalettes, CHARACTERS } from '../../../../(onboarding)/_components/characters';
import { useI18nStore } from '@plan2skill/store';
import { TYPE_ICONS, CHALLENGE_TIER } from '../../_utils/quest-templates';
import type { QuestTask } from '../../_utils/quest-templates';

// ===================================================
// BRIEFING SCREEN -- NPC introduces the quest,
// shows objectives, rarity/type badges, time estimate.
// Player presses "Begin Quest" to proceed to content.
// ===================================================

interface BriefingScreenProps {
  task: QuestTask;
  characterId: string | null;
  onBeginQuest: () => void;
  isLoading: boolean;
}

export function BriefingScreen({ task, characterId, onBeginQuest, isLoading }: BriefingScreenProps) {
  const tr = useI18nStore((s) => s.t);

  const r = rarity[task.rarity] as {
    color: string; icon: string; shape: string;
    label: string; bg: string; glow: string;
  };
  const typeInfo = TYPE_ICONS[task.type] ?? { icon: 'sparkle' as NeonIconType, label: task.type };
  const tier = CHALLENGE_TIER[task.rarity] ?? { label: 'Tier I', color: rarity.common.color };

  // Character companion pixel art
  const charData = useMemo(() => {
    if (!characterId || !charArtStrings[characterId] || !charPalettes[characterId]) return null;
    return parseArt(charArtStrings[characterId]!, charPalettes[characterId]!);
  }, [characterId]);
  const charMeta = characterId ? CHARACTERS.find((c) => c.id === characterId) : undefined;

  // NPC intro message
  const npcMessage = tr(
    'quest.briefing.intro',
    `A new quest awaits you, hero! "${task.title}" — read the objectives carefully and prepare yourself.`,
  );

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
      animation: 'fadeUp 0.4s ease-out',
    }}>
      {/* NPC Sage bubble */}
      <NPCBubble characterId="sage" message={npcMessage} emotion="happy" />

      {/* Quest title + badges row */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        padding: '16px 20px',
        borderRadius: 14,
        background: r.bg,
        border: `1px solid ${r.color}30`,
        boxShadow: r.glow,
      }}>
        {/* Title */}
        <h2 style={{
          fontFamily: t.display,
          fontSize: 20,
          fontWeight: 700,
          color: t.text,
          margin: 0,
          lineHeight: 1.3,
        }}>
          {task.title}
        </h2>

        {/* Badge row */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {/* Type badge */}
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            padding: '4px 10px',
            borderRadius: 8,
            background: `${t.violet}14`,
            border: `1px solid ${t.violet}30`,
            fontFamily: t.mono,
            fontSize: 11,
            fontWeight: 600,
            color: t.violet,
          }}>
            <NeonIcon type={typeInfo.icon as NeonIconType} size={14} color="violet" />
            {typeInfo.label}
          </span>

          {/* Rarity badge */}
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            padding: '4px 10px',
            borderRadius: 8,
            background: `${r.color}14`,
            border: `1px solid ${r.color}30`,
            fontFamily: t.mono,
            fontSize: 11,
            fontWeight: 600,
            color: r.color,
          }}>
            {r.icon} {tier.label}
          </span>

          {/* XP badge */}
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            padding: '4px 10px',
            borderRadius: 8,
            background: `${t.gold}14`,
            border: `1px solid ${t.gold}30`,
            fontFamily: t.mono,
            fontSize: 11,
            fontWeight: 600,
            color: t.gold,
          }}>
            <NeonIcon type="xp" size={14} color="gold" />
            {task.xp} XP
          </span>

          {/* Time estimate badge */}
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            padding: '4px 10px',
            borderRadius: 8,
            background: `${t.cyan}14`,
            border: `1px solid ${t.cyan}30`,
            fontFamily: t.mono,
            fontSize: 11,
            fontWeight: 600,
            color: t.cyan,
          }}>
            <NeonIcon type="clock" size={14} color="cyan" />
            ~{task.mins} {tr('quest.briefing.min', 'min')}
          </span>
        </div>

        {/* Description */}
        <p style={{
          fontFamily: t.body,
          fontSize: 14,
          color: t.textSecondary,
          lineHeight: 1.5,
          margin: 0,
        }}>
          {task.desc}
        </p>
      </div>

      {/* Objectives list */}
      <div style={{
        padding: '14px 18px',
        borderRadius: 12,
        background: t.bgCard,
        border: `1px solid ${t.border}`,
      }}>
        <h3 style={{
          fontFamily: t.display,
          fontSize: 14,
          fontWeight: 700,
          color: t.text,
          margin: '0 0 10px 0',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <NeonIcon type="target" size={16} color="cyan" />
          {tr('quest.briefing.objectives', 'Quest Objectives')}
        </h3>

        <ul style={{
          margin: 0,
          padding: 0,
          listStyle: 'none',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}>
          {task.objectives.map((obj, i) => (
            <li key={i} style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 8,
              fontFamily: t.body,
              fontSize: 13,
              color: t.textSecondary,
              lineHeight: 1.45,
            }}>
              <span style={{
                flexShrink: 0,
                width: 20,
                height: 20,
                borderRadius: 6,
                background: `${t.violet}14`,
                border: `1px solid ${t.violet}30`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: t.mono,
                fontSize: 10,
                fontWeight: 700,
                color: t.violet,
              }}>
                {i + 1}
              </span>
              {obj}
            </li>
          ))}
        </ul>
      </div>

      {/* Character companion */}
      {charData && charMeta && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '12px 16px',
          borderRadius: 12,
          background: `${charMeta.color}08`,
          border: `1px solid ${charMeta.color}20`,
        }}>
          <div style={{
            flexShrink: 0,
            filter: `drop-shadow(0 0 6px ${charMeta.color}44)`,
            animation: 'float 3s ease-in-out infinite',
          }}>
            <PixelCanvas data={charData} size={4} />
          </div>
          <p style={{
            fontFamily: t.body,
            fontSize: 13,
            color: t.textSecondary,
            lineHeight: 1.4,
            margin: 0,
          }}>
            {tr(
              'quest.briefing.companion',
              `${charMeta.name} is ready to accompany you on this quest!`,
            )}
          </p>
        </div>
      )}

      {/* Begin Quest CTA */}
      <button
        onClick={onBeginQuest}
        disabled={isLoading}
        style={{
          width: '100%',
          padding: '14px 24px',
          borderRadius: 12,
          border: 'none',
          background: isLoading ? t.bgElevated : t.gradient,
          color: isLoading ? t.textMuted : '#FFFFFF',
          fontFamily: t.display,
          fontSize: 16,
          fontWeight: 700,
          cursor: isLoading ? 'wait' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          transition: 'transform 0.15s ease, box-shadow 0.15s ease',
          boxShadow: isLoading ? 'none' : `0 4px 20px rgba(157,122,255,0.3)`,
          opacity: isLoading ? 0.6 : 1,
        }}
        onMouseDown={(e) => {
          if (!isLoading) (e.currentTarget.style.transform = 'scale(0.97)');
        }}
        onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
      >
        {isLoading ? (
          <>
            <NeonIcon type="refresh" size={18} color="muted" />
            {tr('quest.briefing.loading', 'Preparing quest...')}
          </>
        ) : (
          <>
            <NeonIcon type="swords" size={18} color="text" />
            {tr('quest.briefing.begin', 'Begin Quest')}
          </>
        )}
      </button>
    </div>
  );
}
