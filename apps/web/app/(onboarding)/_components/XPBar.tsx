'use client';

import React, { useState, useEffect } from 'react';
import { getLevelInfo, useI18nStore } from '@plan2skill/store';
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
  const tr = useI18nStore((s) => s.t);
  const info = getLevelInfo(xp);
  const fillFraction = Math.min(info.progress, 1);
  const [animatedFill, setAnimatedFill] = useState(0);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [prevLevel, setPrevLevel] = useState(level);

  // prefers-reduced-motion
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Animate fill bar
  useEffect(() => {
    const timer = setTimeout(() => setAnimatedFill(fillFraction), 50);
    return () => clearTimeout(timer);
  }, [fillFraction]);

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
        {tr('sidebar.xp_short', '{n} XP').replace('{n}', String(xp))}
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
          width: '100%',
          height: '100%',
          borderRadius: 3,
          background: 'linear-gradient(90deg, #9D7AFF, #4ECDC4)',
          transform: `scaleX(${animatedFill})`,
          transformOrigin: 'left',
          transition: reducedMotion ? 'none' : 'transform 0.6s ease-out',
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
        animation: showLevelUp ? (reducedMotion ? 'none' : 'bounceIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)') : 'none',
      }}>
        {tr('xpbar.level_badge', 'L{n}').replace('{n}', String(level))}
      </div>
    </div>
  );
}
