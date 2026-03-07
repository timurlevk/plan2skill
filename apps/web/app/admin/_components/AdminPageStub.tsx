'use client';

import React from 'react';
import { t } from '../../(onboarding)/_components/tokens';
import { NeonIcon } from '../../(onboarding)/_components/NeonIcon';

// Reusable placeholder for admin pages not yet implemented.
// Each page will replace this with real content as features are built.

interface AdminPageStubProps {
  title: string;
  description: string;
  icon: string;
  features: string[];
  priority: 'P0' | 'P1' | 'P2';
}

const PRIORITY_COLORS: Record<string, string> = {
  P0: t.rose,
  P1: t.gold,
  P2: t.textMuted,
};

export function AdminPageStub({ title, description, icon, features, priority }: AdminPageStubProps) {
  const prioColor = PRIORITY_COLORS[priority] || t.textMuted;
  return (
    <div style={{ maxWidth: 800 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
        <NeonIcon type={icon as any} size={28} color="violet" />
        <h1 style={{
          fontFamily: t.display, fontSize: 24, fontWeight: 800,
          color: t.text, margin: 0,
        }}>
          {title}
        </h1>
        <span style={{
          fontFamily: t.mono, fontSize: 10, fontWeight: 700,
          padding: '2px 8px', borderRadius: 4,
          color: prioColor,
          background: `${prioColor}15`,
          border: `1px solid ${prioColor}30`,
        }}>
          {priority}
        </span>
      </div>
      <p style={{
        fontFamily: t.body, fontSize: 14, color: t.textSecondary,
        margin: '0 0 32px',
      }}>
        {description}
      </p>

      {/* Planned Features */}
      <div style={{
        background: t.bgCard, border: `1px solid ${t.border}`,
        borderRadius: 12, padding: '24px 28px',
      }}>
        <h3 style={{
          fontFamily: t.display, fontSize: 14, fontWeight: 700,
          color: t.textSecondary, margin: '0 0 16px',
          textTransform: 'uppercase', letterSpacing: '0.05em',
        }}>
          Planned Features
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {features.map((feature, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 0',
              borderBottom: i < features.length - 1 ? `1px solid ${t.border}` : 'none',
            }}>
              <div style={{
                width: 20, height: 20, borderRadius: 4,
                border: `1.5px solid ${t.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <span style={{ fontSize: 10, color: t.textMuted }}>
                  {i + 1}
                </span>
              </div>
              <span style={{
                fontFamily: t.body, fontSize: 13, color: t.text,
              }}>
                {feature}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Status notice */}
      <div style={{
        marginTop: 24, padding: '16px 20px',
        borderRadius: 10, background: `${t.violet}08`,
        border: `1px solid ${t.violet}20`,
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <NeonIcon type="clock" size={18} color="violet" />
        <span style={{ fontFamily: t.body, fontSize: 13, color: t.textSecondary }}>
          This page is part of the admin panel roadmap and will be implemented according to priority schedule.
        </span>
      </div>
    </div>
  );
}
