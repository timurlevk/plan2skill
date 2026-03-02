'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useOnboardingV2Store } from '@plan2skill/store';
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
// ═══════════════════════════════════════════

export default function DirectGoalPage() {
  const router = useRouter();
  const {
    dreamGoal, setDreamGoal,
    performanceGoals, setPerformanceGoals, updatePerformanceGoal,
    addXP,
  } = useOnboardingV2Store();

  const [phase, setPhase] = useState<'dream' | 'milestones' | 'pyramid'>(
    dreamGoal ? (performanceGoals.length > 0 ? 'pyramid' : 'milestones') : 'dream'
  );
  const [inputValue, setInputValue] = useState(dreamGoal);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(performanceGoals.map((g) => g.id))
  );

  // prefers-reduced-motion
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Template matching based on dream text
  const templateMatch = useMemo(() => {
    if (!inputValue.trim()) return null;
    return matchTemplates(inputValue);
  }, [inputValue]);

  const milestones = useMemo(() => {
    if (templateMatch) return templateMatch.milestones;
    return getDefaultMilestones('tech'); // fallback
  }, [templateMatch]);

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
              setDreamGoal(inputValue.trim());
              addXP(5);
              setPhase('milestones');
            }}
            disabled={!inputValue.trim()}
          >
            Set my dream quest
          </ContinueButton>
        }
      >
        <NPCBubble characterId="sage" message="What's your dream skill, hero? Think big — the quest map comes later." emotion="thinking" />

        <div style={{ height: 12 }} />

        <h2 style={{
          fontFamily: t.display,
          fontSize: 20,
          fontWeight: 800,
          color: t.text,
          marginBottom: 6,
          lineHeight: 1.3,
        }}>
          Describe your dream quest
        </h2>

        <p style={{
          fontFamily: t.body,
          fontSize: 13,
          color: t.textSecondary,
          marginBottom: 20,
        }}>
          What skill or topic do you want to master?
        </p>

        <textarea
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="e.g., Become a full-stack developer, Master AI/ML, Learn UI/UX design..."
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

        {/* Template hint */}
        {templateMatch && (
          <p style={{
            fontFamily: t.body,
            fontSize: 12,
            color: t.cyan,
            marginTop: 8,
            animation: 'fadeUp 0.3s ease-out',
          }}>
            Matched: {templateMatch.dreamLabel}
          </p>
        )}
      </WizardShell>
    );
  }

  // ─── Phase 2: Milestone Selection ───
  if (phase === 'milestones') {
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
      // Update in local state — will be committed on continue
      const ms = milestones.find((m) => m.id === id);
      if (ms) ms.text = text;
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
            disabled={selectedIds.size === 0}
          >
            Confirm milestones ({selectedIds.size})
          </ContinueButton>
        }
      >
        <NPCBubble characterId="sage" message="Here are some milestones to guide your journey. You can customize them." emotion="impressed" />

        <div style={{ height: 12 }} />

        <h2 style={{
          fontFamily: t.display,
          fontSize: 18,
          fontWeight: 800,
          color: t.text,
          marginBottom: 4,
        }}>
          Choose your milestones
        </h2>

        <p style={{
          fontFamily: t.body,
          fontSize: 12,
          color: t.textSecondary,
          marginBottom: 12,
        }}>
          Select milestones for your quest. Tap edit to customize.
        </p>

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
        <ContinueButton onClick={() => router.push('/assessment')}>
          Looks good — continue
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
        Your Quest Map
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
