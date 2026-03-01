'use client';

import React from 'react';
import { NeonIcon } from '../../../(onboarding)/_components/NeonIcon';
import { t } from '../../../(onboarding)/_components/tokens';

interface StatsRowProps {
  level: number;
  currentStreak: number;
  totalXp: number;
  energyCrystals: number;
  maxEnergyCrystals: number;
}

export function StatsRow({ level, currentStreak, totalXp, energyCrystals, maxEnergyCrystals }: StatsRowProps) {
  const stats = [
    { label: 'Level', value: String(level), color: 'violet' as const, icon: 'lightning' as const, ariaLabel: `Level ${level}` },
    { label: 'Streak', value: `${currentStreak} days`, color: 'gold' as const, icon: 'fire' as const, ariaLabel: `${currentStreak} day streak` },
    { label: 'XP', value: String(totalXp), color: 'cyan' as const, icon: 'xp' as const, ariaLabel: `${totalXp} experience points` },
    { label: 'Energy', value: `${energyCrystals}/${maxEnergyCrystals}`, color: 'violet' as const, icon: 'gem' as const, ariaLabel: `${energyCrystals} of ${maxEnergyCrystals} energy crystals` },
  ];

  const hexMap = { violet: t.violet, gold: t.gold, cyan: t.cyan } as const;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4" style={{ gap: 12, marginBottom: 32 }}>
      {stats.map((stat) => {
        const hex = hexMap[stat.color];
        return (
          <div
            key={stat.label}
            role="status"
            aria-label={stat.ariaLabel}
            style={{
              padding: 16, borderRadius: 16,
              background: t.bgCard, border: `1px solid ${t.border}`,
              animation: 'fadeUp 0.4s ease-out',
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
            }}>
              {stat.value}
            </div>
          </div>
        );
      })}
    </div>
  );
}
