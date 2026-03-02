'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useOnboardingV2Store } from '@plan2skill/store';
import { t } from '../../_components/tokens';
import { StepBarV2 } from '../../_components/StepBarV2';
import { BackButton, ContinueButton } from '../../_components/ContinueButton';
import { NPCBubble } from '../../_components/NPCBubble';
import { WizardShell } from '../../_components/WizardShell';
import { TileCard } from '../../_components/TileCard';
import { TileGrid } from '../../_components/TileGrid';
import { GoalPyramid } from '../../_components/GoalPyramid';
import { PAIN_POINTS, CAREER_TARGETS } from '../../_data/career-data';
import { getDefaultMilestones } from '../../_data/milestone-templates';
import type { PerformanceGoal } from '@plan2skill/types';

// ═══════════════════════════════════════════
// CAREER PATH — Step 2C: Role+Pains → Target → Career Path
// "Career change" path
// 3 internal phases (state-driven)
// ═══════════════════════════════════════════

export default function CareerPage() {
  const router = useRouter();
  const {
    careerCurrent, setCareerCurrent,
    careerPains, toggleCareerPain,
    careerTarget, setCareerTarget,
    setDreamGoal, setPerformanceGoals, addXP,
  } = useOnboardingV2Store();

  const [phase, setPhase] = useState<'role' | 'target' | 'path'>(
    careerTarget ? 'path' : careerCurrent ? 'target' : 'role'
  );
  const [roleInput, setRoleInput] = useState(careerCurrent);

  // prefers-reduced-motion
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const targetData = CAREER_TARGETS.find((ct) => ct.id === careerTarget);

  const careerMilestones = useMemo(() => {
    if (!targetData) return getDefaultMilestones('tech');
    return getDefaultMilestones(targetData.suggestedDomain);
  }, [targetData]);

  const careerDream = useMemo(() => {
    if (!targetData) return 'Transition to a new career';
    return `Transition to ${targetData.name}`;
  }, [targetData]);

  // ─── Phase 1: Current Role + Pain Points ───
  if (phase === 'role') {
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
              setCareerCurrent(roleInput.trim());
              addXP(5);
              setPhase('target');
            }}
            disabled={!roleInput.trim() || careerPains.length === 0}
          >
            Continue
          </ContinueButton>
        }
      >
        <NPCBubble characterId="sage" message="Career change is a bold quest! Tell me about your current situation." emotion="neutral" />

        <div style={{ height: 12 }} />

        <h2 style={{
          fontFamily: t.display,
          fontSize: 20,
          fontWeight: 800,
          color: t.text,
          marginBottom: 8,
        }}>
          Your current role
        </h2>

        <input
          value={roleInput}
          onChange={(e) => setRoleInput(e.target.value)}
          placeholder="e.g., Marketing Manager, Student, Teacher..."
          aria-label="Your current role or title"
          style={{
            width: '100%',
            padding: '14px 16px',
            borderRadius: 14,
            border: `1.5px solid ${t.border}`,
            background: t.bgCard,
            color: t.text,
            fontFamily: t.body,
            fontSize: 14,
            outline: 'none',
            transition: 'border-color 0.2s ease',
            boxSizing: 'border-box',
            marginBottom: 24,
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = t.violet; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = t.border; }}
        />

        <h3 style={{
          fontFamily: t.display,
          fontSize: 16,
          fontWeight: 700,
          color: t.text,
          marginBottom: 4,
        }}>
          What&apos;s driving the change?
        </h3>
        <p style={{
          fontFamily: t.body,
          fontSize: 13,
          color: t.textSecondary,
          marginBottom: 14,
        }}>
          Select 1–3 pain points
        </p>

        <TileGrid columns={{ desktop: 3, mobile: 2 }}>
          {PAIN_POINTS.map((pp, i) => (
            <TileCard
              key={pp.id}
              icon={pp.icon}
              color={pp.color}
              label={pp.label}
              selected={careerPains.includes(pp.id)}
              onClick={() => toggleCareerPain(pp.id)}
              index={i}
              size="compact"
            />
          ))}
        </TileGrid>
      </WizardShell>
    );
  }

  // ─── Phase 2: Career Target ───
  if (phase === 'target') {
    return (
      <WizardShell
        header={
          <>
            <StepBarV2 current={1} />
            <BackButton onClick={() => setPhase('role')} />
          </>
        }
      >
        <NPCBubble characterId="sage" message="Where do you want to be? Let's chart your new path." emotion="thinking" />

        <div style={{ height: 12 }} />

        <h2 style={{
          fontFamily: t.display,
          fontSize: 20,
          fontWeight: 800,
          color: t.text,
          marginBottom: 6,
        }}>
          Choose your target realm
        </h2>
        <p style={{
          fontFamily: t.body,
          fontSize: 13,
          color: t.textSecondary,
          marginBottom: 14,
        }}>
          Where do you see yourself next?
        </p>

        <TileGrid columns={{ desktop: 3, mobile: 2 }} gap={8}>
          {CAREER_TARGETS.map((ct, i) => (
            <TileCard
              key={ct.id}
              icon={ct.icon}
              color={ct.color}
              label={ct.name}
              description={ct.description}
              selected={careerTarget === ct.id}
              onClick={() => {
                setCareerTarget(ct.id);
                addXP(5);
                setTimeout(() => setPhase('path'), reducedMotion ? 50 : 300);
              }}
              index={i}
              size="compact"
            />
          ))}
        </TileGrid>
      </WizardShell>
    );
  }

  // ─── Phase 3: Career Path Preview ───
  return (
    <WizardShell
      header={
        <>
          <StepBarV2 current={1} />
          <BackButton onClick={() => setPhase('target')} />
        </>
      }
      footer={
        <>
          <ContinueButton
            onClick={() => {
              setDreamGoal(careerDream);
              const goals: PerformanceGoal[] = careerMilestones.map((m) => ({
                id: m.id,
                text: m.text,
                isCustom: false,
              }));
              setPerformanceGoals(goals);
              addXP(5);
              router.push('/assessment');
            }}
          >
            Accept career path
          </ContinueButton>

          <button
            onClick={() => setPhase('target')}
            style={{
              width: '100%',
              marginTop: 10,
              padding: '12px 0',
              background: 'none',
              border: 'none',
              color: t.textMuted,
              fontFamily: t.body,
              fontSize: 13,
              cursor: 'pointer',
              textDecoration: 'underline',
              textUnderlineOffset: 3,
            }}
          >
            Choose a different target
          </button>
        </>
      }
    >
      <NPCBubble characterId="sage" message="Here's your career quest map. The journey of a thousand miles begins with one quest." emotion="happy" />

      <div style={{ height: 12 }} />

      <h2 style={{
        fontFamily: t.display,
        fontSize: 18,
        fontWeight: 800,
        color: t.text,
        marginBottom: 8,
      }}>
        Your career quest path
      </h2>

      {/* Transition summary */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16,
        padding: '10px 14px',
        borderRadius: 12,
        background: t.bgElevated,
        border: `1px solid ${t.border}`,
      }}>
        <span style={{
          fontFamily: t.body,
          fontSize: 13,
          color: t.textSecondary,
        }}>
          {careerCurrent}
        </span>
        <span style={{
          fontFamily: t.mono,
          fontSize: 14,
          color: t.gold,
        }}>
          →
        </span>
        <span style={{
          fontFamily: t.body,
          fontSize: 13,
          fontWeight: 600,
          color: targetData?.color || t.text,
        }}>
          {targetData?.name || 'New Career'}
        </span>
      </div>

      <GoalPyramid
        dream={careerDream}
        milestones={careerMilestones}
        color={targetData?.color}
      />
    </WizardShell>
  );
}
