'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useOnboardingV2Store, useI18nStore } from '@plan2skill/store';
import { trpc } from '@plan2skill/api-client';
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
  const locale = useI18nStore((s) => s.locale);
  const tr = useI18nStore((s) => s.t);

  // API data with mock fallback
  const { data: apiCareerData } = trpc.onboarding.careerData.useQuery(
    { locale },
    { staleTime: 5 * 60 * 1000, retry: 1 },
  );
  const submitGoalMutation = trpc.onboarding.submitGoal.useMutation();
  const suggestMilestonesMutation = trpc.onboarding.suggestMilestones.useMutation();

  const painPoints = useMemo(() => {
    if (!apiCareerData?.painPoints?.length) return PAIN_POINTS;
    return apiCareerData.painPoints.map((pp) => {
      const mock = PAIN_POINTS.find((m) => m.id === pp.id);
      return {
        id: pp.id,
        label: pp.label,
        icon: (pp.icon ?? mock?.icon ?? 'coins') as typeof PAIN_POINTS[number]['icon'],
        color: pp.color ?? mock?.color ?? '#FFD166',
      };
    });
  }, [apiCareerData]);

  const careerTargets = useMemo(() => {
    if (!apiCareerData?.careerTargets?.length) return CAREER_TARGETS;
    return apiCareerData.careerTargets.map((ct) => {
      const mock = CAREER_TARGETS.find((m) => m.id === ct.id);
      return {
        id: ct.id,
        name: ct.name,
        description: ct.description,
        icon: (ct.icon ?? mock?.icon ?? 'code') as typeof CAREER_TARGETS[number]['icon'],
        color: ct.color ?? mock?.color ?? '#4ECDC4',
        suggestedDomain: ct.suggestedDomain ?? mock?.suggestedDomain ?? 'tech',
      };
    });
  }, [apiCareerData]);

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

  const targetData = careerTargets.find((ct) => ct.id === careerTarget);

  interface MilestoneItem {
    id: string;
    text: string;
    weeks: number;
  }

  const [careerMilestones, setCareerMilestones] = useState<MilestoneItem[]>([]);
  const [aiSource, setAiSource] = useState<'ai' | 'template' | null>(null);
  const hasRequestedAi = useRef(false);

  const careerDream = useMemo(() => {
    if (!targetData) return 'Transition to a new career';
    return `Transition to ${targetData.name}`;
  }, [targetData]);

  const getTemplateFallback = useCallback((): MilestoneItem[] => {
    if (!targetData) return getDefaultMilestones('tech');
    return getDefaultMilestones(targetData.suggestedDomain);
  }, [targetData]);

  const requestAiMilestones = useCallback(() => {
    if (hasRequestedAi.current) return;
    hasRequestedAi.current = true;

    suggestMilestonesMutation.mutate(
      {
        path: 'career' as const,
        intent: useOnboardingV2Store.getState().intent ?? 'career',
        locale,
        dreamGoal: careerDream,
        careerCurrent: careerCurrent,
        careerPains: careerPains,
        careerTarget: careerTarget,
      },
      {
        onSuccess: (data) => {
          setCareerMilestones(data);
          setAiSource('ai');
        },
        onError: (err) => {
          console.warn('[suggestMilestones] AI fallback to templates:', err.message);
          setCareerMilestones(getTemplateFallback());
          setAiSource('template');
        },
      },
    );
  }, [careerDream, locale, careerCurrent, careerPains, careerTarget, suggestMilestonesMutation, getTemplateFallback]);

  // Trigger AI when entering path phase
  useEffect(() => {
    if (phase === 'path' && careerMilestones.length === 0) {
      requestAiMilestones();
    }
  }, [phase, careerMilestones.length, requestAiMilestones]);

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
        <NPCBubble characterId="sage" message={tr('npc.goal_career_intro')} emotion="neutral" />

        <div style={{ height: 12 }} />

        <h2 style={{
          fontFamily: t.display,
          fontSize: 20,
          fontWeight: 800,
          color: t.text,
          marginBottom: 8,
        }}>
          {tr('onboarding.career_role')}
        </h2>

        <input
          value={roleInput}
          onChange={(e) => setRoleInput(e.target.value)}
          placeholder={tr('onboarding.career_role_placeholder')}
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
          {tr('onboarding.career_driving')}
        </h3>
        <p style={{
          fontFamily: t.body,
          fontSize: 13,
          color: t.textSecondary,
          marginBottom: 14,
        }}>
          {tr('onboarding.career_pain_subtitle')}
        </p>

        <TileGrid columns={{ desktop: 3, mobile: 2 }}>
          {painPoints.map((pp, i) => (
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
        <NPCBubble characterId="sage" message={tr('npc.goal_career_target')} emotion="thinking" />

        <div style={{ height: 12 }} />

        <h2 style={{
          fontFamily: t.display,
          fontSize: 20,
          fontWeight: 800,
          color: t.text,
          marginBottom: 6,
        }}>
          {tr('onboarding.career_target_title')}
        </h2>
        <p style={{
          fontFamily: t.body,
          fontSize: 13,
          color: t.textSecondary,
          marginBottom: 14,
        }}>
          {tr('onboarding.career_target_desc')}
        </p>

        <TileGrid columns={{ desktop: 3, mobile: 2 }} gap={8}>
          {careerTargets.map((ct, i) => (
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
                // Reset for fresh AI request
                hasRequestedAi.current = false;
                setCareerMilestones([]);
                setAiSource(null);
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
  const isLoading = suggestMilestonesMutation.isPending && careerMilestones.length === 0;

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
              // Background server sync
              submitGoalMutation.mutate({
                intent: 'career',
                path: 'career',
                dreamGoal: careerDream,
                careerTarget: careerTarget ?? undefined,
                pains: careerPains.length > 0 ? careerPains : undefined,
                milestones: careerMilestones.map((m) => ({ id: m.id, text: m.text })),
                locale,
              }, { onError: (err) => console.warn('[submitGoal]', err.message) });
              router.push('/assessment');
            }}
            disabled={isLoading}
          >
            {tr('onboarding.accept_career')}
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
            {tr('onboarding.change_target')}
          </button>
        </>
      }
    >
      <NPCBubble
        characterId="sage"
        message={isLoading
          ? tr('npc.goal_career_loading') ?? 'Crafting your career transition path...'
          : tr('npc.goal_career_result')
        }
        emotion={isLoading ? 'thinking' : 'happy'}
      />

      <div style={{ height: 12 }} />

      <h2 style={{
        fontFamily: t.display,
        fontSize: 18,
        fontWeight: 800,
        color: t.text,
        marginBottom: 8,
      }}>
        {isLoading ? 'Generating your career path...' : tr('onboarding.career_path_title')}
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

      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                height: 56,
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
          <p style={{
            fontFamily: t.body,
            fontSize: 12,
            color: t.textMuted,
            textAlign: 'center',
            marginTop: 4,
          }}>
            AI is crafting a personalized career transition path...
          </p>
        </div>
      ) : (
        <>
          <GoalPyramid
            dream={careerDream}
            milestones={careerMilestones}
            color={targetData?.color}
          />
          {aiSource === 'ai' && (
            <p style={{
              fontFamily: t.body,
              fontSize: 11,
              color: t.textMuted,
              textAlign: 'center',
              marginTop: 12,
            }}>
              Career path generated by AI based on your experience
            </p>
          )}
        </>
      )}
    </WizardShell>
  );
}
