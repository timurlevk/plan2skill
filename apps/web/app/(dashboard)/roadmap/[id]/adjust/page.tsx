'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useRoadmapStore, useI18nStore } from '@plan2skill/store';
import { trpc } from '@plan2skill/api-client';
import { NeonIcon } from '../../../../(onboarding)/_components/NeonIcon';
import type { NeonIconType } from '../../../../(onboarding)/_components/NeonIcon';
import { t } from '../../../../(onboarding)/_components/tokens';

// ═══════════════════════════════════════════
// ADJUST QUEST LINE WIZARD — Phase 5H
// 3-step wizard: choose type → configure → confirm
// ═══════════════════════════════════════════

type AdjustType = 'goals' | 'pace' | 'regen' | 'add_topic';

interface AdjustOption {
  type: AdjustType;
  icon: NeonIconType;
  color: string;
  title: string;
  description: string;
}

const ADJUST_OPTIONS: AdjustOption[] = [
  {
    type: 'goals',
    icon: 'target',
    color: t.violet,
    title: 'Change Goals',
    description: 'Update your focus — remaining quests will be re-forged',
  },
  {
    type: 'pace',
    icon: 'lightning',
    color: t.cyan,
    title: 'Change Pace',
    description: 'Adjust your daily training time',
  },
  {
    type: 'regen',
    icon: 'fire',
    color: t.rose,
    title: 'Re-forge Quests',
    description: 'Regenerate remaining quests — progress stays',
  },
  {
    type: 'add_topic',
    icon: 'sparkle',
    color: t.gold,
    title: 'Add Topic',
    description: 'Explore a new interest within this quest line',
  },
];

const PACE_OPTIONS = [15, 30, 60, 90] as const;

export default function AdjustWizardPage() {
  const router = useRouter();
  const tr = useI18nStore((s) => s.t);
  const params = useParams();
  const roadmapId = params.id as string;

  const roadmaps = useRoadmapStore((s) => s.roadmaps);
  const updateRoadmap = useRoadmapStore((s) => s.updateRoadmap);
  const roadmap = roadmaps.find((r) => r.id === roadmapId);

  // SSR-safe reduced-motion hook
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    setReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  // Wizard state
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [adjustType, setAdjustType] = useState<AdjustType | null>(null);
  const [hoveredOption, setHoveredOption] = useState<AdjustType | null>(null);

  // Step 2 form values
  const [newGoal, setNewGoal] = useState(roadmap?.goal ?? '');
  const [newDailyMinutes, setNewDailyMinutes] = useState<15 | 30 | 60 | 90>(
    (roadmap?.dailyMinutes as 15 | 30 | 60 | 90) ?? 30,
  );
  const [newInterests, setNewInterests] = useState('');
  const [isForging, setIsForging] = useState(false);

  const adjustMutation = trpc.roadmap.adjust.useMutation();

  // Computed: tasks that will change
  const totalTasks = roadmap?.milestones.reduce((sum, m) => sum + m.tasks.length, 0) ?? 0;
  const completedTasks = roadmap?.milestones.reduce(
    (sum, m) => sum + m.tasks.filter((task) => task.status === 'completed').length, 0,
  ) ?? 0;
  const remainingTasks = totalTasks - completedTasks;

  const handleSelectType = useCallback((type: AdjustType) => {
    setAdjustType(type);
    setStep(2);
  }, []);

  const handleConfirm = useCallback(() => {
    setStep(3);
  }, []);

  const handleForge = useCallback(async () => {
    if (!adjustType || !roadmapId) return;
    setIsForging(true);

    const input: {
      roadmapId: string;
      type: AdjustType;
      newGoal?: string;
      newDailyMinutes?: 15 | 30 | 60 | 90;
      newInterests?: string[];
    } = { roadmapId, type: adjustType };

    if (adjustType === 'goals' && newGoal) input.newGoal = newGoal;
    if (adjustType === 'pace') input.newDailyMinutes = newDailyMinutes;
    if (adjustType === 'add_topic' && newInterests.trim()) {
      input.newInterests = newInterests.split(',').map((s) => s.trim()).filter(Boolean).slice(0, 5);
    }

    try {
      const result = await adjustMutation.mutateAsync(input);
      updateRoadmap(result as any);
      router.push(`/roadmap/${roadmapId}`);
    } catch (err) {
      console.error('[AdjustWizard] Failed:', err);
      setIsForging(false);
    }
  }, [adjustType, roadmapId, newGoal, newDailyMinutes, newInterests, adjustMutation, updateRoadmap, router]);

  // Guard: no roadmap found
  if (!roadmap) {
    return (
      <div style={{
        padding: 40, textAlign: 'center',
        fontFamily: t.display, fontSize: 16, color: t.textMuted,
      }}>
        {tr('questmap.not_found', 'Quest line not found')} — <button
          onClick={() => router.push('/roadmap')}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: t.display, fontSize: 16, color: t.violet, textDecoration: 'underline',
          }}
        >{tr('questmap.return', 'return to Quest Map')}</button>
      </div>
    );
  }

  const selectedOption = ADJUST_OPTIONS.find((o) => o.type === adjustType);

  // i18n lookup for adjust option titles
  const adjustTitleKeys: Record<AdjustType, string> = {
    goals: 'questmap.change_goals',
    pace: 'questmap.change_pace',
    regen: 'questmap.reforge',
    add_topic: 'questmap.add_topic',
  };

  // ─── Step 2 content based on type ─────────────────────────────

  const renderStep2 = () => {
    switch (adjustType) {
      case 'goals':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <label style={{
              fontFamily: t.display, fontSize: 13, fontWeight: 700,
              color: t.textSecondary,
            }}>
              {tr('questmap.new_goal', 'New goal for this quest line')}
            </label>
            <input
              type="text"
              value={newGoal}
              onChange={(e) => setNewGoal(e.target.value)}
              placeholder="e.g. Master React Server Components"
              maxLength={500}
              style={{
                padding: '12px 16px', borderRadius: 12,
                background: t.bgElevated, border: `1px solid ${t.border}`,
                fontFamily: t.body, fontSize: 14, color: t.text,
                outline: 'none',
                transition: 'border-color 0.2s ease',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = t.violet; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = t.border; }}
            />
            <p style={{
              fontFamily: t.body, fontSize: 12, color: t.textMuted, lineHeight: 1.5,
            }}>
              Your completed quests stay — remaining milestones will be re-forged to match the new goal.
            </p>
          </div>
        );

      case 'pace':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <label style={{
              fontFamily: t.display, fontSize: 13, fontWeight: 700,
              color: t.textSecondary,
            }}>
              {tr('questmap.daily_time', 'Daily training time')}
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              {PACE_OPTIONS.map((mins) => {
                const isSelected = newDailyMinutes === mins;
                return (
                  <button
                    key={mins}
                    onClick={() => setNewDailyMinutes(mins)}
                    style={{
                      padding: '14px 8px', borderRadius: 12,
                      background: isSelected ? `${t.cyan}15` : t.bgElevated,
                      border: `1.5px solid ${isSelected ? t.cyan : t.border}`,
                      cursor: 'pointer',
                      transition: 'border-color 0.2s ease, background 0.2s ease',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{
                      fontFamily: t.display, fontSize: 20, fontWeight: 900,
                      color: isSelected ? t.cyan : t.text,
                    }}>
                      {mins}
                    </div>
                    <div style={{
                      fontFamily: t.mono, fontSize: 9, fontWeight: 700,
                      color: t.textMuted, textTransform: 'uppercase',
                    }}>
                      {tr('questmap.pace_unit', 'min/day')}
                    </div>
                  </button>
                );
              })}
            </div>
            <p style={{
              fontFamily: t.body, fontSize: 12, color: t.textMuted, lineHeight: 1.5,
            }}>
              Currently: {roadmap.dailyMinutes} min/day. {remainingTasks} remaining quests will be adjusted.
            </p>
          </div>
        );

      case 'regen':
        return (
          <div style={{
            padding: 20, borderRadius: 12,
            background: `${t.rose}08`, border: `1px solid ${t.rose}20`,
            display: 'flex', flexDirection: 'column', gap: 12,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <NeonIcon type="fire" size={20} color="rose" />
              <span style={{
                fontFamily: t.display, fontSize: 15, fontWeight: 700,
                color: t.text,
              }}>
                Re-forge remaining quests
              </span>
            </div>
            <p style={{
              fontFamily: t.body, fontSize: 13, color: t.textSecondary, lineHeight: 1.5,
            }}>
              This will regenerate {remainingTasks} remaining quests across your non-completed milestones.
              Your {completedTasks} completed quests and all earned XP stay intact.
            </p>
          </div>
        );

      case 'add_topic':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <label style={{
              fontFamily: t.display, fontSize: 13, fontWeight: 700,
              color: t.textSecondary,
            }}>
              {tr('questmap.new_interests', 'New interests to explore')}
            </label>
            <input
              type="text"
              value={newInterests}
              onChange={(e) => setNewInterests(e.target.value)}
              placeholder="e.g. GraphQL, WebSockets, Edge Functions"
              maxLength={500}
              style={{
                padding: '12px 16px', borderRadius: 12,
                background: t.bgElevated, border: `1px solid ${t.border}`,
                fontFamily: t.body, fontSize: 14, color: t.text,
                outline: 'none',
                transition: 'border-color 0.2s ease',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = t.gold; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = t.border; }}
            />
            <p style={{
              fontFamily: t.body, fontSize: 12, color: t.textMuted, lineHeight: 1.5,
            }}>
              New quests will be added to your active milestone as bonus exploration tasks.
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  // Validation for Step 2 → Step 3
  const canProceed = (() => {
    switch (adjustType) {
      case 'goals': return newGoal.trim().length >= 5;
      case 'pace': return newDailyMinutes !== roadmap.dailyMinutes;
      case 'regen': return true;
      case 'add_topic': return newInterests.trim().length > 0;
      default: return false;
    }
  })();

  return (
    <div style={{
      maxWidth: 560, margin: '0 auto',
      animation: reducedMotion ? 'none' : 'fadeUp 0.4s ease-out',
    }}>
      {/* ─── Back button ─── */}
      <button
        onClick={() => step === 1 ? router.push(`/roadmap/${roadmapId}`) : setStep((step - 1) as 1 | 2)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'none', border: 'none', cursor: 'pointer',
          fontFamily: t.display, fontSize: 13, fontWeight: 700,
          color: t.textMuted, marginBottom: 20,
          transition: 'color 0.15s ease',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.color = t.text; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = t.textMuted; }}
      >
        <NeonIcon type="compass" size={14} color="muted" />
        {step === 1 ? tr('questmap.back_to_quest', 'Back to quest line') : 'Back'}
      </button>

      {/* ─── Title ─── */}
      <h1 style={{
        display: 'flex', alignItems: 'center', gap: 10,
        fontFamily: t.display, fontSize: 22, fontWeight: 900,
        color: t.text, marginBottom: 4,
      }}>
        <NeonIcon type="sparkle" size={22} color="violet" />
        {tr('questmap.adjust_title', 'Adjust Quest Line')}
      </h1>
      <p style={{
        fontFamily: t.body, fontSize: 13, color: t.textSecondary,
        marginBottom: 24,
      }}>
        {roadmap.title} — {completedTasks}/{totalTasks} quests completed
      </p>

      {/* ─── Step 1: Choose adjustment type ─── */}
      {step === 1 && (
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12,
          animation: reducedMotion ? 'none' : 'fadeUp 0.3s ease-out',
        }}>
          {ADJUST_OPTIONS.map((option) => (
            <button
              key={option.type}
              onClick={() => handleSelectType(option.type)}
              aria-label={`${option.title}: ${option.description}`}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: 10, padding: 20, borderRadius: 16,
                background: hoveredOption === option.type ? `${option.color}08` : t.bgCard,
                border: `1.5px solid ${hoveredOption === option.type ? `${option.color}40` : t.border}`,
                cursor: 'pointer',
                transition: 'border-color 0.2s ease, background 0.2s ease, transform 0.2s ease',
                textAlign: 'center',
                transform: hoveredOption === option.type ? 'translateY(-2px)' : 'translateY(0)',
              }}
              onMouseEnter={() => setHoveredOption(option.type)}
              onMouseLeave={() => setHoveredOption(null)}
            >
              <div style={{
                width: 44, height: 44, borderRadius: 14,
                background: `${option.color}12`,
                border: `1px solid ${option.color}25`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <NeonIcon type={option.icon} size={22} color={option.color} />
              </div>
              <div>
                <div style={{
                  fontFamily: t.display, fontSize: 14, fontWeight: 700,
                  color: t.text, marginBottom: 2,
                }}>
                  {tr(adjustTitleKeys[option.type], option.title)}
                </div>
                <div style={{
                  fontFamily: t.body, fontSize: 11, color: t.textMuted, lineHeight: 1.4,
                }}>
                  {option.description}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* ─── Step 2: Configure ─── */}
      {step === 2 && adjustType && (
        <div style={{
          padding: 24, borderRadius: 16,
          background: t.bgCard, border: `1px solid ${t.border}`,
          animation: reducedMotion ? 'none' : 'fadeUp 0.3s ease-out',
        }}>
          {/* Selected type header */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20,
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: 10,
              background: `${selectedOption?.color ?? t.violet}12`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <NeonIcon type={selectedOption?.icon ?? 'sparkle'} size={16} color={selectedOption?.color ?? t.violet} />
            </div>
            <span style={{
              fontFamily: t.display, fontSize: 16, fontWeight: 700,
              color: t.text,
            }}>
              {adjustType ? tr(adjustTitleKeys[adjustType], selectedOption?.title ?? '') : selectedOption?.title}
            </span>
          </div>

          {renderStep2()}

          {/* Action buttons */}
          <div style={{
            display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24,
          }}>
            <button
              onClick={() => setStep(1)}
              style={{
                padding: '10px 20px', borderRadius: 10,
                background: 'transparent', border: `1px solid ${t.border}`,
                cursor: 'pointer',
                fontFamily: t.display, fontSize: 13, fontWeight: 700,
                color: t.textSecondary,
                transition: 'border-color 0.15s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = t.textMuted; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = t.border; }}
            >
              Back
            </button>
            <button
              onClick={handleConfirm}
              disabled={!canProceed}
              style={{
                padding: '10px 20px', borderRadius: 10,
                background: canProceed ? t.gradient : t.border,
                border: 'none', cursor: canProceed ? 'pointer' : 'not-allowed',
                fontFamily: t.display, fontSize: 13, fontWeight: 700,
                color: canProceed ? '#FFF' : t.textMuted,
                transition: 'transform 0.15s ease',
                opacity: canProceed ? 1 : 0.5,
              }}
              onMouseEnter={(e) => { if (canProceed) e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              {tr('questmap.preview', 'Preview Changes')}
            </button>
          </div>
        </div>
      )}

      {/* ─── Step 3: Confirm + Forge ─── */}
      {step === 3 && adjustType && (
        <div style={{
          padding: 24, borderRadius: 16,
          background: t.bgCard, border: `1px solid ${t.border}`,
          animation: reducedMotion ? 'none' : 'fadeUp 0.3s ease-out',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16,
          }}>
            <NeonIcon type="fire" size={20} color="violet" />
            <span style={{
              fontFamily: t.display, fontSize: 16, fontWeight: 700,
              color: t.text,
            }}>
              {tr('questmap.confirm', 'Confirm Changes')}
            </span>
          </div>

          {/* Summary */}
          <div style={{
            padding: 16, borderRadius: 12,
            background: t.bgElevated, border: `1px solid ${t.border}`,
            marginBottom: 20,
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: t.body, fontSize: 12, color: t.textMuted }}>
                  Adjustment
                </span>
                <span style={{ fontFamily: t.display, fontSize: 12, fontWeight: 700, color: selectedOption?.color }}>
                  {adjustType ? tr(adjustTitleKeys[adjustType], selectedOption?.title ?? '') : selectedOption?.title}
                </span>
              </div>

              {adjustType === 'goals' && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontFamily: t.body, fontSize: 12, color: t.textMuted }}>
                    New goal
                  </span>
                  <span style={{
                    fontFamily: t.body, fontSize: 12, color: t.text,
                    maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {newGoal}
                  </span>
                </div>
              )}

              {adjustType === 'pace' && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontFamily: t.body, fontSize: 12, color: t.textMuted }}>
                    Daily pace
                  </span>
                  <span style={{ fontFamily: t.mono, fontSize: 12, fontWeight: 700, color: t.cyan }}>
                    {roadmap.dailyMinutes}min → {newDailyMinutes}min
                  </span>
                </div>
              )}

              {adjustType === 'add_topic' && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontFamily: t.body, fontSize: 12, color: t.textMuted }}>
                    New topics
                  </span>
                  <span style={{ fontFamily: t.body, fontSize: 12, color: t.gold }}>
                    {newInterests.split(',').filter((s) => s.trim()).length} topic(s)
                  </span>
                </div>
              )}

              <div style={{
                borderTop: `1px solid ${t.border}`, paddingTop: 8, marginTop: 4,
                display: 'flex', justifyContent: 'space-between',
              }}>
                <span style={{ fontFamily: t.body, fontSize: 12, color: t.textMuted }}>
                  Quests affected
                </span>
                <span style={{ fontFamily: t.mono, fontSize: 12, fontWeight: 700, color: t.text }}>
                  {adjustType === 'add_topic'
                    ? `+${newInterests.split(',').filter((s) => s.trim()).length} new`
                    : `${remainingTasks} remaining`}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: t.body, fontSize: 12, color: t.textMuted }}>
                  Progress preserved
                </span>
                <span style={{ fontFamily: t.mono, fontSize: 12, fontWeight: 700, color: t.mint }}>
                  {completedTasks} quest{completedTasks !== 1 ? 's' : ''} + all XP
                </span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{
            display: 'flex', justifyContent: 'flex-end', gap: 10,
          }}>
            <button
              onClick={() => setStep(2)}
              disabled={isForging}
              style={{
                padding: '10px 20px', borderRadius: 10,
                background: 'transparent', border: `1px solid ${t.border}`,
                cursor: isForging ? 'not-allowed' : 'pointer',
                fontFamily: t.display, fontSize: 13, fontWeight: 700,
                color: t.textSecondary,
                opacity: isForging ? 0.5 : 1,
              }}
            >
              Back
            </button>
            <button
              onClick={handleForge}
              disabled={isForging}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 24px', borderRadius: 10,
                background: isForging
                  ? `linear-gradient(135deg, ${t.violet}80, ${t.cyan}80)`
                  : t.gradient,
                border: 'none',
                cursor: isForging ? 'wait' : 'pointer',
                fontFamily: t.display, fontSize: 13, fontWeight: 700,
                color: '#FFF',
                transition: 'transform 0.15s ease',
                animation: isForging ? (reducedMotion ? 'none' : 'shimmer 2s linear infinite') : 'none',
                backgroundImage: isForging
                  ? `linear-gradient(90deg, ${t.violet}, ${t.cyan}, ${t.violet})`
                  : undefined,
                backgroundSize: isForging ? '200% 100%' : undefined,
              }}
              onMouseEnter={(e) => { if (!isForging) e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              {isForging ? (
                <>
                  <NeonIcon type="fire" size={14} color="#FFF" />
                  Forging changes...
                </>
              ) : (
                <>
                  <NeonIcon type="fire" size={14} color="#FFF" />
                  {tr('questmap.forge_changes', 'Forge Changes')}
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
