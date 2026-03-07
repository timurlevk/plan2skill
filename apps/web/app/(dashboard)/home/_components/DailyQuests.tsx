'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useReducedMotion } from '../_hooks/useReducedMotion';
import { NeonIcon } from '../../../(onboarding)/_components/NeonIcon';
import { t, rarity, ROADMAP_TIERS } from '../../../(onboarding)/_components/tokens';
import { XPFloat } from '../../../(onboarding)/_components/XPFloat';
import { getDailyProgressMessage } from '../_utils/xp-utils';
import { useI18nStore } from '@plan2skill/store';
import type { QuestTask } from '../_utils/quest-templates';

interface QuestGroup {
  goal: { id: string; label: string };
  goalData: { icon?: string } | null;
  tasks: QuestTask[];
}

interface DailyQuestsProps {
  questGroups: QuestGroup[];
  completedQuests: Set<string>;
  dailyCompleted: number;
  dailyTotal: number;
  xpFloatId: string | null;
  xpFloatAmount: number;
  onCompleteQuest: (taskId: string, xp: number) => void;
  onUndoQuest: (taskId: string) => void;
  onOpenQuest: (taskId: string) => void;
  onOpenQuestReview?: (taskId: string) => void;
}

export function DailyQuests({
  questGroups, completedQuests, dailyCompleted, dailyTotal,
  xpFloatId, xpFloatAmount,
  onCompleteQuest, onUndoQuest, onOpenQuest, onOpenQuestReview,
}: DailyQuestsProps) {
  const tr = useI18nStore((s) => s.t);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [hoveredQuest, setHoveredQuest] = useState<string | null>(null);
  const [pressedCheckbox, setPressedCheckbox] = useState<string | null>(null);
  // Track which groups are collapsing for exit animation
  const [collapsingGroups, setCollapsingGroups] = useState<Record<string, boolean>>({});
  // Track recently completed quests for celebration flash
  const [celebratingQuest, setCelebratingQuest] = useState<string | null>(null);
  const prevCompletedRef = useRef<Set<string>>(completedQuests);
  // Completed section toggle
  const [showCompleted, setShowCompleted] = useState(false);
  // Roadmap filter
  const [activeFilter, setActiveFilter] = useState<string>('all');

  // prefers-reduced-motion guard
  const prefersReduced = useReducedMotion();

  // Detect newly completed quests for celebration flash
  useEffect(() => {
    if (prefersReduced.current) { prevCompletedRef.current = completedQuests; return; }
    const prev = prevCompletedRef.current;
    // Find first new completion (quests complete one at a time)
    let newId: string | null = null;
    for (const id of Array.from(completedQuests)) {
      if (!prev.has(id)) { newId = id; break; }
    }
    prevCompletedRef.current = completedQuests;
    if (!newId) return;
    setCelebratingQuest(newId);
    const timer = setTimeout(() => setCelebratingQuest(null), 300);
    return () => clearTimeout(timer);
  }, [completedQuests]);

  const toggleGroup = useCallback((id: string) => {
    const currentlyExpanded = expandedGroups[id] !== false;
    if (currentlyExpanded) {
      // Start collapse animation, then hide after animation
      setCollapsingGroups(p => ({ ...p, [id]: true }));
      setTimeout(() => {
        setExpandedGroups(p => ({ ...p, [id]: false }));
        setCollapsingGroups(p => ({ ...p, [id]: false }));
      }, 200);
    } else {
      setExpandedGroups(p => ({ ...p, [id]: true }));
    }
  }, [expandedGroups]);
  const isExpanded = (id: string) => expandedGroups[id] !== false;

  // Compute unique roadmap filters from quest tasks
  const roadmapFilters = useMemo(() => {
    const seen = new Map<string, string>();
    for (const group of questGroups) {
      for (const task of group.tasks) {
        if (task.roadmapId && task.roadmapTitle && !seen.has(task.roadmapId)) {
          seen.set(task.roadmapId, task.roadmapTitle);
        }
      }
    }
    return Array.from(seen.entries()).map(([id, title]) => ({ id, title }));
  }, [questGroups]);

  // Filter groups by selected roadmap
  const filteredGroups = useMemo(() => {
    if (activeFilter === 'all') return questGroups;
    return questGroups
      .map((g) => ({ ...g, tasks: g.tasks.filter((task) => task.roadmapId === activeFilter) }))
      .filter((g) => g.tasks.length > 0);
  }, [questGroups, activeFilter]);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <h2 style={{
          display: 'flex', alignItems: 'center', gap: 6,
          fontFamily: t.display, fontSize: 13, fontWeight: 700,
          color: t.textSecondary, textTransform: 'uppercase',
          letterSpacing: '0.08em', margin: 0,
        }}>
          <NeonIcon type="sparkle" size={14} color="gold" />
          {tr('dashboard.daily_quests', "Today's Quests")}
        </h2>
        {dailyTotal > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              fontFamily: t.body, fontSize: 11, color: t.textMuted, fontStyle: 'italic',
            }}>
              {getDailyProgressMessage(dailyCompleted, dailyTotal, tr)}
            </span>
            <span style={{
              fontFamily: t.mono, fontSize: 11, fontWeight: 800,
              color: dailyCompleted === dailyTotal ? t.cyan : t.violet,
              padding: '2px 8px', borderRadius: 8,
              background: dailyCompleted === dailyTotal ? `${t.cyan}12` : `${t.violet}12`,
            }}>
              {dailyCompleted}/{dailyTotal}
            </span>
          </div>
        )}
      </div>

      {/* Filter row — per-roadmap filters (shown when 2+ roadmaps) */}
      {roadmapFilters.length > 1 && (
        <div style={{
          display: 'flex', gap: 6, flexWrap: 'wrap',
          marginBottom: 12, paddingBottom: 8,
        }}>
          <button
            onClick={() => setActiveFilter('all')}
            style={{
              padding: '4px 12px', borderRadius: 10,
              background: activeFilter === 'all' ? `${t.violet}15` : 'transparent',
              border: `1px solid ${activeFilter === 'all' ? t.violet : t.border}`,
              cursor: 'pointer',
              fontFamily: t.mono, fontSize: 10, fontWeight: 700,
              color: activeFilter === 'all' ? t.violet : t.textMuted,
              transition: 'all 0.15s ease',
            }}
          >
            {tr('dashboard.filter_all', 'All')}
          </button>
          {roadmapFilters.map((rf) => {
            const isActive = activeFilter === rf.id;
            return (
              <button
                key={rf.id}
                onClick={() => setActiveFilter(isActive ? 'all' : rf.id)}
                style={{
                  padding: '4px 12px', borderRadius: 10,
                  background: isActive ? `${t.violet}15` : 'transparent',
                  border: `1px solid ${isActive ? t.violet : t.border}`,
                  cursor: 'pointer',
                  fontFamily: t.mono, fontSize: 10, fontWeight: 700,
                  color: isActive ? t.violet : t.textMuted,
                  transition: 'all 0.15s ease',
                }}
              >
                {rf.title}
              </button>
            );
          })}
        </div>
      )}

      {filteredGroups.length === 0 ? (
        <div style={{
          padding: 32, borderRadius: 16,
          background: t.bgCard, border: `1px solid ${t.border}`,
          textAlign: 'center',
        }}>
          <div style={{
            display: 'flex', justifyContent: 'center', marginBottom: 8,
            animation: prefersReduced.current ? 'none' : 'float 3s ease-in-out infinite',
          }}>
            <NeonIcon type="sparkle" size={32} color="muted" />
          </div>
          <p style={{ fontFamily: t.body, fontSize: 14, color: t.textMuted }}>
            {tr('quest.no_quests', 'No quests available yet')}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {filteredGroups.map(({ goal, goalData, tasks }, gi) => {
            const doneCount = tasks.filter(tk => completedQuests.has(tk.id)).length;
            const allDone = doneCount === tasks.length;
            return (
              <div key={goal.id} style={{ animation: `fadeUp 0.4s ease-out ${gi * 0.08}s both` }}>
                {/* Group header */}
                <button
                  onClick={() => toggleGroup(goal.id)}
                  aria-expanded={isExpanded(goal.id)}
                  aria-label={`${goal.label} quests — ${doneCount} of ${tasks.length} complete`}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    width: '100%', padding: '8px 0', marginBottom: 8,
                    background: 'none', border: 'none', cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <NeonIcon type={goalData?.icon || 'target'} size={16} color={allDone ? 'cyan' : 'violet'} />
                  <span style={{
                    fontFamily: t.display, fontSize: 14, fontWeight: 700, color: t.text,
                    flex: 1,
                  }}>
                    {goal.label}
                  </span>
                  <span style={{
                    fontFamily: t.mono, fontSize: 10, fontWeight: 700,
                    color: allDone ? t.cyan : t.textMuted, padding: '2px 8px', borderRadius: 8,
                    background: allDone ? `${t.cyan}12` : `${t.violet}10`,
                  }}>
                    {tr('quest.count', '{done}/{total} quests').replace('{done}', String(doneCount)).replace('{total}', String(tasks.length))}
                  </span>
                  <span style={{
                    color: t.textMuted, fontSize: 12, display: 'inline-block',
                    transform: isExpanded(goal.id) ? 'rotate(180deg)' : 'rotate(0)',
                    transition: 'transform 0.2s ease',
                  }}>
                    ▾
                  </span>
                </button>

                {/* Tasks */}
                {(isExpanded(goal.id) || collapsingGroups[goal.id]) && (
                  <div style={{
                    display: 'flex', flexDirection: 'column', gap: 8,
                    animation: collapsingGroups[goal.id]
                      ? 'fadeUp 0.2s ease-in reverse forwards'
                      : 'fadeUp 0.25s ease-out',
                  }}>
                    {tasks.map((task, ti) => {
                      const r = rarity[task.rarity] ?? rarity.common;
                      const done = completedQuests.has(task.id);
                      const isHovered = hoveredQuest === task.id;
                      const isCelebrating = celebratingQuest === task.id;
                      const hoverBorder = isHovered ? `${r.color}40` : (done ? `${t.cyan}30` : t.border);
                      return (
                        <div key={task.id} style={{ animation: `fadeUp 0.3s ease-out ${ti * 0.05}s both` }}>
                        <div
                          onMouseEnter={() => setHoveredQuest(task.id)}
                          onMouseLeave={() => setHoveredQuest(null)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 12,
                            padding: '12px 16px', borderRadius: 16,
                            background: done ? `${t.cyan}06` : t.bgCard,
                            border: `1px solid ${isCelebrating ? t.cyan : hoverBorder}`,
                            cursor: 'pointer',
                            transition: 'border-color 0.2s ease, background 0.25s ease, opacity 0.25s ease, transform 0.2s ease',
                            position: 'relative',
                            opacity: done ? 0.7 : 1,
                            transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
                          }}
                        >
                          {xpFloatId === task.id && (
                            <XPFloat amount={xpFloatAmount} show />
                          )}

                          {/* Checkbox — 44px touch target (UX-R153) */}
                          <div
                            role="checkbox"
                            aria-checked={done}
                            aria-label={`Mark "${task.title}" as ${done ? 'incomplete' : 'complete'}`}
                            tabIndex={0}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (done) onUndoQuest(task.id);
                              else onCompleteQuest(task.id, task.xp);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                if (done) onUndoQuest(task.id);
                                else onCompleteQuest(task.id, task.xp);
                              }
                            }}
                            onMouseDown={() => setPressedCheckbox(task.id)}
                            onMouseUp={() => setPressedCheckbox(null)}
                            onMouseLeave={() => { if (pressedCheckbox === task.id) setPressedCheckbox(null); }}
                            style={{
                              width: 44, height: 44, flexShrink: 0,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              margin: '-10px -6px -10px -8px',
                              cursor: 'pointer',
                              transform: pressedCheckbox === task.id ? 'scale(0.9)' : 'scale(1)',
                              transition: 'transform 0.1s ease-out',
                            }}
                          >
                            <div style={{
                              width: 22, height: 22, borderRadius: '50%',
                              border: `2px solid ${done ? t.cyan : t.borderHover}`,
                              background: done ? t.cyan : 'transparent',
                              transition: 'background 0.2s ease, border-color 0.2s ease',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              transform: done ? 'scale(1.1)' : 'scale(1)',
                            }}>
                              {done && (
                                <svg
                                  width="11" height="11" viewBox="0 0 12 12" fill="none"
                                  style={{
                                    animation: isCelebrating ? 'bounceIn 0.2s cubic-bezier(0.34,1.56,0.64,1)' : 'none',
                                  }}
                                >
                                  <path d="M2.5 6L5 8.5L9.5 3.5" stroke="#FFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              )}
                            </div>
                          </div>

                          {/* Content — opens quest card */}
                          <div
                            onClick={() => onOpenQuest(task.id)}
                            style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}
                          >
                            <div style={{
                              fontFamily: t.body, fontSize: 14, fontWeight: 500,
                              color: done ? t.textMuted : t.text, marginBottom: 4,
                              textDecoration: done ? 'line-through' : 'none',
                              transition: 'color 0.2s ease',
                            }}>
                              {task.title}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                              {/* Roadmap tier chip */}
                              {task.roadmapTitle && (() => {
                                const tier = task.roadmapTier ?? 'diamond';
                                const tierStyle = ROADMAP_TIERS[tier];
                                return (
                                  <span style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 3,
                                    fontFamily: t.mono, fontSize: 8, fontWeight: 800,
                                    padding: '2px 8px', borderRadius: 8,
                                    background: done ? `${t.textMuted}10` : tierStyle.bg,
                                    color: done ? t.textMuted : tierStyle.text,
                                    boxShadow: done ? 'none' : tierStyle.shadow,
                                    textShadow: done ? 'none' : tierStyle.textShadow,
                                    textTransform: 'uppercase',
                                  }}>
                                    {task.roadmapTitle}
                                  </span>
                                );
                              })()}
                              <span
                                aria-label={`Rarity: ${r.icon}`}
                                style={{
                                  display: 'inline-flex', alignItems: 'center', gap: 3,
                                  fontFamily: t.mono, fontSize: 9, fontWeight: 700,
                                  padding: '2px 8px', borderRadius: 8,
                                  color: done ? t.textMuted : r.color,
                                  background: done ? `${t.textMuted}10` : `${r.color}10`,
                                  textTransform: 'uppercase',
                                  transition: 'opacity 0.2s ease, transform 0.2s ease',
                                }}
                              >
                                {r.icon} {task.type}
                              </span>
                              <span style={{
                                display: 'inline-flex', alignItems: 'center', gap: 3,
                                fontFamily: t.body, fontSize: 11, color: t.textMuted,
                              }}>
                                <NeonIcon type="clock" size={11} color="muted" />
                                {task.mins} min
                              </span>
                            </div>
                          </div>

                          {/* XP reward */}
                          <span
                            onClick={() => onOpenQuest(task.id)}
                            style={{
                              fontFamily: t.mono, fontSize: 12, fontWeight: 800,
                              color: done ? t.textMuted : t.violet, flexShrink: 0,
                              transition: 'color 0.2s ease',
                              cursor: 'pointer',
                            }}
                          >
                            {done ? tr('quest.complete', 'Quest Complete!') : tr('quest.xp_earned', '+{n} XP').replace('{n}', String(task.xp))}
                          </span>
                        </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Completed Quests (collapsible) ── */}
      {(() => {
        const completedTasks = questGroups.flatMap((g) =>
          g.tasks.filter((task) => completedQuests.has(task.id))
        );
        if (completedTasks.length === 0) return null;
        return (
          <div style={{ marginTop: 16 }}>
            <button
              onClick={() => setShowCompleted((v) => !v)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 12px', borderRadius: 10,
                background: 'transparent', border: `1px solid ${t.border}`,
                cursor: 'pointer', width: '100%', textAlign: 'left',
                transition: 'background 0.2s ease',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = t.bgElevated; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
            >
              <NeonIcon type="check" size={12} color="cyan" />
              <span style={{
                fontFamily: t.display, fontSize: 12, fontWeight: 700,
                color: t.textSecondary, flex: 1,
              }}>
                {tr('dashboard.completed_today', 'Completed ({n})').replace('{n}', String(completedTasks.length))}
              </span>
              <span style={{
                fontFamily: t.mono, fontSize: 10, color: t.textMuted,
                transform: showCompleted ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease',
                display: 'inline-block',
              }}>
                ▼
              </span>
            </button>
            {showCompleted && (
              <div style={{
                marginTop: 8,
                animation: 'fadeUp 0.2s ease-out',
              }}>
                {completedTasks.map((task) => {
                  const r2 = rarity[task.rarity] ?? rarity.common;
                  return (
                    <button
                      key={task.id}
                      onClick={() => onOpenQuestReview?.(task.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '10px 14px', borderRadius: 12,
                        background: t.bgElevated, border: `1px solid ${t.border}`,
                        marginBottom: 4, opacity: 0.7,
                        width: '100%', textAlign: 'left',
                        cursor: onOpenQuestReview ? 'pointer' : 'default',
                        transition: 'opacity 0.15s ease',
                      }}
                      onMouseEnter={(e) => { if (onOpenQuestReview) (e.currentTarget as HTMLElement).style.opacity = '0.9'; }}
                      onMouseLeave={(e) => { if (onOpenQuestReview) (e.currentTarget as HTMLElement).style.opacity = '0.7'; }}
                    >
                      <NeonIcon type="check" size={14} color="cyan" />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontFamily: t.body, fontSize: 13, fontWeight: 500,
                          color: t.textMuted, textDecoration: 'line-through',
                        }}>
                          {task.title}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                          <span style={{
                            fontFamily: t.mono, fontSize: 9, fontWeight: 700,
                            padding: '1px 6px', borderRadius: 6,
                            color: t.textMuted, background: `${t.textMuted}10`,
                            textTransform: 'uppercase',
                          }}>
                            {r2.icon} {task.type}
                          </span>
                        </div>
                      </div>
                      <span style={{
                        fontFamily: t.mono, fontSize: 11, fontWeight: 700,
                        color: t.textMuted,
                      }}>
                        {onOpenQuestReview
                          ? tr('quest.review', 'Review')
                          : tr('quest.complete', 'Quest Complete!')}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
}
