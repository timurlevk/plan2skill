'use client';

import React from 'react';
import Link from 'next/link';
import { NeonIcon } from '../../../(onboarding)/_components/NeonIcon';

const t = {
  display: '"Plus Jakarta Sans", system-ui, sans-serif',
  body: '"Inter", system-ui, sans-serif',
  mono: '"JetBrains Mono", monospace',
  text: '#FFFFFF',
  textSecondary: '#A1A1AA',
  textMuted: '#71717A',
  bgCard: '#18181F',
  bgElevated: '#121218',
  border: '#252530',
  rose: '#FF6B8A',
  gold: '#FFD166',
};

const rarity = {
  epic: { color: '#9D7AFF', icon: '◈' },
};

// UX-R162: Social features opt-in only. Shown only when quietMode is off.
export function SocialCards() {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 16,
        marginBottom: 32,
      }}
    >
      {/* Party Quest Card */}
      <Link href="/league" style={{ textDecoration: 'none' }}>
        <div
          aria-label="Party Quest: Procrastination Dragon boss fight — click to view details"
          style={{
            padding: 20,
            borderRadius: 16,
            background: t.bgCard,
            border: `1px solid ${t.border}`,
            transition: 'border-color 0.2s ease, transform 0.2s ease',
            cursor: 'pointer',
            height: '100%',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = `${t.rose}40`;
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = t.border;
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <NeonIcon type="lightning" size={16} color="rose" />
            <span
              style={{
                fontFamily: t.display,
                fontSize: 11,
                fontWeight: 700,
                color: t.textSecondary,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                flex: 1,
              }}
            >
              Party Quest
            </span>
            <span
              style={{
                fontFamily: t.mono,
                fontSize: 9,
                fontWeight: 700,
                color: rarity.epic.color,
                textTransform: 'uppercase',
              }}
            >
              {rarity.epic.icon} Epic
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: `${t.rose}12`,
                border: `1px solid ${t.rose}25`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
                flexShrink: 0,
              }}
            >
              🐉
            </div>
            <div>
              <div
                style={{
                  fontFamily: t.display,
                  fontSize: 14,
                  fontWeight: 700,
                  color: t.text,
                  marginBottom: 2,
                }}
              >
                Procrastination Dragon
              </div>
              <span style={{ fontFamily: t.body, fontSize: 11, color: t.textMuted }}>
                4 heroes fighting
              </span>
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontFamily: t.mono, fontSize: 9, fontWeight: 700, color: t.rose }}>
                HP
              </span>
              <span
                style={{ fontFamily: t.mono, fontSize: 9, fontWeight: 700, color: t.textMuted }}
              >
                847 / 1200
              </span>
            </div>
            <div
              style={{ height: 6, borderRadius: 3, background: '#252530', overflow: 'hidden' }}
            >
              <div
                style={{
                  width: '70.6%',
                  height: '100%',
                  borderRadius: 3,
                  background: `linear-gradient(90deg, ${t.rose}, #FF8FA3)`,
                  transition: 'width 0.6s ease-out',
                }}
              />
            </div>
          </div>

          <div
            style={{
              fontFamily: t.display,
              fontSize: 12,
              fontWeight: 700,
              color: t.rose,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            Complete quests to deal damage
            <NeonIcon type="compass" size={12} color="rose" />
          </div>
        </div>
      </Link>

      {/* League Card */}
      <Link href="/league" style={{ textDecoration: 'none' }}>
        <div
          aria-label="League: Bronze tier — click to join or view standings"
          style={{
            padding: 20,
            borderRadius: 16,
            background: t.bgCard,
            border: `1px solid ${t.border}`,
            transition: 'border-color 0.2s ease, transform 0.2s ease',
            cursor: 'pointer',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = `${t.gold}40`;
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = t.border;
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <NeonIcon type="trophy" size={16} color="gold" />
            <span
              style={{
                fontFamily: t.display,
                fontSize: 11,
                fontWeight: 700,
                color: t.textSecondary,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                flex: 1,
              }}
            >
              Weekly League
            </span>
            <span
              style={{
                fontFamily: t.mono,
                fontSize: 9,
                fontWeight: 700,
                color: '#CD7F32',
                padding: '2px 8px',
                borderRadius: 8,
                background: 'rgba(205,127,50,0.10)',
                border: '1px solid rgba(205,127,50,0.20)',
                textTransform: 'uppercase',
              }}
            >
              ● Bronze
            </span>
          </div>

          <div
            style={{
              padding: '12px 14px',
              borderRadius: 12,
              background: t.bgElevated,
              border: `1px solid ${t.border}`,
              marginBottom: 12,
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 4,
              }}
            >
              <span
                style={{
                  fontFamily: t.body,
                  fontSize: 12,
                  fontWeight: 600,
                  color: t.textSecondary,
                }}
              >
                Your rank
              </span>
              <span
                style={{ fontFamily: t.mono, fontSize: 16, fontWeight: 800, color: t.text }}
              >
                #— / 30
              </span>
            </div>
            <div style={{ fontFamily: t.body, fontSize: 10, color: t.textMuted }}>
              Top 10 promote · Bottom 5 demote
            </div>
          </div>

          <div
            style={{
              fontFamily: t.display,
              fontSize: 12,
              fontWeight: 700,
              color: t.gold,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            Join Weekly League
            <NeonIcon type="compass" size={12} color="gold" />
          </div>
          <div style={{ fontFamily: t.body, fontSize: 9, color: t.textMuted, marginTop: 4 }}>
            Opt-in · Resets weekly · No pressure
          </div>
        </div>
      </Link>
    </div>
  );
}
