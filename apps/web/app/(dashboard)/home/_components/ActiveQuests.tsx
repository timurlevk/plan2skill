'use client';

import React from 'react';
import { NeonIcon } from '../../../(onboarding)/_components/NeonIcon';
import { t, rarity, skillLevelRarity } from '../../../(onboarding)/_components/tokens';
import { GOALS } from '../../../(onboarding)/_data/goals';
import type { GoalSelection, SkillAssessment } from '@plan2skill/types';

interface ActiveQuestsProps {
  selectedGoals: GoalSelection[];
  skillAssessments: SkillAssessment[];
}

export function ActiveQuests({ selectedGoals, skillAssessments }: ActiveQuestsProps) {
  return (
    <div style={{ marginBottom: 32 }}>
      <h2 style={{
        display: 'flex', alignItems: 'center', gap: 6,
        fontFamily: t.display, fontSize: 13, fontWeight: 700,
        color: t.textSecondary, textTransform: 'uppercase',
        letterSpacing: '0.08em', marginBottom: 14,
      }}>
        <NeonIcon type="target" size={14} color="cyan" />
        Active Quests
      </h2>

      {selectedGoals.length === 0 ? (
        <div style={{
          padding: 40, borderRadius: 16,
          background: t.bgCard, border: `1px solid ${t.border}`,
          textAlign: 'center',
        }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
            <NeonIcon type="target" size={40} color="muted" />
          </div>
          <p style={{ fontFamily: t.display, fontSize: 16, fontWeight: 700, color: t.textMuted, marginBottom: 4 }}>
            No quests available
          </p>
          <p style={{ fontFamily: t.body, fontSize: 13, color: t.textMuted }}>
            Complete onboarding to begin your journey
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {selectedGoals.map((goal, i) => {
            const goalData = GOALS.find(gd => gd.id === goal.id);
            const assessment = skillAssessments.find(a => a.goalId === goal.id);
            const lr = assessment ? skillLevelRarity[assessment.level as keyof typeof skillLevelRarity] : rarity.common;

            return (
              <div
                key={goal.id}
                style={{
                  padding: 20, borderRadius: 16,
                  background: t.bgCard, border: `1px solid ${t.border}`,
                  animation: `fadeUp 0.4s ease-out ${i * 0.1}s both`,
                  transition: 'border-color 0.2s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  {goalData && (
                    <div style={{
                      width: 40, height: 40, borderRadius: 12,
                      background: `${t.violet}12`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <NeonIcon type={goalData.icon} size={22} color="violet" />
                    </div>
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontFamily: t.display, fontSize: 15, fontWeight: 700, color: t.text,
                      marginBottom: 2,
                    }}>
                      {goal.label}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span
                        aria-label={`Skill level: ${assessment?.level || 'beginner'}, rarity: ${lr.icon}`}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 3,
                          fontFamily: t.mono, fontSize: 9, fontWeight: 700,
                          padding: '2px 8px', borderRadius: 10,
                          color: lr.color,
                          background: `${lr.color}12`,
                          textTransform: 'uppercase',
                        }}
                      >
                        {lr.icon} {assessment?.level || 'beginner'}
                      </span>
                      {goalData && (
                        <span style={{ fontFamily: t.body, fontSize: 11, color: t.textMuted }}>
                          ~{goalData.estimatedWeeks} weeks
                        </span>
                      )}
                    </div>
                  </div>
                  <span style={{ fontFamily: t.mono, fontSize: 13, fontWeight: 800, color: t.cyan }}>
                    0%
                  </span>
                </div>

                <div style={{ height: 4, borderRadius: 2, background: '#252530', overflow: 'hidden' }}>
                  <div style={{
                    width: '0%', height: '100%', borderRadius: 3,
                    background: t.gradient,
                    transition: 'width 0.6s ease-out',
                  }} />
                </div>
                <p style={{
                  fontFamily: t.body, fontSize: 11, color: t.textMuted,
                  marginTop: 8,
                }}>
                  Current milestone: Foundations &amp; Setup
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
