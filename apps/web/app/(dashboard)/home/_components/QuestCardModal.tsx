'use client';

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { NeonIcon } from '../../../(onboarding)/_components/NeonIcon';
import type { NeonIconType } from '../../../(onboarding)/_components/NeonIcon';
import { t, rarity } from '../../../(onboarding)/_components/tokens';
import { CHARACTERS, charArtStrings, charPalettes } from '../../../(onboarding)/_components/characters';
import { parseArt, PixelCanvas, AnimatedPixelCanvas } from '../../../(onboarding)/_components/PixelEngine';
import { useI18nStore } from '@plan2skill/store';
import { getDailyProgressMessage } from '../_utils/xp-utils';
import { TYPE_ICONS, CHALLENGE_TIER } from '../_utils/quest-templates';
import type { QuestTask } from '../_utils/quest-templates';
import type { BonusResult } from '../_utils/xp-utils';
import { useQuestContent } from '../_hooks/useQuestContent';
import { useQuestAssist } from '../_hooks/useQuestAssist';
import { useUnlockFeature } from '../_hooks/useUnlockFeature';
import { useBudget } from '../_hooks/useBudget';
import { UpgradePromptModal } from './UpgradePromptModal';
import type { QuestContentPackage, ResourceItem, FunFactItem, LockedFeature, CodeChallengeContent } from '@plan2skill/types';

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
  attributeGrowth?: { attribute: string; amount: number }[] | null;
}

export function QuestCardModal({
  task, done, onClose, onToggle, onOpenNext,
  characterId, dailyCompleted, dailyTotal, bonusResult,
  currentStreak, energyCrystals, onConsumeCrystal, attributeGrowth,
}: QuestCardModalProps) {
  // prefers-reduced-motion: skip celebration animations (UX-R164, Крок 9)
  const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const tr = useI18nStore((s) => s.t);

  // Quest content pipeline — fetch rich content when modal opens
  const { content: questContent, isLoading: contentLoading } = useQuestContent(task.id);

  // AI assist mutations (Phase C)
  const { requestHint, requestExplain, requestTutor } = useQuestAssist(task.id);

  // Feature unlock (Phase D)
  const unlockFeature = useUnlockFeature(task.id);
  const { coins: budgetCoins } = useBudget();

  // Code Challenge state
  const [revealedHints, setRevealedHints] = useState(0);
  const [showSolution, setShowSolution] = useState(false);

  // Upgrade prompt modal state
  const [upgradePrompt, setUpgradePrompt] = useState<{ teaser: string; tier: string } | null>(null);

  const overlayRef = useRef<HTMLDivElement>(null);
  const firstFocusRef = useRef<HTMLButtonElement>(null);
  const r = rarity[task.rarity] as { color: string; icon: string; shape: string; label: string; bg: string; glow: string };
  const typeInfo = TYPE_ICONS[task.type] || { icon: 'sparkle' as NeonIconType, label: task.type };
  const tier = CHALLENGE_TIER[task.rarity] ?? { label: 'Tier I', color: rarity.common.color };

  // BL-003: Desktop detection for two-column layout
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== 'undefined' && window.innerWidth >= 768
  );
  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 768);
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Multi-step completion state
  const [phase, setPhase] = useState<'viewing' | 'celebrating' | 'summary'>('viewing');

  // Collapsible sections state
  // BL-003: Desktop — expanded by default (enough space, no reason to hide)
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
    if (typeof window !== 'undefined' && window.innerWidth >= 768) {
      return { knowledge: true, aiTip: true, funFact: true, article: true, resources: true, codeChallenge: true } as Record<string, boolean>;
    }
    return {} as Record<string, boolean>;
  });
  const toggleSection = (id: string) => setExpanded(p => ({ ...p, [id]: !p[id] }));

  // Knowledge Check state
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answerJustSelected, setAnswerJustSelected] = useState<number | null>(null);
  const checkAnswered = selectedAnswer !== null;
  const checkCorrect = selectedAnswer === task.checkCorrect;

  // Button press feedback state (Micro tier: 150ms)
  const [pressedBtn, setPressedBtn] = useState<string | null>(null);
  const handleBtnDown = useCallback((id: string) => setPressedBtn(id), []);
  const handleBtnUp = useCallback(() => setPressedBtn(null), []);

  // Modal exit animation state (MA-TR003: exit < enter duration)
  const [isClosing, setIsClosing] = useState(false);
  const closeWithAnimation = useCallback(() => {
    if (prefersReducedMotion) { onClose(); return; }
    setIsClosing(true);
    setTimeout(onClose, 200);
  }, [onClose, prefersReducedMotion]);

  // Collapsible section exit animation
  const [closingSection, setClosingSection] = useState<string | null>(null);
  const toggleSectionAnimated = useCallback((id: string) => {
    if (expanded[id]) {
      if (prefersReducedMotion) { setExpanded(p => ({ ...p, [id]: false })); return; }
      setClosingSection(id);
      setTimeout(() => {
        setClosingSection(null);
        setExpanded(p => ({ ...p, [id]: false }));
      }, 150);
    } else {
      setExpanded(p => ({ ...p, [id]: true }));
    }
  }, [expanded, prefersReducedMotion]);

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
        else closeWithAnimation();
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
  // If reduced motion, skip celebration phase immediately
  useEffect(() => {
    if (phase !== 'celebrating') return;
    const delay = prefersReducedMotion ? 0 : 1500;
    const timer = setTimeout(() => setPhase('summary'), delay);
    return () => clearTimeout(timer);
  }, [phase, prefersReducedMotion]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) {
      if (phase === 'celebrating') setPhase('summary');
      else closeWithAnimation();
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

  const progressMsg = getDailyProgressMessage(dailyCompleted, dailyTotal, tr);
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
        opacity: isClosing ? 0 : 1,
        transition: isClosing ? 'opacity 0.2s ease-in' : undefined,
      }}
    >
      <div style={{
        width: '100%', maxWidth: isDesktop ? 820 : 440,
        background: t.bgCard, borderRadius: 20,
        border: `1px solid ${r.color}30`,
        boxShadow: r.glow !== 'none'
          ? `${r.glow}, 0 24px 48px rgba(0,0,0,0.5)`
          : `0 0 40px ${r.color}15, 0 24px 48px rgba(0,0,0,0.5)`,
        overflow: 'hidden',
        animation: isClosing
          ? 'fadeUp 0.2s ease-in reverse forwards'
          : 'slideUp 0.4s cubic-bezier(0.175,0.885,0.32,1.275)',
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
              <div style={{ marginBottom: 16, animation: prefersReducedMotion ? 'none' : 'bounceIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
                <AnimatedPixelCanvas character={charData} size={5} glowColor={charMeta?.color} />
              </div>
            )}
            <div style={{
              fontFamily: t.display, fontSize: 22, fontWeight: 900,
              background: t.gradient,
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              animation: prefersReducedMotion ? 'none' : 'celebratePop 0.6s ease-out 0.2s both',
              marginBottom: 8,
            }}>
              {tr('quest.complete', 'Quest Complete!')}
            </div>
            <div style={{
              fontFamily: t.mono, fontSize: 18, fontWeight: 800, color: t.gold,
              animation: prefersReducedMotion ? 'none' : 'xpFloat 1.2s ease-out 0.4s both',
            }}>
              +{xpEarned.total} XP
            </div>
            {xpEarned.hasBonus && (
              <div style={{
                fontFamily: t.mono, fontSize: 13, fontWeight: 800, color: t.gold,
                animation: prefersReducedMotion ? 'none' : 'celebratePop 0.6s ease-out 0.8s both',
                marginTop: 4,
                textShadow: `0 0 12px ${t.gold}80`,
              }}>
                ★ BONUS +{xpEarned.bonus} XP ★
              </div>
            )}
            {!prefersReducedMotion && sparklePositions.map((pos, i) => (
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
              marginTop: 16, animation: 'fadeUp 0.4s ease-out 0.8s both',
            }}>
              {tr('quest.tap_continue', 'Tap to continue')}
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
                {tr('quest.complete', 'Quest Complete!')}
              </div>
              <div style={{
                fontFamily: t.body, fontSize: 13, color: t.textSecondary,
                textAlign: 'center',
              }}>
                {task.title}
              </div>
            </div>

            {/* XP Breakdown card — staggered entrance (Micro tier) */}
            <div style={{
              padding: 16, borderRadius: 14,
              background: t.bgElevated, border: `1px solid ${t.border}`,
              marginBottom: 16,
            }}>
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginBottom: xpEarned.hasBonus ? 8 : 0,
                animation: 'fadeUp 0.3s ease-out both',
                animationDelay: '0s',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <NeonIcon type="xp" size={18} color="gold" />
                  <span style={{ fontFamily: t.body, fontSize: 13, fontWeight: 600, color: t.textSecondary }}>
                    {tr('quest.bounty', 'Quest Bounty')}
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
                    animation: 'fadeUp 0.3s ease-out both',
                    animationDelay: '0.1s',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 14 }}>★</span>
                      <span style={{ fontFamily: t.body, fontSize: 13, fontWeight: 600, color: t.gold }}>
                        {tr('quest.lucky_bonus', 'Lucky Bonus!')}
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
                    animation: 'fadeUp 0.3s ease-out both',
                    animationDelay: '0.2s',
                  }}>
                    <span style={{ fontFamily: t.body, fontSize: 13, fontWeight: 700, color: t.text }}>
                      {tr('quest.total', 'Total')}
                    </span>
                    <span style={{ fontFamily: t.mono, fontSize: 18, fontWeight: 800, color: t.cyan }}>
                      +{xpEarned.total} XP
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Phase 5H: Attribute Growth from milestone completion */}
            {attributeGrowth && attributeGrowth.length > 0 && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' as const,
                padding: '10px 16px', borderRadius: 14,
                background: `${t.violet}08`, border: `1px solid ${t.violet}15`,
                marginBottom: 16,
                animation: prefersReducedMotion ? 'none' : 'fadeUp 0.3s ease-out 0.25s both',
              }}>
                <NeonIcon type="chart" size={16} color="violet" />
                <span style={{ fontFamily: t.body, fontSize: 12, fontWeight: 700, color: t.textSecondary }}>
                  {tr('quest.milestone_bonus', 'Milestone bonus!')}
                </span>
                {attributeGrowth.map((ag, i) => {
                  const attrColors: Record<string, string> = {
                    STR: '#9D7AFF', INT: '#3B82F6', CHA: '#FF6B8A',
                    CON: '#6EE7B7', DEX: '#4ECDC4', WIS: '#FFD166',
                  };
                  return (
                    <span
                      key={ag.attribute}
                      style={{
                        fontFamily: t.mono, fontSize: 12, fontWeight: 800,
                        color: attrColors[ag.attribute] || t.violet,
                        padding: '2px 8px', borderRadius: 8,
                        background: `${attrColors[ag.attribute] || t.violet}12`,
                        animation: prefersReducedMotion ? 'none' : `xpFloat 0.4s ease-out ${0.3 + i * 0.1}s both`,
                      }}
                    >
                      +{ag.amount} {ag.attribute}
                    </span>
                  );
                })}
              </div>
            )}

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
                  {tr('quest.day_streak', '{n}-day streak').replace('{n}', String(currentStreak))}
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
                  {tr('quest.today_progress', "Today's Progress")}
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
                    transition: 'background 0.3s ease, border-color 0.3s ease',
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
                  onMouseDown={() => handleBtnDown('nextQuest')}
                  onMouseUp={handleBtnUp}
                  onMouseLeave={handleBtnUp}
                  style={{
                    width: '100%', padding: '14px 0', borderRadius: 14,
                    border: 'none', background: t.gradient,
                    cursor: 'pointer',
                    fontFamily: t.display, fontSize: 15, fontWeight: 800,
                    color: '#FFF', transition: 'transform 0.15s ease-out',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    borderBottom: '4px solid #6A50CC',
                    minHeight: 48,
                    transform: pressedBtn === 'nextQuest' ? 'scale(0.98) translateY(1px)' : 'scale(1)',
                  }}
                >
                  <NeonIcon type="sparkle" size={16} color="text" />
                  {tr('quest.next', 'Next Quest')}
                </button>
                <button
                  onClick={closeWithAnimation}
                  style={{
                    width: '100%', padding: '10px 0', marginTop: 8,
                    background: 'none', border: 'none',
                    fontFamily: t.body, fontSize: 13, fontWeight: 500,
                    color: t.textMuted, cursor: 'pointer',
                    minHeight: 44,
                  }}
                >
                  {tr('quest.return_home', 'Return to Command Center')}
                </button>
              </>
            ) : (
              <button
                onClick={closeWithAnimation}
                onMouseDown={() => handleBtnDown('returnCmd')}
                onMouseUp={handleBtnUp}
                onMouseLeave={handleBtnUp}
                style={{
                  width: '100%', padding: '14px 0', borderRadius: 14,
                  border: 'none', background: t.gradient,
                  cursor: 'pointer',
                  fontFamily: t.display, fontSize: 15, fontWeight: 800,
                  color: '#FFF', transition: 'transform 0.15s ease-out',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  borderBottom: '4px solid #6A50CC',
                  minHeight: 48,
                  transform: pressedBtn === 'returnCmd' ? 'scale(0.98) translateY(1px)' : 'scale(1)',
                }}
              >
                <NeonIcon type="compass" size={16} color="text" />
                {dailyCompleted >= dailyTotal ? tr('quest.all_complete', 'All Quests Complete!') : tr('quest.return_home', 'Return to Command Center')}
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
            onClick={closeWithAnimation}
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

        {/* ── BODY ZONE (scrollable) — BL-003: two-column on desktop ── */}
        <div style={{
          flex: 1, overflowY: 'auto', position: 'relative',
          display: isDesktop ? 'flex' : 'block',
        }}>

        {/* ── LEFT COLUMN: Learning Material ── */}
        <div style={{
          flex: isDesktop ? '1 1 55%' : '1 1 100%',
          overflowY: isDesktop ? 'auto' : 'visible',
          borderRight: isDesktop ? `1px solid ${t.border}` : 'none',
        }}>
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
              {tr('quest.objectives', 'Quest Objectives')}
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
                    transition: 'background 0.25s ease, border-color 0.25s ease',
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
        </div>
        </div>

          {/* ── RIGHT COLUMN: Interactive Content — BL-003 ── */}
          <div style={{
            flex: isDesktop ? '1 1 45%' : '1 1 100%',
            position: isDesktop ? 'sticky' as const : 'static' as const,
            top: 0,
            overflowY: isDesktop ? 'auto' : 'visible',
            alignSelf: isDesktop ? 'flex-start' : 'auto',
            maxHeight: isDesktop ? '100%' : 'none',
          }}>
          <div style={{ padding: isDesktop ? '20px 24px' : '0 24px' }}>

          {/* ── Collapsible: Learning Material (from content pipeline) ── */}
          <div style={{ marginBottom: 8 }}>
            <button
              onClick={() => toggleSectionAnimated('article')}
              aria-expanded={!!expanded['article']}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 14px', borderRadius: 14,
                background: `${t.cyan}06`,
                border: `1px solid ${t.cyan}15`,
                cursor: 'pointer', transition: 'background 0.2s ease',
              }}
            >
              <div style={{
                width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                background: `${t.cyan}15`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14,
              }}>
                📖
              </div>
              <span style={{
                flex: 1, textAlign: 'left',
                fontFamily: t.mono, fontSize: 10, fontWeight: 800,
                color: t.cyan, textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}>
                {tr('quest.learning_material', 'Learning Material')}
              </span>
              {contentLoading && (
                <span style={{
                  fontFamily: t.mono, fontSize: 8, fontWeight: 700,
                  color: t.textMuted, padding: '1px 6px', borderRadius: 6,
                  background: `${t.textMuted}12`,
                }}>
                  ...
                </span>
              )}
              <span style={{
                fontSize: 12, color: t.textMuted,
                transition: 'transform 0.2s ease',
                transform: expanded['article'] ? 'rotate(180deg)' : 'rotate(0deg)',
              }}>
                ▾
              </span>
            </button>
            {(expanded['article'] || closingSection === 'article') && (
              <div style={{
                padding: '10px 14px 10px 52px',
                animation: closingSection === 'article'
                  ? 'fadeUp 0.15s ease-in reverse forwards'
                  : 'fadeUp 0.2s ease-out',
              }}>
                {contentLoading || questContent?.status === 'generating' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {[1, 2, 3].map((i) => (
                      <div key={i} style={{
                        height: 12, borderRadius: 4,
                        background: `${t.textMuted}15`,
                        width: i === 3 ? '60%' : '100%',
                        animation: 'pulse 1.5s ease-in-out infinite',
                      }} />
                    ))}
                  </div>
                ) : questContent?.articleBody ? (
                  <div style={{
                    fontFamily: t.body, fontSize: 12, color: t.textSecondary,
                    lineHeight: 1.6, whiteSpace: 'pre-wrap',
                  }}>
                    {questContent.articleBody}
                  </div>
                ) : (
                  <p style={{
                    fontFamily: t.body, fontSize: 12, color: t.textSecondary,
                    lineHeight: 1.5, margin: 0,
                  }}>
                    {task.aiTip}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* ── Collapsible: Fun Facts (from content pipeline or fallback) ── */}
          <div style={{ marginBottom: 8 }}>
            <button
              onClick={() => toggleSectionAnimated('funFact')}
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
                {tr('quest.fun_fact', 'Fun Fact')}
              </span>
              <span style={{
                fontSize: 12, color: t.textMuted,
                transition: 'transform 0.2s ease',
                transform: expanded['funFact'] ? 'rotate(180deg)' : 'rotate(0deg)',
              }}>
                ▾
              </span>
            </button>
            {(expanded['funFact'] || closingSection === 'funFact') && (
              <div style={{
                padding: '10px 14px 10px 52px',
                animation: closingSection === 'funFact'
                  ? 'fadeUp 0.15s ease-in reverse forwards'
                  : 'fadeUp 0.2s ease-out',
              }}>
                {questContent?.funFacts && questContent.funFacts.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {questContent.funFacts.map((ff: FunFactItem, i: number) => (
                      <div key={i} style={{
                        padding: '8px 10px', borderRadius: 8,
                        background: `${t.gold}06`,
                        borderLeft: `2px solid ${t.gold}30`,
                      }}>
                        <p style={{
                          fontFamily: t.body, fontSize: 12, color: t.textSecondary,
                          lineHeight: 1.5, margin: 0,
                        }}>
                          {ff.fact}
                        </p>
                        {ff.source && (
                          <span style={{
                            fontFamily: t.mono, fontSize: 9, color: t.textMuted,
                            marginTop: 4, display: 'block',
                          }}>
                            — {ff.source}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{
                    fontFamily: t.body, fontSize: 12, color: t.textSecondary,
                    lineHeight: 1.5, margin: 0,
                  }}>
                    {task.funFact}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* ── Collapsible: Resources (from content pipeline) ── */}
          {(questContent?.resources && questContent.resources.length > 0) && (
            <div style={{ marginBottom: 8 }}>
              <button
                onClick={() => toggleSectionAnimated('resources')}
                aria-expanded={!!expanded['resources']}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 14px', borderRadius: 14,
                  background: `${t.violet}06`,
                  border: `1px solid ${t.violet}15`,
                  cursor: 'pointer', transition: 'background 0.2s ease',
                }}
              >
                <div style={{
                  width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                  background: `${t.violet}15`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14,
                }}>
                  📚
                </div>
                <span style={{
                  flex: 1, textAlign: 'left',
                  fontFamily: t.mono, fontSize: 10, fontWeight: 800,
                  color: t.violet, textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}>
                  {tr('quest.resources', 'Resources')}
                </span>
                <span style={{
                  fontFamily: t.mono, fontSize: 8, fontWeight: 700,
                  color: t.violet, padding: '1px 6px', borderRadius: 6,
                  background: `${t.violet}12`,
                }}>
                  {questContent.resources.length}
                </span>
                <span style={{
                  fontSize: 12, color: t.textMuted,
                  transition: 'transform 0.2s ease',
                  transform: expanded['resources'] ? 'rotate(180deg)' : 'rotate(0deg)',
                }}>
                  ▾
                </span>
              </button>
              {(expanded['resources'] || closingSection === 'resources') && (
                <div style={{
                  padding: '10px 14px 10px 52px',
                  animation: closingSection === 'resources'
                    ? 'fadeUp 0.15s ease-in reverse forwards'
                    : 'fadeUp 0.2s ease-out',
                  display: 'flex', flexDirection: 'column', gap: 6,
                }}>
                  {questContent.resources.map((res: ResourceItem, i: number) => (
                    <a
                      key={i}
                      href={res.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'flex', alignItems: 'flex-start', gap: 8,
                        padding: '8px 10px', borderRadius: 8,
                        background: `${t.violet}06`,
                        border: `1px solid ${t.violet}10`,
                        textDecoration: 'none',
                        transition: 'background 0.2s ease',
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                          <span style={{
                            fontFamily: t.body, fontSize: 12, fontWeight: 600,
                            color: t.violet, overflow: 'hidden', textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}>
                            {res.title}
                          </span>
                          <span style={{
                            fontFamily: t.mono, fontSize: 8, fontWeight: 700,
                            color: t.textMuted, padding: '1px 4px', borderRadius: 4,
                            background: `${t.textMuted}12`, textTransform: 'uppercase',
                            flexShrink: 0,
                          }}>
                            {res.type}
                          </span>
                          <span style={{
                            fontFamily: t.mono, fontSize: 8, fontWeight: 700,
                            color: t.textMuted, padding: '1px 4px', borderRadius: 4,
                            background: `${t.textMuted}12`, flexShrink: 0,
                          }}>
                            {res.difficulty}
                          </span>
                        </div>
                        <p style={{
                          fontFamily: t.body, fontSize: 11, color: t.textSecondary,
                          lineHeight: 1.4, margin: 0,
                        }}>
                          {res.description}
                        </p>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Collapsible: Code Challenge (Phase D) ── */}
          {questContent?.codeChallenge && (
            <div style={{ marginBottom: 12 }}>
              <button
                onClick={() => toggleSectionAnimated('codeChallenge')}
                aria-expanded={!!expanded['codeChallenge']}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 14px', borderRadius: 14,
                  background: t.bgElevated,
                  border: `1px solid ${t.mint}20`,
                  cursor: 'pointer', transition: 'background 0.2s ease',
                }}
              >
                <NeonIcon type="code" size={14} color="cyan" />
                <span style={{
                  flex: 1, textAlign: 'left',
                  fontFamily: t.mono, fontSize: 10, fontWeight: 800,
                  color: t.mint, textTransform: 'uppercase', letterSpacing: '0.08em',
                }}>
                  {tr('quest.code_challenge', 'Code Challenge')}
                </span>
                <span style={{
                  fontSize: 12, color: t.textMuted,
                  transition: 'transform 0.2s ease',
                  transform: expanded['codeChallenge'] ? 'rotate(180deg)' : 'rotate(0deg)',
                }}>
                  ▾
                </span>
              </button>
              {(expanded['codeChallenge'] || closingSection === 'codeChallenge') && (
                <div style={{
                  padding: '12px 14px',
                  animation: closingSection === 'codeChallenge'
                    ? 'fadeUp 0.15s ease-in reverse forwards'
                    : 'fadeUp 0.2s ease-out',
                  display: 'flex', flexDirection: 'column', gap: 10,
                }}>
                  {/* Title */}
                  <div style={{
                    fontFamily: t.display, fontSize: 13, fontWeight: 700, color: t.text,
                  }}>
                    {questContent.codeChallenge.title}
                  </div>
                  {/* Description */}
                  <p style={{
                    fontFamily: t.body, fontSize: 12, color: t.textSecondary,
                    lineHeight: 1.5, margin: 0,
                  }}>
                    {questContent.codeChallenge.description}
                  </p>
                  {/* Starter Code */}
                  <pre style={{
                    fontFamily: t.mono, fontSize: 11, color: t.mint,
                    background: t.bg, padding: 12, borderRadius: 10,
                    border: `1px solid ${t.border}`,
                    overflowX: 'auto', margin: 0, lineHeight: 1.6,
                    whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                  }}>
                    {questContent.codeChallenge.starterCode}
                  </pre>
                  {/* Test Cases (visible only) */}
                  {questContent.codeChallenge.testCases.filter((tc) => !tc.isHidden).length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <div style={{
                        fontFamily: t.mono, fontSize: 9, fontWeight: 700,
                        color: t.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em',
                      }}>
                        {tr('quest.test_cases', 'Test Cases')}
                      </div>
                      {questContent.codeChallenge.testCases
                        .filter((tc) => !tc.isHidden)
                        .map((tc, i) => (
                          <div key={i} style={{
                            display: 'flex', gap: 8, alignItems: 'center',
                            padding: '6px 10px', borderRadius: 8,
                            background: `${t.mint}06`, border: `1px solid ${t.mint}10`,
                          }}>
                            <span style={{ fontFamily: t.mono, fontSize: 11, color: t.textSecondary }}>
                              {tc.input}
                            </span>
                            <span style={{ fontFamily: t.mono, fontSize: 11, color: t.textMuted }}>→</span>
                            <span style={{ fontFamily: t.mono, fontSize: 11, color: t.mint }}>
                              {tc.expectedOutput}
                            </span>
                          </div>
                        ))}
                    </div>
                  )}
                  {/* Progressive Hints */}
                  {questContent.codeChallenge.hints.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {questContent.codeChallenge.hints.slice(0, revealedHints).map((hint, i) => (
                        <div key={i} style={{
                          fontFamily: t.body, fontSize: 11, fontStyle: 'italic',
                          color: t.textSecondary, lineHeight: 1.5,
                          padding: '6px 10px', borderRadius: 8,
                          background: `${t.mint}06`,
                        }}>
                          {hint}
                        </div>
                      ))}
                      {revealedHints < questContent.codeChallenge.hints.length && (
                        <button
                          onClick={() => setRevealedHints((prev) => prev + 1)}
                          style={{
                            alignSelf: 'flex-start',
                            padding: '4px 12px', borderRadius: 8,
                            background: `${t.mint}12`, border: `1px solid ${t.mint}25`,
                            cursor: 'pointer',
                            fontFamily: t.mono, fontSize: 10, fontWeight: 700,
                            color: t.mint, transition: 'background 0.15s ease',
                          }}
                        >
                          {tr('quest.show_hint', 'Show Hint')} ({revealedHints + 1}/{questContent.codeChallenge.hints.length})
                        </button>
                      )}
                    </div>
                  )}
                  {/* Solution */}
                  {questContent.codeChallenge.solutionExplanation && (
                    <div>
                      {!showSolution ? (
                        <button
                          onClick={() => setShowSolution(true)}
                          disabled={!checkAnswered}
                          style={{
                            padding: '6px 14px', borderRadius: 8,
                            background: checkAnswered ? `${t.violet}12` : `${t.textMuted}08`,
                            border: `1px solid ${checkAnswered ? t.violet : t.border}25`,
                            cursor: checkAnswered ? 'pointer' : 'not-allowed',
                            fontFamily: t.mono, fontSize: 10, fontWeight: 700,
                            color: checkAnswered ? t.violet : t.textMuted,
                            opacity: checkAnswered ? 1 : 0.5,
                            transition: 'background 0.15s ease',
                          }}
                          title={checkAnswered ? undefined : tr('quest.complete_quiz_first', 'Complete quiz first')}
                        >
                          {tr('quest.reveal_solution', 'Reveal Solution')}
                        </button>
                      ) : (
                        <div style={{
                          fontFamily: t.body, fontSize: 12, color: t.textSecondary,
                          lineHeight: 1.6, padding: '10px 12px', borderRadius: 10,
                          background: `${t.violet}06`, border: `1px solid ${t.violet}10`,
                        }}>
                          {questContent.codeChallenge.solutionExplanation}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── Interactive Locked Feature Cards (Phase D) ── */}
          {questContent?.lockedFeatures && questContent.lockedFeatures.length > 0 && (
            <div style={{ marginBottom: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {questContent.lockedFeatures.map((lf: LockedFeature, i: number) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '8px 14px', borderRadius: 10,
                  background: `${t.textMuted}06`,
                  border: `1px solid ${t.border}`,
                }}>
                  <span style={{ fontSize: 12 }}>🔒</span>
                  <span style={{
                    flex: 1,
                    fontFamily: t.body, fontSize: 11, color: t.textMuted,
                  }}>
                    {lf.teaser}
                  </span>
                  {lf.unlockMethod === 'coins' && lf.coinCost != null ? (
                    <button
                      onClick={() => unlockFeature.mutate({
                        taskId: task.id,
                        feature: lf.type as 'code_challenge' | 'resources' | 'fun_facts',
                      })}
                      disabled={budgetCoins < lf.coinCost || unlockFeature.isPending}
                      style={{
                        padding: '3px 10px', borderRadius: 6,
                        background: budgetCoins >= lf.coinCost ? `${t.gold}15` : `${t.textMuted}08`,
                        border: `1px solid ${budgetCoins >= lf.coinCost ? `${t.gold}40` : t.border}`,
                        cursor: budgetCoins >= lf.coinCost && !unlockFeature.isPending ? 'pointer' : 'not-allowed',
                        fontFamily: t.mono, fontSize: 9, fontWeight: 700,
                        color: budgetCoins >= lf.coinCost ? t.gold : t.textMuted,
                        opacity: budgetCoins >= lf.coinCost ? 1 : 0.5,
                        transition: 'background 0.15s ease',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {unlockFeature.isPending ? '...' : `${tr('quest.unlock_for', 'Unlock for')} ${lf.coinCost} ${tr('quest.coins_unit', 'coins')}`}
                    </button>
                  ) : (
                    <button
                      onClick={() => setUpgradePrompt({ teaser: lf.teaser, tier: lf.requiredTier })}
                      style={{
                        padding: '3px 10px', borderRadius: 6,
                        background: `${t.violet}12`,
                        border: `1px solid ${t.violet}30`,
                        cursor: 'pointer',
                        fontFamily: t.mono, fontSize: 9, fontWeight: 700,
                        color: t.violet,
                        transition: 'background 0.15s ease',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {tr('quest.upgrade_to_pro', 'Upgrade to Pro')}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ── Collapsible: Knowledge Check ── */}
          <div style={{ marginBottom: 12 }}>
            <button
              onClick={() => toggleSectionAnimated('knowledge')}
              aria-expanded={!!expanded['knowledge']}
              aria-disabled={!hasCrystals && !checkAnswered ? true : undefined}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 14px', borderRadius: 14,
                background: t.bgElevated,
                border: `1px solid ${checkAnswered ? (checkCorrect ? `${t.cyan}30` : `${t.rose}30`) : t.border}`,
                cursor: 'pointer', transition: 'background 0.2s ease, border-color 0.2s ease, opacity 0.2s ease, transform 0.2s ease',
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
                {tr('quest.knowledge_check', 'Knowledge Check')}
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
            {(expanded['knowledge'] || closingSection === 'knowledge') && (
              <div style={{
                padding: '12px 14px',
                animation: closingSection === 'knowledge'
                  ? 'fadeUp 0.15s ease-in reverse forwards'
                  : 'fadeUp 0.2s ease-out',
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
                            onClick={() => {
                              if (!checkAnswered) {
                                setSelectedAnswer(i);
                                setAnswerJustSelected(i);
                                setTimeout(() => setAnswerJustSelected(null), 300);
                              }
                            }}
                            disabled={checkAnswered}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 10,
                              padding: '10px 12px', borderRadius: 10,
                              background: optBg,
                              border: `1px solid ${optBorder}`,
                              cursor: checkAnswered ? 'default' : 'pointer',
                              transition: 'background 0.2s ease, border-color 0.3s ease, opacity 0.2s ease, transform 0.2s ease',
                              textAlign: 'left',
                              minHeight: 44,
                              // Correct answer: flash cyan border; Incorrect: shake
                              animation: checkAnswered && isSelected && !isCorrectOption
                                ? 'shake 0.3s ease' : undefined,
                            }}
                          >
                            <div style={{
                              width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              background: isSelected || (checkAnswered && isCorrectOption) ? optColor : 'transparent',
                              border: `1.5px solid ${optColor}`,
                              transition: 'background 0.2s ease, border-color 0.2s ease',
                              // BounceIn on selection (Micro tier: 200ms)
                              animation: answerJustSelected === i
                                ? 'bounceIn 0.2s cubic-bezier(0.34,1.56,0.64,1)' : undefined,
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
                    {tr('quest.recharge_tomorrow', 'Recharge tomorrow')}
                  </p>
                )}
              </div>
            )}
          {/* ── AI Assist Buttons (Phase C) ── */}
          <div style={{ marginBottom: 12, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {/* Hint — always visible */}
            <button
              onClick={() => task.id && requestHint.mutate({ taskId: task.id })}
              disabled={requestHint.isPending}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 14px', borderRadius: 10,
                background: requestHint.data?.result ? `${t.violet}12` : t.bgElevated,
                border: `1px solid ${requestHint.data?.result ? `${t.violet}30` : t.border}`,
                cursor: requestHint.isPending ? 'wait' : 'pointer',
                fontFamily: t.mono, fontSize: 10, fontWeight: 700,
                color: t.violet, textTransform: 'uppercase' as const, letterSpacing: '0.06em',
                opacity: requestHint.isPending ? 0.6 : 1,
                transition: 'opacity 0.2s ease, background 0.2s ease',
              }}
            >
              {requestHint.isPending ? '...' : tr('quest.hint_btn', 'Hint')}
              {questContent && questContent.aiHintsRemaining > 0 && (
                <span style={{
                  fontFamily: t.mono, fontSize: 8, color: t.textMuted,
                  padding: '1px 5px', borderRadius: 4, background: `${t.textMuted}10`,
                }}>
                  {questContent.aiHintsRemaining}
                </span>
              )}
            </button>

            {/* Explain — visible after quiz answer */}
            {checkAnswered && (
              <button
                onClick={() => task.id && requestExplain.mutate({ taskId: task.id })}
                disabled={requestExplain.isPending}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 14px', borderRadius: 10,
                  background: requestExplain.data?.result ? `${t.cyan}12` : t.bgElevated,
                  border: `1px solid ${requestExplain.data?.result ? `${t.cyan}30` : t.border}`,
                  cursor: requestExplain.isPending ? 'wait' : 'pointer',
                  fontFamily: t.mono, fontSize: 10, fontWeight: 700,
                  color: t.cyan, textTransform: 'uppercase' as const, letterSpacing: '0.06em',
                  opacity: requestExplain.isPending ? 0.6 : 1,
                  transition: 'opacity 0.2s ease, background 0.2s ease',
                }}
              >
                {requestExplain.isPending ? '...' : tr('quest.explain_btn', 'Explain')}
              </button>
            )}

            {/* Try Again — visible after incorrect answer */}
            {checkAnswered && !checkCorrect && (
              <button
                onClick={() => task.id && requestTutor.mutate({ taskId: task.id })}
                disabled={requestTutor.isPending}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 14px', borderRadius: 10,
                  background: requestTutor.data?.result ? `${t.gold}12` : t.bgElevated,
                  border: `1px solid ${requestTutor.data?.result ? `${t.gold}30` : t.border}`,
                  cursor: requestTutor.isPending ? 'wait' : 'pointer',
                  fontFamily: t.mono, fontSize: 10, fontWeight: 700,
                  color: t.gold, textTransform: 'uppercase' as const, letterSpacing: '0.06em',
                  opacity: requestTutor.isPending ? 0.6 : 1,
                  transition: 'opacity 0.2s ease, background 0.2s ease',
                }}
              >
                {requestTutor.isPending ? '...' : tr('quest.tutor_btn', 'Try Again')}
              </button>
            )}
          </div>

          {/* ── AI Assist Response Panels ── */}
          {requestHint.data?.result && (
            <div style={{
              marginBottom: 8, padding: '10px 14px', borderRadius: 10,
              background: `${t.violet}08`, border: `1px solid ${t.violet}20`,
              animation: 'fadeUp 0.2s ease-out',
            }}>
              <p style={{
                fontFamily: t.body, fontSize: 12, color: t.text,
                lineHeight: 1.5, margin: 0,
              }}>
                {requestHint.data.result.message}
              </p>
              {requestHint.data.result.encouragement && (
                <p style={{
                  fontFamily: t.body, fontSize: 11, color: t.textMuted,
                  fontStyle: 'italic', margin: '6px 0 0 0',
                }}>
                  {requestHint.data.result.encouragement}
                </p>
              )}
              {requestHint.data.result.nextSteps && requestHint.data.result.nextSteps.length > 0 && (
                <ul style={{
                  margin: '6px 0 0 0', paddingLeft: 16,
                  fontFamily: t.body, fontSize: 11, color: t.textSecondary,
                  lineHeight: 1.5,
                }}>
                  {requestHint.data.result.nextSteps.map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {requestExplain.data?.result && (
            <div style={{
              marginBottom: 8, padding: '10px 14px', borderRadius: 10,
              background: `${t.cyan}08`, border: `1px solid ${t.cyan}20`,
              animation: 'fadeUp 0.2s ease-out',
            }}>
              <p style={{
                fontFamily: t.body, fontSize: 12, color: t.text,
                lineHeight: 1.5, margin: 0,
              }}>
                {requestExplain.data.result.message}
              </p>
              {requestExplain.data.result.encouragement && (
                <p style={{
                  fontFamily: t.body, fontSize: 11, color: t.textMuted,
                  fontStyle: 'italic', margin: '6px 0 0 0',
                }}>
                  {requestExplain.data.result.encouragement}
                </p>
              )}
            </div>
          )}

          {requestTutor.data?.result && (
            <div style={{
              marginBottom: 8, padding: '10px 14px', borderRadius: 10,
              background: `${(t.gold)}08`,
              border: `1px solid ${(t.gold)}20`,
              animation: 'fadeUp 0.2s ease-out',
            }}>
              <p style={{
                fontFamily: t.body, fontSize: 12, color: t.text,
                lineHeight: 1.5, margin: 0,
              }}>
                {requestTutor.data.result.message}
              </p>
              {requestTutor.data.result.encouragement && (
                <p style={{
                  fontFamily: t.body, fontSize: 11, color: t.textMuted,
                  fontStyle: 'italic', margin: '6px 0 0 0',
                }}>
                  {requestTutor.data.result.encouragement}
                </p>
              )}
              {requestTutor.data.result.nextSteps && requestTutor.data.result.nextSteps.length > 0 && (
                <ul style={{
                  margin: '6px 0 0 0', paddingLeft: 16,
                  fontFamily: t.body, fontSize: 11, color: t.textSecondary,
                  lineHeight: 1.5,
                }}>
                  {requestTutor.data.result.nextSteps.map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
          </div>
          </div>
          </div>
        </div>

        {/* Fade indicator at bottom of scrollable area */}
        {!isDesktop && (
        <div style={{
          position: 'sticky', bottom: 0, left: 0, right: 0, height: 32,
          background: `linear-gradient(transparent, ${t.bgCard})`,
          pointerEvents: 'none',
          marginTop: -32,
        }} />
        )}

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
                {tr('quest.bounty', 'Quest Bounty')}
              </span>
            </div>
            <span style={{
              fontFamily: t.mono, fontSize: 16, fontWeight: 800,
              color: done ? t.cyan : t.violet,
            }}>
              {done ? `${task.xp} XP earned` : `+${task.xp} XP`}
            </span>
          </div>

          {/* CTA button — press feedback (Micro tier: 150ms) */}
          <button
            onClick={handleComplete}
            onMouseDown={() => handleBtnDown('complete')}
            onMouseUp={handleBtnUp}
            onMouseLeave={handleBtnUp}
            style={{
              width: '100%', padding: '14px 0', borderRadius: 14,
              border: done ? `1px solid ${t.border}` : 'none',
              background: done ? 'transparent' : t.gradient,
              cursor: 'pointer',
              fontFamily: t.display, fontSize: 15, fontWeight: 800,
              color: done ? t.textSecondary : '#FFF',
              transition: 'transform 0.15s ease-out',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              borderBottom: done ? `1px solid ${t.border}` : `4px solid #6A50CC`,
              minHeight: 48,
              transform: pressedBtn === 'complete' ? 'scale(0.98) translateY(1px)' : 'scale(1)',
            }}
          >
            {done ? (
              <>
                <NeonIcon type="refresh" size={16} color="secondary" />
                {tr('quest.restart_btn', 'Restart Quest')}
              </>
            ) : (
              <>
                <NeonIcon type="trophy" size={16} color="text" />
                {tr('quest.complete_btn', 'Complete Quest')}
              </>
            )}
          </button>

          {/* Neutral decline — "Not now" (ethical: no confirmshaming) */}
          <button
            onClick={closeWithAnimation}
            style={{
              width: '100%', padding: '10px 0', marginTop: 8,
              background: 'none', border: 'none',
              fontFamily: t.body, fontSize: 13, fontWeight: 500,
              color: t.textMuted, cursor: 'pointer',
              transition: 'color 0.2s ease',
              minHeight: 44,
            }}
          >
            {tr('quest.not_now', 'Not now')}
          </button>
        </div>

        </>)}
      </div>

      {/* Upgrade Prompt Modal (Phase D) */}
      <UpgradePromptModal
        isOpen={upgradePrompt !== null}
        onClose={() => setUpgradePrompt(null)}
        featureTeaser={upgradePrompt?.teaser ?? ''}
        requiredTier={upgradePrompt?.tier ?? 'pro'}
      />
    </div>
  );
}
