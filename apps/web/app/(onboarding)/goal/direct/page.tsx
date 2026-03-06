'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useOnboardingV2Store } from '@plan2skill/store';
import { useI18nStore } from '@plan2skill/store';
import { trpc } from '@plan2skill/api-client';
import { t } from '../../_components/tokens';
import { StepBarV2 } from '../../_components/StepBarV2';
import { BackButton, ContinueButton } from '../../_components/ContinueButton';
import { NPCBubble } from '../../_components/NPCBubble';
import { WizardShell } from '../../_components/WizardShell';
import { GoalPyramid } from '../../_components/GoalPyramid';
import { MilestoneCard, MilestoneStepper } from '../../_components/MilestoneCard';
import { matchTemplates, getDefaultMilestones } from '../../_data/milestone-templates';
import type { PerformanceGoal } from '@plan2skill/types';

// ═══════════════════════════════════════════
// DIRECT GOAL — Step 2A: Dream → Milestones → Pyramid
// "I know what to learn" path
// 3 phases: dream input → milestone selection → pyramid
// AI-powered milestone suggestions with template fallback
// ═══════════════════════════════════════════

interface MilestoneItem {
  id: string;
  text: string;
  weeks: number;
}

export default function DirectGoalPage() {
  const router = useRouter();
  const {
    dreamGoal, setDreamGoal,
    performanceGoals, setPerformanceGoals,
    addXP,
  } = useOnboardingV2Store();
  const locale = useI18nStore((s) => s.locale);
  const tr = useI18nStore((s) => s.t);
  const submitGoalMutation = trpc.onboarding.submitGoal.useMutation();
  const suggestMilestonesMutation = trpc.onboarding.suggestMilestones.useMutation();

  const [phase, setPhase] = useState<'dream' | 'milestones' | 'pyramid'>(
    dreamGoal ? (performanceGoals.length > 0 ? 'pyramid' : 'milestones') : 'dream'
  );
  const [inputValue, setInputValue] = useState(dreamGoal);
  const [milestones, setMilestones] = useState<MilestoneItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(performanceGoals.map((g) => g.id))
  );
  const [aiSource, setAiSource] = useState<'ai' | 'template' | null>(null);
  const hasRequestedAi = useRef(false);

  // prefers-reduced-motion
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Fallback to templates
  const getTemplateFallback = useCallback((goal: string): MilestoneItem[] => {
    const match = matchTemplates(goal);
    if (match) return match.milestones;
    return getDefaultMilestones('tech');
  }, []);

  // Request AI milestones when entering milestones phase
  const requestAiMilestones = useCallback((goal: string) => {
    if (hasRequestedAi.current) return;
    hasRequestedAi.current = true;

    suggestMilestonesMutation.mutate(
      {
        path: 'direct' as const,
        intent: useOnboardingV2Store.getState().intent ?? 'know',
        locale,
        dreamGoal: goal,
      },
      {
        onSuccess: (data) => {
          setMilestones(data);
          setSelectedIds(new Set(data.map((m) => m.id)));
          setAiSource('ai');
        },
        onError: (err) => {
          console.warn('[suggestMilestones] AI fallback to templates:', err.message);
          const fallback = getTemplateFallback(goal);
          setMilestones(fallback);
          setSelectedIds(new Set(fallback.map((m) => m.id)));
          setAiSource('template');
        },
      },
    );
  }, [locale, suggestMilestonesMutation, getTemplateFallback]);

  // If returning to milestones phase with existing data, restore it
  useEffect(() => {
    if (phase === 'milestones' && milestones.length === 0 && dreamGoal) {
      requestAiMilestones(dreamGoal);
    }
  }, [phase, milestones.length, dreamGoal, requestAiMilestones]);

  // ─── Phase 1: Dream Input ───
  if (phase === 'dream') {
    return (
      <WizardShell
        header={
          <>
            <StepBarV2 current={1} />
            <BackButton onClick={() => router.push('/intent')} />
          </>
        }
        footer={
          <ContinueButton
            onClick={() => {
              const goal = inputValue.trim();
              setDreamGoal(goal);
              addXP(5);
              // Reset for fresh AI request
              hasRequestedAi.current = false;
              setMilestones([]);
              setAiSource(null);
              setPhase('milestones');
            }}
            disabled={!inputValue.trim()}
          >
            {tr('goal.direct_submit')}
          </ContinueButton>
        }
      >
        <NPCBubble characterId="sage" message={tr('npc.goal_direct_prompt')} emotion="thinking" />

        <div style={{ height: 12 }} />

        <h2 style={{
          fontFamily: t.display,
          fontSize: 20,
          fontWeight: 800,
          color: t.text,
          marginBottom: 6,
          lineHeight: 1.3,
        }}>
          {tr('goal.direct_title')}
        </h2>

        <p style={{
          fontFamily: t.body,
          fontSize: 13,
          color: t.textSecondary,
          marginBottom: 20,
        }}>
          {tr('goal.direct_subtitle')}
        </p>

        <textarea
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={tr('goal.direct_placeholder')}
          aria-label="Your dream skill or goal"
          rows={3}
          style={{
            width: '100%',
            padding: '14px 16px',
            borderRadius: 14,
            border: `1.5px solid ${t.border}`,
            background: t.bgCard,
            color: t.text,
            fontFamily: t.body,
            fontSize: 14,
            lineHeight: 1.5,
            resize: 'none',
            outline: 'none',
            transition: 'border-color 0.2s ease',
            boxSizing: 'border-box',
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = t.violet; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = t.border; }}
        />
      </WizardShell>
    );
  }

  // ─── Phase 2: Milestone Selection ───
  if (phase === 'milestones') {
    const isLoading = suggestMilestonesMutation.isPending && milestones.length === 0;

    const toggleMilestone = (id: string) => {
      const next = new Set(selectedIds);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      setSelectedIds(next);
    };

    const handleEditMilestone = (id: string, text: string) => {
      setMilestones((prev) => prev.map((m) => m.id === id ? { ...m, text } : m));
    };

    return (
      <WizardShell
        header={
          <>
            <StepBarV2 current={1} />
            <BackButton onClick={() => setPhase('dream')} />
          </>
        }
        footer={
          <ContinueButton
            onClick={() => {
              const goals: PerformanceGoal[] = milestones
                .filter((m) => selectedIds.has(m.id))
                .map((m) => ({ id: m.id, text: m.text, isCustom: false }));
              setPerformanceGoals(goals);
              addXP(10);
              setPhase('pyramid');
            }}
            disabled={selectedIds.size === 0 || isLoading}
          >
            Confirm milestones ({selectedIds.size})
          </ContinueButton>
        }
      >
        <NPCBubble
          characterId="sage"
          message={isLoading
            ? tr('npc.goal_direct_loading')
            : aiSource === 'ai'
              ? tr('npc.goal_direct_success')
              : "Here are some milestones to guide your journey. You can customize them."
          }
          emotion={isLoading ? 'thinking' : 'impressed'}
        />

        <div style={{ height: 12 }} />

        <h2 style={{
          fontFamily: t.display,
          fontSize: 18,
          fontWeight: 800,
          color: t.text,
          marginBottom: 4,
        }}>
          {isLoading ? tr('goal.direct_generating') : tr('goal.direct_choose')}
        </h2>

        <p style={{
          fontFamily: t.body,
          fontSize: 12,
          color: t.textSecondary,
          marginBottom: 12,
        }}>
          {isLoading
            ? 'AI is creating a personalized learning path for you.'
            : 'Select milestones for your quest. Tap edit to customize.'}
        </p>

        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  height: 64,
                  borderRadius: 12,
                  background: t.bgCard,
                  border: `1px solid ${t.border}`,
                  animation: reducedMotion ? 'none' : 'pulse 1.5s ease-in-out infinite',
                  animationDelay: `${i * 0.2}s`,
                  opacity: 0.6,
                }}
              />
            ))}
            <style>{`
              @keyframes pulse {
                0%, 100% { opacity: 0.4; }
                50% { opacity: 0.7; }
              }
            `}</style>
          </div>
        ) : (
          <MilestoneStepper>
            {milestones.map((m, i) => (
              <MilestoneCard
                key={m.id}
                index={i}
                text={m.text}
                weeks={m.weeks}
                selected={selectedIds.has(m.id)}
                onToggle={() => toggleMilestone(m.id)}
                onEdit={(text) => handleEditMilestone(m.id, text)}
                isFirst={i === 0}
                isLast={i === milestones.length - 1}
              />
            ))}
          </MilestoneStepper>
        )}

        {aiSource === 'ai' && (
          <p style={{
            fontFamily: t.body,
            fontSize: 11,
            color: t.textMuted,
            textAlign: 'center',
            marginTop: 12,
          }}>
            Milestones generated by AI based on your goal
          </p>
        )}
      </WizardShell>
    );
  }

  // ─── Phase 3: Pyramid View ───
  return (
    <WizardShell
      header={
        <>
          <StepBarV2 current={1} />
          <BackButton onClick={() => setPhase('milestones')} />
        </>
      }
      footer={
        <ContinueButton onClick={() => {
          // Background server sync
          submitGoalMutation.mutate({
            intent: 'know',
            path: 'direct',
            dreamGoal: dreamGoal || inputValue,
            milestones: performanceGoals.map((g) => ({ id: g.id, text: g.text })),
            locale,
          }, { onError: (err) => console.warn('[submitGoal]', err.message) });
          router.push('/assessment');
        }}>
          {tr('goal.direct_continue')}
        </ContinueButton>
      }
    >
      <h2 style={{
        fontFamily: t.display,
        fontSize: 20,
        fontWeight: 800,
        color: t.text,
        marginBottom: 16,
      }}>
        {tr('goal.direct_quest_map')}
      </h2>

      <GoalPyramid
        dream={dreamGoal || inputValue}
        milestones={milestones.filter((m) => selectedIds.has(m.id)).map((m) => ({
          id: m.id,
          text: performanceGoals.find((g) => g.id === m.id)?.text || m.text,
          weeks: m.weeks,
        }))}
      />
    </WizardShell>
  );
}
