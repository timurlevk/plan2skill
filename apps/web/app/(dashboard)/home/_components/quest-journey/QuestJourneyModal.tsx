'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { t } from '../../../../(onboarding)/_components/tokens';
import { NeonIcon } from '../../../../(onboarding)/_components/NeonIcon';
import { useI18nStore } from '@plan2skill/store';
import { useQuestContent } from '../../_hooks/useQuestContent';
import { useQuestAssist } from '../../_hooks/useQuestAssist';
import type { QuestTask } from '../../_utils/quest-templates';
import type { BonusResult } from '../../_utils/xp-utils';
import { BriefingScreen } from './BriefingScreen';
import { ContentScrollScreen } from './ContentScrollScreen';
import { TrialByFireScreen } from './TrialByFireScreen';
import { CompleteScreen } from './CompleteScreen';
import { FailScreen } from './FailScreen';

// ===================================================
// QUEST JOURNEY MODAL -- Shell component + phase router
// Phases: briefing -> content -> trial -> complete | fail
//
// Features:
// - Overlay with backdrop blur, body scroll lock
// - Focus trap + keyboard (Escape, Tab)
// - Close animation (fadeUp/fadeOut)
// - Desktop detection (>=768px)
// - prefers-reduced-motion support
// - Uses useQuestContent + useQuestAssist hooks
// ===================================================

/** Pass threshold: score >= 60% of total to pass */
const PASS_THRESHOLD = 0.6;

type Phase = 'briefing' | 'content' | 'trial' | 'complete' | 'fail';

interface QuestJourneyModalProps {
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
  /** Review mode — completed quest read-only, no XP reward */
  reviewMode?: boolean;
}

export function QuestJourneyModal({
  task,
  done,
  onClose,
  onToggle,
  onOpenNext,
  characterId,
  dailyCompleted,
  dailyTotal,
  bonusResult,
  currentStreak,
  energyCrystals,
  onConsumeCrystal,
  attributeGrowth,
  reviewMode = false,
}: QuestJourneyModalProps) {
  const tr = useI18nStore((s) => s.t);

  // ── Quest content pipeline ──
  const { content: questContent, isLoading: contentLoading } = useQuestContent(task.id);

  // ── AI assist (available for child screens) ──
  const { requestHint, requestExplain, requestTutor } = useQuestAssist(task.id);

  // ── Reduced motion ──
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // ── Desktop detection ──
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== 'undefined' && window.innerWidth >= 768,
  );
  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 768);
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // ── Phase state machine ──
  const [phase, setPhase] = useState<Phase>(() => (done && !reviewMode ? 'complete' : 'briefing'));
  const [trialScore, setTrialScore] = useState(0);
  const [trialTotal, setTrialTotal] = useState(0);

  // ── Close animation ──
  const [isClosing, setIsClosing] = useState(false);
  const closeWithAnimation = useCallback(() => {
    if (reducedMotion) {
      onClose();
      return;
    }
    setIsClosing(true);
    setTimeout(onClose, 200);
  }, [onClose, reducedMotion]);

  // ── Refs ──
  const overlayRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // ── Body scroll lock ──
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // ── Auto-focus close button ──
  useEffect(() => {
    closeButtonRef.current?.focus();
  }, []);

  // ── Focus trap + keyboard ──
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      // Escape
      if (e.key === 'Escape') {
        closeWithAnimation();
        return;
      }

      // Tab focus trap
      if (e.key === 'Tab') {
        const modal = overlayRef.current;
        if (!modal) return;
        const focusable = modal.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
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
  }, [closeWithAnimation]);

  // ── Phase transition handlers ──

  const handleBeginQuest = useCallback(() => {
    // If content has blocks or articleBody, go to content; otherwise skip to trial
    const hasContent =
      (questContent?.contentBlocks && questContent.contentBlocks.length > 0) ||
      (questContent?.articleBody && questContent.articleBody.length > 0);

    if (hasContent) {
      setPhase('content');
    } else {
      setPhase('trial');
    }
  }, [questContent]);

  const handleContinueToTrial = useCallback(() => {
    if (reviewMode) {
      closeWithAnimation();
      return;
    }
    setPhase('trial');
  }, [reviewMode, closeWithAnimation]);

  const handleTrialComplete = useCallback(
    (score: number, total: number) => {
      setTrialScore(score);
      setTrialTotal(total);

      // Determine pass/fail (0 exercises = auto-pass)
      if (total === 0 || score / total >= PASS_THRESHOLD) {
        // Mark quest as complete
        if (!done) {
          onToggle();
        }
        setPhase('complete');
      } else {
        setPhase('fail');
      }
    },
    [done, onToggle],
  );

  const handleRetryTrial = useCallback(() => {
    setTrialScore(0);
    setTrialTotal(0);
    setPhase('trial');
  }, []);

  const handleReviewMaterial = useCallback(() => {
    setPhase('content');
  }, []);

  // ── Phase label for header ──
  const phaseLabel = useMemo(() => {
    if (reviewMode) {
      return phase === 'briefing'
        ? tr('quest.phase.review', 'Review')
        : tr('quest.phase.content', 'Study');
    }
    switch (phase) {
      case 'briefing':
        return tr('quest.phase.briefing', 'Briefing');
      case 'content':
        return tr('quest.phase.content', 'Study');
      case 'trial':
        return tr('quest.phase.trial', 'Trial by Fire');
      case 'complete':
        return tr('quest.phase.complete', 'Victory');
      case 'fail':
        return tr('quest.phase.fail', 'Defeat');
    }
  }, [phase, tr, reviewMode]);

  // ── Phase progress steps ──
  const phaseSteps: Phase[] = ['briefing', 'content', 'trial'];
  const currentStepIndex = phaseSteps.indexOf(phase);

  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-label={tr('quest.journey.aria_label', 'Quest Journey')}
      onClick={(e) => {
        if (e.target === e.currentTarget) closeWithAnimation();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: isDesktop ? 'center' : 'flex-end',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.65)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        animation: isClosing
          ? (reducedMotion ? 'none' : 'fadeIn 0.2s ease-out reverse forwards')
          : (reducedMotion ? 'none' : 'fadeIn 0.25s ease-out'),
      }}
    >
      {/* Modal panel */}
      <div
        style={{
          width: isDesktop ? 560 : '100%',
          maxWidth: isDesktop ? 560 : '100%',
          maxHeight: isDesktop ? '90vh' : '92vh',
          display: 'flex',
          flexDirection: 'column',
          background: t.bg,
          borderRadius: isDesktop ? 20 : '20px 20px 0 0',
          borderTop: `1px solid ${t.border}`,
          borderLeft: `1px solid ${t.border}`,
          borderRight: `1px solid ${t.border}`,
          borderBottom: isDesktop ? `1px solid ${t.border}` : 'none',
          overflow: 'hidden',
          animation: isClosing
            ? (reducedMotion ? 'none' : 'slideUp 0.2s ease-in reverse forwards')
            : (reducedMotion ? 'none' : 'slideUp 0.35s ease-out'),
          boxShadow: '0 -4px 40px rgba(0,0,0,0.4)',
        }}
      >
        {/* ── Header ── */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 20px',
          borderBottom: `1px solid ${t.border}`,
          flexShrink: 0,
        }}>
          {/* Phase label */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}>
            <NeonIcon
              type={phase === 'complete' ? 'trophy' : phase === 'fail' ? 'shield' : 'compass'}
              size={18}
              color={phase === 'complete' ? 'gold' : phase === 'fail' ? 'rose' : 'violet'}
              active={phase === 'complete'}
            />
            <span style={{
              fontFamily: t.display,
              fontSize: 15,
              fontWeight: 700,
              color: t.text,
            }}>
              {phaseLabel}
            </span>
          </div>

          {/* Phase progress dots (only during active phases) */}
          {currentStepIndex >= 0 && phase !== 'complete' && phase !== 'fail' && (
            <div style={{
              display: 'flex',
              gap: 6,
              alignItems: 'center',
            }}>
              {phaseSteps.map((step, i) => {
                const isActive = i === currentStepIndex;
                const isDone = i < currentStepIndex;
                return (
                  <div
                    key={step}
                    style={{
                      width: isActive ? 18 : 8,
                      height: 8,
                      borderRadius: 4,
                      background: isDone
                        ? t.mint
                        : isActive
                          ? t.violet
                          : `${t.textMuted}40`,
                      transition: 'width 0.3s ease, background 0.3s ease',
                    }}
                  />
                );
              })}
            </div>
          )}

          {/* Close button */}
          <button
            ref={closeButtonRef}
            onClick={closeWithAnimation}
            aria-label={tr('quest.journey.close', 'Close')}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              border: `1px solid ${t.border}`,
              background: 'transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'border-color 0.2s ease, background 0.2s ease',
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = t.borderHover;
              e.currentTarget.style.background = `${t.border}40`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = t.border;
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <NeonIcon type="close" size={14} color="secondary" />
          </button>
        </div>

        {/* ── Content area ── */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 20px 24px 20px',
          scrollbarWidth: 'thin' as 'thin',
          scrollbarColor: `${t.border} transparent`,
        }}>
          {/* Briefing phase */}
          {phase === 'briefing' && (
            <BriefingScreen
              task={task}
              characterId={characterId}
              onBeginQuest={handleBeginQuest}
              isLoading={contentLoading}
            />
          )}

          {/* Content phase */}
          {phase === 'content' && (
            <ContentScrollScreen
              contentBlocks={questContent?.contentBlocks ?? null}
              articleBody={questContent?.articleBody ?? null}
              onContinue={handleContinueToTrial}
              characterId={characterId}
            />
          )}

          {/* Trial phase (hidden in review mode) */}
          {!reviewMode && phase === 'trial' && (
            <TrialByFireScreen
              exercises={questContent?.exercises ?? null}
              quizQuestions={questContent?.quizQuestions ?? null}
              onComplete={handleTrialComplete}
              energyCrystals={energyCrystals}
              onConsumeCrystal={onConsumeCrystal}
              taskId={task.id}
            />
          )}

          {/* Complete phase (hidden in review mode) */}
          {!reviewMode && phase === 'complete' && (
            <CompleteScreen
              task={task}
              characterId={characterId}
              score={trialScore}
              total={trialTotal}
              bonusResult={bonusResult}
              attributeGrowth={attributeGrowth}
              currentStreak={currentStreak}
              dailyCompleted={dailyCompleted}
              dailyTotal={dailyTotal}
              onClose={closeWithAnimation}
              onOpenNext={onOpenNext}
            />
          )}

          {/* Fail phase (hidden in review mode) */}
          {!reviewMode && phase === 'fail' && (
            <FailScreen
              task={task}
              characterId={characterId}
              score={trialScore}
              total={trialTotal}
              onRetryTrial={handleRetryTrial}
              onReviewMaterial={handleReviewMaterial}
            />
          )}
        </div>
      </div>
    </div>
  );
}
