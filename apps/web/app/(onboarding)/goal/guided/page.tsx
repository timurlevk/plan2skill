'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useOnboardingV2Store, useI18nStore, useAuthStore } from '@plan2skill/store';
import { trpc } from '@plan2skill/api-client';
import { t } from '../../_components/tokens';
import { StepBarV2 } from '../../_components/StepBarV2';
import { BackButton, ContinueButton } from '../../_components/ContinueButton';
import { NPCBubble } from '../../_components/NPCBubble';
import { WizardShell } from '../../_components/WizardShell';
import { TileCard } from '../../_components/TileCard';
import { TileGrid } from '../../_components/TileGrid';
import { GoalPyramid } from '../../_components/GoalPyramid';
import { NeonIcon } from '../../_components/NeonIcon';
import { DOMAINS, getInterestsForDomain } from '../../_data/domains';
import type { InterestConfig } from '../../_data/domains';
import { getDefaultMilestones, matchTemplates } from '../../_data/milestone-templates';
import { SELF_ASSESSMENT_OPTIONS } from '../../_data/assessment-questions';
import type { PerformanceGoal, SkillAssessmentV2, AssessmentLevel } from '@plan2skill/types';
import { SearchInput } from '../../_components/SearchInput';

// ═══════════════════════════════════════════
// GUIDED DISCOVERY — Step 2B: Domain → Interests → Assessment → Goals → AI Proposal
// "I need direction" path
// 5 internal phases (state-driven, NOT route changes)
// AI-powered milestone suggestions with template fallback
// ═══════════════════════════════════════════

interface MilestoneItem {
  id: string;
  text: string;
  weeks: number;
}

export default function GuidedPage() {
  const router = useRouter();
  const {
    selectedDomain, setSelectedDomain,
    selectedInterests, toggleInterest, addCustomInterest,
    customInterests,
    guidedAssessmentLevel, setGuidedAssessmentLevel,
    guidedCustomGoals, addGuidedCustomGoal, removeGuidedCustomGoal,
    setAssessment,
    setDreamGoal, setPerformanceGoals, addXP,
  } = useOnboardingV2Store();
  const locale = useI18nStore((s) => s.locale);
  const tr = useI18nStore((s) => s.t);

  // API data with mock fallback
  const { data: apiDomains } = trpc.onboarding.domains.useQuery(
    { locale },
    { staleTime: 5 * 60 * 1000, retry: 1 },
  );
  const submitGoalMutation = trpc.onboarding.submitGoal.useMutation();
  const suggestMilestonesMutation = trpc.onboarding.suggestMilestones.useMutation();
  const generateRoadmapMutation = trpc.roadmap.generate.useMutation();

  const assessments = useOnboardingV2Store((s) => s.assessments);

  const [phase, setPhase] = useState<'domain' | 'interests' | 'assessment' | 'goals' | 'proposal'>(() => {
    // Re-entry: user completed phases 1-4 + assessment quiz → jump to proposal
    const hasQuizAssessment = assessments.some((a) => a.method === 'quiz');
    if (selectedDomain && selectedInterests.length > 0 && guidedAssessmentLevel && hasQuizAssessment) {
      return 'proposal';
    }
    // Normal resume
    if (selectedDomain) return selectedInterests.length > 0 ? 'assessment' : 'interests';
    return 'domain';
  });
  const [proposalMilestones, setProposalMilestones] = useState<MilestoneItem[]>([]);
  const [aiSource, setAiSource] = useState<'ai' | 'template' | null>(null);
  const hasRequestedAi = useRef(false);
  const [goalInput, setGoalInput] = useState('');

  // Search state for domain & interests
  const [domainSearch, setDomainSearch] = useState('');
  const [interestSearch, setInterestSearch] = useState('');

  // AI-generated interests for custom/empty domains
  const suggestInterestsMutation = trpc.onboarding.suggestInterests.useMutation();
  const [aiInterests, setAiInterests] = useState<InterestConfig[]>([]);

  // prefers-reduced-motion
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // AI interest generation — always generate for selected domain
  useEffect(() => {
    if (phase === 'interests' && selectedDomain && !suggestInterestsMutation.isPending) {
      suggestInterestsMutation.mutate(
        { domain: selectedDomain, dreamGoal: proposalDream, locale },
        {
          onSuccess: (data) => {
            setAiInterests(data.map((d: { id: string; label: string }) => ({
              id: d.id,
              label: d.label,
              domain: selectedDomain || '',
              icon: 'sparkle' as typeof DOMAINS[number]['icon'],
              color: domainColor,
            })));
          },
          onError: (err) => console.warn('[suggestInterests]', err.message),
        },
      );
    }
  }, [phase, selectedDomain]); // eslint-disable-line react-hooks/exhaustive-deps

  // Resolved domains/interests: API with mock fallback
  const domains = useMemo(() => {
    if (!apiDomains?.length) return DOMAINS;
    return apiDomains.map((ad) => {
      const mock = DOMAINS.find((m) => m.id === ad.id);
      return {
        id: ad.id,
        name: ad.name,
        description: ad.description,
        icon: (ad.icon ?? mock?.icon ?? 'sparkle') as typeof DOMAINS[number]['icon'],
        color: ad.color ?? mock?.color ?? '#818CF8',
        interests: ad.interests ?? [],
      };
    });
  }, [apiDomains]);

  const interests: InterestConfig[] = useMemo(() => {
    if (!selectedDomain) return [];
    const apiDomain = domains.find((d) => d.id === selectedDomain);
    if (apiDomain && 'interests' in apiDomain) {
      const ints = apiDomain.interests as Array<Record<string, any>>;
      if (ints.length > 0) {
        return ints.map((i): InterestConfig => ({
          id: i.id,
          label: i.label,
          domain: i.domain,
          icon: i.icon as typeof DOMAINS[number]['icon'],
          color: i.color,
          trending: i.trending,
        }));
      }
    }
    return getInterestsForDomain(selectedDomain);
  }, [selectedDomain, domains]);

  const domainData = domains.find((d) => d.id === selectedDomain);
  const domainColor = domainData?.color ?? '#818CF8';

  // Merge custom + AI interests into the tile list
  const allInterests: InterestConfig[] = useMemo(() => {
    const custom: InterestConfig[] = customInterests.map((label) => ({
      id: label,
      label,
      domain: selectedDomain || '',
      icon: 'sparkle' as typeof DOMAINS[number]['icon'],
      color: domainColor,
    }));
    const base = aiInterests.length > 0 ? aiInterests : interests;
    return [...custom, ...base];
  }, [interests, aiInterests, customInterests, selectedDomain, domainColor]);

  // Build dream goal text from domain + selected interest for AI prompt
  const proposalDream = useMemo(() => {
    if (!domainData) return 'Master new skills';
    const interest = allInterests.find((i) => i.id === selectedInterests[0]);
    if (interest) {
      return `Master ${interest.label} (${domainData.name})`;
    }
    return `Master ${domainData.name}`;
  }, [domainData, selectedInterests, allInterests]);

  // Template fallback
  const getTemplateFallback = useCallback((): MilestoneItem[] => {
    if (selectedInterests.length === 0) return [];
    const firstInterest = selectedInterests[0] || '';
    const match = matchTemplates(firstInterest, selectedDomain || undefined);
    if (match) return match.milestones;
    return getDefaultMilestones(selectedDomain || 'tech');
  }, [selectedInterests, selectedDomain]);

  // Request AI milestones when entering proposal phase
  const requestAiMilestones = useCallback(() => {
    if (hasRequestedAi.current) return;
    hasRequestedAi.current = true;

    const s = useOnboardingV2Store.getState();
    suggestMilestonesMutation.mutate(
      {
        path: 'guided' as const,
        intent: s.intent ?? 'explore_guided',
        locale,
        dreamGoal: proposalDream,
        selectedDomain: s.selectedDomain ?? '',
        selectedInterests: s.selectedInterests,
        customInterests: s.customInterests,
        skillLevel: s.guidedAssessmentLevel,
        customGoals: s.guidedCustomGoals,
        assessments: s.assessments.map((a) => ({
          domain: a.domain,
          level: a.level,
          method: a.method,
          score: a.score,
          confidence: a.confidence,
        })),
      },
      {
        onSuccess: (data) => {
          setProposalMilestones(data);
          setAiSource('ai');
        },
        onError: (err) => {
          console.warn('[suggestMilestones] AI fallback to templates:', err.message);
          setProposalMilestones(getTemplateFallback());
          setAiSource('template');
        },
      },
    );
  }, [proposalDream, locale, suggestMilestonesMutation, getTemplateFallback]);

  // Reset AI request state when entering/re-entering proposal phase
  useEffect(() => {
    if (phase === 'proposal') {
      hasRequestedAi.current = false;
      setProposalMilestones([]);
      setAiSource(null);
    }
  }, [phase]);

  // Trigger AI when entering proposal phase (after reset)
  useEffect(() => {
    if (phase === 'proposal' && proposalMilestones.length === 0) {
      requestAiMilestones();
    }
  }, [phase, proposalMilestones.length, requestAiMilestones]);

  // ─── Background AI Assessment Generation ───
  function triggerBackgroundAssessmentGen() {
    const s = useOnboardingV2Store.getState();
    s.setAiAssessmentStatus('loading');

    // Direct fetch — bypasses httpBatchLink which may not flush before navigation unmounts the component.
    // tRPC React Query mutations are tied to the batch queue; if the component unmounts before
    // the next event loop tick, the request is never sent. Using fetch() starts the HTTP request
    // immediately and the promise survives any React lifecycle changes.
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
    const token = useAuthStore.getState().accessToken;
    const payload = {
      path: 'guided' as const,
      intent: s.intent ?? 'explore_guided',
      locale,
      dreamGoal: proposalDream,
      selectedDomain: s.selectedDomain ?? '',
      selectedInterests: s.selectedInterests,
      customInterests: s.customInterests,
      skillLevel: s.guidedAssessmentLevel,
      customGoals: s.guidedCustomGoals,
      assessments: s.assessments.map((a) => ({
        domain: a.domain,
        level: a.level,
        method: a.method,
        score: a.score,
        confidence: a.confidence,
      })),
    };

    fetch(`${apiUrl}/trpc/onboarding.generateAssessmentQuestions?batch=1`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      // tRPC v11 batch format (no superjson): {"0": <raw_input>}
      body: JSON.stringify({ '0': payload }),
    })
      .then((res) => res.json())
      .then((batch) => {
        // tRPC batch response: [{ result: { data: <output> } }]
        const questions = batch?.[0]?.result?.data;
        if (Array.isArray(questions) && questions.length > 0) {
          useOnboardingV2Store.getState().setAiAssessmentQuestions(questions);
          useOnboardingV2Store.getState().setAiAssessmentStatus('ready');
        } else {
          console.warn('[background assessment gen] unexpected response:', batch);
          useOnboardingV2Store.getState().setAiAssessmentStatus('error');
        }
      })
      .catch((err) => {
        console.error('[background assessment gen] failed:', err);
        useOnboardingV2Store.getState().setAiAssessmentStatus('error');
      });
  }

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
        <NPCBubble characterId="sage" message={tr('npc.goal_guided_domain')} emotion="happy" />

        <div style={{ height: 12 }} />

        <h2 style={{
          fontFamily: t.display,
          fontSize: 20,
          fontWeight: 800,
          color: t.text,
          marginBottom: 6,
        }}>
          {tr('onboarding.pick_realm')}
        </h2>
        <p style={{
          fontFamily: t.body,
          fontSize: 13,
          color: t.textSecondary,
          marginBottom: 14,
        }}>
          {tr('onboarding.pick_realm_desc')}
        </p>

        <SearchInput
          value={domainSearch}
          onChange={setDomainSearch}
          onSubmit={(val) => {
            setSelectedDomain(val);
            setDomainSearch('');
            addXP(5);
            setTimeout(() => setPhase('interests'), reducedMotion ? 50 : 300);
          }}
          placeholder={tr('onboarding.search_domain') || 'Search or type your own domain...'}
          locale={locale}
        />

        <TileGrid columns={{ desktop: 3, mobile: 2 }} gap={8}>
          {domains
            .filter((d) => !domainSearch || d.name.toLowerCase().includes(domainSearch.toLowerCase()))
            .map((domain, i) => (
            <TileCard
              key={domain.id}
              icon={domain.icon}
              color={domain.color}
              label={domain.name}
              description={domain.description}
              selected={selectedDomain === domain.id}
              onClick={() => {
                setSelectedDomain(domain.id);
                setDomainSearch('');
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
              setPhase('assessment');
            }}
            disabled={selectedInterests.length < 1}
          >
            Continue
          </ContinueButton>
        }
      >
        <NPCBubble
          characterId="sage"
          message={tr('npc.goal_guided_interests')}
          emotion={selectedInterests.length > 0 ? 'impressed' : 'thinking'}
        />

        <div style={{ height: 12 }} />

        <h2 style={{
          fontFamily: t.display,
          fontSize: 20,
          fontWeight: 800,
          color: t.text,
          marginBottom: 4,
        }}>
          {tr('onboarding.interests_title').replace('{domain}', domainData?.name || 'this realm')}
        </h2>
        <p style={{
          fontFamily: t.body,
          fontSize: 13,
          color: t.textSecondary,
          marginBottom: 12,
        }}>
          {tr('onboarding.interests_subtitle')}
        </p>

        <SearchInput
          value={interestSearch}
          onChange={setInterestSearch}
          onSubmit={(val) => {
            addCustomInterest(val);
            setInterestSearch('');
          }}
          placeholder={tr('onboarding.interests_add') || 'Search or add your own interest...'}
          locale={locale}
        />

        {suggestInterestsMutation.isPending && allInterests.length === 0 && (
          <p style={{ fontFamily: t.body, fontSize: 12, color: t.textMuted, textAlign: 'center', marginBottom: 8 }}>
            AI is discovering interests for this domain...
          </p>
        )}

        <TileGrid columns={{ desktop: 3, mobile: 2 }}>
          {allInterests
            .filter((i) => !interestSearch || i.label.toLowerCase().includes(interestSearch.toLowerCase()))
            .map((interest, i) => (
            <TileCard
              key={interest.id}
              icon={interest.icon}
              color={interest.color}
              label={interest.label}
              selected={selectedInterests.includes(interest.id)}
              onClick={() => toggleInterest(interest.id)}
              index={i}
              badge={interest.trending ? tr('onboarding.trending') : (customInterests.includes(interest.id) ? 'Custom' : undefined)}
              size="compact"
            />
          ))}
        </TileGrid>
      </WizardShell>
    );
  }

  // ─── Phase 3: Self-Assessment ───
  if (phase === 'assessment') {
    return (
      <WizardShell
        header={
          <>
            <StepBarV2 current={1} />
            <BackButton onClick={() => setPhase('interests')} />
          </>
        }
      >
        <NPCBubble
          characterId="sage"
          message={tr('npc.goal_guided_assessment')}
          emotion="thinking"
        />

        <div style={{ height: 12 }} />

        <h2 style={{
          fontFamily: t.display,
          fontSize: 20,
          fontWeight: 800,
          color: t.text,
          marginBottom: 4,
        }}>
          {tr('onboarding.skill_level')}
        </h2>
        <p style={{
          fontFamily: t.body,
          fontSize: 13,
          color: t.textSecondary,
          marginBottom: 14,
        }}>
          {tr('onboarding.skill_level_in').replace('{domain}', domainData?.name || 'this realm')}
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
          {SELF_ASSESSMENT_OPTIONS.map((opt, i) => {
            const isSelected = guidedAssessmentLevel === opt.level;
            return (
              <button
                key={opt.id}
                onClick={() => {
                  setGuidedAssessmentLevel(opt.level as AssessmentLevel);
                  const assessment: SkillAssessmentV2 = {
                    domain: selectedDomain || 'general',
                    level: opt.level as AssessmentLevel,
                    method: 'self_assessment',
                    score: 0,
                    confidence: 0.5,
                  };
                  setAssessment(assessment);
                  addXP(5);
                  setTimeout(() => setPhase('goals'), reducedMotion ? 50 : 300);
                }}
                aria-label={`${opt.label}: ${opt.description}`}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 6,
                  padding: '14px 10px 12px',
                  borderRadius: 12,
                  border: `2px solid ${isSelected ? opt.color : t.border}`,
                  background: isSelected ? `${opt.color}10` : t.bgCard,
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'border-color 0.2s ease, background 0.2s ease',
                  animation: reducedMotion ? 'none' : `fadeUp 0.35s ease-out ${i * 0.06}s both`,
                }}
              >
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: `${opt.color}15`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <NeonIcon type={opt.icon} size={18} color={opt.color} />
                </div>
                <span style={{
                  fontFamily: t.display,
                  fontSize: 13,
                  fontWeight: 700,
                  color: t.text,
                }}>
                  {opt.label}
                </span>
                <span style={{
                  fontFamily: t.body,
                  fontSize: 11,
                  color: t.textMuted,
                  lineHeight: 1.3,
                }}>
                  {opt.description}
                </span>
              </button>
            );
          })}
        </div>
      </WizardShell>
    );
  }

  // ─── Phase 4: Custom Goals ───
  if (phase === 'goals') {
    const handleAddGoal = () => {
      const trimmed = goalInput.trim();
      if (!trimmed || guidedCustomGoals.length >= 5) return;
      addGuidedCustomGoal(trimmed);
      setGoalInput('');
    };

    return (
      <WizardShell
        header={
          <>
            <StepBarV2 current={1} />
            <BackButton onClick={() => setPhase('assessment')} />
          </>
        }
        footer={
          <ContinueButton
            onClick={() => {
              const hasQuizAssessment = assessments.some((a) => a.method === 'quiz');
              if (hasQuizAssessment) {
                // Re-entry: already completed legend + assessment, go straight to proposal
                setPhase('proposal');
              } else {
                triggerBackgroundAssessmentGen();
                router.push('/legend');
              }
            }}
          >
            {guidedCustomGoals.length > 0
              ? tr('onboarding.milestones_continue').replace('{count}', String(guidedCustomGoals.length))
              : tr('onboarding.milestones_skip')}
          </ContinueButton>
        }
      >
        <NPCBubble
          characterId="sage"
          message={tr('npc.goal_guided_goals')}
          emotion="happy"
        />

        <div style={{ height: 12 }} />

        <h2 style={{
          fontFamily: t.display,
          fontSize: 20,
          fontWeight: 800,
          color: t.text,
          marginBottom: 4,
        }}>
          {tr('onboarding.milestones_title')}
        </h2>
        <p style={{
          fontFamily: t.body,
          fontSize: 13,
          color: t.textSecondary,
          marginBottom: 14,
        }}>
          {tr('onboarding.milestones_count').replace('{count}', String(guidedCustomGoals.length))}
        </p>

        {/* Input area */}
        <div style={{
          display: 'flex',
          gap: 8,
          marginBottom: 16,
        }}>
          <textarea
            value={goalInput}
            onChange={(e) => setGoalInput(e.target.value.slice(0, 200))}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleAddGoal();
              }
            }}
            placeholder={tr('onboarding.milestones_placeholder')}
            disabled={guidedCustomGoals.length >= 5}
            rows={2}
            style={{
              flex: 1,
              padding: '10px 12px',
              borderRadius: 10,
              border: `1px solid ${t.border}`,
              background: t.bgCard,
              color: t.text,
              fontFamily: t.body,
              fontSize: 13,
              resize: 'none',
              outline: 'none',
            }}
          />
          <button
            onClick={handleAddGoal}
            disabled={!goalInput.trim() || guidedCustomGoals.length >= 5}
            style={{
              padding: '10px 16px',
              borderRadius: 10,
              border: 'none',
              background: !goalInput.trim() || guidedCustomGoals.length >= 5 ? t.border : t.gradient,
              color: !goalInput.trim() || guidedCustomGoals.length >= 5 ? t.textMuted : '#fff',
              fontFamily: t.display,
              fontSize: 13,
              fontWeight: 700,
              cursor: !goalInput.trim() || guidedCustomGoals.length >= 5 ? 'not-allowed' : 'pointer',
              alignSelf: 'flex-end',
            }}
          >
            Add
          </button>
        </div>

        {/* Goal list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {guidedCustomGoals.map((goal, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 12px',
                borderRadius: 10,
                background: t.bgCard,
                border: `1px solid ${t.border}`,
                animation: reducedMotion ? 'none' : 'fadeUp 0.25s ease-out',
              }}
            >
              <NeonIcon type="target" size={16} color={domainColor} />
              <span style={{
                flex: 1,
                fontFamily: t.body,
                fontSize: 13,
                color: t.text,
                lineHeight: 1.4,
              }}>
                {goal}
              </span>
              <button
                onClick={() => removeGuidedCustomGoal(i)}
                aria-label="Remove goal"
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 6,
                  border: 'none',
                  background: 'none',
                  color: t.textMuted,
                  fontSize: 16,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>

        {guidedCustomGoals.length === 0 && (
          <p style={{
            fontFamily: t.body,
            fontSize: 12,
            color: t.textMuted,
            textAlign: 'center',
            marginTop: 24,
            lineHeight: 1.5,
          }}>
            {tr('onboarding.milestones_empty')}
          </p>
        )}
      </WizardShell>
    );
  }

  // ─── Phase 5: AI Proposal ───
  const isLoading = suggestMilestonesMutation.isPending && proposalMilestones.length === 0;

  return (
    <WizardShell
      header={
        <>
          <StepBarV2 current={1} />
          <BackButton onClick={() => router.push('/assessment')} />
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
              // Background server sync
              submitGoalMutation.mutate({
                intent: 'explore_guided',
                path: 'guided',
                dreamGoal: proposalDream,
                domain: selectedDomain ?? undefined,
                interests: selectedInterests,
                milestones: proposalMilestones.map((m) => ({ id: m.id, text: m.text })),
                locale,
                skillLevel: guidedAssessmentLevel ?? undefined,
                customGoals: guidedCustomGoals.length > 0 ? guidedCustomGoals : undefined,
              }, { onError: (err) => console.warn('[submitGoal]', err.message) });

              // Fire-and-forget roadmap + quest generation for dashboard
              generateRoadmapMutation.mutate({
                goal: proposalDream,
                currentRole: 'Learner',
                experienceLevel: guidedAssessmentLevel === 'advanced' ? 'advanced'
                  : guidedAssessmentLevel === 'intermediate' ? 'intermediate' : 'beginner',
                dailyMinutes: 30,
                selectedTools: [],
                superpower: selectedInterests[0] || '',
              }, { onError: (err) => console.warn('[roadmap gen]', err.message) });

              router.push('/character');
            }}
            disabled={isLoading}
          >
            {tr('onboarding.accept_quest')}
          </ContinueButton>

          <button
            onClick={() => setPhase('goals')}
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
            {tr('onboarding.change_goals')}
          </button>
        </>
      }
    >
      <NPCBubble
        characterId="sage"
        message={isLoading
          ? tr('npc.goal_guided_loading')
          : aiSource === 'ai'
            ? "I've crafted this quest path based on your interests. How does it look?"
            : "Based on your interests, here's a quest path I'd recommend."
        }
        emotion={isLoading ? 'thinking' : 'impressed'}
      />

      <div style={{ height: 12 }} />

      <h2 style={{
        fontFamily: t.display,
        fontSize: 18,
        fontWeight: 800,
        color: t.text,
        marginBottom: 8,
      }}>
        {isLoading ? 'Generating your quest path...' : 'Your proposed quest path'}
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
        {guidedAssessmentLevel && (
          <span style={{
            padding: '4px 10px',
            borderRadius: 8,
            background: `${t.violet}15`,
            border: `1px solid ${t.violet}30`,
            fontFamily: t.mono,
            fontSize: 11,
            fontWeight: 600,
            color: t.violet,
          }}>
            {guidedAssessmentLevel.charAt(0).toUpperCase() + guidedAssessmentLevel.slice(1)}
          </span>
        )}
        {selectedInterests.slice(0, 3).map((id) => {
          const interest = allInterests.find((i) => i.id === id);
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
            AI is crafting a personalized path from your interests...
          </p>
        </div>
      ) : (
        <>
          <GoalPyramid
            dream={proposalDream}
            milestones={proposalMilestones}
            color={domainData?.color}
          />
          {aiSource === 'ai' && (
            <p style={{
              fontFamily: t.body,
              fontSize: 11,
              color: t.textMuted,
              textAlign: 'center',
              marginTop: 12,
            }}>
              Quest path generated by AI based on your interests
            </p>
          )}
        </>
      )}
    </WizardShell>
  );
}
