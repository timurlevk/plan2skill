'use client';

import React, { useState, useEffect } from 'react';
import { t } from './tokens';

// ═══════════════════════════════════════════
// XP BAR — Persistent XP indicator
// Shows: current XP / next level, level badge, animated fill
// Integrated into StepBar (below step progress dots)
// ═══════════════════════════════════════════

interface XPBarProps {
  xp: number;
  level: number;
}

export function XPBar({ xp, level }: XPBarProps) {
  const xpForNextLevel = level * 100;
  const xpInCurrentLevel = xp - (level - 1) * 100;
  const fillPct = Math.min((xpInCurrentLevel / 100) * 100, 100);
  const [animatedFill, setAnimatedFill] = useState(0);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [prevLevel, setPrevLevel] = useState(level);

  // Animate fill bar
  useEffect(() => {
    const timer = setTimeout(() => setAnimatedFill(fillPct), 50);
    return () => clearTimeout(timer);
  }, [fillPct]);

  // Level-up celebration
  useEffect(() => {
    if (level > prevLevel) {
      setShowLevelUp(true);
      const timer = setTimeout(() => setShowLevelUp(false), 1500);
      setPrevLevel(level);
      return () => clearTimeout(timer);
    }
    setPrevLevel(level);
  }, [level]);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      marginBottom: 8,
    }}>
      {/* XP label */}
      <span style={{
        fontFamily: t.mono,
        fontSize: 10,
        fontWeight: 700,
        color: t.gold,
        whiteSpace: 'nowrap',
      }}>
        {xp} XP
      </span>

      {/* XP bar */}
      <div style={{
        flex: 1,
        height: 6,
        borderRadius: 3,
        background: '#252530',
        overflow: 'hidden',
        position: 'relative',
      }}>
        <div style={{
          width: `${animatedFill}%`,
          height: '100%',
          borderRadius: 3,
          background: 'linear-gradient(90deg, #9D7AFF, #4ECDC4)',
          transition: 'width 0.6s ease-out',
          boxShadow: '0 0 8px rgba(157,122,255,0.3)',
        }} />
      </div>

      {/* Level badge */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 28,
        height: 20,
        borderRadius: 10,
        background: `${t.violet}20`,
        border: `1px solid ${t.violet}40`,
        fontFamily: t.mono,
        fontSize: 10,
        fontWeight: 800,
        color: t.violet,
        animation: showLevelUp ? 'bounceIn 0.6s ease-out' : 'none',
      }}>
        L{level}
      </div>
    </div>
  );
}
