'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useOnboardingStore } from '@plan2skill/store';
import { t } from '../_components/tokens';
import { StepBar } from '../_components/StepBar';
import { ContinueButton, BackButton } from '../_components/ContinueButton';
import { NeonIcon } from '../_components/NeonIcon';
import { GOALS, GOAL_CATEGORIES } from '../_data/goals';
import { getSubGoalsForGoal } from '../_data/goal-subgoals';
import type { GoalCategory } from '@plan2skill/types';

// ═══════════════════════════════════════════
// GOALS — "What do you want to learn?" (Step 1/5)
// Phase A: Category tabs, search, multi-select 1-3
// Phase B: Sub-goal depth (define your path)
// NeonIcon SVGs instead of emojis
// ═══════════════════════════════════════════

export default function GoalsPage() {
  const router = useRouter();
  const {
    selectedGoals, setGoals, clearDownstream, addXP,
    goalSubGoals, setGoalSubGoals, goalFreeText, setGoalFreeText,
  } = useOnboardingStore();

  const [activeCategory, setActiveCategory] = useState<GoalCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [phase, setPhase] = useState<'select' | 'depth'>('select');

  const selectedIds = useMemo(() => new Set(selectedGoals.map(g => g.id)), [selectedGoals]);

  const filteredGoals = useMemo(() => {
    let goals = GOALS;
    if (activeCategory !== 'all') {
      goals = goals.filter(g => g.category === activeCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      goals = goals.filter(g =>
        g.label.toLowerCase().includes(q) ||
        g.relatedSkills.some(s => s.toLowerCase().includes(q))
      );
    }
    return goals.sort((a, b) => b.popularity - a.popularity);
  }, [activeCategory, searchQuery]);

  const toggleGoal = (goal: typeof GOALS[0]) => {
    const isSelected = selectedIds.has(goal.id);
    let newGoals;
    if (isSelected) {
      newGoals = selectedGoals.filter(g => g.id !== goal.id);
    } else if (selectedGoals.length < 3) {
      newGoals = [...selectedGoals, {
        id: goal.id,
        label: goal.label,
        category: goal.category,
        popularity: goal.popularity,
      }];
    } else {
      return;
    }
    setGoals(newGoals);
    clearDownstream(1);
  };

  const addCustomGoal = (label: string) => {
    const trimmed = label.trim();
    if (!trimmed || selectedGoals.length >= 3) return;
    const customGoal = {
      id: `custom-${Date.now()}`,
      label: trimmed,
      category: 'personal' as GoalCategory,
      popularity: 0,
      isCustom: true,
    };
    setGoals([...selectedGoals, customGoal]);
    clearDownstream(1);
    setSearchQuery('');
  };

  // Can add custom when search has text, no results, and room for more
  const canAddCustom = searchQuery.trim().length > 2 && filteredGoals.length === 0 && selectedGoals.length < 3;

  // ─── Phase B: Sub-Goal Depth ───
  if (phase === 'depth') {
    return (
      <div style={{ animation: 'slideLeft 0.5s ease-out' }}>
        <StepBar current={0} />

        <BackButton onClick={() => setPhase('select')} />
        <div style={{ height: 16 }} />

        <h1 style={{
          fontFamily: t.display,
          fontSize: 26,
          fontWeight: 800,
          color: t.text,
          marginBottom: 8,
          lineHeight: 1.2,
        }}>
          Define Your Path
        </h1>
        <p style={{
          fontFamily: t.body,
          fontSize: 14,
          color: t.textSecondary,
          marginBottom: 24,
          lineHeight: 1.5,
        }}>
          What milestones and dreams are on your quest list?
        </p>

        {/* Per-goal expandable cards */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          marginBottom: 32,
        }}>
          {selectedGoals.map((goal, gi) => {
            const presets = getSubGoalsForGoal(goal.id);
            const selectedSubs = goalSubGoals[goal.id] || [];
            const freeText = goalFreeText[goal.id] || '';
            const goalData = GOALS.find(g => g.id === goal.id);

            return (
              <div key={goal.id} style={{
                background: t.bgCard,
                borderRadius: 16,
                padding: '18px 18px 16px',
                border: `1px solid ${t.border}`,
                animation: `fadeUp 0.5s ease-out ${gi * 0.1}s both`,
              }}>
                {/* Goal header */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  marginBottom: 14,
                }}>
                  <NeonIcon type={goalData?.icon || 'target'} size={20} color="violet" active />
                  <span style={{
                    fontFamily: t.display,
                    fontSize: 15,
                    fontWeight: 700,
                    color: t.text,
                  }}>
                    {goal.label}
                  </span>
                </div>

                {/* Preset sub-goals as toggleable chips */}
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 6,
                  marginBottom: 14,
                }}>
                  {presets.map(preset => {
                    const isActive = selectedSubs.includes(preset.id);
                    const typeColors = {
                      milestone: t.cyan,
                      dream: t.gold,
                      project: t.violet,
                    };
                    const chipColor = typeColors[preset.type];
                    return (
                      <button
                        key={preset.id}
                        onClick={() => {
                          const newSubs = isActive
                            ? selectedSubs.filter(s => s !== preset.id)
                            : [...selectedSubs, preset.id];
                          setGoalSubGoals(goal.id, newSubs);
                          if (!isActive) addXP(3);
                        }}
                        style={{
                          padding: '6px 12px',
                          borderRadius: 20,
                          border: `1px solid ${isActive ? chipColor : t.border}`,
                          background: isActive ? `${chipColor}15` : 'transparent',
                          color: isActive ? chipColor : t.textSecondary,
                          fontFamily: t.body,
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {preset.type === 'milestone' ? '>' : preset.type === 'dream' ? '>' : '>'} {preset.label}
                      </button>
                    );
                  })}
                </div>

                {/* Free-form textarea */}
                <div style={{ position: 'relative' }}>
                  <textarea
                    value={freeText}
                    onChange={(e) => setGoalFreeText(goal.id, e.target.value)}
                    placeholder="Tell us more about what you want to achieve..."
                    rows={2}
                    style={{
                      width: '100%',
                      padding: '10px 40px 10px 14px',
                      borderRadius: 10,
                      border: `1px solid ${t.border}`,
                      background: t.bgElevated,
                      color: t.text,
                      fontFamily: t.body,
                      fontSize: 13,
                      outline: 'none',
                      resize: 'none',
                      boxSizing: 'border-box',
                      transition: 'border-color 0.2s ease',
                    }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = t.violet; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = t.border; }}
                  />
                  <div style={{
                    position: 'absolute',
                    right: 10,
                    top: 10,
                    cursor: 'default',
                  }} title="Voice input — coming soon">
                    <NeonIcon type="mic" size={16} color="muted" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <ContinueButton onClick={() => router.push('/skills')} />
      </div>
    );
  }

  // ─── Phase A: Goal Selection ───
  return (
    <div style={{ animation: 'fadeUp 0.6s ease-out' }}>
      <StepBar current={0} />

      <h1 style={{
        fontFamily: t.display,
        fontSize: 28,
        fontWeight: 800,
        color: t.text,
        marginBottom: 8,
        lineHeight: 1.2,
      }}>
        What do you want to learn?
      </h1>
      <p style={{
        fontFamily: t.body,
        fontSize: 15,
        color: t.textSecondary,
        marginBottom: 24,
        lineHeight: 1.5,
      }}>
        Pick 1-3 skills to begin your journey
      </p>

      {/* Unified Search + Add Custom Skill */}
      <div style={{ marginBottom: 16 }}>
        <div style={{
          position: 'relative',
        }}>
          <div style={{
            position: 'absolute',
            left: 14,
            top: '50%',
            transform: 'translateY(-50%)',
          }}>
            <NeonIcon type="search" size={16} color="muted" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && canAddCustom) {
                addCustomGoal(searchQuery);
              }
            }}
            placeholder="Search skills or type to add your own..."
            style={{
              width: '100%',
              padding: '12px 76px 12px 40px',
              borderRadius: canAddCustom ? '12px 12px 0 0' : 12,
              border: `1px solid ${canAddCustom ? t.cyan : t.border}`,
              borderBottom: canAddCustom ? `1px solid ${t.cyan}30` : undefined,
              background: t.bgCard,
              color: t.text,
              fontFamily: t.body,
              fontSize: 14,
              outline: 'none',
              boxSizing: 'border-box',
              transition: 'border-color 0.2s ease, border-radius 0.2s ease',
            }}
            onFocus={(e) => { if (!canAddCustom) e.currentTarget.style.borderColor = t.violet; }}
            onBlur={(e) => { if (!canAddCustom) e.currentTarget.style.borderColor = t.border; }}
          />
          <div style={{
            position: 'absolute',
            right: 12,
            top: '50%',
            transform: 'translateY(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  padding: 2, display: 'flex', alignItems: 'center',
                }}
                aria-label="Clear search"
              >
                <NeonIcon type="close" size={14} color="muted" />
              </button>
            )}
            <button
              onClick={() => alert('Voice search — coming soon!')}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                padding: 2, display: 'flex', alignItems: 'center',
              }}
              title="Voice search — coming soon"
              aria-label="Voice search (coming soon)"
            >
              <NeonIcon type="mic" size={16} color="muted" />
            </button>
          </div>
        </div>

        {/* Inline "add custom" suggestion */}
        {canAddCustom && (
          <button
            onClick={() => addCustomGoal(searchQuery)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              width: '100%',
              padding: '12px 16px',
              borderRadius: '0 0 12px 12px',
              border: `1px solid ${t.cyan}40`,
              borderTop: 'none',
              background: `${t.cyan}06`,
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.2s ease',
              animation: 'fadeUp 0.2s ease-out',
            }}
          >
            <NeonIcon type="plus" size={16} color="cyan" />
            <span style={{
              fontFamily: t.body,
              fontSize: 13,
              fontWeight: 600,
              color: t.cyan,
            }}>
              Add &quot;{searchQuery.trim()}&quot; as custom skill
            </span>
            <span style={{
              marginLeft: 'auto',
              fontFamily: t.mono,
              fontSize: 10,
              color: t.textMuted,
            }}>
              Enter ↵
            </span>
          </button>
        )}
      </div>

      {/* Category Tabs */}
      <div style={{
        display: 'flex',
        gap: 6,
        marginBottom: 20,
        overflowX: 'auto',
        paddingBottom: 4,
      }}>
        {GOAL_CATEGORIES.map(cat => {
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '8px 14px',
                borderRadius: 20,
                border: `1px solid ${isActive ? t.violet : t.border}`,
                background: isActive ? `${t.violet}15` : 'transparent',
                color: isActive ? t.violet : t.textSecondary,
                fontFamily: t.body,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s ease',
                flexShrink: 0,
              }}
            >
              <NeonIcon type={cat.icon} size={14} color={isActive ? 'violet' : 'secondary'} />
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Social proof */}
      <p style={{
        fontFamily: t.body,
        fontSize: 12,
        color: t.textMuted,
        marginBottom: 12,
        fontStyle: 'italic',
      }}>
        Popular among professionals like you
      </p>

      {/* Goal Grid 2 columns */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 10,
        marginBottom: 20,
      }}>
        {filteredGoals.map((goal, i) => {
          const isSelected = selectedIds.has(goal.id);
          const isHovered = hoveredId === goal.id;
          const isFull = selectedGoals.length >= 3 && !isSelected;

          return (
            <button
              key={goal.id}
              onClick={() => toggleGoal(goal)}
              onMouseEnter={() => setHoveredId(goal.id)}
              onMouseLeave={() => setHoveredId(null)}
              disabled={isFull}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                padding: '14px 14px 12px',
                borderRadius: 16,
                border: `2px solid ${isSelected ? t.violet : isHovered ? t.borderHover : t.border}`,
                background: isSelected ? 'rgba(157,122,255,0.08)' : isHovered ? 'rgba(255,255,255,0.02)' : t.bgCard,
                cursor: isFull ? 'not-allowed' : 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s ease',
                animation: `fadeUp 0.4s ease-out ${Math.min(i, 8) * 0.04}s both`,
                boxShadow: isSelected ? '0 0 16px rgba(157,122,255,0.15)' : 'none',
                opacity: isFull ? 0.4 : 1,
                position: 'relative',
              }}
            >
              {/* Selection indicator */}
              {isSelected && (
                <div style={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  background: t.gradient,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  animation: 'celebratePop 0.3s ease-out',
                }}>
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                    <path d="M2.5 6L5 8.5L9.5 3.5" stroke="#FFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              )}

              <div style={{ marginBottom: 8 }}>
                <NeonIcon type={goal.icon} size={24} color={isSelected ? 'violet' : 'secondary'} active={isSelected} />
              </div>
              <span style={{
                fontFamily: t.display,
                fontSize: 13,
                fontWeight: 700,
                color: isSelected ? t.text : '#D4D4D8',
                lineHeight: 1.3,
                marginBottom: 6,
              }}>
                {goal.label}
              </span>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {goal.hot && (
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 3,
                    fontFamily: t.mono,
                    fontSize: 10,
                    fontWeight: 700,
                    color: t.rose,
                    background: `${t.rose}12`,
                    padding: '2px 6px',
                    borderRadius: 6,
                  }}>
                    <NeonIcon type="fire" size={10} color="rose" /> HOT
                  </span>
                )}
                {goal.trending && (
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 3,
                    fontFamily: t.mono,
                    fontSize: 10,
                    fontWeight: 700,
                    color: t.cyan,
                    background: `${t.cyan}12`,
                    padding: '2px 6px',
                    borderRadius: 6,
                  }}>
                    <NeonIcon type="trendUp" size={10} color="cyan" /> Trending
                  </span>
                )}
                <span style={{
                  fontFamily: t.mono,
                  fontSize: 10,
                  color: t.textMuted,
                  padding: '2px 4px',
                }}>
                  {goal.popularity}%
                </span>
              </div>
            </button>
          );
        })}

      </div>

      {/* Selected pills */}
      {selectedGoals.length > 0 && (
        <div style={{
          display: 'flex',
          gap: 8,
          flexWrap: 'wrap',
          marginBottom: 20,
          animation: 'fadeUp 0.3s ease-out',
        }}>
          {selectedGoals.map(goal => (
            <div key={goal.id} style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              borderRadius: 20,
              background: `${t.violet}15`,
              border: `1px solid ${t.violet}30`,
            }}>
              <span style={{
                fontFamily: t.body,
                fontSize: 13,
                fontWeight: 600,
                color: t.text,
              }}>
                {goal.label}
              </span>
              <button
                onClick={() => {
                  setGoals(selectedGoals.filter(g => g.id !== goal.id));
                  clearDownstream(1);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0 2px',
                  display: 'flex',
                  alignItems: 'center',
                }}
                aria-label={`Remove ${goal.label}`}
              >
                <NeonIcon type="close" size={12} color="muted" />
              </button>
            </div>
          ))}
          <span style={{
            fontFamily: t.mono,
            fontSize: 11,
            color: t.textMuted,
            alignSelf: 'center',
          }}>
            {selectedGoals.length}/3
          </span>
        </div>
      )}

      {/* Continue — goes to depth phase if goals selected */}
      <ContinueButton
        onClick={() => setPhase('depth')}
        disabled={selectedGoals.length < 1}
      />
    </div>
  );
}
