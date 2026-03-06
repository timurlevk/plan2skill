'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSkillStore, useOnboardingV2Store, useI18nStore } from '@plan2skill/store';
import type { AssessmentQuestion, AssessmentResult } from '@plan2skill/store';
import { trpc } from '@plan2skill/api-client';
import { t } from '../../../(onboarding)/_components/tokens';
import { NeonIcon } from '../../../(onboarding)/_components/NeonIcon';

// ═══════════════════════════════════════════
// SKILL ASSESSMENT — AI-powered adaptive quiz
// Phase W2: Wires assessment.generate + assessment.submit
// Flow: Setup → Generate → Quiz → Results
// ═══════════════════════════════════════════

type Phase = 'setup' | 'generating' | 'quiz' | 'submitting' | 'results';

const EXPERIENCE_LEVELS = [
  { value: 'beginner',     label: 'Beginner',     desc: 'Just starting out', color: '#71717A' },
  { value: 'intermediate', label: 'Intermediate',  desc: 'Some experience',   color: '#6EE7B7' },
  { value: 'advanced',     label: 'Advanced',      desc: 'Solid foundation',  color: '#3B82F6' },
  { value: 'expert',       label: 'Expert',        desc: 'Deep expertise',    color: '#9D7AFF' },
] as const;

const QUESTION_COUNTS = [3, 5, 7, 10] as const;

export default function AssessmentPage() {
  const tr = useI18nStore((s) => s.t);
  const router = useRouter();
  const { assessments } = useOnboardingV2Store();
  const { setAssessment, setLastResult, updateSkillElo, clearAssessment } = useSkillStore();

  // ─── Setup state ───
  const [skillDomain, setSkillDomain] = useState('');
  const [experienceLevel, setExperienceLevel] = useState<string>('intermediate');
  const [goal, setGoal] = useState('');
  const [questionCount, setQuestionCount] = useState<number>(5);

  // ─── Quiz state ───
  const [phase, setPhase] = useState<Phase>('setup');
  const [questions, setQuestions] = useState<AssessmentQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Map<number, number>>(new Map());
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ─── Known skill domains from onboarding ───
  const knownDomains = useMemo(() => {
    return assessments?.map((a) => a.domain).filter(Boolean) ?? [];
  }, [assessments]);

  // ─── tRPC mutations ───
  const generateMutation = trpc.assessment.generate.useMutation();
  const submitMutation = trpc.assessment.submit.useMutation();

  // ─── Generate assessment ───
  const handleGenerate = useCallback(() => {
    if (!skillDomain.trim()) return;
    setError(null);
    setPhase('generating');

    generateMutation.mutate(
      {
        skillDomain: skillDomain.trim(),
        experienceLevel: experienceLevel as 'beginner' | 'intermediate' | 'advanced' | 'expert',
        goal: goal.trim() || `Assess my ${skillDomain} skills`,
        questionCount,
      },
      {
        onSuccess: (data) => {
          const qs = data.questions as AssessmentQuestion[];
          setQuestions(qs);
          setAssessment(data.skillDomain, qs, data.targetBloomLevel);
          setCurrentIdx(0);
          setAnswers(new Map());
          setSelectedOption(null);
          setShowExplanation(false);
          setPhase('quiz');
        },
        onError: (err) => {
          setError(err.message || 'Failed to generate assessment. Try again.');
          setPhase('setup');
        },
      },
    );
  }, [skillDomain, experienceLevel, goal, questionCount, generateMutation, setAssessment]);

  // ─── Answer question ───
  const handleSelectAnswer = useCallback((optIdx: number) => {
    if (showExplanation) return;
    setSelectedOption(optIdx);
    setShowExplanation(true);
    setAnswers((prev) => {
      const next = new Map(prev);
      next.set(currentIdx, optIdx);
      return next;
    });
  }, [currentIdx, showExplanation]);

  // ─── Next question or submit ───
  const handleNext = useCallback(() => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx((i) => i + 1);
      setSelectedOption(null);
      setShowExplanation(false);
    } else {
      // All questions answered — submit
      setPhase('submitting');
      const answerArray = Array.from(answers.entries()).map(([qi, si]) => ({
        questionIndex: qi,
        selectedIndex: si,
      }));

      submitMutation.mutate(
        {
          skillDomain: skillDomain.trim(),
          questions: questions.map((q) => ({
            question: q.question,
            options: q.options,
            correctIndex: q.correctIndex,
            explanation: q.explanation,
            bloomLevel: q.bloomLevel,
            skillDomain: q.skillDomain,
            difficultyElo: q.difficultyElo,
            distractorTypes: q.distractorTypes,
          })),
          answers: answerArray,
        },
        {
          onSuccess: (data) => {
            const r = data as AssessmentResult;
            setResult(r);
            setLastResult(r);
            updateSkillElo(r.skillDomain, r.initialElo);
            setPhase('results');
          },
          onError: (err) => {
            setError(err.message || 'Failed to submit assessment.');
            setPhase('quiz');
          },
        },
      );
    }
  }, [currentIdx, questions, answers, skillDomain, submitMutation, setLastResult, updateSkillElo]);

  // ─── Restart ───
  const handleRestart = useCallback(() => {
    clearAssessment();
    setPhase('setup');
    setQuestions([]);
    setAnswers(new Map());
    setResult(null);
    setError(null);
    setSelectedOption(null);
    setShowExplanation(false);
    setCurrentIdx(0);
  }, [clearAssessment]);

  const currentQ = questions[currentIdx];

  return (
    <div style={{ animation: 'fadeUp 0.4s ease-out', maxWidth: 640, margin: '0 auto' }}>
      {/* Back button */}
      <button
        onClick={() => router.push('/skills')}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'none', border: 'none',
          fontFamily: t.body, fontSize: 13, color: t.textSecondary,
          cursor: 'pointer', marginBottom: 20, padding: 0,
        }}
      >
        <NeonIcon type="compass" size={14} color="muted" />
        Back to Skills
      </button>

      {/* ═══ SETUP PHASE ═══ */}
      {phase === 'setup' && (
        <div style={{ animation: 'fadeUp 0.3s ease-out' }}>
          <h1 style={{
            fontFamily: t.display, fontSize: 24, fontWeight: 900,
            color: t.text, marginBottom: 6,
          }}>
            {tr('dashboard.assessment_title', 'Skill Assessment')}
          </h1>
          <p style={{
            fontFamily: t.body, fontSize: 13, color: t.textSecondary,
            marginBottom: 28,
          }}>
            {tr('dashboard.assessment_desc', 'AI generates adaptive questions to evaluate your skill level and calculate your Elo rating.')}
          </p>

          {error && (
            <div style={{
              padding: '12px 16px', borderRadius: 10, marginBottom: 16,
              background: `${t.rose}12`, border: `1px solid ${t.rose}25`,
              fontFamily: t.body, fontSize: 13, color: t.rose,
            }}>
              {error}
            </div>
          )}

          {/* Skill Domain */}
          <label style={{
            display: 'block', marginBottom: 16,
          }}>
            <span style={{
              fontFamily: t.display, fontSize: 12, fontWeight: 700,
              color: t.textSecondary, textTransform: 'uppercase' as const,
              letterSpacing: '0.06em', display: 'block', marginBottom: 6,
            }}>
              {tr('dashboard.skill_domain', 'Skill Domain')}
            </span>
            <input
              type="text"
              value={skillDomain}
              onChange={(e) => setSkillDomain(e.target.value)}
              placeholder="e.g. React, Python, Machine Learning..."
              style={{
                width: '100%', padding: '12px 14px', borderRadius: 10,
                background: t.bgCard, border: `1px solid ${t.border}`,
                fontFamily: t.body, fontSize: 14, color: t.text,
                outline: 'none', transition: 'border-color 0.2s',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = t.violet)}
              onBlur={(e) => (e.currentTarget.style.borderColor = t.border)}
            />
            {knownDomains.length > 0 && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                {knownDomains.map((d) => (
                  <button
                    key={d}
                    onClick={() => setSkillDomain(d)}
                    style={{
                      padding: '4px 10px', borderRadius: 8,
                      background: skillDomain === d ? `${t.violet}20` : t.bgCard,
                      border: `1px solid ${skillDomain === d ? t.violet : t.border}`,
                      fontFamily: t.mono, fontSize: 11, fontWeight: 600,
                      color: skillDomain === d ? t.violet : t.textSecondary,
                      cursor: 'pointer',
                    }}
                  >
                    {d}
                  </button>
                ))}
              </div>
            )}
          </label>

          {/* Experience Level */}
          <div style={{ marginBottom: 16 }}>
            <span style={{
              fontFamily: t.display, fontSize: 12, fontWeight: 700,
              color: t.textSecondary, textTransform: 'uppercase' as const,
              letterSpacing: '0.06em', display: 'block', marginBottom: 6,
            }}>
              {tr('dashboard.exp_level', 'Experience Level')}
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
              {EXPERIENCE_LEVELS.map((lvl) => (
                <button
                  key={lvl.value}
                  onClick={() => setExperienceLevel(lvl.value)}
                  style={{
                    padding: '10px 12px', borderRadius: 10,
                    background: experienceLevel === lvl.value ? `${lvl.color}15` : t.bgCard,
                    border: `1px solid ${experienceLevel === lvl.value ? lvl.color : t.border}`,
                    cursor: 'pointer', textAlign: 'left',
                    transition: 'border-color 0.15s',
                  }}
                >
                  <div style={{
                    fontFamily: t.body, fontSize: 13, fontWeight: 600,
                    color: experienceLevel === lvl.value ? lvl.color : t.text,
                  }}>
                    {lvl.label}
                  </div>
                  <div style={{
                    fontFamily: t.body, fontSize: 11, color: t.textMuted, marginTop: 2,
                  }}>
                    {lvl.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Goal (optional) */}
          <label style={{ display: 'block', marginBottom: 16 }}>
            <span style={{
              fontFamily: t.display, fontSize: 12, fontWeight: 700,
              color: t.textSecondary, textTransform: 'uppercase' as const,
              letterSpacing: '0.06em', display: 'block', marginBottom: 6,
            }}>
              {tr('dashboard.goal_optional', 'Goal (optional)')}
            </span>
            <input
              type="text"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="e.g. Build production-ready APIs"
              style={{
                width: '100%', padding: '12px 14px', borderRadius: 10,
                background: t.bgCard, border: `1px solid ${t.border}`,
                fontFamily: t.body, fontSize: 14, color: t.text,
                outline: 'none', transition: 'border-color 0.2s',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = t.violet)}
              onBlur={(e) => (e.currentTarget.style.borderColor = t.border)}
            />
          </label>

          {/* Question Count */}
          <div style={{ marginBottom: 28 }}>
            <span style={{
              fontFamily: t.display, fontSize: 12, fontWeight: 700,
              color: t.textSecondary, textTransform: 'uppercase' as const,
              letterSpacing: '0.06em', display: 'block', marginBottom: 6,
            }}>
              {tr('dashboard.questions', 'Questions')}
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              {QUESTION_COUNTS.map((n) => (
                <button
                  key={n}
                  onClick={() => setQuestionCount(n)}
                  style={{
                    padding: '8px 16px', borderRadius: 8,
                    background: questionCount === n ? `${t.violet}20` : t.bgCard,
                    border: `1px solid ${questionCount === n ? t.violet : t.border}`,
                    fontFamily: t.mono, fontSize: 13, fontWeight: 700,
                    color: questionCount === n ? t.violet : t.textSecondary,
                    cursor: 'pointer',
                  }}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={!skillDomain.trim()}
            style={{
              width: '100%', padding: '14px 24px', borderRadius: 12,
              background: skillDomain.trim() ? t.gradient : t.border,
              border: 'none',
              fontFamily: t.body, fontSize: 15, fontWeight: 700, color: '#FFF',
              cursor: skillDomain.trim() ? 'pointer' : 'not-allowed',
              opacity: skillDomain.trim() ? 1 : 0.5,
              transition: 'transform 0.15s ease',
            }}
          >
            {tr('dashboard.generate', 'Generate Assessment')}
          </button>
        </div>
      )}

      {/* ═══ GENERATING PHASE ═══ */}
      {phase === 'generating' && (
        <div style={{
          padding: '64px 24px', textAlign: 'center',
          animation: 'fadeUp 0.3s ease-out',
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: '50%',
            border: `3px solid ${t.border}`, borderTopColor: t.violet,
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 20px',
          }} />
          <h2 style={{
            fontFamily: t.display, fontSize: 18, fontWeight: 700,
            color: t.text, marginBottom: 8,
          }}>
            {tr('dashboard.generating', 'Generating Assessment')}
          </h2>
          <p style={{
            fontFamily: t.body, fontSize: 13, color: t.textSecondary,
          }}>
            {tr('dashboard.ai_crafting', 'AI is crafting {n} questions...').replace('{n}', String(questionCount))}
          </p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* ═══ QUIZ PHASE ═══ */}
      {phase === 'quiz' && currentQ && (
        <div style={{ animation: 'fadeUp 0.3s ease-out' }}>
          {/* Progress bar */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20,
          }}>
            <div style={{
              flex: 1, height: 4, borderRadius: 2,
              background: t.border, overflow: 'hidden',
            }}>
              <div style={{
                width: `${((currentIdx + (showExplanation ? 1 : 0)) / questions.length) * 100}%`,
                height: '100%', borderRadius: 2,
                background: t.gradient,
                transition: 'width 0.4s ease-out',
              }} />
            </div>
            <span style={{
              fontFamily: t.mono, fontSize: 12, fontWeight: 700, color: t.textSecondary,
            }}>
              {currentIdx + 1}/{questions.length}
            </span>
          </div>

          {/* Bloom level badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '3px 10px', borderRadius: 8, marginBottom: 12,
            background: `${t.cyan}12`, border: `1px solid ${t.cyan}20`,
          }}>
            <span style={{
              fontFamily: t.mono, fontSize: 10, fontWeight: 600, color: t.cyan,
              textTransform: 'capitalize' as const,
            }}>
              {currentQ.bloomLevel}
            </span>
            <span style={{
              fontFamily: t.mono, fontSize: 10, color: t.textMuted,
            }}>
              Elo {currentQ.difficultyElo}
            </span>
          </div>

          {/* Question */}
          <h2 style={{
            fontFamily: t.display, fontSize: 18, fontWeight: 700,
            color: t.text, marginBottom: 20, lineHeight: 1.4,
          }}>
            {currentQ.question}
          </h2>

          {error && (
            <div style={{
              padding: '10px 14px', borderRadius: 8, marginBottom: 12,
              background: `${t.rose}12`, border: `1px solid ${t.rose}25`,
              fontFamily: t.body, fontSize: 12, color: t.rose,
            }}>
              {error}
            </div>
          )}

          {/* Options */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
            {currentQ.options.map((opt, i) => {
              const isSelected = selectedOption === i;
              const isCorrect = i === currentQ.correctIndex;
              const answered = showExplanation;

              let borderColor: string = t.border;
              let bgColor: string = t.bgCard;
              if (answered && isCorrect) {
                borderColor = t.cyan;
                bgColor = `${t.cyan}12`;
              } else if (answered && isSelected && !isCorrect) {
                borderColor = t.rose;
                bgColor = `${t.rose}12`;
              } else if (isSelected) {
                borderColor = t.violet;
                bgColor = `${t.violet}12`;
              }

              return (
                <button
                  key={i}
                  onClick={() => handleSelectAnswer(i)}
                  disabled={answered}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: 12,
                    padding: '14px 16px', borderRadius: 12,
                    background: bgColor, border: `1.5px solid ${borderColor}`,
                    cursor: answered ? 'default' : 'pointer',
                    textAlign: 'left',
                    transition: 'border-color 0.15s, background 0.15s',
                  }}
                >
                  <span style={{
                    fontFamily: t.mono, fontSize: 12, fontWeight: 700,
                    color: answered && isCorrect ? t.cyan : answered && isSelected ? t.rose : t.textMuted,
                    minWidth: 20,
                  }}>
                    {String.fromCharCode(65 + i)}.
                  </span>
                  <span style={{
                    fontFamily: t.body, fontSize: 14, color: t.text, lineHeight: 1.4,
                  }}>
                    {opt}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Explanation */}
          {showExplanation && (
            <div style={{
              padding: '14px 16px', borderRadius: 12, marginBottom: 20,
              background: `${t.indigo}08`, border: `1px solid ${t.indigo}20`,
              animation: 'fadeUp 0.25s ease-out',
            }}>
              <div style={{
                fontFamily: t.display, fontSize: 11, fontWeight: 700,
                color: t.indigo, textTransform: 'uppercase' as const,
                letterSpacing: '0.06em', marginBottom: 6,
              }}>
                {tr('dashboard.explanation', 'Explanation')}
              </div>
              <p style={{
                fontFamily: t.body, fontSize: 13, color: t.textSecondary, lineHeight: 1.5,
                margin: 0,
              }}>
                {currentQ.explanation}
              </p>
            </div>
          )}

          {/* Next / Submit button */}
          {showExplanation && (
            <button
              onClick={handleNext}
              style={{
                width: '100%', padding: '14px 24px', borderRadius: 12,
                background: t.gradient, border: 'none',
                fontFamily: t.body, fontSize: 15, fontWeight: 700, color: '#FFF',
                cursor: 'pointer',
              }}
            >
              {currentIdx < questions.length - 1 ? tr('dashboard.next_question', 'Next Question') : tr('dashboard.submit_assessment', 'Submit Assessment')}
            </button>
          )}
        </div>
      )}

      {/* ═══ SUBMITTING PHASE ═══ */}
      {phase === 'submitting' && (
        <div style={{
          padding: '64px 24px', textAlign: 'center',
          animation: 'fadeUp 0.3s ease-out',
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: '50%',
            border: `3px solid ${t.border}`, borderTopColor: t.cyan,
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 20px',
          }} />
          <h2 style={{
            fontFamily: t.display, fontSize: 18, fontWeight: 700,
            color: t.text, marginBottom: 8,
          }}>
            {tr('dashboard.calculating', 'Calculating Results')}
          </h2>
          <p style={{
            fontFamily: t.body, fontSize: 13, color: t.textSecondary,
          }}>
            {tr('dashboard.computing', 'Computing your Elo rating...')}
          </p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* ═══ RESULTS PHASE ═══ */}
      {phase === 'results' && result && (
        <div style={{ animation: 'fadeUp 0.4s ease-out' }}>
          <div style={{
            textAlign: 'center', padding: '32px 24px', marginBottom: 24,
            borderRadius: 16, background: t.bgCard, border: `1px solid ${t.border}`,
          }}>
            {/* Score */}
            <div style={{
              fontFamily: t.mono, fontSize: 48, fontWeight: 900,
              color: result.percentage >= 0.7 ? t.cyan : result.percentage >= 0.4 ? t.gold : t.rose,
              marginBottom: 8,
            }}>
              {result.score}/{result.total}
            </div>
            <div style={{
              fontFamily: t.body, fontSize: 15, color: t.textSecondary,
              marginBottom: 20,
            }}>
              {Math.round(result.percentage * 100)}% correct
            </div>

            {/* Elo Rating */}
            <div style={{
              display: 'inline-flex', flexDirection: 'column', alignItems: 'center',
              padding: '16px 32px', borderRadius: 14,
              background: `${t.violet}10`, border: `1px solid ${t.violet}25`,
            }}>
              <span style={{
                fontFamily: t.display, fontSize: 11, fontWeight: 700,
                color: t.textMuted, textTransform: 'uppercase' as const,
                letterSpacing: '0.08em', marginBottom: 4,
              }}>
                Elo Rating
              </span>
              <span style={{
                fontFamily: t.mono, fontSize: 36, fontWeight: 900, color: t.violet,
              }}>
                {result.initialElo}
              </span>
              <span style={{
                fontFamily: t.body, fontSize: 12, color: t.textSecondary, marginTop: 4,
              }}>
                {result.skillDomain}
              </span>
            </div>
          </div>

          {/* Question breakdown */}
          <div style={{
            padding: '16px 20px', borderRadius: 14,
            background: t.bgCard, border: `1px solid ${t.border}`,
            marginBottom: 24,
          }}>
            <h3 style={{
              fontFamily: t.display, fontSize: 13, fontWeight: 700,
              color: t.textSecondary, textTransform: 'uppercase' as const,
              letterSpacing: '0.06em', marginBottom: 12,
            }}>
              {tr('dashboard.breakdown', 'Question Breakdown')}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {result.questionResults.map((qr, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 12px', borderRadius: 8,
                    background: qr.correct ? `${t.cyan}08` : `${t.rose}08`,
                  }}
                >
                  <span style={{
                    fontFamily: t.mono, fontSize: 12, fontWeight: 700,
                    color: qr.correct ? t.cyan : t.rose,
                    minWidth: 20,
                  }}>
                    {qr.correct ? '✓' : '✗'}
                  </span>
                  <span style={{
                    fontFamily: t.body, fontSize: 13, color: t.text,
                    flex: 1,
                  }}>
                    Q{i + 1}
                  </span>
                  <span style={{
                    fontFamily: t.body, fontSize: 11, color: t.textMuted,
                    maxWidth: '60%',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const,
                  }}>
                    {qr.explanation}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={handleRestart}
              style={{
                flex: 1, padding: '12px 20px', borderRadius: 12,
                background: t.bgCard, border: `1px solid ${t.border}`,
                fontFamily: t.body, fontSize: 14, fontWeight: 600, color: t.textSecondary,
                cursor: 'pointer',
              }}
            >
              {tr('dashboard.take_another', 'Take Another')}
            </button>
            <button
              onClick={() => router.push('/skills')}
              style={{
                flex: 1, padding: '12px 20px', borderRadius: 12,
                background: t.gradient, border: 'none',
                fontFamily: t.body, fontSize: 14, fontWeight: 700, color: '#FFF',
                cursor: 'pointer',
              }}
            >
              {tr('dashboard.view_skills', 'View All Skills')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
