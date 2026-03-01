'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { NeonIcon } from '../../../(onboarding)/_components/NeonIcon';
import type { NeonIconType } from '../../../(onboarding)/_components/NeonIcon';
import { t, rarity } from '../../../(onboarding)/_components/tokens';
import { CHARACTERS, charArtStrings, charPalettes } from '../../../(onboarding)/_components/characters';
import { parseArt, PixelCanvas, AnimatedPixelCanvas } from '../../../(onboarding)/_components/PixelEngine';
import { getDailyProgressMessage } from '../_utils/xp-utils';
import { TYPE_ICONS, CHALLENGE_TIER } from '../_utils/quest-templates';
import type { QuestTask } from '../_utils/quest-templates';
import type { BonusResult } from '../_utils/xp-utils';

// ═══════════════════════════════════════════
// QUEST CARD MODAL — Gamified quest detail
// State: viewing → completing → celebrating → summary → (nextQuest | close)
// Animation tiers: Meso (400-1200ms) for celebration, Micro for sound
// ═══════════════════════════════════════════

interface QuestCardModalProps {
  task: QuestTask;
  done: boolean;
  onClose: () => void;
  onToggle: () => void;
  onOpenNext: (() => void) | null;
  characterId: string | null;
  dailyCompleted: number;
  dailyTotal: number;
  bonusResult: BonusResult | null;
  currentStreak: number;
  energyCrystals: number;
  onConsumeCrystal?: () => void;
}

export function QuestCardModal({
  task, done, onClose, onToggle, onOpenNext,
  characterId, dailyCompleted, dailyTotal, bonusResult,
  currentStreak, energyCrystals, onConsumeCrystal,
}: QuestCardModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const firstFocusRef = useRef<HTMLButtonElement>(null);
  const r = rarity[task.rarity] as { color: string; icon: string; shape: string; label: string; bg: string; glow: string };
  const typeInfo = TYPE_ICONS[task.type] || { icon: 'sparkle' as NeonIconType, label: task.type };
  const tier = CHALLENGE_TIER[task.rarity] ?? { label: 'Tier I', color: rarity.common.color };

  // Multi-step completion state
  const [phase, setPhase] = useState<'viewing' | 'celebrating' | 'summary'>('viewing');

  // Collapsible sections state (progressive disclosure — default collapsed)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const toggleSection = (id: string) => setExpanded(p => ({ ...p, [id]: !p[id] }));

  // Knowledge Check state
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const checkAnswered = selectedAnswer !== null;
  const checkCorrect = selectedAnswer === task.checkCorrect;

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

  // Focus trap + keyboard handling
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        if (phase === 'celebrating') setPhase('summary');
        else onClose();
      }
      // Focus trap: Tab cycles within modal
      if (e.key === 'Tab') {
        const modal = overlayRef.current;
        if (!modal) return;
        const focusable = modal.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0]!;
        const last = focusable[focusable.length - 1]!;
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose, phase]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // Auto-focus first button on open
  useEffect(() => {
    firstFocusRef.current?.focus();
  }, []);

  // Auto-advance celebrating → summary after 1.5s (interruptible: UX-R164)
  useEffect(() => {
    if (phase !== 'celebrating') return;
    const timer = setTimeout(() => setPhase('summary'), 1500);
    return () => clearTimeout(timer);
  }, [phase]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) {
      if (phase === 'celebrating') setPhase('summary');
      else onClose();
    }
  };

  const handleComplete = () => {
    if (done) {
      onToggle(); // undo
    } else {
      onToggle(); // complete
      setPhase('celebrating');
    }
  };

  const progressMsg = getDailyProgressMessage(dailyCompleted, dailyTotal);
  const xpEarned = bonusResult || { bonus: 0, total: task.xp, hasBonus: false };

  const hasCrystals = energyCrystals > 0;

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
        display: 'flex', flexDirection: 'column' as const,
        position: 'relative',
      }}>

        {/* ─── Phase: Celebrating (Meso tier 400-1200ms, interruptible) ─── */}
        {phase === 'celebrating' && (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            minHeight: 360, padding: 32,
            background: t.bgCard,
            animation: 'fadeUp 0.3s ease-out',
            cursor: 'pointer',
            position: 'relative',
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

        {/* ─── Phase: Summary ─── */}
        {phase === 'summary' && (
          <div style={{
            display: 'flex', flexDirection: 'column',
            background: t.bgCard,
            animation: 'fadeUp 0.4s ease-out',
            padding: 24,
            overflowY: 'auto',
          }}>
            <button
              ref={firstFocusRef}
              onClick={onClose}
              aria-label="Close summary"
              style={{
                position: 'absolute', top: 12, right: 12, zIndex: 5,
                width: 32, height: 32, borderRadius: '50%',
                background: t.border, border: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <NeonIcon type="close" size={14} color="muted" />
            </button>

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
              {xpEarned.hasBonus && (
                <>
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    paddingTop: 8, borderTop: `1px solid ${t.border}`,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 14 }}>★</span>
                      <span style={{ fontFamily: t.body, fontSize: 13, fontWeight: 600, color: t.gold }}>
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
                </>
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
                  {currentStreak}-day streak
                </span>
                <span style={{
                  fontFamily: t.body, fontSize: 11, color: t.textMuted,
                  marginLeft: 8,
                }}>
                  {currentStreak === 0
                    ? 'Complete daily quests to build your streak!'
                    : 'Keep the momentum going!'}
                </span>
              </div>
            </div>

            {/* Daily Quest Progress */}
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
              <div style={{
                fontFamily: t.body, fontSize: 12, color: t.textSecondary,
                fontStyle: 'italic',
              }}>
                {progressMsg}
              </div>
            </div>

            {/* Action buttons */}
            {onOpenNext && dailyCompleted < dailyTotal ? (
              <>
                <button
                  onClick={() => { onOpenNext(); }}
                  style={{
                    width: '100%', padding: '14px 0', borderRadius: 14,
                    border: 'none', background: t.gradient,
                    cursor: 'pointer',
                    fontFamily: t.display, fontSize: 15, fontWeight: 800,
                    color: '#FFF', transition: 'all 0.2s ease',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    borderBottom: '4px solid #6A50CC',
                    minHeight: 48,
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
                    minHeight: 44,
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
                  minHeight: 48,
                }}
              >
                <NeonIcon type="compass" size={16} color="text" />
                {dailyCompleted >= dailyTotal ? 'All Quests Complete!' : 'Return to Command Center'}
              </button>
            )}
          </div>
        )}

        {/* ─── Phase: Viewing (default quest card content) ─── */}
        {phase === 'viewing' && (<>

        {/* ── HEADER ZONE (sticky, no scroll) ── */}
        <div style={{
          flexShrink: 0,
          padding: '20px 24px 16px',
          borderBottom: `1px solid ${t.border}`,
          position: 'relative',
        }}>
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 3,
            background: `linear-gradient(90deg, ${r.color}, ${t.cyan})`,
          }} />

          <button
            ref={firstFocusRef}
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

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
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

        {/* ── BODY ZONE (scrollable) ── */}
        <div style={{ flex: 1, overflowY: 'auto', position: 'relative' }}>
        <div style={{ padding: '20px 24px' }}>
          {/* Character companion + description */}
          <div style={{
            display: 'flex', gap: 14, marginBottom: 20,
            alignItems: 'flex-start',
          }}>
            {charData && (
              <div style={{
                flexShrink: 0, paddingTop: 2,
                filter: `drop-shadow(0 0 8px ${charMeta?.color || t.violet}30)`,
              }}>
                <PixelCanvas data={charData.art} size={3} />
              </div>
            )}
            <div style={{
              flex: 1,
              padding: '12px 14px', borderRadius: 14,
              background: t.bgElevated,
              border: `1px solid ${t.border}`,
              position: 'relative',
            }}>
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
          <div style={{ marginBottom: 20 }}>
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

          {/* ── Collapsible: AI Tip ── */}
          <div style={{ marginBottom: 8 }}>
            <button
              onClick={() => toggleSection('aiTip')}
              aria-expanded={!!expanded['aiTip']}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 14px', borderRadius: 14,
                background: hasCrystals ? `${t.cyan}06` : `${t.border}08`,
                border: `1px solid ${hasCrystals ? `${t.cyan}15` : t.border}`,
                cursor: 'pointer', transition: 'background 0.2s ease',
                opacity: hasCrystals ? 1 : 0.5,
              }}
            >
              <div style={{
                width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                background: `${t.cyan}15`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14,
              }}>
                💡
              </div>
              <span style={{
                flex: 1, textAlign: 'left',
                fontFamily: t.mono, fontSize: 10, fontWeight: 800,
                color: t.cyan, textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}>
                AI Tip
              </span>
              {onConsumeCrystal && (
                <span style={{
                  fontFamily: t.mono, fontSize: 8, fontWeight: 700,
                  color: hasCrystals ? t.cyan : t.textMuted,
                  padding: '1px 6px', borderRadius: 6,
                  background: hasCrystals ? `${t.cyan}12` : `${t.textMuted}12`,
                }}>
                  💎 1
                </span>
              )}
              <span style={{
                fontSize: 12, color: t.textMuted,
                transition: 'transform 0.2s ease',
                transform: expanded['aiTip'] ? 'rotate(180deg)' : 'rotate(0deg)',
              }}>
                ▾
              </span>
            </button>
            {expanded['aiTip'] && (
              <div style={{
                padding: '10px 14px 10px 52px',
                animation: 'fadeUp 0.2s ease-out',
              }}>
                {hasCrystals ? (
                  <p style={{
                    fontFamily: t.body, fontSize: 12, color: t.textSecondary,
                    lineHeight: 1.5, margin: 0,
                  }}>
                    {task.aiTip}
                  </p>
                ) : (
                  <p style={{
                    fontFamily: t.body, fontSize: 12, color: t.textMuted,
                    lineHeight: 1.5, margin: 0, fontStyle: 'italic',
                  }}>
                    Recharge tomorrow
                  </p>
                )}
              </div>
            )}
          </div>

          {/* ── Collapsible: Fun Fact ── */}
          <div style={{ marginBottom: 8 }}>
            <button
              onClick={() => toggleSection('funFact')}
              aria-expanded={!!expanded['funFact']}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 14px', borderRadius: 14,
                background: `${t.gold}06`,
                border: `1px solid ${t.gold}15`,
                cursor: 'pointer', transition: 'background 0.2s ease',
              }}
            >
              <div style={{
                width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                background: `${t.gold}15`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14,
              }}>
                🤓
              </div>
              <span style={{
                flex: 1, textAlign: 'left',
                fontFamily: t.mono, fontSize: 10, fontWeight: 800,
                color: t.gold, textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}>
                Fun Fact
              </span>
              <span style={{
                fontSize: 12, color: t.textMuted,
                transition: 'transform 0.2s ease',
                transform: expanded['funFact'] ? 'rotate(180deg)' : 'rotate(0deg)',
              }}>
                ▾
              </span>
            </button>
            {expanded['funFact'] && (
              <div style={{
                padding: '10px 14px 10px 52px',
                animation: 'fadeUp 0.2s ease-out',
              }}>
                <p style={{
                  fontFamily: t.body, fontSize: 12, color: t.textSecondary,
                  lineHeight: 1.5, margin: 0,
                }}>
                  {task.funFact}
                </p>
              </div>
            )}
          </div>

          {/* ── Collapsible: Knowledge Check ── */}
          <div style={{ marginBottom: 12 }}>
            <button
              onClick={() => toggleSection('knowledge')}
              aria-expanded={!!expanded['knowledge']}
              aria-disabled={!hasCrystals && !checkAnswered ? true : undefined}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 14px', borderRadius: 14,
                background: t.bgElevated,
                border: `1px solid ${checkAnswered ? (checkCorrect ? `${t.cyan}30` : `${t.rose}30`) : t.border}`,
                cursor: 'pointer', transition: 'all 0.2s ease',
                opacity: hasCrystals || checkAnswered ? 1 : 0.5,
              }}
            >
              <NeonIcon type="quiz" size={14} color={checkAnswered ? (checkCorrect ? 'cyan' : 'rose') : 'violet'} />
              <span style={{
                flex: 1, textAlign: 'left',
                fontFamily: t.mono, fontSize: 10, fontWeight: 800,
                color: checkAnswered ? (checkCorrect ? t.cyan : t.rose) : t.violet,
                textTransform: 'uppercase', letterSpacing: '0.08em',
              }}>
                Knowledge Check
              </span>
              {onConsumeCrystal && !checkAnswered && (
                <span style={{
                  fontFamily: t.mono, fontSize: 8, fontWeight: 700,
                  color: hasCrystals ? t.violet : t.textMuted,
                  padding: '1px 6px', borderRadius: 6,
                  background: hasCrystals ? `${t.violet}12` : `${t.textMuted}12`,
                }}>
                  💎 1
                </span>
              )}
              <span style={{
                fontSize: 12, color: t.textMuted,
                transition: 'transform 0.2s ease',
                transform: expanded['knowledge'] ? 'rotate(180deg)' : 'rotate(0deg)',
              }}>
                ▾
              </span>
            </button>
            {expanded['knowledge'] && (
              <div style={{
                padding: '12px 14px',
                animation: 'fadeUp 0.2s ease-out',
              }}>
                {hasCrystals || checkAnswered ? (
                  <>
                    <p style={{
                      fontFamily: t.body, fontSize: 13, fontWeight: 600,
                      color: t.text, lineHeight: 1.4,
                      margin: '0 0 12px 0',
                    }}>
                      {task.checkQuestion}
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {task.checkOptions.map((opt, i) => {
                        const isSelected = selectedAnswer === i;
                        const isCorrectOption = i === task.checkCorrect;
                        let optBg: string = t.bgCard;
                        let optBorder: string = t.border;
                        let optColor: string = t.textSecondary;
                        if (checkAnswered) {
                          if (isCorrectOption) {
                            optBg = `${t.cyan}10`;
                            optBorder = `${t.cyan}40`;
                            optColor = t.cyan;
                          } else if (isSelected && !checkCorrect) {
                            optBg = `${t.rose}10`;
                            optBorder = `${t.rose}40`;
                            optColor = t.rose;
                          }
                        } else if (isSelected) {
                          optBg = `${t.violet}10`;
                          optBorder = `${t.violet}40`;
                          optColor = t.violet;
                        }
                        return (
                          <button
                            key={i}
                            onClick={() => { if (!checkAnswered) setSelectedAnswer(i); }}
                            disabled={checkAnswered}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 10,
                              padding: '10px 12px', borderRadius: 10,
                              background: optBg,
                              border: `1px solid ${optBorder}`,
                              cursor: checkAnswered ? 'default' : 'pointer',
                              transition: 'all 0.2s ease',
                              textAlign: 'left',
                              minHeight: 44,
                            }}
                          >
                            <div style={{
                              width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              background: isSelected || (checkAnswered && isCorrectOption) ? optColor : 'transparent',
                              border: `1.5px solid ${optColor}`,
                              transition: 'all 0.2s ease',
                            }}>
                              {checkAnswered && isCorrectOption ? (
                                <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                                  <path d="M2.5 6L5 8.5L9.5 3.5" stroke="#FFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              ) : checkAnswered && isSelected && !checkCorrect ? (
                                <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                                  <path d="M3 3L9 9M9 3L3 9" stroke="#FFF" strokeWidth="2" strokeLinecap="round" />
                                </svg>
                              ) : (
                                <span style={{
                                  fontFamily: t.mono, fontSize: 10, fontWeight: 700,
                                  color: isSelected ? '#FFF' : optColor,
                                }}>
                                  {String.fromCharCode(65 + i)}
                                </span>
                              )}
                            </div>
                            <span style={{
                              fontFamily: t.body, fontSize: 12, fontWeight: isSelected ? 600 : 400,
                              color: checkAnswered && isCorrectOption ? t.text : optColor,
                              flex: 1,
                            }}>
                              {opt}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    {checkAnswered && (
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        marginTop: 10, padding: '8px 12px', borderRadius: 8,
                        background: checkCorrect ? `${t.cyan}08` : `${t.rose}08`,
                        animation: 'fadeUp 0.3s ease-out',
                      }}>
                        <NeonIcon type={checkCorrect ? 'trophy' : 'sparkle'} size={14} color={checkCorrect ? 'cyan' : 'rose'} />
                        <span style={{
                          fontFamily: t.body, fontSize: 12, fontWeight: 600,
                          color: checkCorrect ? t.cyan : t.rose,
                        }}>
                          {checkCorrect ? 'Correct! +5 bonus XP for your wisdom!' : 'Not quite — review the objectives above and try to remember why!'}
                        </span>
                      </div>
                    )}
                  </>
                ) : (
                  <p style={{
                    fontFamily: t.body, fontSize: 12, color: t.textMuted,
                    lineHeight: 1.5, margin: 0, fontStyle: 'italic',
                  }}>
                    Recharge tomorrow
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Fade indicator at bottom of scrollable area */}
        <div style={{
          position: 'sticky', bottom: 0, left: 0, right: 0, height: 32,
          background: `linear-gradient(transparent, ${t.bgCard})`,
          pointerEvents: 'none',
          marginTop: -32,
        }} />
        </div>

        {/* ── FOOTER ZONE (sticky, no scroll) ── */}
        <div style={{
          flexShrink: 0, padding: '16px 24px',
          borderTop: `1px solid ${t.border}`,
        }}>
          {/* XP bounty row */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: 12,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <NeonIcon type="xp" size={16} color={done ? 'cyan' : 'violet'} />
              <span style={{
                fontFamily: t.body, fontSize: 13, fontWeight: 600,
                color: t.textSecondary,
              }}>
                Quest Bounty
              </span>
            </div>
            <span style={{
              fontFamily: t.mono, fontSize: 16, fontWeight: 800,
              color: done ? t.cyan : t.violet,
            }}>
              {done ? `${task.xp} XP earned` : `+${task.xp} XP`}
            </span>
          </div>

          {/* CTA button */}
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
              borderBottom: done ? `1px solid ${t.border}` : `4px solid #6A50CC`,
              minHeight: 48,
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
              minHeight: 44,
            }}
          >
            Not now
          </button>
        </div>

        </>)}
      </div>
    </div>
  );
}
