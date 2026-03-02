'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useOnboardingV2Store } from '@plan2skill/store';
import { t } from '../_components/tokens';
import { StepBarV2 } from '../_components/StepBarV2';
import { BackButton, ContinueButton } from '../_components/ContinueButton';
import { NPCBubble } from '../_components/NPCBubble';
import { QuizCardV2 } from '../_components/QuizCardV2';
import { XPFloat } from '../_components/XPFloat';
import { NeonIcon } from '../_components/NeonIcon';
import { WizardShell } from '../_components/WizardShell';
import {
  getNextQuestion, shouldStopAssessment,
  computeLevel as computeAssessmentLevel,
  SELF_ASSESSMENT_OPTIONS, QUESTIONS,
} from '../_data/assessment-questions';
import { DOMAINS } from '../_data/domains';
import type { SkillAssessmentV2 } from '@plan2skill/types';

// ═══════════════════════════════════════════
// ASSESSMENT — Step 3: Adaptive 2-5 questions
// A/B/C quiz cards with NPC reactions
// Self-assessment fallback for domains without questions
// ═══════════════════════════════════════════

export default function AssessmentPage() {
  const router = useRouter();
  const {
    selectedDomain, intent, discoveryPath,
    setAssessment, addXP,
  } = useOnboardingV2Store();

  // Determine which domain to assess
  const assessDomain = useMemo(() => {
    if (selectedDomain) return selectedDomain;
    if (discoveryPath === 'direct') return 'tech'; // default for direct path
    return 'tech';
  }, [selectedDomain, discoveryPath]);

  // Check if we have questions for this domain
  const hasQuestions = useMemo(() => {
    return QUESTIONS.some((q) => q.domain === assessDomain);
  }, [assessDomain]);

  const [mode, setMode] = useState<'quiz' | 'self'>(!hasQuestions ? 'self' : 'quiz');
  const [answered, setAnswered] = useState<{ questionId: string; correct: boolean }[]>([]);
  const [npcMessage, setNpcMessage] = useState(
    'Time to gauge your power level, hero! Don\'t worry — there are no wrong answers, only XP to gain.'
  );
  const [npcEmotion, setNpcEmotion] = useState<'neutral' | 'happy' | 'impressed' | 'thinking'>('happy');
  const [showXP, setShowXP] = useState(false);
  const [xpAmount, setXpAmount] = useState(0);
  const [complete, setComplete] = useState(false);
  const [selfLevel, setSelfLevel] = useState<string | null>(null);

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
    return getNextQuestion(assessDomain, answered);
  }, [assessDomain, answered, mode, complete]);

  // Calculate current streak (consecutive correct from the end)
  const currentStreak = useMemo(() => {
    let streak = 0;
    for (let i = answered.length - 1; i >= 0; i--) {
      if (answered[i].correct) streak++;
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
      setNpcMessage(q.npcReaction.correct);
      setNpcEmotion(q.npcReaction.correctEmotion);
      setXpAmount(5);
      setShowXP(true);
      addXP(5);
      setTimeout(() => setShowXP(false), 1200);
    } else {
      setNpcMessage(q.npcReaction.wrong);
      setNpcEmotion(q.npcReaction.wrongEmotion);
    }

    // Check if we should stop
    if (shouldStopAssessment(newAnswered) || !getNextQuestion(assessDomain, newAnswered)) {
      setTimeout(() => {
        setComplete(true);
        setNpcMessage('Assessment complete! I\'ve measured your abilities.');
        setNpcEmotion('impressed');
        const level = computeAssessmentLevel(newAnswered);
        const assessment: SkillAssessmentV2 = {
          domain: assessDomain,
          level,
          method: 'quiz',
          score: newAnswered.filter((a) => a.correct).length,
          confidence: 0.8,
        };
        setAssessment(assessment);
        addXP(5); // completion bonus
      }, 1000);
    }
  }, [currentQuestion, answered, assessDomain, addXP, setAssessment]);

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
    addXP(5);
    setComplete(true);
    setNpcMessage('Self-assessment noted! Every hero knows their starting point.');
    setNpcEmotion('happy');
  };

  const domainData = DOMAINS.find((d) => d.id === assessDomain);

  // ─── Complete State ───
  if (complete) {
    const level = selfLevel
      ? SELF_ASSESSMENT_OPTIONS.find((o) => o.id === selfLevel)?.level || 'beginner'
      : computeAssessmentLevel(answered);
    const levelLabel = level.charAt(0).toUpperCase() + level.slice(1);

    return (
      <WizardShell
        header={<StepBarV2 current={2} />}
        footer={
          <ContinueButton onClick={() => router.push('/character')}>
            Continue to Hero Selection
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
          animation: reducedMotion ? 'none' : 'bounceIn 0.6s ease-out',
        }}>
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

          <h2 style={{
            fontFamily: t.display,
            fontSize: 28,
            fontWeight: 900,
            background: t.gradient,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: 4,
          }}>
            {levelLabel}
          </h2>

          {mode === 'quiz' && (
            <p style={{
              fontFamily: t.body,
              fontSize: 13,
              color: t.textSecondary,
            }}>
              {answered.filter((a) => a.correct).length}/{answered.length} correct
            </p>
          )}
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
            <StepBarV2 current={2} />
            <BackButton onClick={() => {
              if (discoveryPath === 'direct') router.push('/goal/direct');
              else if (discoveryPath === 'guided') router.push('/goal/guided');
              else if (discoveryPath === 'career') router.push('/goal/career');
              else router.push('/intent');
            }} />
          </>
        }
      >
        <NPCBubble
          characterId="sage"
          message="How would you describe your experience with this realm?"
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
          Rate your experience
        </h2>
        <p style={{
          fontFamily: t.body,
          fontSize: 13,
          color: t.textSecondary,
          marginBottom: 16,
        }}>
          in {domainData?.name || 'this realm'}
        </p>

        {/* 2×2 grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
          {SELF_ASSESSMENT_OPTIONS.map((opt, i) => {
            const isSelected = selfLevel === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => handleSelfAssessment(opt.id)}
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
                  transition: 'all 0.2s ease',
                  animation: `fadeUp 0.35s ease-out ${i * 0.06}s both`,
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

  // ─── Quiz Mode ───
  if (!currentQuestion) return null;

  const questionNum = answered.length + 1;
  const maxQuestions = Math.min(QUESTIONS.filter((q) => q.domain === assessDomain).length, 5);

  return (
    <WizardShell
      header={
        <>
          <StepBarV2 current={2} />
          <BackButton onClick={() => {
            if (answered.length > 0) {
              setAnswered((prev) => prev.slice(0, -1));
            } else {
              if (discoveryPath === 'direct') router.push('/goal/direct');
              else if (discoveryPath === 'guided') router.push('/goal/guided');
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
            width: `${(questionNum / maxQuestions) * 100}%`,
            height: '100%',
            borderRadius: 2,
            background: t.gradient,
            transition: 'width 0.4s ease',
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
