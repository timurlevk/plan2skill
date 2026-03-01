'use client';

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useOnboardingStore } from '@plan2skill/store';
import { NeonIcon } from '../../(onboarding)/_components/NeonIcon';
import type { NeonIconType } from '../../(onboarding)/_components/NeonIcon';
import { t, rarity, skillLevelRarity } from '../../(onboarding)/_components/tokens';
import { XPFloat } from '../../(onboarding)/_components/XPFloat';
import { CHARACTERS, charArtStrings, charPalettes } from '../../(onboarding)/_components/characters';
import { parseArt, PixelCanvas, AnimatedPixelCanvas } from '../../(onboarding)/_components/PixelEngine';
import { GOALS } from '../../(onboarding)/_data/goals';
import { ARCHETYPES } from '../../(onboarding)/_data/archetypes';

// ═══════════════════════════════════════════
// COMMAND CENTER — Dashboard home page
// Greeting, stats, active quests, today's quests
// ═══════════════════════════════════════════

// ─── Task type ───
interface QuestTask {
  id: string;
  title: string;
  type: string;
  xp: number;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  mins: number;
  desc: string;
  objectives: string[];
  goalLabel: string;
  goalIcon: string;
}

// ─── Mock task generator with descriptions ───
const TASK_TEMPLATES = [
  {
    titleFn: (g: string) => `Read: Introduction to ${g}`,
    type: 'article', xp: 15, rarity: 'common' as const, mins: 5,
    descFn: (g: string) => `Dive into the fundamentals of ${g}. This article covers the core concepts you need before going deeper.`,
    objectivesFn: (g: string) => [
      `Read the full introduction to ${g}`,
      'Take note of 3 key concepts',
      'Mark quest as complete when done',
    ],
  },
  {
    titleFn: (g: string) => `Watch: ${g} Fundamentals`,
    type: 'video', xp: 25, rarity: 'common' as const, mins: 10,
    descFn: (g: string) => `A guided video walkthrough of ${g} fundamentals. Follow along and practice the demonstrated techniques.`,
    objectivesFn: (g: string) => [
      `Watch the ${g} fundamentals video`,
      'Follow along with the examples',
      'Try one technique on your own',
    ],
  },
  {
    titleFn: (g: string) => `Quiz: ${g} Basics`,
    type: 'quiz', xp: 30, rarity: 'uncommon' as const, mins: 5,
    descFn: (g: string) => `Test your knowledge of ${g} basics. Score 80% or higher to earn bonus XP. Don't worry — you can retry!`,
    objectivesFn: (g: string) => [
      `Complete the ${g} basics quiz`,
      'Score at least 80%',
      'Review any incorrect answers',
    ],
  },
  {
    titleFn: (g: string) => `Build: ${g} Mini-Project`,
    type: 'project', xp: 50, rarity: 'rare' as const, mins: 20,
    descFn: (g: string) => `Apply what you've learned by building a small ${g} project from scratch. This is where real learning happens!`,
    objectivesFn: (g: string) => [
      'Set up your project environment',
      `Build a working ${g} prototype`,
      'Test and iterate on your solution',
      'Share or save your progress',
    ],
  },
];

function generateTasks(goalLabel: string, goalId: string, goalIcon: string): QuestTask[] {
  const seed = goalId.length;
  const count = 2 + (seed % 2); // 2 or 3 tasks
  return TASK_TEMPLATES.slice(0, count).map((tmpl, i) => ({
    id: `${goalId}-task-${i}`,
    title: tmpl.titleFn(goalLabel),
    type: tmpl.type,
    xp: tmpl.xp,
    rarity: tmpl.rarity,
    mins: tmpl.mins,
    desc: tmpl.descFn(goalLabel),
    objectives: tmpl.objectivesFn(goalLabel),
    goalLabel,
    goalIcon,
  }));
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

// ─── Quest type → icon mapping ───
const TYPE_ICONS: Record<string, { icon: 'book' | 'play' | 'quiz' | 'rocket'; label: string }> = {
  article: { icon: 'book', label: 'Scroll' },
  video:   { icon: 'play', label: 'Vision' },
  quiz:    { icon: 'quiz', label: 'Trial' },
  project: { icon: 'rocket', label: 'Forge' },
};

// ─── Challenge Tier (RPG vocabulary for difficulty) ───
const CHALLENGE_TIER: Record<string, { label: string; color: string }> = {
  common:    { label: 'Tier I',  color: rarity.common.color },
  uncommon:  { label: 'Tier II', color: rarity.uncommon.color },
  rare:      { label: 'Tier III', color: rarity.rare.color },
  epic:      { label: 'Tier IV', color: rarity.epic.color },
  legendary: { label: 'Tier V',  color: rarity.legendary.color },
};

// ─── Completion sound via Web Audio API (Micro tier) ───
function playCompleteSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    // Two-tone chime: C5 → E5
    [523.25, 659.25].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.15, ctx.currentTime + i * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.12);
      osc.stop(ctx.currentTime + i * 0.12 + 0.3);
    });
    // Cleanup after sound finishes
    setTimeout(() => ctx.close(), 600);
  } catch { /* Web Audio not available — silent fallback */ }
}

// ─── Variable Bonus XP (20% chance, Variable Ratio Reinforcement) ───
function rollBonusXP(baseXP: number): { bonus: number; total: number; hasBonus: boolean } {
  const hasBonus = Math.random() < 0.2; // 20% chance
  const bonus = hasBonus ? Math.round(baseXP * 0.5) : 0; // +50% bonus
  return { bonus, total: baseXP + bonus, hasBonus };
}

// ─── Daily quest proximity messaging (Goal-Gradient Effect) ───
function getDailyProgressMessage(completed: number, total: number): string {
  if (completed === 0) return 'Begin your journey, hero!';
  if (completed === total) return 'All quests conquered! Glorious!';
  const remaining = total - completed;
  if (remaining === 1) return 'One quest away from glory!';
  if (completed / total >= 0.5) return 'Over halfway — keep the momentum!';
  return `${remaining} quests remain on your path`;
}

// ═══════════════════════════════════════════
// QUEST CARD MODAL — Gamified quest detail
// State: viewing → completing → celebrating → summary → (nextQuest | close)
// Animation tiers: Meso (400-1200ms) for celebration, Micro for sound
// ═══════════════════════════════════════════
function QuestCardModal({ task, done, onClose, onToggle, onOpenNext, characterId, dailyCompleted, dailyTotal, bonusResult }: {
  task: QuestTask;
  done: boolean;
  onClose: () => void;
  onToggle: () => void;
  onOpenNext: (() => void) | null; // null if no next quest
  characterId: string | null;
  dailyCompleted: number;
  dailyTotal: number;
  bonusResult: { bonus: number; total: number; hasBonus: boolean } | null;
}) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const r = rarity[task.rarity] as { color: string; icon: string; shape: string; label: string; bg: string; glow: string };
  const typeInfo = TYPE_ICONS[task.type] || { icon: 'sparkle' as const, label: task.type };
  const tier = CHALLENGE_TIER[task.rarity] ?? { label: 'Tier I', color: rarity.common.color };

  // Multi-step completion state: 'viewing' → 'celebrating' → 'summary'
  const [phase, setPhase] = useState<'viewing' | 'celebrating' | 'summary'>('viewing');

  // Sparkle positions — stable across re-renders
  const sparklePositions = useRef(
    Array.from({ length: 5 }, () => ({
      top: 20 + Math.random() * 60,
      left: 10 + Math.random() * 80,
    }))
  ).current;

  // Character companion data
  const charData = useMemo(() => {
    if (!characterId || !charArtStrings[characterId] || !charPalettes[characterId]) return null;
    return {
      id: characterId,
      artString: charArtStrings[characterId]!,
      palette: charPalettes[characterId]!,
      art: parseArt(charArtStrings[characterId]!, charPalettes[characterId]!),
    };
  }, [characterId]);
  const charMeta = CHARACTERS.find(c => c.id === characterId);

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        if (phase === 'celebrating') setPhase('summary');
        else onClose();
      }
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose, phase]);

  // Lock body scroll while modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // Auto-advance from celebrating → summary after 1.5s
  useEffect(() => {
    if (phase !== 'celebrating') return;
    const timer = setTimeout(() => setPhase('summary'), 1500);
    return () => clearTimeout(timer);
  }, [phase]);

  // Close on overlay click
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) {
      if (phase === 'celebrating') setPhase('summary');
      else onClose();
    }
  };

  // Complete with celebration
  const handleComplete = () => {
    if (done) {
      onToggle(); // undo → restart quest
    } else {
      onToggle(); // complete
      playCompleteSound();
      setPhase('celebrating');
    }
  };

  const progressMsg = getDailyProgressMessage(dailyCompleted, dailyTotal);
  const xpEarned = bonusResult || { bonus: 0, total: task.xp, hasBonus: false };

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="quest-card-title"
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
        animation: 'fadeUp 0.2s ease-out',
      }}
    >
      <div style={{
        width: '100%', maxWidth: 440,
        background: t.bgCard, borderRadius: 20,
        border: `1px solid ${r.color}30`,
        boxShadow: r.glow !== 'none'
          ? `${r.glow}, 0 24px 48px rgba(0,0,0,0.5)`
          : `0 0 40px ${r.color}15, 0 24px 48px rgba(0,0,0,0.5)`,
        overflow: 'hidden',
        animation: 'slideUp 0.4s cubic-bezier(0.175,0.885,0.32,1.275)',
        maxHeight: '85vh',
        overflowY: 'auto',
        position: 'relative',
      }}>
        {/* ─── Phase: Celebrating (Meso tier: 800ms, interruptible → tap advances to summary) ─── */}
        {phase === 'celebrating' && (
          <div style={{
            position: 'absolute', inset: 0, zIndex: 10,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            background: `${t.bg}E0`,
            animation: 'fadeUp 0.3s ease-out',
            cursor: 'pointer',
          }} onClick={() => setPhase('summary')}>
            {charData && (
              <div style={{ marginBottom: 16, animation: 'bounceIn 0.5s ease-out' }}>
                <AnimatedPixelCanvas character={charData} size={5} glowColor={charMeta?.color} />
              </div>
            )}
            <div style={{
              fontFamily: t.display, fontSize: 22, fontWeight: 900,
              background: t.gradient,
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              animation: 'celebratePop 0.6s ease-out 0.2s both',
              marginBottom: 8,
            }}>
              Quest Complete!
            </div>
            <div style={{
              fontFamily: t.mono, fontSize: 18, fontWeight: 800, color: t.gold,
              animation: 'xpFloat 1.2s ease-out 0.4s both',
            }}>
              +{xpEarned.total} XP
            </div>
            {/* Bonus XP indicator (Variable Ratio Reinforcement) */}
            {xpEarned.hasBonus && (
              <div style={{
                fontFamily: t.mono, fontSize: 13, fontWeight: 800, color: t.gold,
                animation: 'celebratePop 0.6s ease-out 0.8s both',
                marginTop: 4,
                textShadow: `0 0 12px ${t.gold}80`,
              }}>
                ★ BONUS +{xpEarned.bonus} XP ★
              </div>
            )}
            {/* Sparkle particles */}
            {sparklePositions.map((pos, i) => (
              <div key={i} style={{
                position: 'absolute',
                top: `${pos.top}%`,
                left: `${pos.left}%`,
                width: 6, height: 6, borderRadius: '50%',
                background: [t.violet, t.cyan, t.gold, t.rose, t.mint][i],
                animation: `sparkle 1s ease-in-out ${i * 0.15}s infinite`,
                pointerEvents: 'none',
              }} />
            ))}
            <div style={{
              fontFamily: t.body, fontSize: 11, color: t.textMuted,
              marginTop: 16, animation: 'fadeUp 0.5s ease-out 0.8s both',
            }}>
              Tap to continue
            </div>
          </div>
        )}

        {/* ─── Phase: Summary (after celebration) — XP breakdown + daily progress + next quest CTA ─── */}
        {phase === 'summary' && (
          <div style={{
            position: 'absolute', inset: 0, zIndex: 10,
            display: 'flex', flexDirection: 'column',
            background: t.bgCard,
            animation: 'fadeUp 0.4s ease-out',
            padding: 24,
            overflowY: 'auto',
          }}>
            {/* Close */}
            <button
              onClick={onClose}
              aria-label="Close summary"
              style={{
                position: 'absolute', top: 12, right: 12,
                width: 32, height: 32, borderRadius: '50%',
                background: t.border, border: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <NeonIcon type="close" size={14} color="muted" />
            </button>

            {/* Character + title */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24 }}>
              {charData && (
                <div style={{ marginBottom: 12, animation: 'float 3s ease-in-out infinite' }}>
                  <AnimatedPixelCanvas character={charData} size={4} glowColor={charMeta?.color} />
                </div>
              )}
              <div style={{
                fontFamily: t.display, fontSize: 18, fontWeight: 900,
                color: t.text, textAlign: 'center', marginBottom: 4,
              }}>
                Quest Complete!
              </div>
              <div style={{
                fontFamily: t.body, fontSize: 13, color: t.textSecondary,
                textAlign: 'center',
              }}>
                {task.title}
              </div>
            </div>

            {/* XP Breakdown card */}
            <div style={{
              padding: 16, borderRadius: 14,
              background: t.bgElevated, border: `1px solid ${t.border}`,
              marginBottom: 16,
            }}>
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginBottom: xpEarned.hasBonus ? 8 : 0,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <NeonIcon type="xp" size={18} color="gold" />
                  <span style={{ fontFamily: t.body, fontSize: 13, fontWeight: 600, color: t.textSecondary }}>
                    Quest Bounty
                  </span>
                </div>
                <span style={{ fontFamily: t.mono, fontSize: 16, fontWeight: 800, color: t.gold }}>
                  +{task.xp} XP
                </span>
              </div>
              {/* Bonus row (Variable Ratio Reinforcement — surprise reward) */}
              {xpEarned.hasBonus && (
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  paddingTop: 8, borderTop: `1px solid ${t.border}`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 14 }}>★</span>
                    <span style={{
                      fontFamily: t.body, fontSize: 13, fontWeight: 600,
                      color: t.gold,
                    }}>
                      Lucky Bonus!
                    </span>
                  </div>
                  <span style={{
                    fontFamily: t.mono, fontSize: 16, fontWeight: 800, color: t.gold,
                    textShadow: `0 0 8px ${t.gold}60`,
                  }}>
                    +{xpEarned.bonus} XP
                  </span>
                </div>
              )}
              {/* Total */}
              {xpEarned.hasBonus && (
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  paddingTop: 8, marginTop: 8, borderTop: `1px solid ${t.border}`,
                }}>
                  <span style={{ fontFamily: t.body, fontSize: 13, fontWeight: 700, color: t.text }}>
                    Total
                  </span>
                  <span style={{ fontFamily: t.mono, fontSize: 18, fontWeight: 800, color: t.cyan }}>
                    +{xpEarned.total} XP
                  </span>
                </div>
              )}
            </div>

            {/* Streak display */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 16px', borderRadius: 14,
              background: `${t.gold}08`, border: `1px solid ${t.gold}15`,
              marginBottom: 16,
            }}>
              <NeonIcon type="fire" size={18} color="gold" />
              <div style={{ flex: 1 }}>
                <span style={{ fontFamily: t.body, fontSize: 13, fontWeight: 600, color: t.text }}>
                  0-day streak
                </span>
                <span style={{
                  fontFamily: t.body, fontSize: 11, color: t.textMuted,
                  marginLeft: 8,
                }}>
                  Complete daily quests to build your streak!
                </span>
              </div>
            </div>

            {/* Daily Quest Progress (Goal-Gradient Effect — Zeigarnik trigger) */}
            <div style={{
              padding: 16, borderRadius: 14,
              background: t.bgElevated, border: `1px solid ${t.border}`,
              marginBottom: 24,
            }}>
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginBottom: 10,
              }}>
                <span style={{ fontFamily: t.body, fontSize: 13, fontWeight: 600, color: t.text }}>
                  Today&apos;s Progress
                </span>
                <span style={{ fontFamily: t.mono, fontSize: 12, fontWeight: 800, color: t.cyan }}>
                  {dailyCompleted}/{dailyTotal}
                </span>
              </div>
              {/* Quest dots — filled = complete, hollow = remaining */}
              <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
                {Array.from({ length: dailyTotal }, (_, i) => (
                  <div key={i} style={{
                    width: 12, height: 12, borderRadius: '50%',
                    background: i < dailyCompleted ? t.cyan : 'transparent',
                    border: `2px solid ${i < dailyCompleted ? t.cyan : t.border}`,
                    transition: 'all 0.3s ease',
                    animation: i === dailyCompleted - 1 ? 'bounceIn 0.4s ease-out' : 'none',
                  }} />
                ))}
              </div>
              {/* Proximity messaging */}
              <div style={{
                fontFamily: t.body, fontSize: 12, color: t.textSecondary,
                fontStyle: 'italic',
              }}>
                {progressMsg}
              </div>
            </div>

            {/* Action buttons — Session-extend "Next Quest" CTA */}
            {onOpenNext && dailyCompleted < dailyTotal ? (
              <>
                <button
                  onClick={() => {
                    onOpenNext();
                  }}
                  style={{
                    width: '100%', padding: '14px 0', borderRadius: 14,
                    border: 'none', background: t.gradient,
                    cursor: 'pointer',
                    fontFamily: t.display, fontSize: 15, fontWeight: 800,
                    color: '#FFF', transition: 'all 0.2s ease',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    borderBottom: '4px solid #6A50CC',
                  }}
                >
                  <NeonIcon type="sparkle" size={16} color="text" />
                  Next Quest
                </button>
                <button
                  onClick={onClose}
                  style={{
                    width: '100%', padding: '10px 0', marginTop: 8,
                    background: 'none', border: 'none',
                    fontFamily: t.body, fontSize: 13, fontWeight: 500,
                    color: t.textMuted, cursor: 'pointer',
                  }}
                >
                  Return to Command Center
                </button>
              </>
            ) : (
              <button
                onClick={onClose}
                style={{
                  width: '100%', padding: '14px 0', borderRadius: 14,
                  border: 'none', background: t.gradient,
                  cursor: 'pointer',
                  fontFamily: t.display, fontSize: 15, fontWeight: 800,
                  color: '#FFF', transition: 'all 0.2s ease',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  borderBottom: '4px solid #6A50CC',
                }}
              >
                <NeonIcon type="compass" size={16} color="text" />
                {dailyCompleted >= dailyTotal ? 'All Quests Complete!' : 'Return to Command Center'}
              </button>
            )}
          </div>
        )}

        {/* ─── Header with rarity stripe ─── */}
        <div style={{
          padding: '20px 24px 16px',
          borderBottom: `1px solid ${t.border}`,
          position: 'relative',
        }}>
          {/* Top rarity accent — gradient from rarity color */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 3,
            background: `linear-gradient(90deg, ${r.color}, ${t.cyan})`,
          }} />

          {/* Close button */}
          <button
            onClick={onClose}
            aria-label="Close quest card"
            style={{
              position: 'absolute', top: 12, right: 12,
              width: 32, height: 32, borderRadius: '50%',
              background: t.border, border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'background 0.2s ease',
            }}
          >
            <NeonIcon type="close" size={14} color="muted" />
          </button>

          {/* Quest source (Skill Domain) */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12,
          }}>
            <NeonIcon type={task.goalIcon as NeonIconType} size={14} color="violet" />
            <span style={{
              fontFamily: t.body, fontSize: 11, fontWeight: 600,
              color: t.textSecondary,
            }}>
              {task.goalLabel}
            </span>
          </div>

          {/* Title */}
          <h2
            id="quest-card-title"
            style={{
              fontFamily: t.display, fontSize: 20, fontWeight: 800,
              color: t.text, lineHeight: 1.3, marginBottom: 12,
              paddingRight: 28,
            }}
          >
            {task.title}
          </h2>

          {/* Meta row — double-coded badges: icon + color + shape label */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {/* Type badge */}
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              fontFamily: t.mono, fontSize: 10, fontWeight: 700,
              padding: '3px 10px', borderRadius: 10,
              color: r.color, background: r.bg || `${r.color}08`,
              textTransform: 'uppercase',
            }}>
              <NeonIcon type={typeInfo.icon} size={12} color={r.color} />
              {typeInfo.label}
            </span>
            {/* Rarity badge — double-coded: icon + color + shape */}
            <span
              aria-label={`Rarity: ${r.label}, ${r.shape}`}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 3,
                fontFamily: t.mono, fontSize: 10, fontWeight: 700,
                padding: '3px 10px', borderRadius: 10,
                color: r.color, background: r.bg || `${r.color}08`,
                textTransform: 'uppercase',
              }}
            >
              {r.icon} {r.label}
            </span>
            {/* Challenge Tier (RPG vocabulary for difficulty) */}
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 3,
              fontFamily: t.mono, fontSize: 10, fontWeight: 700,
              padding: '3px 10px', borderRadius: 10,
              color: tier.color, background: `${tier.color}08`,
              textTransform: 'uppercase',
            }}>
              <NeonIcon type="shield" size={12} color={tier.color} />
              {tier.label}
            </span>
            {/* Duration */}
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              fontFamily: t.mono, fontSize: 10, fontWeight: 700,
              padding: '3px 10px', borderRadius: 10,
              color: t.textMuted, background: t.border,
            }}>
              <NeonIcon type="clock" size={12} color="muted" />
              {task.mins} min
            </span>
          </div>
        </div>

        {/* ─── Body ─── */}
        <div style={{ padding: '20px 24px' }}>
          {/* Character companion + description */}
          <div style={{
            display: 'flex', gap: 14, marginBottom: 20,
            alignItems: 'flex-start',
          }}>
            {/* Character companion — visible on quest card */}
            {charData && (
              <div style={{
                flexShrink: 0, paddingTop: 2,
                filter: `drop-shadow(0 0 8px ${charMeta?.color || t.violet}30)`,
              }}>
                <PixelCanvas data={charData.art} size={3} />
              </div>
            )}
            {/* Description in NPC-style speech bubble */}
            <div style={{
              flex: 1,
              padding: '12px 14px', borderRadius: 14,
              background: t.bgElevated,
              border: `1px solid ${t.border}`,
              position: 'relative',
            }}>
              {/* Speech bubble arrow */}
              {charData && (
                <div style={{
                  position: 'absolute', left: -6, top: 12,
                  width: 0, height: 0,
                  borderTop: '6px solid transparent',
                  borderBottom: '6px solid transparent',
                  borderRight: `6px solid ${t.border}`,
                }} />
              )}
              <p style={{
                fontFamily: t.body, fontSize: 13, color: t.textSecondary,
                lineHeight: 1.5, margin: 0,
              }}>
                {task.desc}
              </p>
            </div>
          </div>

          {/* Quest Objectives */}
          <div style={{ marginBottom: 24 }}>
            <h3 style={{
              display: 'flex', alignItems: 'center', gap: 6,
              fontFamily: t.display, fontSize: 12, fontWeight: 700,
              color: t.textSecondary, textTransform: 'uppercase',
              letterSpacing: '0.08em', marginBottom: 12,
            }}>
              <NeonIcon type="target" size={12} color="cyan" />
              Quest Objectives
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {task.objectives.map((obj, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                  animation: `fadeUp 0.3s ease-out ${i * 0.06}s both`,
                }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: '50%', flexShrink: 0, marginTop: 1,
                    border: `1.5px solid ${done ? t.cyan : t.borderHover}`,
                    background: done ? t.cyan : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.25s ease',
                  }}>
                    {done && (
                      <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                        <path d="M2.5 6L5 8.5L9.5 3.5" stroke="#FFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  <span style={{
                    fontFamily: t.body, fontSize: 13, color: done ? t.textMuted : t.text,
                    lineHeight: 1.4,
                    textDecoration: done ? 'line-through' : 'none',
                    transition: 'color 0.2s ease',
                  }}>
                    {obj}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* XP Bounty card */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 16px', borderRadius: 14,
            background: done ? `${t.cyan}08` : `${t.violet}08`,
            border: `1px solid ${done ? `${t.cyan}20` : `${t.violet}20`}`,
            marginBottom: 20,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <NeonIcon type="xp" size={18} color={done ? 'cyan' : 'violet'} />
              <span style={{
                fontFamily: t.body, fontSize: 13, fontWeight: 600,
                color: t.textSecondary,
              }}>
                Quest Bounty
              </span>
            </div>
            <span style={{
              fontFamily: t.mono, fontSize: 18, fontWeight: 800,
              color: done ? t.cyan : t.violet,
            }}>
              {done ? `${task.xp} XP earned` : `+${task.xp} XP`}
            </span>
          </div>

          {/* Action button */}
          <button
            onClick={handleComplete}
            style={{
              width: '100%', padding: '14px 0', borderRadius: 14,
              border: done ? `1px solid ${t.border}` : 'none',
              background: done ? 'transparent' : t.gradient,
              cursor: 'pointer',
              fontFamily: t.display, fontSize: 15, fontWeight: 800,
              color: done ? t.textSecondary : '#FFF',
              transition: 'all 0.2s ease',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              // Duolingo-style 3D push effect
              borderBottom: done ? `1px solid ${t.border}` : `4px solid #6A50CC`,
            }}
          >
            {done ? (
              <>
                <NeonIcon type="refresh" size={16} color="secondary" />
                Restart Quest
              </>
            ) : (
              <>
                <NeonIcon type="trophy" size={16} color="text" />
                Complete Quest
              </>
            )}
          </button>

          {/* Neutral decline — "Not now" (ethical: no confirmshaming) */}
          <button
            onClick={onClose}
            style={{
              width: '100%', padding: '10px 0', marginTop: 8,
              background: 'none', border: 'none',
              fontFamily: t.body, fontSize: 13, fontWeight: 500,
              color: t.textMuted, cursor: 'pointer',
              transition: 'color 0.2s ease',
            }}
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// HOME PAGE
// ═══════════════════════════════════════════
export default function HomePage() {
  const { selectedGoals, skillAssessments, characterId, archetypeId, xpTotal, level, addXP } = useOnboardingStore();
  const charMeta = CHARACTERS.find(c => c.id === characterId);
  const archetype = archetypeId ? ARCHETYPES[archetypeId] : null;

  // Collapsible groups
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const toggleGroup = (id: string) => setExpandedGroups(p => ({ ...p, [id]: !p[id] }));

  // Quest completion state
  const [completedQuests, setCompletedQuests] = useState<Set<string>>(new Set());
  const [xpFloatId, setXpFloatId] = useState<string | null>(null);
  const [xpFloatAmount, setXpFloatAmount] = useState(0);

  // Quest card modal
  const [openQuestId, setOpenQuestId] = useState<string | null>(null);

  // Variable bonus XP — stored per completed quest
  const [bonusResults, setBonusResults] = useState<Map<string, { bonus: number; total: number; hasBonus: boolean }>>(new Map());

  const completeQuest = useCallback((taskId: string, xp: number) => {
    // Roll variable bonus XP (20% chance, Variable Ratio Reinforcement)
    const bonus = rollBonusXP(xp);
    setBonusResults(prev => {
      const next = new Map(prev);
      next.set(taskId, bonus);
      return next;
    });

    setCompletedQuests(prev => {
      if (prev.has(taskId)) return prev;
      const next = new Set(prev);
      next.add(taskId);
      return next;
    });
    addXP(bonus.total); // Add base + bonus
    setXpFloatId(taskId);
    setXpFloatAmount(bonus.total);
    setTimeout(() => setXpFloatId(null), 1200);
  }, [addXP]);

  const undoQuest = useCallback((taskId: string) => {
    setCompletedQuests(prev => {
      if (!prev.has(taskId)) return prev;
      const next = new Set(prev);
      next.delete(taskId);
      return next;
    });
    // Remove bonus result on undo
    setBonusResults(prev => {
      const next = new Map(prev);
      next.delete(taskId);
      return next;
    });
  }, []);

  // Generate tasks per goal
  const questGroups = useMemo(() => {
    return selectedGoals.map(g => {
      const goalData = GOALS.find(gd => gd.id === g.id);
      return {
        goal: g,
        goalData,
        tasks: generateTasks(g.label, g.id, goalData?.icon || 'target'),
      };
    });
  }, [selectedGoals]);

  // Flat task lookup for modal
  const allTasks = useMemo(() => {
    const map = new Map<string, QuestTask>();
    questGroups.forEach(({ tasks }) => tasks.forEach(t => map.set(t.id, t)));
    return map;
  }, [questGroups]);

  const openTask = openQuestId ? allTasks.get(openQuestId) : null;

  // Daily quest totals (Goal-Gradient Effect)
  const dailyTotal = useMemo(() => {
    let count = 0;
    questGroups.forEach(({ tasks }) => { count += tasks.length; });
    return count;
  }, [questGroups]);

  const dailyCompleted = useMemo(() => {
    let count = 0;
    questGroups.forEach(({ tasks }) => {
      tasks.forEach(tk => { if (completedQuests.has(tk.id)) count++; });
    });
    return count;
  }, [questGroups, completedQuests]);

  // Get next uncompleted quest (Session-extend CTA)
  const getNextQuest = useCallback((): string | null => {
    for (const { tasks } of questGroups) {
      for (const tk of tasks) {
        if (!completedQuests.has(tk.id) && tk.id !== openQuestId) {
          return tk.id;
        }
      }
    }
    return null;
  }, [questGroups, completedQuests, openQuestId]);

  // Default all expanded
  const isExpanded = (id: string) => expandedGroups[id] !== false;

  return (
    <div style={{ animation: 'fadeUp 0.5s ease-out' }}>
      {/* ─── Quest Card Modal ─── */}
      {openTask && (
        <QuestCardModal
          task={openTask}
          done={completedQuests.has(openTask.id)}
          onClose={() => setOpenQuestId(null)}
          onToggle={() => {
            if (completedQuests.has(openTask.id)) {
              undoQuest(openTask.id);
            } else {
              completeQuest(openTask.id, openTask.xp);
            }
          }}
          onOpenNext={(() => {
            const nextId = getNextQuest();
            if (!nextId) return null;
            return () => setOpenQuestId(nextId);
          })()}
          characterId={characterId}
          dailyCompleted={dailyCompleted}
          dailyTotal={dailyTotal}
          bonusResult={bonusResults.get(openTask.id) || null}
        />
      )}

      {/* ─── Greeting ─── */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{
          fontFamily: t.display, fontSize: 26, fontWeight: 900,
          color: t.text, marginBottom: 6, lineHeight: 1.3,
        }}>
          {getGreeting()}, {charMeta?.name || 'Hero'}!
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: t.body, fontSize: 14, color: t.textSecondary }}>
            Today&apos;s focus: Level up your skills
          </span>
          {archetype && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              padding: '2px 10px', borderRadius: 20,
              background: `${archetype.color}12`, border: `1px solid ${archetype.color}25`,
              fontFamily: t.mono, fontSize: 10, fontWeight: 700, color: archetype.color,
            }}>
              {archetype.icon} {archetype.name}
            </span>
          )}
        </div>
      </div>

      {/* ─── Stats Row ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4" style={{ gap: 12, marginBottom: 32 }}>
        {([
          { label: 'Level', value: String(level), color: 'violet' as const, icon: 'lightning' as const },
          { label: 'Streak', value: '0 days', color: 'gold' as const, icon: 'fire' as const },
          { label: 'XP', value: String(xpTotal), color: 'cyan' as const, icon: 'xp' as const },
          { label: 'Energy', value: '3/3', color: 'violet' as const, icon: 'gem' as const },
        ]).map((stat) => {
          const hexMap = { violet: t.violet, gold: t.gold, cyan: t.cyan } as const;
          const hex = hexMap[stat.color];
          return (
            <div
              key={stat.label}
              style={{
                padding: 16, borderRadius: 16,
                background: t.bgCard, border: `1px solid ${t.border}`,
                animation: 'fadeUp 0.4s ease-out',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <NeonIcon type={stat.icon} size={16} color={stat.color} />
                <span style={{ fontFamily: t.body, fontSize: 12, color: t.textSecondary }}>
                  {stat.label}
                </span>
              </div>
              <div style={{
                fontFamily: t.mono, fontSize: 20, fontWeight: 800, color: hex,
              }}>
                {stat.value}
              </div>
            </div>
          );
        })}
      </div>

      {/* ─── Active Quests ─── */}
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
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 3,
                          fontFamily: t.mono, fontSize: 9, fontWeight: 700,
                          padding: '2px 8px', borderRadius: 10,
                          color: lr.color,
                          background: `${lr.color}12`,
                          textTransform: 'uppercase',
                        }}>
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

      {/* ─── Today's Quests ─── */}
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
          {/* Daily quest counter with proximity messaging (Goal-Gradient Effect) */}
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
                          {/* XP float animation */}
                          {xpFloatId === task.id && (
                            <XPFloat amount={xpFloatAmount} show />
                          )}

                          {/* Checkbox — click toggles completion */}
                          <div
                            role="checkbox"
                            aria-checked={done}
                            aria-label={`Mark "${task.title}" as ${done ? 'incomplete' : 'complete'}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (done) {
                                undoQuest(task.id);
                              } else {
                                completeQuest(task.id, task.xp);
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

                          {/* Content — click opens quest card */}
                          <div
                            onClick={() => setOpenQuestId(task.id)}
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
                              {/* Type badge — double-coded: rarity icon + color */}
                              <span style={{
                                display: 'inline-flex', alignItems: 'center', gap: 3,
                                fontFamily: t.mono, fontSize: 9, fontWeight: 700,
                                padding: '2px 8px', borderRadius: 8,
                                color: done ? t.textMuted : r.color,
                                background: done ? `${t.textMuted}10` : `${r.color}10`,
                                textTransform: 'uppercase',
                                transition: 'all 0.2s ease',
                              }}>
                                {r.icon} {task.type}
                              </span>
                              {/* Duration */}
                              <span style={{
                                display: 'inline-flex', alignItems: 'center', gap: 3,
                                fontFamily: t.body, fontSize: 11, color: t.textMuted,
                              }}>
                                <NeonIcon type="clock" size={11} color="muted" />
                                {task.mins} min
                              </span>
                            </div>
                          </div>

                          {/* XP reward — click opens quest card */}
                          <span
                            onClick={() => setOpenQuestId(task.id)}
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
    </div>
  );
}
