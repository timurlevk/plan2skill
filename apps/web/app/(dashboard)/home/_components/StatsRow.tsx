'use client';

import React, { useState, useEffect, useRef } from 'react';
import { NeonIcon } from '../../../(onboarding)/_components/NeonIcon';
import { t } from '../../../(onboarding)/_components/tokens';
import { useReducedMotion } from '../_hooks/useReducedMotion';
import { useI18nStore } from '@plan2skill/store';

interface StatsRowProps {
  level: number;
  currentStreak: number;
  totalXp: number;
  coins: number;
  energyCrystals: number;
  maxEnergyCrystals: number;
  onRechargeEnergy?: () => void;
  isRecharging?: boolean;
}

export function StatsRow({ level, currentStreak, totalXp, coins, energyCrystals, maxEnergyCrystals, onRechargeEnergy, isRecharging }: StatsRowProps) {
  // ── Hover state for cards ──
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const tr = useI18nStore((s) => s.t);

  // ── Value-change bounce states (Pavlovian feedback — MICRO_ANIMATION_GUIDELINES §1) ──
  const prevXp = useRef<number | null>(null);
  const prevStreak = useRef<number | null>(null);
  const prevCoins = useRef<number | null>(null);
  const prevCrystals = useRef<number | null>(null);
  const [xpBounce, setXpBounce] = useState(false);
  const [streakBounce, setStreakBounce] = useState(false);
  const [coinBounce, setCoinBounce] = useState(false);
  const [crystalBounce, setCrystalBounce] = useState(false);

  // prefers-reduced-motion guard
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    if (prevXp.current === null) {
      prevXp.current = totalXp;
      return;
    }
    if (totalXp !== prevXp.current && !prefersReduced.current) {
      setXpBounce(true);
      const timer = setTimeout(() => setXpBounce(false), 150);
      prevXp.current = totalXp;
      return () => clearTimeout(timer);
    }
    prevXp.current = totalXp;
  }, [totalXp]);

  useEffect(() => {
    if (prevStreak.current === null) {
      prevStreak.current = currentStreak;
      return;
    }
    if (currentStreak !== prevStreak.current && !prefersReduced.current) {
      setStreakBounce(true);
      const timer = setTimeout(() => setStreakBounce(false), 150);
      prevStreak.current = currentStreak;
      return () => clearTimeout(timer);
    }
    prevStreak.current = currentStreak;
  }, [currentStreak]);

  useEffect(() => {
    if (prevCoins.current === null) {
      prevCoins.current = coins;
      return;
    }
    if (coins !== prevCoins.current && !prefersReduced.current) {
      setCoinBounce(true);
      const timer = setTimeout(() => setCoinBounce(false), 150);
      prevCoins.current = coins;
      return () => clearTimeout(timer);
    }
    prevCoins.current = coins;
  }, [coins]);

  useEffect(() => {
    if (prevCrystals.current === null) {
      prevCrystals.current = energyCrystals;
      return;
    }
    if (energyCrystals !== prevCrystals.current && !prefersReduced.current) {
      setCrystalBounce(true);
      const timer = setTimeout(() => setCrystalBounce(false), 150);
      prevCrystals.current = energyCrystals;
      return () => clearTimeout(timer);
    }
    prevCrystals.current = energyCrystals;
  }, [energyCrystals]);

  // Map label → bounce state
  const bounceMap: Record<string, boolean> = {
    XP: xpBounce,
    Streak: streakBounce,
    Coins: coinBounce,
    Energy: crystalBounce,
  };

  const stats = [
    { label: tr('dashboard.level', 'Level'), value: String(level), color: 'violet' as const, icon: 'lightning' as const, ariaLabel: tr('stats.aria_level', 'Level {n}').replace('{n}', String(level)) },
    { label: tr('dashboard.streak', 'Streak'), value: `${currentStreak} ${tr('stats.days', 'days')}`, color: 'gold' as const, icon: 'fire' as const, ariaLabel: tr('stats.aria_streak', '{n} day streak').replace('{n}', String(currentStreak)) },
    { label: tr('dashboard.xp', 'XP'), value: String(totalXp), color: 'cyan' as const, icon: 'xp' as const, ariaLabel: `${totalXp} experience points` },
    { label: tr('dashboard.coins', 'Coins'), value: String(coins), color: 'gold' as const, icon: 'coins' as const, ariaLabel: `${coins} coins` },
    { label: tr('dashboard.energy', 'Energy'), value: `${energyCrystals}/${maxEnergyCrystals}${energyCrystals < maxEnergyCrystals && onRechargeEnergy ? ' ⟳' : ''}`, color: 'violet' as const, icon: 'gem' as const, ariaLabel: `${energyCrystals} of ${maxEnergyCrystals} energy crystals${energyCrystals < maxEnergyCrystals ? tr('stats.recharge_hint', ', click to recharge') : ''}` },
  ];

  const hexMap = { violet: t.violet, gold: t.gold, cyan: t.cyan } as const;

  return (
    <div className="grid grid-cols-2 md:grid-cols-5" style={{ gap: 12, marginBottom: 32 }}>
      {stats.map((stat, index) => {
        const hex = hexMap[stat.color];
        const isHovered = hoveredCard === index;
        const isBouncing = bounceMap[stat.label] ?? false;
        return (
          <div
            key={stat.label}
            style={{
              animation: `fadeUp 0.4s ease-out ${index * 0.08}s both`,
            }}
          >
            <div
              role={stat.label === 'Energy' && onRechargeEnergy && energyCrystals < maxEnergyCrystals ? 'button' : 'status'}
              tabIndex={stat.label === 'Energy' && onRechargeEnergy && energyCrystals < maxEnergyCrystals ? 0 : undefined}
              aria-label={stat.ariaLabel}
              onClick={stat.label === 'Energy' && onRechargeEnergy && energyCrystals < maxEnergyCrystals && !isRecharging ? onRechargeEnergy : undefined}
              onKeyDown={stat.label === 'Energy' && onRechargeEnergy && energyCrystals < maxEnergyCrystals && !isRecharging
                ? (e: React.KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') onRechargeEnergy(); }
                : undefined}
              onMouseEnter={() => setHoveredCard(index)}
              onMouseLeave={() => setHoveredCard(null)}
              style={{
                padding: 16, borderRadius: 16,
                background: t.bgCard, border: `1px solid ${t.border}`,
                transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
                boxShadow: isHovered ? '0 8px 24px rgba(0,0,0,0.2)' : 'none',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                cursor: stat.label === 'Energy' && onRechargeEnergy && energyCrystals < maxEnergyCrystals ? 'pointer' : 'default',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <NeonIcon type={stat.icon} size={16} color={stat.color} />
                <span style={{ fontFamily: t.body, fontSize: 12, color: t.textSecondary }}>
                  {stat.label}
                </span>
              </div>
              <div style={{
                fontFamily: t.mono, fontSize: 20, fontWeight: 800, color: hex,
                transform: isBouncing ? 'scale(1.15)' : 'scale(1)',
                transition: 'transform 0.15s ease-out',
              }}>
                {stat.value}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
