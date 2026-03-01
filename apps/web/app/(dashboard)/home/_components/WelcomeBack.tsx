'use client';

import React, { useState, useMemo } from 'react';
import { NeonIcon } from '../../../(onboarding)/_components/NeonIcon';
import { t } from '../../../(onboarding)/_components/tokens';
import { CHARACTERS, charArtStrings, charPalettes } from '../../../(onboarding)/_components/characters';
import { parseArt, PixelCanvas } from '../../../(onboarding)/_components/PixelEngine';

// ═══════════════════════════════════════════
// WELCOME BACK — Return flow greeting (UX-R102)
// Based on lastActivityDate absence duration
// No guilt trip, always positive framing (UX-R141)
// ═══════════════════════════════════════════

interface WelcomeBackProps {
  lastActivityDate: string | null;
  characterId: string | null;
  characterName: string;
}

function getDaysSince(dateStr: string | null): number {
  if (!dateStr) return 999;
  const last = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - last.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

interface WelcomeConfig {
  greeting: string;
  subtitle: string;
  showRecap: boolean;
}

function getWelcomeConfig(days: number, name: string): WelcomeConfig | null {
  if (days < 1) return null; // Same day — no special greeting
  if (days <= 3) return {
    greeting: `Ready for more, ${name}?`,
    subtitle: 'Your quests await, hero!',
    showRecap: false,
  };
  if (days <= 7) return {
    greeting: `We missed you, ${name}!`,
    subtitle: 'Pick up where you left off with an easy quest.',
    showRecap: true,
  };
  if (days <= 30) return {
    greeting: `Let's refresh, ${name}!`,
    subtitle: 'Start with something light to rebuild momentum.',
    showRecap: true,
  };
  return {
    greeting: `Welcome back, ${name}!`,
    subtitle: 'Great to see you again! Ready for a fresh start?',
    showRecap: true,
  };
}

export function WelcomeBack({ lastActivityDate, characterId, characterName }: WelcomeBackProps) {
  const [dismissed, setDismissed] = useState(false);
  const days = getDaysSince(lastActivityDate);
  const config = getWelcomeConfig(days, characterName);

  const charData = useMemo(() => {
    if (!characterId || !charArtStrings[characterId] || !charPalettes[characterId]) return null;
    return parseArt(charArtStrings[characterId]!, charPalettes[characterId]!);
  }, [characterId]);
  const charMeta = CHARACTERS.find(c => c.id === characterId);

  if (!config || dismissed) return null;

  return (
    <div
      role="status"
      aria-label={config.greeting}
      style={{
        display: 'flex', alignItems: 'center', gap: 16,
        padding: '16px 20px', borderRadius: 16,
        background: t.bgCard, border: `1px solid ${t.violet}20`,
        boxShadow: `0 0 20px ${t.violet}08`,
        marginBottom: 24,
        animation: 'fadeUp 0.5s ease-out',
        position: 'relative',
      }}
    >
      {/* Character companion */}
      {charData && (
        <div style={{
          flexShrink: 0,
          filter: `drop-shadow(0 0 6px ${charMeta?.color || t.violet}30)`,
          animation: 'float 3s ease-in-out infinite',
        }}>
          <PixelCanvas data={charData} size={3} />
        </div>
      )}

      {/* Content */}
      <div style={{ flex: 1 }}>
        <div style={{
          fontFamily: t.display, fontSize: 16, fontWeight: 800,
          color: t.text, marginBottom: 2,
        }}>
          {config.greeting}
        </div>
        <div style={{
          fontFamily: t.body, fontSize: 13, color: t.textSecondary,
        }}>
          {config.subtitle}
        </div>
        {config.showRecap && days > 7 && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            marginTop: 8, padding: '4px 12px', borderRadius: 10,
            background: `${t.violet}08`, border: `1px solid ${t.violet}15`,
          }}>
            <NeonIcon type="sparkle" size={12} color="violet" />
            <span style={{
              fontFamily: t.body, fontSize: 11, fontWeight: 600, color: t.violet,
            }}>
              Start with a quick quest to warm up!
            </span>
          </div>
        )}
      </div>

      {/* Dismiss button */}
      <button
        onClick={() => setDismissed(true)}
        aria-label="Dismiss welcome message"
        style={{
          width: 28, height: 28, borderRadius: '50%',
          background: t.border, border: 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', flexShrink: 0,
          minWidth: 44, minHeight: 44,
          margin: '-8px -12px -8px 0',
        }}
      >
        <NeonIcon type="close" size={10} color="muted" />
      </button>
    </div>
  );
}
