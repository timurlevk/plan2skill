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
import { DOMAINS, getInterestsForDomain } from '../../_data/domains';
import { getDefaultMilestones, matchTemplates } from '../../_data/milestone-templates';
import type { PerformanceGoal } from '@plan2skill/types';

// ═══════════════════════════════════════════
// GUIDED DISCOVERY — Step 2B: Domain → Interests → AI Proposal
// "I need direction" path
// 3 internal phases (state-driven, NOT route changes)
// ═══════════════════════════════════════════

export default function GuidedPage() {
  const router = useRouter();
  const {
    selectedDomain, setSelectedDomain,
    selectedInterests, toggleInterest, addCustomInterest,
    setDreamGoal, setPerformanceGoals, addXP,
  } = useOnboardingV2Store();

  const [phase, setPhase] = useState<'domain' | 'interests' | 'proposal'>(
    selectedDomain ? (selectedInterests.length > 0 ? 'proposal' : 'interests') : 'domain'
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

  const interests = useMemo(() => {
    return selectedDomain ? getInterestsForDomain(selectedDomain) : [];
  }, [selectedDomain]);

  const domainData = DOMAINS.find((d) => d.id === selectedDomain);

  // Generate proposal milestones from selected interests
  const proposalMilestones = useMemo(() => {
    if (selectedInterests.length === 0) return [];
    const firstInterest = selectedInterests[0] || '';
    const match = matchTemplates(firstInterest, selectedDomain || undefined);
    if (match) return match.milestones;
    return getDefaultMilestones(selectedDomain || 'tech');
  }, [selectedInterests, selectedDomain]);

  const proposalDream = useMemo(() => {
    if (!domainData) return 'Master new skills';
    if (selectedInterests.length === 1) {
      const interest = interests.find((i) => i.id === selectedInterests[0]);
      return `Master ${interest?.label || selectedInterests[0]}`;
    }
    return `Master ${domainData.name}`;
  }, [domainData, selectedInterests, interests]);

  // ─── Phase 1: Domain Selection ───
  if (phase === 'domain') {
    return (
      <WizardShell
        header={
          <>
            <StepBarV2 current={1} />
            <BackButton onClick={() => router.push('/intent')} />
          </>
        }
      >
        <NPCBubble characterId="sage" message="Let's explore your interests, hero. Which realm calls to you?" emotion="happy" />

        <div style={{ height: 12 }} />

        <h2 style={{
          fontFamily: t.display,
          fontSize: 20,
          fontWeight: 800,
          color: t.text,
          marginBottom: 6,
        }}>
          Pick your realm
        </h2>
        <p style={{
          fontFamily: t.body,
          fontSize: 13,
          color: t.textSecondary,
          marginBottom: 14,
        }}>
          Choose the area that interests you most
        </p>

        <TileGrid columns={{ desktop: 3, mobile: 2 }} gap={8}>
          {DOMAINS.map((domain, i) => (
            <TileCard
              key={domain.id}
              icon={domain.icon}
              color={domain.color}
              label={domain.name}
              description={domain.description}
              selected={selectedDomain === domain.id}
              onClick={() => {
                setSelectedDomain(domain.id);
                addXP(5);
                setTimeout(() => setPhase('interests'), reducedMotion ? 50 : 300);
              }}
              index={i}
              size="compact"
            />
          ))}
        </TileGrid>
      </WizardShell>
    );
  }

  // ─── Phase 2: Interest Tiles ───
  if (phase === 'interests') {
    return (
      <WizardShell
        header={
          <>
            <StepBarV2 current={1} />
            <BackButton onClick={() => setPhase('domain')} />
          </>
        }
        footer={
          <ContinueButton
            onClick={() => {
              addXP(5);
              setPhase('proposal');
            }}
            disabled={selectedInterests.length < 1}
          >
            Continue ({selectedInterests.length} {selectedInterests.length === 1 ? 'interest' : 'interests'})
          </ContinueButton>
        }
      >
        <NPCBubble
          characterId="sage"
          message={selectedInterests.length === 0
            ? "Pick the skills that spark your curiosity, hero!"
            : selectedInterests.length < 3
            ? "Great pick! Choosing 3 or more helps me craft a better quest path."
            : "Excellent choices! Your quest path is taking shape."
          }
          emotion={selectedInterests.length >= 3 ? 'impressed' : 'thinking'}
        />

        <div style={{ height: 12 }} />

        <h2 style={{
          fontFamily: t.display,
          fontSize: 20,
          fontWeight: 800,
          color: t.text,
          marginBottom: 4,
        }}>
          What interests you in {domainData?.name || 'this realm'}?
        </h2>
        <p style={{
          fontFamily: t.body,
          fontSize: 13,
          color: t.textSecondary,
          marginBottom: 12,
        }}>
          Pick at least 1 interest · {selectedInterests.length} selected
        </p>

        <TileGrid
          columns={{ desktop: 3, mobile: 2 }}
          freeText={{
            placeholder: 'Add custom interest...',
            value: '',
            onChange: () => {},
            onAdd: (val) => addCustomInterest(val),
          }}
        >
          {interests.map((interest, i) => (
            <TileCard
              key={interest.id}
              icon={interest.icon}
              color={interest.color}
              label={interest.label}
              selected={selectedInterests.includes(interest.id)}
              onClick={() => toggleInterest(interest.id)}
              index={i}
              badge={interest.trending ? 'Trending' : undefined}
              size="compact"
            />
          ))}
        </TileGrid>
      </WizardShell>
    );
  }

  // ─── Phase 3: AI Proposal ───
  return (
    <WizardShell
      header={
        <>
          <StepBarV2 current={1} />
          <BackButton onClick={() => setPhase('interests')} />
        </>
      }
      footer={
        <>
          <ContinueButton
            onClick={() => {
              setDreamGoal(proposalDream);
              const goals: PerformanceGoal[] = proposalMilestones.map((m) => ({
                id: m.id,
                text: m.text,
                isCustom: false,
              }));
              setPerformanceGoals(goals);
              addXP(5);
              router.push('/assessment');
            }}
          >
            Accept quest path
          </ContinueButton>

          <button
            onClick={() => setPhase('interests')}
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
            Change my interests
          </button>
        </>
      }
    >
      <NPCBubble characterId="sage" message="Based on your interests, here's a quest path I'd recommend." emotion="impressed" />

      <div style={{ height: 12 }} />

      <h2 style={{
        fontFamily: t.display,
        fontSize: 18,
        fontWeight: 800,
        color: t.text,
        marginBottom: 8,
      }}>
        Your proposed quest path
      </h2>

      {/* Summary chips */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 6,
        marginBottom: 16,
      }}>
        {domainData && (
          <span style={{
            padding: '4px 10px',
            borderRadius: 8,
            background: `${domainData.color}15`,
            border: `1px solid ${domainData.color}30`,
            fontFamily: t.mono,
            fontSize: 11,
            fontWeight: 600,
            color: domainData.color,
          }}>
            {domainData.name}
          </span>
        )}
        {selectedInterests.slice(0, 3).map((id) => {
          const interest = interests.find((i) => i.id === id);
          return interest ? (
            <span key={id} style={{
              padding: '4px 10px',
              borderRadius: 8,
              background: `${interest.color}10`,
              fontFamily: t.body,
              fontSize: 11,
              color: interest.color,
            }}>
              {interest.label}
            </span>
          ) : null;
        })}
        {selectedInterests.length > 3 && (
          <span style={{
            padding: '4px 10px',
            borderRadius: 8,
            background: `${t.textMuted}15`,
            fontFamily: t.body,
            fontSize: 11,
            color: t.textMuted,
          }}>
            +{selectedInterests.length - 3} more
          </span>
        )}
      </div>

      <GoalPyramid
        dream={proposalDream}
        milestones={proposalMilestones}
        color={domainData?.color}
      />
    </WizardShell>
  );
}
