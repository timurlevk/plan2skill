'use client';

import React, { useMemo, useState } from 'react';
import { useReducedMotion } from '../_hooks/useReducedMotion';
import { useRouter } from 'next/navigation';
import { useRoadmapStore, useI18nStore } from '@plan2skill/store';
import { NeonIcon } from '../../../(onboarding)/_components/NeonIcon';
import { t, rarity, skillLevelRarity, ROADMAP_TIERS } from '../../../(onboarding)/_components/tokens';
import type { GoalSelection, SkillAssessment, Roadmap } from '@plan2skill/types';

interface RoadmapCardsProps {
  selectedGoals: GoalSelection[];
  skillAssessments: SkillAssessment[];
}

export function RoadmapCards({ selectedGoals, skillAssessments }: RoadmapCardsProps) {
  const tr = useI18nStore((s) => s.t);
  const router = useRouter();
  const serverRoadmaps = useRoadmapStore((s) => s.roadmaps);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const prefersReduced = useReducedMotion();

  const roadmaps = useMemo<Roadmap[]>(() => {
    if (serverRoadmaps.length > 0) return serverRoadmaps;
    return [];
  }, [serverRoadmaps]);

  if (roadmaps.length === 0) return null;

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 12,
      }}>
        <h2 style={{
          display: 'flex', alignItems: 'center', gap: 6,
          fontFamily: t.display, fontSize: 13, fontWeight: 700,
          color: t.textSecondary, textTransform: 'uppercase',
          letterSpacing: '0.08em', margin: 0,
        }}>
          <NeonIcon type="map" size={14} color="cyan" />
          {tr('dashboard.roadmaps', 'Roadmaps')}
        </h2>
        {roadmaps.length > 1 && (
          <button
            onClick={() => router.push('/roadmaps')}
            style={{
              fontFamily: t.mono, fontSize: 10, fontWeight: 700,
              color: t.textMuted, background: 'transparent',
              border: 'none', cursor: 'pointer',
              padding: '4px 8px',
            }}
          >
            {tr('dashboard.manage', 'Manage...')}
          </button>
        )}
      </div>

      {/* Horizontal scroll container */}
      <div style={{
        display: 'flex', gap: 12, overflowX: 'auto',
        paddingBottom: 8,
        scrollSnapType: 'x mandatory',
        WebkitOverflowScrolling: 'touch',
      }}>
        {roadmaps.map((rm, i) => {
          const isActive = rm.status === 'active';
          const isCompleted = rm.status === 'completed';
          const activeMilestone = rm.milestones.find((m) => m.status === 'active');
          const progress = Math.round(rm.progress);
          const totalQuests = rm.milestones.reduce((sum, m) => sum + m.tasks.length, 0);
          const completedQuests = rm.milestones.reduce(
            (sum, m) => sum + m.tasks.filter((tk) => tk.status === 'completed').length, 0,
          );

          const goal = selectedGoals.find((g) => rm.goal === g.label);
          const assessment = goal ? skillAssessments.find((a) => a.goalId === goal.id) : null;
          const lr = assessment ? skillLevelRarity[assessment.level as keyof typeof skillLevelRarity] : rarity.common;

          return (
            <button
              key={rm.id}
              onClick={() => router.push(`/roadmap/${rm.id}`)}
              onMouseEnter={() => setHoveredCard(rm.id)}
              onMouseLeave={() => setHoveredCard(null)}
              style={{
                minWidth: 220, maxWidth: 280, flex: '0 0 auto',
                scrollSnapAlign: 'start',
                padding: 16, borderRadius: 14,
                background: t.bgCard,
                border: `1px solid ${hoveredCard === rm.id ? t.violet : t.border}`,
                cursor: 'pointer', textAlign: 'left',
                transition: 'border-color 0.2s ease, transform 0.15s ease, box-shadow 0.2s ease',
                transform: hoveredCard === rm.id ? 'translateY(-2px)' : 'translateY(0)',
                boxShadow: hoveredCard === rm.id ? '0 6px 20px rgba(0,0,0,0.25)' : 'none',
                animation: isActive && !prefersReduced.current
                  ? `fadeUp 0.3s ease-out ${i * 0.08}s both, cardBreath 3s ease-in-out infinite`
                  : `fadeUp 0.3s ease-out ${i * 0.08}s both`,
              }}
            >
              {/* Title */}
              <div style={{
                fontFamily: t.display, fontSize: 13, fontWeight: 700,
                color: t.text, marginBottom: 6,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {rm.title}
              </div>

              {/* Skill level badge */}
              <div style={{ marginBottom: 10 }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 3,
                  fontFamily: t.mono, fontSize: 8, fontWeight: 700,
                  padding: '2px 6px', borderRadius: 8,
                  color: lr.color, background: `${lr.color}12`,
                  textTransform: 'uppercase',
                }}>
                  {lr.icon} {assessment?.level || 'beginner'}
                </span>
              </div>

              {/* Progress bar */}
              <div style={{
                height: 4, borderRadius: 2, background: t.border,
                overflow: 'hidden', marginBottom: 8, position: 'relative',
              }}>
                <div style={{
                  height: '100%', borderRadius: 2,
                  background: isCompleted ? t.gold : t.gradient,
                  width: `${Math.max(progress, 2)}%`,
                  transition: 'width 0.6s ease-out',
                  position: 'relative',
                  overflow: 'hidden',
                }}>
                  {!prefersReduced.current && (
                    <div style={{
                      position: 'absolute', inset: 0,
                      background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                      animation: 'barShimmer 2.5s ease-in-out infinite',
                    }} />
                  )}
                </div>
              </div>

              {/* Footer: milestone + count */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <span style={{
                  fontFamily: t.body, fontSize: 10, color: t.textMuted,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  maxWidth: '60%',
                }}>
                  {isCompleted
                    ? tr('quest.all_conquered', 'All milestones conquered!')
                    : activeMilestone?.title ?? tr('quest.ready', 'Ready to begin')}
                </span>
                <span style={{
                  fontFamily: t.mono, fontSize: 10, fontWeight: 700,
                  color: isCompleted ? t.gold : t.cyan,
                }}>
                  {progress}%
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
