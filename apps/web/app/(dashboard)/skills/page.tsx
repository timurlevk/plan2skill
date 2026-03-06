'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { useSkillStore, useI18nStore } from '@plan2skill/store';
import { t } from '../../(onboarding)/_components/tokens';
import { NeonIcon } from '../../(onboarding)/_components/NeonIcon';

// ═══════════════════════════════════════════
// SKILL MASTERY DASHBOARD — Elo ratings per domain
// Phase W2: Assessment & Skill Elo Wire-Up
// ═══════════════════════════════════════════

/** Elo → rank mapping with visual config */
const ELO_RANKS = [
  { min: 1600, label: 'Grandmaster', color: '#FFD166', icon: '★', glow: '0 0 16px rgba(255,209,102,0.4)' },
  { min: 1450, label: 'Master',      color: '#9D7AFF', icon: '◈', glow: '0 0 12px rgba(157,122,255,0.35)' },
  { min: 1300, label: 'Expert',      color: '#3B82F6', icon: '⬡', glow: '0 0 10px rgba(59,130,246,0.3)' },
  { min: 1150, label: 'Journeyman',  color: '#6EE7B7', icon: '◆', glow: 'none' },
  { min: 1000, label: 'Apprentice',  color: '#A1A1AA', icon: '●', glow: 'none' },
  { min: 800,  label: 'Novice',      color: '#71717A', icon: '●', glow: 'none' },
] as const;

function getEloRank(elo: number): (typeof ELO_RANKS)[number] {
  for (const rank of ELO_RANKS) {
    if (elo >= rank.min) return rank;
  }
  return ELO_RANKS[ELO_RANKS.length - 1]!;
}

/** Normalize Elo to 0-100 for progress bar (800=0%, 2000=100%) */
function eloToPercent(elo: number) {
  return Math.max(0, Math.min(100, ((elo - 800) / 1200) * 100));
}

export default function SkillsPage() {
  const tr = useI18nStore((s) => s.t);
  const skillElos = useSkillStore((s) => s.skillElos);

  const sorted = useMemo(
    () => [...skillElos].sort((a, b) => b.elo - a.elo),
    [skillElos],
  );

  return (
    <div style={{ animation: 'fadeUp 0.4s ease-out' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{
            fontFamily: t.display, fontSize: 24, fontWeight: 900,
            color: t.text, marginBottom: 4,
          }}>
            {tr('dashboard.skill_mastery', 'Skill Mastery')}
          </h1>
          <p style={{ fontFamily: t.body, fontSize: 13, color: t.textSecondary }}>
            {tr('dashboard.skill_subtitle', 'Your Elo ratings across all skill domains')}
          </p>
        </div>
        <Link href="/skills/assessment" style={{ textDecoration: 'none' }}>
          <button style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 20px', borderRadius: 12,
            background: t.gradient, border: 'none',
            fontFamily: t.body, fontSize: 13, fontWeight: 700, color: '#FFF',
            cursor: 'pointer', transition: 'transform 0.15s ease, box-shadow 0.15s ease',
            boxShadow: `0 4px 16px ${t.violet}30`,
          }}>
            <NeonIcon type="lightning" size={16} color="white" />
            {tr('dashboard.take_assessment', 'Take Assessment')}
          </button>
        </Link>
      </div>

      {/* Elo Rank Legend */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24,
        padding: '12px 16px', borderRadius: 12,
        background: t.bgCard, border: `1px solid ${t.border}`,
      }}>
        {ELO_RANKS.map((rank) => (
          <div key={rank.label} style={{
            display: 'flex', alignItems: 'center', gap: 4,
          }}>
            <span style={{ fontSize: 10, color: rank.color }}>{rank.icon}</span>
            <span style={{
              fontFamily: t.mono, fontSize: 10, fontWeight: 600,
              color: rank.color,
            }}>
              {rank.label} ({rank.min}+)
            </span>
          </div>
        ))}
      </div>

      {/* Empty state */}
      {sorted.length === 0 && (
        <div style={{
          padding: '48px 24px', textAlign: 'center',
          borderRadius: 16, background: t.bgCard, border: `1px solid ${t.border}`,
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>&#9876;</div>
          <h2 style={{
            fontFamily: t.display, fontSize: 18, fontWeight: 700,
            color: t.text, marginBottom: 8,
          }}>
            {tr('dashboard.no_skills', 'No Skills Assessed Yet')}
          </h2>
          <p style={{
            fontFamily: t.body, fontSize: 13, color: t.textSecondary,
            marginBottom: 20, maxWidth: 360, margin: '0 auto 20px',
          }}>
            {tr('dashboard.no_skills_desc', 'Take a skill assessment to discover your Elo rating and track your mastery progress.')}
          </p>
          <Link href="/skills/assessment" style={{ textDecoration: 'none' }}>
            <button style={{
              padding: '10px 24px', borderRadius: 12,
              background: t.gradient, border: 'none',
              fontFamily: t.body, fontSize: 13, fontWeight: 700, color: '#FFF',
              cursor: 'pointer',
            }}>
              {tr('dashboard.first_assessment', 'Start First Assessment')}
            </button>
          </Link>
        </div>
      )}

      {/* Skill cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {sorted.map((skill, idx) => {
          const rank = getEloRank(skill.elo);
          const pct = eloToPercent(skill.elo);
          return (
            <div
              key={skill.skillDomain}
              style={{
                padding: '16px 20px', borderRadius: 14,
                background: t.bgCard, border: `1px solid ${t.border}`,
                boxShadow: rank.glow,
                animation: `fadeUp 0.4s ease-out ${idx * 0.06}s both`,
              }}
            >
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginBottom: 10,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 16, color: rank.color }}>{rank.icon}</span>
                  <div>
                    <div style={{
                      fontFamily: t.display, fontSize: 14, fontWeight: 700, color: t.text,
                    }}>
                      {skill.skillDomain}
                    </div>
                    <div style={{
                      fontFamily: t.mono, fontSize: 10, fontWeight: 600, color: rank.color,
                    }}>
                      {rank.label}
                    </div>
                  </div>
                </div>
                <div style={{
                  fontFamily: t.mono, fontSize: 20, fontWeight: 900, color: rank.color,
                }}>
                  {skill.elo}
                </div>
              </div>

              {/* Elo progress bar */}
              <div style={{
                height: 6, borderRadius: 3,
                background: t.border, overflow: 'hidden',
              }}>
                <div style={{
                  width: `${pct}%`, height: '100%', borderRadius: 3,
                  background: rank.color,
                  transition: 'width 0.6s ease-out',
                  boxShadow: rank.glow !== 'none' ? rank.glow : undefined,
                }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
