'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useOnboardingV2Store, useI18nStore } from '@plan2skill/store';
import { trpc } from '@plan2skill/api-client';
import { t } from '../_components/tokens';
import { StepBarV2 } from '../_components/StepBarV2';
import { BackButton, ContinueButton } from '../_components/ContinueButton';
import { NPCBubble } from '../_components/NPCBubble';
import { QuizCardV2 } from '../_components/QuizCardV2';
import { XPFloat } from '../_components/XPFloat';
import { NeonIcon } from '../_components/NeonIcon';
import { WizardShell } from '../_components/WizardShell';
import { NPCLoadingMessages } from '../_components/NPCLoadingMessages';
import { ASSESSMENT_LOADING_MESSAGES } from '../_data/loading-messages';
import {
  getNextQuestion, shouldStopAssessment,
  computeLevel as computeAssessmentLevel,
  SELF_ASSESSMENT_OPTIONS, QUESTIONS,
  type AssessmentQuestion,
} from '../_data/assessment-questions';
import { DOMAINS } from '../_data/domains';
import type { SkillAssessmentV2, ArchetypeId, AssessmentLevel } from '@plan2skill/types';

/** Infer archetype from onboarding intent + assessment level */
function inferArchetype(
  intentVal: string | null,
  pathVal: string | null,
  level: AssessmentLevel,
): ArchetypeId {
  if (intentVal === 'know' || pathVal === 'direct') return 'strategist';
  if (intentVal === 'career' || pathVal === 'career') return 'builder';
  if (intentVal === 'explore_guided' || pathVal === 'guided') {
    if (level === 'advanced' || level === 'intermediate') return 'innovator';
    return 'explorer';
  }
  return 'explorer';
}

// ═══════════════════════════════════════════
// ASSESSMENT — Step 3: Adaptive 2-5 questions
// A/B/C quiz cards with NPC reactions
// Self-assessment fallback for domains without questions
// ═══════════════════════════════════════════

export default function AssessmentPage() {
  const router = useRouter();
  const {
    selectedDomain, intent, discoveryPath,
    assessments, aiAssessmentStatus,
    setAssessment, setInferredArchetype, addXP,
  } = useOnboardingV2Store();
  const locale = useI18nStore((s) => s.locale);
  const tr = useI18nStore((s) => s.t);
  const submitAssessmentMutation = trpc.onboarding.submitAssessment.useMutation();

  // ─── AI-generated questions ─────────────────────────────
  const generateQuestionsMutation = trpc.onboarding.generateAssessmentQuestions.useMutation();
  // Sync-init from store so mode/hasQuestions are correct on first render
  const [aiQuestions, setAiQuestions] = useState<AssessmentQuestion[] | null>(() => {
    const { aiAssessmentQuestions, aiAssessmentStatus } = useOnboardingV2Store.getState();
    if (aiAssessmentQuestions?.length && aiAssessmentStatus === 'ready') {
      return aiAssessmentQuestions as unknown as AssessmentQuestion[];
    }
    return null;
  });
  const [aiError, setAiError] = useState(false);
  const hasRequestedAi = useRef(false);

  // Own generation — used as fallback when background gen fails/times out
  const fireOwnGeneration = useCallback(() => {
    if (hasRequestedAi.current) return;
    hasRequestedAi.current = true;

    const store = useOnboardingV2Store.getState();
    const path = store.discoveryPath;
    const base = {
      intent: (store.intent ?? 'exploring') as 'know' | 'explore_guided' | 'career' | 'exploring',
      locale,
      dreamGoal: store.dreamGoal || 'Learn new skills',
    };

    let context: Parameters<typeof generateQuestionsMutation.mutate>[0];
    if (path === 'guided') {
      context = {
        ...base,
        path: 'guided' as const,
        selectedDomain: store.selectedDomain ?? 'tech',
        selectedInterests: store.selectedInterests,
        customInterests: store.customInterests,
        skillLevel: (store.guidedAssessmentLevel as 'beginner' | 'familiar' | 'intermediate' | 'advanced') ?? null,
        customGoals: store.guidedCustomGoals,
        assessments: store.assessments.map((a) => ({
          domain: a.domain,
          level: a.level as 'beginner' | 'familiar' | 'intermediate' | 'advanced',
          method: a.method as 'quiz' | 'self_assessment',
          score: a.score,
          confidence: a.confidence,
        })),
      };
    } else if (path === 'career') {
      context = {
        ...base,
        path: 'career' as const,
        careerCurrent: store.careerCurrent || 'Unknown',
        careerPains: store.careerPains,
        careerTarget: store.careerTarget,
      };
    } else {
      context = { ...base, path: 'direct' as const };
    }

    generateQuestionsMutation.mutate(context, {
      onSuccess: (data) => setAiQuestions(data as AssessmentQuestion[]),
      onError: (err) => {
        console.warn('[AI assessment] fallback:', err.message);
        setAiError(true);
      },
    });
  }, [locale, generateQuestionsMutation]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // Already initialized synchronously from store
    if (aiQuestions) return;

    const { aiAssessmentQuestions, aiAssessmentStatus } = useOnboardingV2Store.getState();

    // Double-check: store became ready between init and effect
    if (aiAssessmentQuestions?.length && aiAssessmentStatus === 'ready') {
      setAiQuestions(aiAssessmentQuestions as unknown as AssessmentQuestion[]);
      return;
    }

    // Still loading from guided flow — subscribe with timeout safety net
    if (aiAssessmentStatus === 'loading') {
      let resolved = false;

      const unsub = useOnboardingV2Store.subscribe((state) => {
        if (resolved) return;
        if (state.aiAssessmentStatus === 'ready' && state.aiAssessmentQuestions?.length) {
          resolved = true;
          setAiQuestions(state.aiAssessmentQuestions as unknown as AssessmentQuestion[]);
          unsub();
          clearTimeout(timeout);
        } else if (state.aiAssessmentStatus === 'error') {
          resolved = true;
          unsub();
          clearTimeout(timeout);
          fireOwnGeneration();
        }
      });

      // Safety net: if background gen doesn't resolve in 8s, generate ourselves
      const timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          unsub();
          fireOwnGeneration();
        }
      }, 8000);

      return () => { clearTimeout(timeout); unsub(); };
    }

    // No background gen — generate immediately (non-guided or idle state)
    fireOwnGeneration();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Determine which domain to assess
  const assessDomain = useMemo(() => {
    if (aiQuestions?.length) return aiQuestions[0]!.domain;
    if (selectedDomain) return selectedDomain;
    if (discoveryPath === 'direct') return 'tech'; // default for direct path
    return 'tech';
  }, [aiQuestions, selectedDomain, discoveryPath]);

  // Fetch questions from API with mock fallback
  const { data: apiQuestions } = trpc.onboarding.assessmentQuestions.useQuery(
    { domain: assessDomain, locale },
    { staleTime: 5 * 60 * 1000, retry: 1 },
  );

  // 3-tier fallback: AI questions → DB seed → frontend QUESTIONS array
  const questionPool: AssessmentQuestion[] = useMemo(() => {
    if (aiQuestions?.length) return aiQuestions;
    if (apiQuestions && apiQuestions.length > 0) return apiQuestions as AssessmentQuestion[];
    return QUESTIONS;
  }, [aiQuestions, apiQuestions]);

  // Check if we have questions for this domain
  const hasQuestions = useMemo(() => {
    return questionPool.some((q) => q.domain === assessDomain);
  }, [questionPool, assessDomain]);

  const [mode, setMode] = useState<'quiz' | 'self'>(!hasQuestions ? 'self' : 'quiz');
  const [answered, setAnswered] = useState<{ questionId: string; correct: boolean }[]>([]);
  const [npcMessage, setNpcMessage] = useState('');
  const [npcEmotion, setNpcEmotion] = useState<'neutral' | 'happy' | 'impressed' | 'thinking'>('happy');
  const [showXP, setShowXP] = useState(false);
  const [xpAmount, setXpAmount] = useState(0);
  const [totalXpEarned, setTotalXpEarned] = useState(0);
  const [complete, setComplete] = useState(false);
  const [selfLevel, setSelfLevel] = useState<string | null>(null);

  // Hydration-safe: set translated NPC message after mount
  useEffect(() => {
    setNpcMessage(tr('npc.assessment_intro'));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // prefers-reduced-motion
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const currentQuestion = useMemo(() => {
    if (mode !== 'quiz' || complete) return null;
    return getNextQuestion(assessDomain, answered, questionPool);
  }, [assessDomain, answered, mode, complete, questionPool]);

  // Calculate current streak (consecutive correct from the end)
  const currentStreak = useMemo(() => {
    let streak = 0;
    for (let i = answered.length - 1; i >= 0; i--) {
      if (answered[i]?.correct) streak++;
      else break;
    }
    return streak;
  }, [answered]);

  const handleQuizAnswer = useCallback((optionId: string, correct: boolean) => {
    const q = currentQuestion;
    if (!q) return;

    const newAnswered = [...answered, { questionId: q.id, correct }];
    setAnswered(newAnswered);

    // NPC reaction
    if (correct) {
      setNpcMessage(tr('npc.assessment_feedback_correct'));
      setNpcEmotion(q.npcReaction.correctEmotion);
      setXpAmount(5);
      setShowXP(true);
      setTotalXpEarned((prev) => prev + 5);
      addXP(5);
      setTimeout(() => setShowXP(false), 1200);
    } else {
      setNpcMessage(tr('npc.assessment_feedback_wrong'));
      setNpcEmotion(q.npcReaction.wrongEmotion);
    }

    // Check if we should stop
    if (shouldStopAssessment(newAnswered, questionPool) || !getNextQuestion(assessDomain, newAnswered, questionPool)) {
      setTimeout(() => {
        setComplete(true);
        setNpcMessage(tr('npc.assessment_complete'));
        setNpcEmotion('impressed');
        const level = computeAssessmentLevel(newAnswered, questionPool);
        const assessment: SkillAssessmentV2 = {
          domain: assessDomain,
          level,
          method: 'quiz',
          score: newAnswered.filter((a) => a.correct).length,
          confidence: 0.8,
        };
        setAssessment(assessment);
        setInferredArchetype(inferArchetype(intent, discoveryPath, level));
        setTotalXpEarned((prev) => prev + 5);
        addXP(5); // completion bonus
        // Background server sync
        submitAssessmentMutation.mutate({
          assessments: [assessment],
        }, { onError: (err) => console.warn('[submitAssessment]', err.message) });
      }, 1000);
    }
  }, [currentQuestion, answered, assessDomain, addXP, setAssessment, setInferredArchetype, intent, discoveryPath]);

  const handleSelfAssessment = (levelId: string) => {
    setSelfLevel(levelId);
    const option = SELF_ASSESSMENT_OPTIONS.find((o) => o.id === levelId);
    if (!option) return;

    const assessment: SkillAssessmentV2 = {
      domain: assessDomain,
      level: option.level,
      method: 'self_assessment',
      score: 0,
      confidence: 0.5,
    };
    setAssessment(assessment);
    setInferredArchetype(inferArchetype(intent, discoveryPath, option.level as AssessmentLevel));
    setTotalXpEarned(5);
    addXP(5);
    setComplete(true);
    setNpcMessage(tr('npc.assessment_complete'));
    setNpcEmotion('happy');
    // Background server sync
    submitAssessmentMutation.mutate({
      assessments: [assessment],
    }, { onError: (err) => console.warn('[submitAssessment]', err.message) });
  };

  const domainData = DOMAINS.find((d) => d.id === assessDomain);

  // ─── Complete State — matches prototype: icon + level + description + 3 stat cards ───
  if (complete) {
    const level = selfLevel
      ? SELF_ASSESSMENT_OPTIONS.find((o) => o.id === selfLevel)?.level || 'beginner'
      : computeAssessmentLevel(answered, questionPool);
    const LEVEL_LABEL_KEYS: Record<string, string> = {
      beginner: 'assessment.beginner',
      familiar: 'assessment.familiar',
      intermediate: 'assessment.intermediate',
      advanced: 'assessment.advanced',
    };
    const levelLabel = tr(LEVEL_LABEL_KEYS[level] || level);
    const correctCount = answered.filter((a) => a.correct).length;

    // Level description — RPG vocabulary (UX-R141: positive framing)
    const LEVEL_DESC_KEYS: Record<string, string> = {
      beginner: 'assessment.beginner_desc',
      familiar: 'assessment.familiar_desc',
      intermediate: 'assessment.intermediate_desc',
      advanced: 'assessment.advanced_desc',
    };
    const levelDesc = tr(LEVEL_DESC_KEYS[level] || LEVEL_DESC_KEYS.intermediate!);

    // Self-assessment description — different from quiz
    const selfOption = selfLevel ? SELF_ASSESSMENT_OPTIONS.find((o) => o.id === selfLevel) : null;

    return (
      <WizardShell
        header={<StepBarV2 current={1} />}
        footer={
          <ContinueButton onClick={() => {
            if (discoveryPath === 'guided') {
              router.push('/goal/guided');
            } else {
              router.push('/character');
            }
          }}>
            {tr('onboarding.onward')}
          </ContinueButton>
        }
      >
        <NPCBubble characterId="sage" message={npcMessage} emotion={npcEmotion} />

        <div style={{ height: 12 }} />

        <div style={{
          textAlign: 'center',
          padding: '24px 16px',
          borderRadius: 16,
          background: t.bgCard,
          border: `1px solid ${t.border}`,
          animation: reducedMotion ? 'none' : 'bounceIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}>
          {/* Icon */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: 16,
            animation: reducedMotion ? 'none' : 'float 3s ease-in-out infinite',
          }}>
            <NeonIcon type="swords" size={48} color="violet" active />
          </div>

          {/* Domain label */}
          <p style={{
            fontFamily: t.mono,
            fontSize: 11,
            fontWeight: 700,
            color: t.cyan,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: 8,
          }}>
            {domainData?.name || 'Skill'} assessment
          </p>

          {/* Level title */}
          <h2 style={{
            fontFamily: t.display,
            fontSize: 28,
            fontWeight: 900,
            background: t.gradient,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: 8,
          }}>
            {levelLabel}
          </h2>

          {/* Description */}
          <p style={{
            fontFamily: t.body,
            fontSize: 14,
            color: t.textSecondary,
            lineHeight: 1.5,
            marginBottom: 16,
          }}>
            {levelDesc}
          </p>

          {/* Stat cards — 3 columns (prototype lines 896-909) */}
          <div style={{
            display: 'flex',
            gap: 12,
            justifyContent: 'center',
          }}>
            {mode === 'quiz' ? (
              <>
                {/* Trials */}
                <div style={{
                  background: t.bgElevated,
                  border: `1px solid ${t.border}`,
                  borderRadius: 12,
                  padding: '12px 18px',
                  textAlign: 'center',
                  minWidth: 72,
                }}>
                  <div style={{
                    fontFamily: t.mono, fontSize: 20, fontWeight: 700, color: t.cyan,
                  }}>
                    {answered.length}
                  </div>
                  <div style={{
                    fontSize: 10, color: t.textMuted, marginTop: 2, letterSpacing: '0.03em',
                  }}>
                    {tr('assessment.trials')}
                  </div>
                </div>
                {/* Correct */}
                <div style={{
                  background: t.bgElevated,
                  border: `1px solid ${t.border}`,
                  borderRadius: 12,
                  padding: '12px 18px',
                  textAlign: 'center',
                  minWidth: 72,
                }}>
                  <div style={{
                    fontFamily: t.mono, fontSize: 20, fontWeight: 700, color: t.violet,
                  }}>
                    {correctCount}/{answered.length}
                  </div>
                  <div style={{
                    fontSize: 10, color: t.textMuted, marginTop: 2, letterSpacing: '0.03em',
                  }}>
                    {tr('assessment.correct')}
                  </div>
                </div>
                {/* XP earned */}
                <div style={{
                  background: t.bgElevated,
                  border: `1px solid ${t.border}`,
                  borderRadius: 12,
                  padding: '12px 18px',
                  textAlign: 'center',
                  minWidth: 72,
                }}>
                  <div style={{
                    fontFamily: t.mono, fontSize: 20, fontWeight: 700, color: t.gold,
                  }}>
                    +{totalXpEarned}
                  </div>
                  <div style={{
                    fontSize: 10, color: t.textMuted, marginTop: 2, letterSpacing: '0.03em',
                  }}>
                    {tr('assessment.xp')}
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Self-assessment: Level + Method + XP */}
                <div style={{
                  background: t.bgElevated,
                  border: `1px solid ${t.border}`,
                  borderRadius: 12,
                  padding: '12px 18px',
                  textAlign: 'center',
                  minWidth: 72,
                }}>
                  <div style={{
                    fontFamily: t.mono, fontSize: 20, fontWeight: 700, color: t.violet,
                  }}>
                    {selfOption?.icon || '⚡'}
                  </div>
                  <div style={{
                    fontSize: 10, color: t.textMuted, marginTop: 2, letterSpacing: '0.03em',
                  }}>
                    {tr('assessment.level')}
                  </div>
                </div>
                <div style={{
                  background: t.bgElevated,
                  border: `1px solid ${t.border}`,
                  borderRadius: 12,
                  padding: '12px 18px',
                  textAlign: 'center',
                  minWidth: 72,
                }}>
                  <div style={{
                    fontFamily: t.mono, fontSize: 20, fontWeight: 700, color: t.cyan,
                  }}>
                    ✓
                  </div>
                  <div style={{
                    fontSize: 10, color: t.textMuted, marginTop: 2, letterSpacing: '0.03em',
                  }}>
                    {tr('assessment.self_rated')}
                  </div>
                </div>
                <div style={{
                  background: t.bgElevated,
                  border: `1px solid ${t.border}`,
                  borderRadius: 12,
                  padding: '12px 18px',
                  textAlign: 'center',
                  minWidth: 72,
                }}>
                  <div style={{
                    fontFamily: t.mono, fontSize: 20, fontWeight: 700, color: t.gold,
                  }}>
                    +{totalXpEarned}
                  </div>
                  <div style={{
                    fontSize: 10, color: t.textMuted, marginTop: 2, letterSpacing: '0.03em',
                  }}>
                    {tr('assessment.xp')}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </WizardShell>
    );
  }

  // ─── Self-Assessment Mode ───
  if (mode === 'self') {
    return (
      <WizardShell
        header={
          <>
            <StepBarV2 current={1} />
            <BackButton onClick={() => {
              if (discoveryPath === 'guided') router.push('/legend');
              else if (discoveryPath === 'direct') router.push('/goal/direct');
              else if (discoveryPath === 'career') router.push('/goal/career');
              else router.push('/intent');
            }} />
          </>
        }
      >
        <NPCBubble
          characterId="sage"
          message={tr('npc.assessment_self')}
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
          {tr('onboarding.gauge_mastery')}
        </h2>
        <p style={{
          fontFamily: t.body,
          fontSize: 13,
          color: t.textSecondary,
          marginBottom: 16,
        }}>
          {tr('onboarding.in_domain').replace('{domain}', domainData?.name || 'this realm')}
        </p>

        {/* 2×2 grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
          {SELF_ASSESSMENT_OPTIONS.map((opt, i) => {
            const isSelected = selfLevel === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => handleSelfAssessment(opt.id)}
                aria-label={`${tr(opt.labelKey, opt.label)}: ${tr(opt.descKey, opt.description)}`}
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
                  {tr(opt.labelKey, opt.label)}
                </span>
                <span style={{
                  fontFamily: t.body,
                  fontSize: 11,
                  color: t.textMuted,
                  lineHeight: 1.3,
                }}>
                  {tr(opt.descKey, opt.description)}
                </span>
              </button>
            );
          })}
        </div>
      </WizardShell>
    );
  }

  // ─── Loading Skeleton — AI questions in flight ───
  const isAiLoading = (generateQuestionsMutation.isPending || aiAssessmentStatus === 'loading') && !aiError && !aiQuestions;
  if (isAiLoading) {
    return (
      <WizardShell
        header={<StepBarV2 current={1} />}
      >
        <NPCLoadingMessages
          messages={ASSESSMENT_LOADING_MESSAGES}
          subtitle={tr('assessment.ai_generating_subtitle', 'Generating quick questions to gauge your level — this helps craft a precise roadmap')}
        />
      </WizardShell>
    );
  }

  // ─── Quiz Mode ───
  if (!currentQuestion) return null;

  const questionNum = answered.length + 1;
  const maxQuestions = Math.min(questionPool.filter((q) => q.domain === assessDomain).length, 5);

  return (
    <WizardShell
      header={
        <>
          <StepBarV2 current={1} />
          <BackButton onClick={() => {
            if (answered.length > 0) {
              setAnswered((prev) => prev.slice(0, -1));
            } else {
              if (discoveryPath === 'guided') router.push('/legend');
              else if (discoveryPath === 'direct') router.push('/goal/direct');
              else if (discoveryPath === 'career') router.push('/goal/career');
              else router.push('/intent');
            }
          }} />
        </>
      }
    >
      {/* XP Float */}
      <XPFloat amount={xpAmount} show={showXP} />

      <NPCBubble characterId="sage" message={npcMessage} emotion={npcEmotion} />

      <div style={{ height: 12 }} />

      {/* Progress */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16,
      }}>
        <span style={{
          fontFamily: t.mono,
          fontSize: 12,
          color: t.cyan,
          fontWeight: 700,
        }}>
          {questionNum}/{maxQuestions}
        </span>
        <div style={{
          flex: 1,
          height: 3,
          borderRadius: 2,
          background: t.border,
          overflow: 'hidden',
        }}>
          <div style={{
            width: '100%',
            height: '100%',
            borderRadius: 2,
            background: t.gradient,
            transform: `scaleX(${questionNum / maxQuestions})`,
            transformOrigin: 'left',
            transition: reducedMotion ? 'none' : 'transform 0.4s ease',
          }} />
        </div>
      </div>

      {/* Quiz — slide in each new question */}
      <div
        key={currentQuestion.id}
        style={{
          animation: reducedMotion ? 'none' : 'slideLeft 0.35s ease-out',
        }}
      >
        <QuizCardV2
          question={currentQuestion.question}
          options={currentQuestion.options}
          onAnswer={handleQuizAnswer}
          streak={currentStreak}
        />
      </div>
    </WizardShell>
  );
}
