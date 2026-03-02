'use client';

import React from 'react';
import { t } from './tokens';
import { NeonIcon } from './NeonIcon';

// ═══════════════════════════════════════════
// GOAL PYRAMID — Dream → Performance Goals → Process Preview
// Visual pyramid with 3 tiers
// ═══════════════════════════════════════════

interface GoalPyramidProps {
  dream: string;
  milestones: { id: string; text: string; weeks: number }[];
  color?: string;
}

export function GoalPyramid({ dream, milestones, color = t.violet }: GoalPyramidProps) {
  return (
    <div style={{
      background: t.bgCard,
      borderRadius: 16,
      border: `1px solid ${t.border}`,
      padding: '16px 14px',
      animation: 'fadeUp 0.5s ease-out',
    }}>
      {/* Dream — Top of pyramid */}
      <div style={{
        textAlign: 'center',
        marginBottom: 12,
        padding: '10px 14px',
        borderRadius: 12,
        background: `${color}10`,
        border: `1.5px solid ${color}30`,
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          marginBottom: 6,
        }}>
          <NeonIcon type="crown" size={16} color={color} active />
          <span style={{
            fontFamily: t.mono,
            fontSize: 10,
            fontWeight: 700,
            color,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}>
            Dream Quest
          </span>
        </div>
        <p style={{
          fontFamily: t.display,
          fontSize: 16,
          fontWeight: 700,
          color: t.text,
          margin: 0,
          lineHeight: 1.3,
        }}>
          {dream}
        </p>
      </div>

      {/* Milestones — Middle tier */}
      <div style={{ marginBottom: 12 }}>
        <div style={{
          fontFamily: t.mono,
          fontSize: 10,
          fontWeight: 700,
          color: t.cyan,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          marginBottom: 8,
        }}>
          Performance Milestones
        </div>
        <div style={{
          borderRadius: 10,
          border: `1px solid ${t.border}`,
          overflow: 'hidden',
        }}>
          {milestones.map((m, i) => (
            <div key={m.id} style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 10px',
              background: t.bgElevated,
              borderTop: i > 0 ? `1px solid ${t.border}` : 'none',
              animation: `fadeUp 0.4s ease-out ${0.3 + i * 0.08}s both`,
            }}>
              {/* Step number */}
              <div style={{
                width: 20,
                height: 20,
                borderRadius: '50%',
                background: `${t.cyan}20`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: t.mono,
                fontSize: 10,
                fontWeight: 800,
                color: t.cyan,
                flexShrink: 0,
              }}>
                {i + 1}
              </div>

              {/* Milestone text */}
              <span style={{
                fontFamily: t.body,
                fontSize: 12,
                color: t.text,
                flex: 1,
                lineHeight: 1.3,
              }}>
                {m.text}
              </span>

              {/* Weeks badge */}
              <span style={{
                fontFamily: t.mono,
                fontSize: 10,
                color: t.textMuted,
                flexShrink: 0,
              }}>
                ~{m.weeks}w
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Process Preview — Bottom tier */}
      <div style={{
        padding: '10px 12px',
        borderRadius: 10,
        background: `${t.mint}08`,
        border: `1px dashed ${t.mint}30`,
        textAlign: 'center',
      }}>
        <span style={{
          fontFamily: t.body,
          fontSize: 11,
          color: t.textMuted,
        }}>
          Daily quests and practice routines will be generated from these milestones
        </span>
      </div>
    </div>
  );
}
