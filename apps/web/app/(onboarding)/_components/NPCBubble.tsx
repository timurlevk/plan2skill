'use client';

import React from 'react';
import { t } from './tokens';
import { parseArt, PixelCanvas } from './PixelEngine';
import { charArtStrings, charPalettes, CHARACTERS } from './characters';

// ═══════════════════════════════════════════
// NPC BUBBLE — Character conversation bubble
// Used in skills quiz (NPC Conversation format)
// Emotions affect bubble border color
// ═══════════════════════════════════════════

type NPCEmotion = 'neutral' | 'happy' | 'impressed' | 'thinking';

const emotionColors: Record<NPCEmotion, string> = {
  neutral: t.border,
  happy: t.cyan,
  impressed: t.gold,
  thinking: t.violet,
};

interface NPCBubbleProps {
  characterId: string;
  message: string;
  emotion?: NPCEmotion;
  typing?: boolean;
}

/**
 * NPCInline — Compact NPC with float-left avatar and wrapping text.
 * Saves ~24px height vs full NPCBubble. Use on review screens (Pyramid, Proposal, Path).
 */
export function NPCInline({ characterId = 'sage', message, emotion = 'neutral' }: Omit<NPCBubbleProps, 'typing'>) {
  const charId = charArtStrings[characterId] ? characterId : 'sage';
  const artData = parseArt(charArtStrings[charId]!, charPalettes[charId]!);
  const charMeta = CHARACTERS.find(c => c.id === charId);
  const npcColor = charMeta?.color || (charId === 'sage' ? '#B8C4E0' : t.violet);
  const borderColor = emotionColors[emotion];

  return (
    <div style={{
      padding: '10px 12px',
      borderRadius: 12,
      border: `1px solid ${borderColor}40`,
      background: `${borderColor}06`,
      marginBottom: 12,
      animation: 'fadeUp 0.3s ease-out',
      overflow: 'hidden',
    }}>
      {/* Float-left avatar */}
      <div style={{
        float: 'left',
        marginRight: 10,
        marginBottom: 2,
        filter: `drop-shadow(0 0 6px ${npcColor}44)`,
      }}>
        <PixelCanvas data={artData} size={3} />
      </div>
      <p style={{
        fontFamily: t.body,
        fontSize: 13,
        color: t.text,
        lineHeight: 1.45,
        margin: 0,
      }}>
        {message}
      </p>
    </div>
  );
}

export function NPCBubble({ characterId = 'sage', message, emotion = 'neutral', typing = false }: NPCBubbleProps) {
  const charId = charArtStrings[characterId] ? characterId : 'sage';
  const artData = parseArt(charArtStrings[charId]!, charPalettes[charId]!);
  const charMeta = CHARACTERS.find(c => c.id === charId);
  // For NPC-only characters (sage) that aren't in CHARACTERS array
  const npcName = charMeta?.name || (charId === 'sage' ? 'Sage' : charId);
  const npcColor = charMeta?.color || (charId === 'sage' ? '#B8C4E0' : t.violet);
  const borderColor = emotionColors[emotion];

  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: 12,
      marginBottom: 16,
      animation: 'fadeUp 0.4s ease-out',
    }}>
      {/* Character pixel art + label */}
      <div style={{
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
      }}>
        <div style={{
          animation: 'npcBounce 2s ease-in-out infinite',
          filter: `drop-shadow(0 0 8px ${npcColor}44)`,
        }}>
          <PixelCanvas data={artData} size={4} />
        </div>
        <span style={{
          fontFamily: t.mono,
          fontSize: 9,
          fontWeight: 700,
          color: npcColor,
          letterSpacing: '0.04em',
        }}>
          {npcName}
        </span>
      </div>

      {/* Speech bubble */}
      <div style={{
        flex: 1,
        background: t.bgCard,
        borderRadius: '4px 16px 16px 16px',
        border: `1.5px solid ${borderColor}`,
        padding: '12px 16px',
        position: 'relative',
        boxShadow: emotion !== 'neutral' ? `0 0 12px ${borderColor}20` : 'none',
        transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
      }}>
        {typing ? (
          <div style={{
            display: 'flex',
            gap: 4,
            padding: '4px 0',
          }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: t.textMuted,
                animation: `pulse 1s ease-in-out ${i * 0.2}s infinite`,
              }} />
            ))}
          </div>
        ) : (
          <p style={{
            fontFamily: t.body,
            fontSize: 14,
            color: t.text,
            lineHeight: 1.5,
            margin: 0,
          }}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
