'use client';

import React, { useState, useEffect } from 'react';
import { t, rarity as rarityTokens } from './tokens';
import { parseArt, PixelCanvas } from './PixelEngine';

// ═══════════════════════════════════════════
// EQUIPMENT REVEAL — Loot reveal animation
// cardFlip → glowPulse → pixel art → claim
// Rarity glow color from gamification tokens
// ═══════════════════════════════════════════

type RarityKey = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

// Code Hammer pixel art (10×10)
const codeHammerArt = `
..HHHHH...
.HHHHHHH..
.HhHHHhH..
..HHHHH...
....HH....
....WW....
....WW....
....WW....
...WWWW...
...WWWW...
`.trim();

const codeHammerPalette: Record<string, string> = {
  H: '#9D7AFF',
  h: '#B794FF',
  W: '#71717A',
};

interface EquipmentRevealProps {
  slot: string;
  name: string;
  rarity: RarityKey;
  onClaim: () => void;
}

export function EquipmentReveal({ slot, name, rarity: rarityKey, onClaim }: EquipmentRevealProps) {
  const [phase, setPhase] = useState<'hidden' | 'flipping' | 'revealed' | 'claimed'>('hidden');
  const rarityConfig = rarityTokens[rarityKey];
  const artData = parseArt(codeHammerArt, codeHammerPalette);

  useEffect(() => {
    // Start reveal sequence
    const t1 = setTimeout(() => setPhase('flipping'), 300);
    const t2 = setTimeout(() => setPhase('revealed'), 1200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  if (phase === 'hidden') {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        padding: 40,
      }}>
        <div style={{
          width: 120,
          height: 150,
          borderRadius: 16,
          background: t.bgCard,
          border: `2px solid ${t.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <span style={{
            fontSize: 32,
            color: t.textMuted,
            animation: 'pulse 1.5s ease-in-out infinite',
          }}>
            ?
          </span>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      animation: phase === 'flipping' ? 'cardFlip 0.8s ease-out' : 'none',
    }}>
      {/* Equipment card */}
      <div style={{
        width: 160,
        padding: '28px 20px 24px',
        borderRadius: 20,
        background: t.bgCard,
        border: `2px solid ${rarityConfig.color}`,
        boxShadow: `0 0 24px ${rarityConfig.color}30, 0 0 48px ${rarityConfig.color}10`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        marginBottom: 20,
        animation: phase === 'revealed' ? 'glowPulse 2s ease-in-out infinite' : 'none',
      }}>
        {/* Rarity badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          padding: '3px 10px',
          borderRadius: 8,
          background: `${rarityConfig.color}15`,
          marginBottom: 16,
          animation: 'bounceIn 0.5s ease-out 0.3s both',
        }}>
          <span style={{
            fontSize: 12,
            color: rarityConfig.color,
          }}>
            {rarityConfig.icon}
          </span>
          <span style={{
            fontFamily: t.mono,
            fontSize: 10,
            fontWeight: 700,
            color: rarityConfig.color,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}>
            {rarityConfig.label}
          </span>
        </div>

        {/* Pixel art */}
        <div style={{
          marginBottom: 16,
          filter: `drop-shadow(0 0 12px ${rarityConfig.color}55)`,
          animation: 'bounceIn 0.6s ease-out 0.5s both',
        }}>
          <PixelCanvas data={artData} size={6} />
        </div>

        {/* Name */}
        <span style={{
          fontFamily: t.display,
          fontSize: 16,
          fontWeight: 800,
          color: t.text,
          textAlign: 'center',
          marginBottom: 4,
          animation: 'fadeUp 0.4s ease-out 0.7s both',
        }}>
          {name}
        </span>

        {/* Slot */}
        <span style={{
          fontFamily: t.mono,
          fontSize: 11,
          color: t.textMuted,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          animation: 'fadeUp 0.4s ease-out 0.8s both',
        }}>
          {slot} slot
        </span>
      </div>

      {/* Claim button */}
      {phase === 'revealed' && (
        <button
          onClick={() => { setPhase('claimed'); onClaim(); }}
          style={{
            width: '100%',
            maxWidth: 220,
            padding: '14px 0',
            borderRadius: 16,
            border: 'none',
            background: t.gradient,
            color: '#FFF',
            fontFamily: t.display,
            fontSize: 15,
            fontWeight: 700,
            cursor: 'pointer',
            animation: 'bounceIn 0.5s ease-out 1s both',
            boxShadow: `0 0 20px ${t.violet}30`,
          }}
        >
          Claim & Continue
        </button>
      )}

      {phase === 'claimed' && (
        <div style={{
          fontFamily: t.display,
          fontSize: 16,
          fontWeight: 700,
          color: t.cyan,
          animation: 'celebratePop 0.5s ease-out',
        }}>
          Equipped!
        </div>
      )}
    </div>
  );
}
