'use client';

import React from 'react';
import { t, rarity as rarityTokens } from './tokens';
import { NeonIcon, type NeonIconType } from './NeonIcon';

// ═══════════════════════════════════════════
// QUEST PREVIEW — First quest card with tasks
// 3 mini-tasks with checkboxes, XP reward
// ═══════════════════════════════════════════

interface QuestTask {
  id: string;
  label: string;
  completed: boolean;
}

interface QuestPreviewProps {
  title: string;
  description: string;
  icon: NeonIconType;
  tasks: QuestTask[];
  xpReward: number;
  onToggleTask: (index: number) => void;
  domain?: string;
}

export function QuestPreview({
  title, description, icon, tasks, xpReward, onToggleTask, domain,
}: QuestPreviewProps) {
  const completedCount = tasks.filter((t) => t.completed).length;
  const allComplete = completedCount === tasks.length;
  const rarityConfig = rarityTokens.uncommon;
  const progressPct = tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0;

  return (
    <div style={{
      background: t.bgCard,
      borderRadius: 16,
      border: `1.5px solid ${allComplete ? t.cyan : t.border}`,
      padding: '20px 18px',
      animation: 'fadeUp 0.5s ease-out',
      boxShadow: allComplete ? `0 0 20px ${t.cyan}20` : 'none',
      transition: 'all 0.3s ease',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        marginBottom: 14,
      }}>
        <div style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          background: `${rarityConfig.color}15`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          <NeonIcon type={icon} size={24} color={rarityConfig.color} active />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            marginBottom: 4,
          }}>
            <span style={{
              fontFamily: t.display,
              fontSize: 15,
              fontWeight: 700,
              color: t.text,
            }}>
              {title}
            </span>
            <span style={{
              fontFamily: t.mono,
              fontSize: 9,
              fontWeight: 700,
              color: rarityConfig.color,
              padding: '2px 6px',
              borderRadius: 4,
              background: rarityConfig.bg,
              textTransform: 'uppercase',
            }}>
              {rarityConfig.icon} {rarityConfig.label}
            </span>
          </div>
          <p style={{
            fontFamily: t.body,
            fontSize: 12,
            color: t.textMuted,
            margin: 0,
            lineHeight: 1.4,
          }}>
            {description}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{
        height: 4,
        borderRadius: 2,
        background: t.border,
        marginBottom: 14,
        overflow: 'hidden',
      }}>
        <div style={{
          width: `${progressPct}%`,
          height: '100%',
          borderRadius: 2,
          background: t.gradient,
          transition: 'width 0.4s ease-out',
        }} />
      </div>

      {/* Tasks */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {tasks.map((task, i) => (
          <button
            key={task.id}
            onClick={() => onToggleTask(i)}
            aria-label={`${task.completed ? 'Completed' : 'Incomplete'}: ${task.label}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 12px',
              borderRadius: 10,
              border: `1px solid ${task.completed ? `${t.cyan}30` : t.border}`,
              background: task.completed ? `${t.cyan}08` : 'transparent',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.2s ease',
              width: '100%',
            }}
          >
            {/* Checkbox */}
            <div style={{
              width: 20,
              height: 20,
              borderRadius: 6,
              border: `2px solid ${task.completed ? t.cyan : t.border}`,
              background: task.completed ? t.cyan : 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              transition: 'all 0.2s ease',
            }}>
              {task.completed && (
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                  <path d="M2.5 6L5 8.5L9.5 3.5" stroke="#FFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>

            {/* Label */}
            <span style={{
              fontFamily: t.body,
              fontSize: 13,
              color: task.completed ? t.textSecondary : t.text,
              textDecoration: task.completed ? 'line-through' : 'none',
              flex: 1,
            }}>
              {task.label}
            </span>
          </button>
        ))}
      </div>

      {/* XP reward footer */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 14,
        paddingTop: 12,
        borderTop: `1px solid ${t.border}`,
      }}>
        <span style={{
          fontFamily: t.body,
          fontSize: 12,
          color: t.textMuted,
        }}>
          {completedCount}/{tasks.length} tasks complete
        </span>
        <span style={{
          fontFamily: t.mono,
          fontSize: 12,
          fontWeight: 700,
          color: t.gold,
        }}>
          +{xpReward} XP
        </span>
      </div>
    </div>
  );
}
