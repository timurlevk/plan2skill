'use client';

import React, { useState } from 'react';
import { useReducedMotion } from '../_hooks/useReducedMotion';
import { NeonIcon } from '../../../(onboarding)/_components/NeonIcon';
import { t } from '../../../(onboarding)/_components/tokens';
import { useI18nStore } from '@plan2skill/store';
import { MasteryRing } from './MasteryRing';

interface SkillItem {
  skillId: string;
  skillDomain: string;
  masteryLevel: number;
  isOverdue: boolean;
  [key: string]: unknown;
}

interface TrainingGroundsProps {
  skills: SkillItem[];
  overallMastery: number;
  dueCount: number;
  dueItems: Array<{
    skillId: string;
    skillDomain: string;
    masteryLevel: number;
    [key: string]: unknown;
  }>;
  onStartReview: (skillId: string) => void;
  isSubmitting: boolean;
}

export function TrainingGrounds({
  skills,
  overallMastery,
  dueCount,
  dueItems,
  onStartReview,
  isSubmitting,
}: TrainingGroundsProps) {
  const tr = useI18nStore((s) => s.t);
  const [expanded, setExpanded] = useState(false);
  const prefersReduced = useReducedMotion();

  if (skills.length === 0) return null;

  return (
    <div style={{ marginTop: 32, marginBottom: 32 }}>
      {/* Section header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 14,
      }}>
        <h2 style={{
          display: 'flex', alignItems: 'center', gap: 6,
          fontFamily: t.display, fontSize: 13, fontWeight: 700,
          color: t.textSecondary, textTransform: 'uppercase',
          letterSpacing: '0.08em', margin: 0,
        }}>
          <NeonIcon type="shield" size={14} color="cyan" />
          {tr('dashboard.training_grounds', 'Training Grounds')}
        </h2>
        {dueCount > 0 && (
          <span style={{
            fontFamily: t.mono, fontSize: 10, fontWeight: 800,
            padding: '3px 10px', borderRadius: 10,
            color: t.rose, background: `${t.rose}12`,
          }}>
            {dueCount} {tr('dashboard.reviews_due', 'reviews due')}
          </span>
        )}
      </div>

      {/* Overall mastery bar */}
      <div style={{
        padding: 16, borderRadius: 14,
        background: t.bgCard, border: `1px solid ${t.border}`,
        marginBottom: 12,
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 8,
        }}>
          <span style={{ fontFamily: t.display, fontSize: 13, fontWeight: 700, color: t.text }}>
            {tr('dashboard.overall_mastery', 'Overall Mastery')}
          </span>
          <span style={{ fontFamily: t.mono, fontSize: 12, fontWeight: 800, color: t.cyan }}>
            {Math.round(overallMastery * 100)}%
          </span>
        </div>
        <div style={{
          height: 6, borderRadius: 3, background: t.border,
          overflow: 'hidden',
        }}>
          <div style={{
            height: '100%', borderRadius: 3,
            background: t.gradient,
            width: `${Math.max(overallMastery * 100, 2)}%`,
            transition: 'width 0.6s ease-out',
          }} />
        </div>
      </div>

      {/* Due reviews — urgent action cards */}
      {dueItems.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          {dueItems.map((item) => (
            <button
              key={item.skillId}
              onClick={() => onStartReview(item.skillId)}
              disabled={isSubmitting}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                width: '100%', textAlign: 'left',
                padding: '12px 14px', borderRadius: 12,
                background: `${t.rose}06`, border: `1px solid ${t.rose}20`,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                marginBottom: 6,
                transition: 'background 0.15s ease',
                opacity: isSubmitting ? 0.6 : 1,
              }}
            >
              <MasteryRing
                masteryLevel={item.masteryLevel}
                skillDomain={item.skillDomain}
                isOverdue
                size="sm"
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontFamily: t.display, fontSize: 13, fontWeight: 700, color: t.text,
                }}>
                  {item.skillDomain}
                </div>
                <div style={{
                  fontFamily: t.body, fontSize: 11, color: t.rose,
                }}>
                  {tr('mastery.review_now', 'Review now to maintain mastery')}
                </div>
              </div>
              <NeonIcon type="swords" size={16} color={t.rose} />
            </button>
          ))}
        </div>
      )}

      {/* All skills — expandable grid */}
      <button
        onClick={() => setExpanded((v) => !v)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '8px 12px', borderRadius: 10,
          background: 'transparent', border: `1px solid ${t.border}`,
          cursor: 'pointer', width: '100%', textAlign: 'left',
        }}
      >
        <NeonIcon type="book" size={12} color="cyan" />
        <span style={{
          fontFamily: t.display, fontSize: 12, fontWeight: 700,
          color: t.textSecondary, flex: 1,
        }}>
          {tr('dashboard.knowledge_codex', 'Knowledge Codex ({n} skills)').replace('{n}', String(skills.length))}
        </span>
        <span style={{
          fontFamily: t.mono, fontSize: 10, color: t.textMuted,
          transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s ease',
          display: 'inline-block',
        }}>
          ▼
        </span>
      </button>

      {expanded && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
          gap: 8, marginTop: 8,
          animation: 'fadeUp 0.2s ease-out',
        }}>
          {skills.map((skill) => (
            <button
              key={skill.skillId}
              onClick={() => onStartReview(skill.skillId)}
              disabled={isSubmitting}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: 6, padding: 12, borderRadius: 12,
                background: t.bgCard, border: `1px solid ${skill.isOverdue ? `${t.rose}30` : t.border}`,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                transition: 'border-color 0.15s ease',
              }}
            >
              <MasteryRing
                masteryLevel={skill.masteryLevel}
                skillDomain={skill.skillDomain}
                isOverdue={skill.isOverdue}
                size="md"
                showLabel
              />
              <span style={{
                fontFamily: t.mono, fontSize: 9, fontWeight: 600,
                color: t.textMuted, textAlign: 'center',
                overflow: 'hidden', textOverflow: 'ellipsis',
                whiteSpace: 'nowrap', width: '100%',
              }}>
                {skill.skillDomain}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
