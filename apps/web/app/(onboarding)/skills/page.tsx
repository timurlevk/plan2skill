'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useOnboardingStore } from '@plan2skill/store';
import { t, skillLevelRarity } from '../_components/tokens';
import { StepBar } from '../_components/StepBar';
import { ContinueButton, BackButton } from '../_components/ContinueButton';
import { XPFloat } from '../_components/XPFloat';
import { NeonIcon } from '../_components/NeonIcon';
import { NPCBubble } from '../_components/NPCBubble';
import { getQuestionsForGoal, scoreToLevel } from '../_data/skill-questions';
import { getScriptForGoal, getNPCReaction } from '../_data/npc-scripts';
import type { SkillLevel } from '@plan2skill/types';

// ═══════════════════════════════════════════
// SKILLS — NPC Conversation Quiz (Step 2/5)
// NPC intro → 2x2 visual cards → Duolingo feedback
// XP floats, progress dots, NPC reactions
// ═══════════════════════════════════════════

export default function SkillsPage() {
  const router = useRouter();
  const { selectedGoals, skillAssessments, setSkillAssessment, setSkillFreeText, characterId, addXP } = useOnboardingStore();

  // State
  const [goalIndex, setGoalIndex] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [currentAnswers, setCurrentAnswers] = useState<number[]>([]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showXP, setShowXP] = useState(false);
  const [xpAmount, setXpAmount] = useState(0);
  const [phase, setPhase] = useState<'npcIntro' | 'quiz' | 'npcReact' | 'goalSummary' | 'freeForm' | 'summary'>('npcIntro');
  const [npcMessage, setNpcMessage] = useState('');
  const [npcEmotion, setNpcEmotion] = useState<'neutral' | 'happy' | 'impressed' | 'thinking'>('neutral');
  const [hoveredOption, setHoveredOption] = useState<number | null>(null);
  const [feedbackColor, setFeedbackColor] = useState<string | null>(null);
  const [shakeOption, setShakeOption] = useState<number | null>(null);

  const currentGoal = selectedGoals[goalIndex];
  const questions = useMemo(
    () => currentGoal ? getQuestionsForGoal(currentGoal.id) : [],
    [currentGoal?.id]
  );
  const script = useMemo(
    () => currentGoal ? getScriptForGoal(currentGoal.id) : null,
    [currentGoal?.id]
  );
  const currentQuestion = questions[questionIndex];
  const npcCharId = 'sage';
  const [freeFormText, setFreeFormText] = useState('');

  // Show NPC intro on goal change
  useEffect(() => {
    if (script && phase === 'npcIntro') {
      setNpcMessage(script.intro);
      setNpcEmotion('happy');
      const timer = setTimeout(() => setPhase('quiz'), 2500);
      return () => clearTimeout(timer);
    }
  }, [goalIndex, phase === 'npcIntro']);

  const handleAnswer = (optIndex: number) => {
    if (selectedOption !== null || !currentQuestion || !currentGoal) return;
    setSelectedOption(optIndex);

    const option = currentQuestion.options[optIndex]!;
    const score = option.score;

    // Determine XP and feedback
    let xp: number;
    let color: string;
    if (score >= 2) {
      xp = 10;
      color = t.cyan;
    } else if (score >= 1) {
      xp = 5;
      color = t.gold;
    } else {
      xp = 2;
      color = 'transparent';
      setShakeOption(optIndex);
      setTimeout(() => setShakeOption(null), 400);
    }

    setXpAmount(xp);
    setShowXP(true);
    setFeedbackColor(color);
    addXP(xp);
    setTimeout(() => setShowXP(false), 1200);

    // Show NPC reaction
    if (script) {
      const reaction = getNPCReaction(script, questionIndex, score);
      setNpcMessage(reaction.message);
      setNpcEmotion(reaction.emotion);
    }

    setTimeout(() => {
      setPhase('npcReact');
    }, 600);

    setTimeout(() => {
      const newAnswers = [...currentAnswers, optIndex];
      setCurrentAnswers(newAnswers);
      setSelectedOption(null);
      setHoveredOption(null);
      setFeedbackColor(null);

      if (questionIndex + 1 >= questions.length) {
        // All questions for this goal answered
        const totalScore = newAnswers.reduce((sum, ansIdx, qIdx) => {
          return sum + (questions[qIdx]?.options[ansIdx]?.score ?? 0);
        }, 0);
        const level = scoreToLevel(totalScore);

        setSkillAssessment({
          goalId: currentGoal.id,
          level,
          answers: newAnswers,
        });

        // Go to free-form FIRST, then goalSummary
        setFreeFormText('');
        setPhase('freeForm');
      } else {
        setQuestionIndex(prev => prev + 1);
        setPhase('quiz');
      }
    }, 1800);
  };

  const advanceFromFreeForm = () => {
    // Save free text if provided
    if (freeFormText.trim() && currentGoal) {
      setSkillFreeText(currentGoal.id, freeFormText.trim());
    }
    // Now show the AI assessment result
    if (script) {
      const assessment = skillAssessments.find(a => a.goalId === currentGoal?.id);
      const level = assessment?.level ?? 'beginner';
      const summaryReaction = script.summary[level as string];
      if (summaryReaction) {
        setNpcMessage(summaryReaction.message);
        setNpcEmotion(summaryReaction.emotion);
      }
    }
    setPhase('goalSummary');
  };

  const advanceFromGoalSummary = () => {
    if (goalIndex + 1 < selectedGoals.length) {
      setGoalIndex(prev => prev + 1);
      setQuestionIndex(0);
      setCurrentAnswers([]);
      setPhase('npcIntro');
    } else {
      setPhase('summary');
    }
  };

  // ─── Final Summary ───
  if (phase === 'summary') {
    const totalXPGained = skillAssessments.length * 20; // approximate
    return (
      <div style={{ animation: 'fadeUp 0.6s ease-out' }}>
        <StepBar current={1} />

        <BackButton onClick={() => {
          setPhase('npcIntro');
          setGoalIndex(0);
          setQuestionIndex(0);
          setCurrentAnswers([]);
        }} />
        <div style={{ height: 16 }} />

        <NPCBubble
          characterId={npcCharId}
          message="Quest assessment complete! Here's your hero profile, adventurer."
          emotion="impressed"
        />

        <h1 style={{
          fontFamily: t.display,
          fontSize: 26,
          fontWeight: 800,
          color: t.text,
          marginBottom: 8,
          lineHeight: 1.2,
        }}>
          Your Quest Profile
        </h1>
        <p style={{
          fontFamily: t.body,
          fontSize: 14,
          color: t.textSecondary,
          marginBottom: 28,
          lineHeight: 1.5,
        }}>
          Skills assessed — your roadmap will be forged accordingly
        </p>

        {/* Per-goal stat bars */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          marginBottom: 32,
        }}>
          {selectedGoals.map((goal, i) => {
            const assessment = skillAssessments.find(a => a.goalId === goal.id);
            const level: SkillLevel = assessment?.level ?? 'beginner';
            const rarityInfo = skillLevelRarity[level];
            const barWidth =
              level === 'beginner' ? 15 :
              level === 'familiar' ? 40 :
              level === 'intermediate' ? 70 : 95;

            return (
              <div key={goal.id} style={{
                background: t.bgCard,
                borderRadius: 14,
                padding: '16px 18px',
                border: `1px solid ${t.border}`,
                animation: `fadeUp 0.5s ease-out ${i * 0.1}s both`,
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 10,
                }}>
                  <span style={{
                    fontFamily: t.display,
                    fontSize: 14,
                    fontWeight: 700,
                    color: t.text,
                  }}>
                    {goal.label}
                  </span>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    fontFamily: t.mono,
                    fontSize: 11,
                    fontWeight: 700,
                    color: rarityInfo.color,
                    background: `${rarityInfo.color}12`,
                    padding: '3px 8px',
                    borderRadius: 8,
                    animation: 'bounceIn 0.5s ease-out',
                  }}>
                    {rarityInfo.icon} {level.charAt(0).toUpperCase() + level.slice(1)}
                  </span>
                </div>
                <div style={{
                  height: 6,
                  borderRadius: 3,
                  background: '#252530',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    width: `${barWidth}%`,
                    height: '100%',
                    borderRadius: 3,
                    background: `linear-gradient(90deg, ${rarityInfo.color}, ${t.cyan})`,
                    transition: 'width 1s ease-out',
                  }} />
                </div>
              </div>
            );
          })}
        </div>

        <ContinueButton onClick={() => router.push('/archetype')} />
      </div>
    );
  }

  // ─── Goal Summary Phase ───
  if (phase === 'goalSummary') {
    const assessment = skillAssessments.find(a => a.goalId === currentGoal?.id);
    const level: SkillLevel = assessment?.level ?? 'beginner';
    const rarityInfo = skillLevelRarity[level];

    return (
      <div style={{ animation: 'slideLeft 0.5s ease-out' }}>
        <StepBar current={1} />

        <NPCBubble characterId={npcCharId} message={npcMessage} emotion={npcEmotion} />

        <div style={{
          textAlign: 'center',
          padding: '24px 0',
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 20px',
            borderRadius: 16,
            background: `${rarityInfo.color}12`,
            border: `2px solid ${rarityInfo.color}40`,
            marginBottom: 16,
            animation: 'bounceIn 0.6s ease-out',
          }}>
            <span style={{ fontSize: 18, color: rarityInfo.color }}>{rarityInfo.icon}</span>
            <span style={{
              fontFamily: t.display,
              fontSize: 18,
              fontWeight: 800,
              color: rarityInfo.color,
            }}>
              {level.charAt(0).toUpperCase() + level.slice(1)}
            </span>
          </div>

          <p style={{
            fontFamily: t.body,
            fontSize: 14,
            color: t.textSecondary,
            marginBottom: 24,
          }}>
            {currentGoal?.label} — level assessed!
          </p>

          <ContinueButton onClick={advanceFromGoalSummary}>
            {goalIndex + 1 < selectedGoals.length ? 'Next Quest' : 'View Quest Profile'}
          </ContinueButton>
        </div>
      </div>
    );
  }

  // ─── Free-Form Phase ───
  if (phase === 'freeForm') {
    return (
      <div style={{ animation: 'slideLeft 0.5s ease-out' }}>
        <StepBar current={1} />

        <NPCBubble
          characterId={npcCharId}
          message={`Tell me more about your experience with ${currentGoal?.label ?? 'this quest'}. Any projects, courses, or hands-on work?`}
          emotion="thinking"
        />

        <div style={{
          background: t.bgCard,
          borderRadius: 16,
          padding: '18px',
          border: `1px solid ${t.border}`,
          marginBottom: 24,
        }}>
          <div style={{ position: 'relative' }}>
            <textarea
              value={freeFormText}
              onChange={(e) => {
                if (e.target.value.length <= 500) setFreeFormText(e.target.value);
              }}
              placeholder="e.g. I've built a few React apps, done a Udemy course on Node.js, worked with REST APIs at my job..."
              rows={5}
              style={{
                width: '100%',
                padding: '12px 40px 12px 14px',
                borderRadius: 12,
                border: `1px solid ${t.border}`,
                background: t.bgElevated,
                color: t.text,
                fontFamily: t.body,
                fontSize: 14,
                outline: 'none',
                resize: 'none',
                boxSizing: 'border-box',
                lineHeight: 1.5,
                transition: 'border-color 0.2s ease',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = t.violet; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = t.border; }}
            />
            <button
              onClick={() => alert('Voice input — coming soon!')}
              style={{
                position: 'absolute',
                right: 10,
                top: 12,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 2,
              }}
              title="Voice input — coming soon"
              aria-label="Voice input (coming soon)"
            >
              <NeonIcon type="mic" size={18} color="muted" />
            </button>
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            marginTop: 6,
          }}>
            <span style={{
              fontFamily: t.mono,
              fontSize: 11,
              color: freeFormText.length >= 450 ? t.rose : t.textMuted,
            }}>
              {freeFormText.length}/500
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={advanceFromFreeForm}
            style={{
              flex: 1,
              padding: '14px 0',
              borderRadius: 14,
              border: `1px solid ${t.border}`,
              background: 'transparent',
              color: t.textSecondary,
              fontFamily: t.display,
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Skip
          </button>
          <ContinueButton
            onClick={advanceFromFreeForm}
            style={{ flex: 2 }}
          >
            Continue
          </ContinueButton>
        </div>
      </div>
    );
  }

  // ─── NPC Intro ───
  if (phase === 'npcIntro') {
    return (
      <div style={{ animation: 'slideLeft 0.5s ease-out' }} key={`intro-${goalIndex}`}>
        <StepBar current={1} />

        <BackButton onClick={() => {
          if (goalIndex > 0) {
            setGoalIndex(prev => prev - 1);
            setQuestionIndex(0);
            setCurrentAnswers([]);
            setPhase('npcIntro');
          } else {
            router.push('/goals');
          }
        }} />
        <div style={{ height: 16 }} />

        {/* Goal badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 20,
        }}>
          <span style={{
            fontFamily: t.mono,
            fontSize: 12,
            color: t.cyan,
            fontWeight: 700,
          }}>
            Quest {goalIndex + 1}/{selectedGoals.length}
          </span>
          <span style={{
            fontFamily: t.body,
            fontSize: 13,
            color: t.textSecondary,
            fontWeight: 600,
          }}>
            {currentGoal?.label}
          </span>
        </div>

        <NPCBubble characterId={npcCharId} message={npcMessage} emotion={npcEmotion} />

        <div style={{ height: 32 }} />

        <ContinueButton onClick={() => setPhase('quiz')}>
          Let&apos;s go!
        </ContinueButton>
      </div>
    );
  }

  // ─── NPC React (brief) ───
  if (phase === 'npcReact') {
    return (
      <div style={{ animation: 'fadeUp 0.3s ease-out' }} key={`react-${goalIndex}-${questionIndex}`}>
        <StepBar current={1} />

        {/* Progress dots */}
        <div style={{
          display: 'flex',
          gap: 6,
          justifyContent: 'center',
          marginBottom: 20,
        }}>
          {questions.map((_, i) => (
            <div key={i} style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: i <= questionIndex ? t.cyan : '#252530',
              transition: 'background 0.3s ease',
            }} />
          ))}
        </div>

        <NPCBubble characterId={npcCharId} message={npcMessage} emotion={npcEmotion} />
      </div>
    );
  }

  // ─── Quiz Phase ───
  if (!currentGoal || !currentQuestion) return null;

  return (
    <div style={{ animation: 'fadeUp 0.4s ease-out' }} key={`${goalIndex}-${questionIndex}`}>
      <StepBar current={1} />

      <BackButton onClick={() => {
        if (questionIndex > 0) {
          setQuestionIndex(prev => prev - 1);
          setCurrentAnswers(prev => prev.slice(0, -1));
        } else if (goalIndex > 0) {
          setGoalIndex(prev => prev - 1);
          const prevGoal = selectedGoals[goalIndex - 1]!;
          const prevQs = getQuestionsForGoal(prevGoal.id);
          setQuestionIndex(prevQs.length - 1);
          setCurrentAnswers([]);
        } else {
          router.push('/goals');
        }
      }} />
      <div style={{ height: 12 }} />

      {/* Progress dots (Duolingo-style) */}
      <div style={{
        display: 'flex',
        gap: 6,
        justifyContent: 'center',
        marginBottom: 16,
      }}>
        {questions.map((_, i) => (
          <div key={i} style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: i < questionIndex ? t.cyan : i === questionIndex ? t.violet : '#252530',
            transition: 'background 0.3s ease',
            boxShadow: i === questionIndex ? `0 0 6px ${t.violet}60` : 'none',
          }} />
        ))}
      </div>

      {/* Goal context */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        marginBottom: 8,
      }}>
        <span style={{
          fontFamily: t.mono,
          fontSize: 11,
          color: t.cyan,
          fontWeight: 700,
        }}>
          Quest {goalIndex + 1}/{selectedGoals.length}
        </span>
        <span style={{
          fontFamily: t.body,
          fontSize: 12,
          color: t.textMuted,
        }}>
          {currentGoal.label}
        </span>
      </div>

      {/* NPC asks question */}
      <NPCBubble
        characterId={npcCharId}
        message={currentQuestion.question}
        emotion="thinking"
      />

      {/* 2x2 Visual Card Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 10,
        marginBottom: 24,
        position: 'relative',
      }}>
        <XPFloat amount={xpAmount} show={showXP} />
        {currentQuestion.options.map((opt, i) => {
          const isSelected = selectedOption === i;
          const isHovered = hoveredOption === i;
          const isShaking = shakeOption === i;
          const showFeedback = isSelected && feedbackColor;

          return (
            <button
              key={i}
              onClick={() => handleAnswer(i)}
              onMouseEnter={() => setHoveredOption(i)}
              onMouseLeave={() => setHoveredOption(null)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '16px 10px',
                borderRadius: 16,
                border: `2px solid ${
                  showFeedback ? feedbackColor
                  : isSelected ? t.violet
                  : isHovered ? t.borderHover
                  : t.border
                }`,
                background: isSelected
                  ? showFeedback ? `${feedbackColor}12` : 'rgba(157,122,255,0.12)'
                  : isHovered ? 'rgba(255,255,255,0.02)' : t.bgCard,
                cursor: selectedOption === null ? 'pointer' : 'default',
                textAlign: 'center',
                transition: 'all 0.25s ease',
                animation: isShaking
                  ? 'none'
                  : isSelected ? 'bounceIn 0.3s ease-out' : `fadeUp 0.3s ease-out ${i * 0.05}s both`,
                transform: isShaking
                  ? `translateX(${Math.sin(Date.now() / 50) * 4}px)`
                  : 'none',
                boxShadow: showFeedback ? `0 0 16px ${feedbackColor}30` : 'none',
                minHeight: 100,
              }}
            >
              <NeonIcon
                type={opt.iconType}
                size={28}
                color={isSelected ? (feedbackColor === t.cyan ? 'cyan' : feedbackColor === t.gold ? 'gold' : 'violet') : 'secondary'}
                active={isSelected}
              />
              <span style={{
                fontFamily: t.body,
                fontSize: 12,
                fontWeight: 600,
                color: isSelected ? t.text : '#D4D4D8',
                lineHeight: 1.3,
              }}>
                {opt.shortLabel}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
