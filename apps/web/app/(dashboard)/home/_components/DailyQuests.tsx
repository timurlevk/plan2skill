'use client';

import React, { useState } from 'react';
import { NeonIcon } from '../../../(onboarding)/_components/NeonIcon';
import { t, rarity } from '../../../(onboarding)/_components/tokens';
import { XPFloat } from '../../../(onboarding)/_components/XPFloat';
import { GOALS } from '../../../(onboarding)/_data/goals';
import { getDailyProgressMessage } from '../_utils/xp-utils';
import type { QuestTask } from '../_utils/quest-templates';
import type { GoalSelection } from '@plan2skill/types';

interface QuestGroup {
  goal: GoalSelection;
  goalData: ReturnType<typeof GOALS.find>;
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
}

export function DailyQuests({
  questGroups, completedQuests, dailyCompleted, dailyTotal,
  xpFloatId, xpFloatAmount,
  onCompleteQuest, onUndoQuest, onOpenQuest,
}: DailyQuestsProps) {
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const toggleGroup = (id: string) => setExpandedGroups(p => ({ ...p, [id]: !p[id] }));
  const isExpanded = (id: string) => expandedGroups[id] !== false;

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
          Today&apos;s Quests
        </h2>
        {dailyTotal > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              fontFamily: t.body, fontSize: 11, color: t.textMuted, fontStyle: 'italic',
            }}>
              {getDailyProgressMessage(dailyCompleted, dailyTotal)}
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

      {questGroups.length === 0 ? (
        <div style={{
          padding: 32, borderRadius: 16,
          background: t.bgCard, border: `1px solid ${t.border}`,
          textAlign: 'center',
        }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
            <NeonIcon type="sparkle" size={32} color="muted" />
          </div>
          <p style={{ fontFamily: t.body, fontSize: 14, color: t.textMuted }}>
            No quests available yet
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {questGroups.map(({ goal, goalData, tasks }, gi) => {
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
                  {goalData && <NeonIcon type={goalData.icon} size={16} color={allDone ? 'cyan' : 'violet'} />}
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
                    {doneCount}/{tasks.length} quests
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
                {isExpanded(goal.id) && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {tasks.map((task, ti) => {
                      const r = rarity[task.rarity];
                      const done = completedQuests.has(task.id);
                      return (
                        <div
                          key={task.id}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 12,
                            padding: '12px 16px', borderRadius: 16,
                            background: done ? `${t.cyan}06` : t.bgCard,
                            border: `1px solid ${done ? `${t.cyan}30` : t.border}`,
                            cursor: 'pointer',
                            transition: 'all 0.25s ease',
                            animation: `fadeUp 0.3s ease-out ${ti * 0.05}s both`,
                            position: 'relative',
                            opacity: done ? 0.7 : 1,
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
                            style={{
                              width: 44, height: 44, flexShrink: 0,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              margin: '-10px -6px -10px -8px',
                              cursor: 'pointer',
                            }}
                          >
                            <div style={{
                              width: 22, height: 22, borderRadius: '50%',
                              border: `2px solid ${done ? t.cyan : t.borderHover}`,
                              background: done ? t.cyan : 'transparent',
                              transition: 'all 0.2s ease',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              transform: done ? 'scale(1.1)' : 'scale(1)',
                            }}>
                              {done && (
                                <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
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
                              <span
                                aria-label={`Rarity: ${r.icon}`}
                                style={{
                                  display: 'inline-flex', alignItems: 'center', gap: 3,
                                  fontFamily: t.mono, fontSize: 9, fontWeight: 700,
                                  padding: '2px 8px', borderRadius: 8,
                                  color: done ? t.textMuted : r.color,
                                  background: done ? `${t.textMuted}10` : `${r.color}10`,
                                  textTransform: 'uppercase',
                                  transition: 'all 0.2s ease',
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
                            {done ? 'Quest Complete!' : `+${task.xp} XP`}
                          </span>
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
    </div>
  );
}
