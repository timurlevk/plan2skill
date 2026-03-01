'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useOnboardingStore } from '@plan2skill/store';
import { t, rarity } from '../_components/tokens';
import { StepBar } from '../_components/StepBar';
import { ConfettiLayer } from '../_components/ConfettiParticle';
import { GOALS } from '../_data/goals';

// ═══════════════════════════════════════════
// THE FORGE — Crystal Formation + Milestones (Step 4/5)
// Crystal grows in stages, energy particles spiral in,
// color matches archetype, confetti on completion
// ═══════════════════════════════════════════

// ─── Archetype colors ───
const ARCHETYPE_COLORS: Record<string, { outline: string; shine: string }> = {
  strategist: { outline: '#5B7FCC', shine: '#8AB4FF' },
  explorer:   { outline: '#2A9D8F', shine: '#6EDDCC' },
  connector:  { outline: '#E05580', shine: '#FF8AAA' },
  builder:    { outline: '#E8852E', shine: '#FFB866' },
  innovator:  { outline: '#DAA520', shine: '#FFD166' },
};

// ─── CSS Crystal Component ───
function CSSCrystal({ stage, outlineColor, shineColor, complete }: {
  stage: number; outlineColor: string; shineColor: string; complete: boolean;
}) {
  const scales = [0.4, 0.6, 0.85, 1.0];
  const scale = scales[Math.min(stage, 3)]!;

  return (
    <div style={{
      position: 'relative',
      width: 80,
      height: 120,
      transform: `scale(${scale})`,
      transition: 'transform 0.8s cubic-bezier(0.34,1.56,0.64,1)',
    }}>
      {/* Main crystal body — hexagonal elongated shape */}
      <div style={{
        position: 'absolute',
        inset: 0,
        clipPath: 'polygon(50% 0%, 90% 20%, 90% 80%, 50% 100%, 10% 80%, 10% 20%)',
        background: `linear-gradient(170deg, ${shineColor} 0%, ${outlineColor} 40%, ${outlineColor}CC 100%)`,
        boxShadow: complete ? `0 0 30px ${outlineColor}66` : `0 0 12px ${outlineColor}33`,
        transition: 'box-shadow 0.5s ease',
      }}>
        {/* Left facet highlight */}
        <div style={{
          position: 'absolute',
          top: '15%',
          left: '12%',
          width: '35%',
          height: '70%',
          clipPath: 'polygon(0% 10%, 100% 0%, 80% 100%, 0% 90%)',
          background: `linear-gradient(180deg, ${shineColor}55 0%, transparent 60%)`,
        }} />
        {/* Right facet */}
        <div style={{
          position: 'absolute',
          top: '10%',
          right: '12%',
          width: '30%',
          height: '65%',
          clipPath: 'polygon(20% 0%, 100% 10%, 100% 90%, 0% 100%)',
          background: `linear-gradient(190deg, rgba(255,255,255,0.15) 0%, transparent 50%)`,
        }} />
        {/* Center shine */}
        <div style={{
          position: 'absolute',
          top: '20%',
          left: '30%',
          width: '40%',
          height: '30%',
          borderRadius: '50%',
          background: `radial-gradient(ellipse, ${shineColor}44 0%, transparent 70%)`,
          animation: complete ? 'glowPulse 2s ease-in-out infinite' : 'none',
        }} />
      </div>

      {/* Sparkle points on vertices (stage 2+) */}
      {stage >= 2 && (
        <>
          {[
            { top: '-4px', left: '50%', delay: '0s' },
            { top: '18%', left: '92%', delay: '0.3s' },
            { top: '78%', left: '92%', delay: '0.6s' },
            { top: '100%', left: '50%', delay: '0.9s' },
            { top: '78%', left: '4%', delay: '1.2s' },
            { top: '18%', left: '4%', delay: '1.5s' },
          ].map((pos, i) => (
            <div key={i} style={{
              position: 'absolute',
              top: pos.top,
              left: pos.left,
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: shineColor,
              boxShadow: `0 0 8px ${shineColor}`,
              animation: `sparkle 2s ease-in-out ${pos.delay} infinite`,
              transform: 'translate(-50%, -50%)',
            }} />
          ))}
        </>
      )}
    </div>
  );
}

// ─── Crystal Shard — converges in during stage transitions ───
function CrystalShard({ index, color, total = 6 }: { index: number; color: string; total?: number }) {
  const angle = (index / total) * 360;
  const delay = index * 0.12;

  return (
    // Outer wrapper — provides angular position (static rotation)
    <div style={{
      position: 'absolute',
      top: '50%',
      left: '50%',
      width: 0,
      height: 0,
      transform: `rotate(${angle}deg)`,
    }}>
      {/* Inner shard — converges radially from outside to center */}
      <div style={{
        width: 8,
        height: 14,
        clipPath: 'polygon(50% 0%, 100% 40%, 80% 100%, 20% 100%, 0% 40%)',
        background: `linear-gradient(180deg, ${color}, ${color}88)`,
        boxShadow: `0 0 6px ${color}55`,
        animation: `shardConverge 1.2s ease-in ${delay}s both`,
        transformOrigin: 'center center',
      }} />
    </div>
  );
}

// ─── Progress stage names ───
const STAGE_NAMES = ['Seed Crystal', 'Growing', 'Resonating', 'Complete'];

export default function ForgePage() {
  const router = useRouter();
  const {
    selectedGoals, archetypeId, aiEstimateWeeks,
    setForgeComplete, addXP,
  } = useOnboardingStore();

  const [progress, setProgress] = useState(0);
  const [complete, setComplete] = useState(false);
  const [revealedMilestones, setRevealedMilestones] = useState<number[]>([]);
  const [showParticles, setShowParticles] = useState(false);
  const [socialIndex, setSocialIndex] = useState(0);
  const particleCycle = useRef(0);

  // Crystal stage (0-3)
  const crystalStage = progress < 25 ? 0 : progress < 50 ? 1 : progress < 80 ? 2 : 3;

  // Archetype-based colors
  const archColors = ARCHETYPE_COLORS[archetypeId || 'strategist'] ?? ARCHETYPE_COLORS.strategist!;

  // Track previous stage for shard animation
  const [showShards, setShowShards] = useState(false);
  const prevStageRef = useRef(0);
  useEffect(() => {
    if (crystalStage > prevStageRef.current) {
      prevStageRef.current = crystalStage;
      setShowShards(true);
      setTimeout(() => setShowShards(false), 1200);
    }
  }, [crystalStage]);

  // Personalized data
  const goalNames = useMemo(() =>
    selectedGoals.map(g => {
      const full = GOALS.find(gd => gd.id === g.id);
      return full?.label ?? g.label;
    }), [selectedGoals]
  );

  const archetypeName = archetypeId
    ? archetypeId.charAt(0).toUpperCase() + archetypeId.slice(1)
    : 'Hero';

  const FORGE_STEPS = useMemo(() => [
    { text: `Analyzing your ${archetypeName} archetype`, doneAt: 15 },
    { text: `Mapping skills for ${goalNames[0] ?? 'your goals'}`, doneAt: 35 },
    { text: 'Calibrating challenge tiers', doneAt: 55 },
    { text: 'Generating daily quests', doneAt: 75 },
    { text: 'Infusing crystal with your roadmap', doneAt: 92 },
  ], [archetypeName, goalNames]);

  const totalWeeks = aiEstimateWeeks || 12;

  const MILESTONES = useMemo(() => [
    { pct: 25, week: `W1-${Math.ceil(totalWeeks * 0.2)}`, name: 'Foundations & Setup', rarity: rarity.common },
    { pct: 45, week: `W${Math.ceil(totalWeeks * 0.2) + 1}-${Math.ceil(totalWeeks * 0.4)}`, name: 'Core Concepts', rarity: rarity.common },
    { pct: 65, week: `W${Math.ceil(totalWeeks * 0.4) + 1}-${Math.ceil(totalWeeks * 0.6)}`, name: 'Practical Projects', rarity: rarity.uncommon },
    { pct: 80, week: `W${Math.ceil(totalWeeks * 0.6) + 1}-${Math.ceil(totalWeeks * 0.8)}`, name: 'Advanced Patterns', rarity: rarity.rare },
    { pct: 95, week: `W${Math.ceil(totalWeeks * 0.8) + 1}-${totalWeeks}`, name: 'Capstone Challenge', rarity: rarity.epic },
  ], [totalWeeks]);

  const SOCIAL_PROOF = useMemo(() => [
    `${archetypeName}s reach Milestone 1 in ~5 days`,
    '87% of users with your profile stay on track',
    '2,847 professionals building roadmaps right now',
    `Most ${archetypeName}s study in the morning`,
    'Average first achievement: Day 3',
  ], [archetypeName]);

  // Animation duration ~15 seconds
  const totalDuration = 15000;

  useEffect(() => {
    let elapsed = 0;
    const interval = setInterval(() => {
      elapsed += 50;
      const pct = Math.min((elapsed / totalDuration) * 100, 100);
      setProgress(pct);

      // Trigger particles every ~3s
      if (Math.floor(elapsed / 3000) > particleCycle.current) {
        particleCycle.current = Math.floor(elapsed / 3000);
        setShowParticles(true);
        setTimeout(() => setShowParticles(false), 1500);
      }

      if (pct >= 100) {
        clearInterval(interval);
        setShowParticles(true);
        setTimeout(() => {
          setShowParticles(false);
          setComplete(true);
          setForgeComplete(true);
          addXP(25);
        }, 1500);
      }
    }, 50);

    return () => clearInterval(interval);
  }, []);

  // Milestone reveals
  useEffect(() => {
    MILESTONES.forEach((ms, i) => {
      if (progress >= ms.pct && !revealedMilestones.includes(i)) {
        setRevealedMilestones(prev => [...prev, i]);
      }
    });
  }, [progress]);

  // Rotate social proof
  useEffect(() => {
    const iv = setInterval(() => {
      setSocialIndex(prev => (prev + 1) % SOCIAL_PROOF.length);
    }, 3500);
    return () => clearInterval(iv);
  }, [SOCIAL_PROOF.length]);

  const currentStep = FORGE_STEPS.findIndex(s => progress < s.doneAt);

  // ── Phase-based layout ──
  // Phase 1 (0–60%): Crystal hero + compact checklist
  // Phase 2 (60–95%): Crystal shrinks + quest map reveals
  // Phase 3 (complete): Celebration + summary + CTA
  const forgePhase = complete ? 3 : progress >= 60 ? 2 : 1;

  // For compact checklist: show 1 done + current + 1 upcoming (max 3 visible)
  const compactSteps = useMemo(() => {
    const idx = currentStep === -1 ? FORGE_STEPS.length - 1 : currentStep;
    const start = Math.max(0, idx - 1);
    const end = Math.min(FORGE_STEPS.length, idx + 2);
    return FORGE_STEPS.slice(start, end).map((step, i) => ({
      ...step,
      originalIndex: start + i,
    }));
  }, [currentStep, FORGE_STEPS]);

  return (
    <div style={{
      animation: 'fadeUp 0.6s ease-out',
      textAlign: 'center',
      position: 'relative',
      minHeight: 520,
    }}>
      {/* Confetti on complete */}
      {complete && <ConfettiLayer count={40} />}

      <StepBar current={3} />

      {/* Title — compact */}
      <h1 style={{
        fontFamily: t.display,
        fontSize: 26,
        fontWeight: 900,
        marginBottom: 4,
        background: t.gradient,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
      }}>
        The Forge
      </h1>
      <p style={{
        fontFamily: t.body,
        fontSize: 13,
        color: t.textSecondary,
        marginBottom: forgePhase === 1 ? 20 : 12,
        transition: 'margin 0.4s ease',
      }}>
        Forging your personalized {totalWeeks}-week roadmap
      </p>

      {/* ═══ PHASE 1: Crystal Hero + Compact Checklist ═══ */}
      {forgePhase === 1 && (
        <div style={{ animation: 'fadeUp 0.5s ease-out' }}>
          {/* Large Crystal */}
          <div style={{
            position: 'relative',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: 160,
            marginBottom: 8,
          }}>
            {/* Crystal glow background */}
            <div style={{
              position: 'absolute',
              width: crystalStage >= 2 ? 140 : 80,
              height: crystalStage >= 2 ? 140 : 80,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${archColors.outline}15 0%, transparent 70%)`,
              transition: 'all 1s ease',
            }} />

            <CSSCrystal
              stage={crystalStage}
              outlineColor={archColors.outline}
              shineColor={archColors.shine}
              complete={false}
            />

            {/* Crystal Shards */}
            {showShards && Array.from({ length: 6 }, (_, i) => (
              <CrystalShard
                key={`shard-${crystalStage}-${i}`}
                index={i}
                color={i % 2 === 0 ? archColors.outline : archColors.shine}
                total={6}
              />
            ))}

            {/* Energy particles — symmetrically converge to center */}
            {showParticles && Array.from({ length: 8 }, (_, i) => (
              <div
                key={`${particleCycle.current}-${i}`}
                style={{
                  position: 'absolute',
                  top: '50%', left: '50%',
                  width: 0, height: 0,
                  transform: `rotate(${(i / 8) * 360}deg)`,
                }}
              >
                <div style={{
                  width: 4, height: 4, borderRadius: '50%',
                  background: i % 2 === 0 ? archColors.outline : archColors.shine,
                  boxShadow: `0 0 8px ${i % 2 === 0 ? archColors.outline : archColors.shine}`,
                  animation: `convergeIn 1.5s ease-in ${i * 0.1}s both`,
                }} />
              </div>
            ))}
          </div>

          {/* Stage name */}
          <div style={{
            fontFamily: t.mono, fontSize: 11, fontWeight: 700,
            color: archColors.outline, marginBottom: 14,
          }}>
            {STAGE_NAMES[crystalStage]}
          </div>

          {/* Progress Bar */}
          <div style={{ marginBottom: 6, padding: '0 8px' }}>
            <div style={{
              height: 6, borderRadius: 3,
              background: '#252530', overflow: 'hidden', position: 'relative',
            }}>
              <div style={{
                width: `${progress}%`, height: '100%', borderRadius: 3,
                background: `linear-gradient(90deg, ${archColors.outline}, ${archColors.shine})`,
                transition: 'width 0.15s linear',
                boxShadow: `0 0 12px ${archColors.outline}40`,
                position: 'relative', overflow: 'hidden',
              }}>
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                  backgroundSize: '200% 100%',
                  animation: 'shimmer 2s linear infinite',
                }} />
              </div>
            </div>
          </div>
          <div style={{
            fontFamily: t.mono, fontSize: 13, fontWeight: 700,
            color: archColors.outline, marginBottom: 16,
          }}>
            {Math.round(progress)}%
          </div>

          {/* Compact Checklist — only 3 items visible */}
          <div style={{
            position: 'relative', textAlign: 'left',
            padding: '0 4px 0 24px', marginBottom: 12,
          }}>
            {/* Vertical line */}
            <div style={{
              position: 'absolute', left: 15, top: 4, bottom: 4,
              width: 2, background: '#252530', borderRadius: 1,
            }}>
              <div style={{
                width: '100%',
                height: `${Math.min(100, (progress / 92) * 100)}%`,
                background: `linear-gradient(to bottom, ${archColors.outline}, ${archColors.shine})`,
                borderRadius: 1, transition: 'height 0.3s linear',
              }} />
            </div>

            {compactSteps.map((step) => {
              const i = step.originalIndex;
              const isDone = progress >= step.doneAt;
              const isCurrent = i === currentStep;

              return (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '8px 0', position: 'relative',
                  animation: 'fadeUp 0.3s ease-out',
                }}>
                  <div style={{
                    position: 'absolute', left: -17,
                    width: isDone ? 14 : isCurrent ? 14 : 10,
                    height: isDone ? 14 : isCurrent ? 14 : 10,
                    borderRadius: '50%',
                    background: isDone ? archColors.outline : isCurrent ? t.bgCard : '#252530',
                    border: `2px solid ${isDone ? archColors.outline : isCurrent ? archColors.outline : '#35354A'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 1, transition: 'all 0.3s ease',
                    animation: isCurrent ? 'pulse 1.5s ease-in-out infinite' : 'none',
                    boxShadow: isCurrent ? `0 0 8px ${archColors.outline}40` : 'none',
                  }}>
                    {isDone && (
                      <svg width="7" height="7" viewBox="0 0 12 12" fill="none">
                        <path d="M2.5 6L5 8.5L9.5 3.5" stroke="#FFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>

                  <span style={{
                    fontFamily: t.body, fontSize: 12,
                    color: isDone ? t.textSecondary : isCurrent ? t.text : t.textMuted,
                    fontWeight: isCurrent ? 600 : 400,
                    marginLeft: 8, lineHeight: 1.3,
                  }}>
                    {step.text}
                    {isCurrent && <span style={{ animation: 'pulse 1s ease-in-out infinite' }}>...</span>}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Social Proof */}
          <p style={{
            fontFamily: t.body, fontSize: 11,
            color: t.textMuted, fontWeight: 400,
            textAlign: 'center',
            animation: 'fadeUp 0.4s ease-out',
          }} key={socialIndex}>
            {SOCIAL_PROOF[socialIndex]}
          </p>
        </div>
      )}

      {/* ═══ PHASE 2: Compact Crystal + Quest Map Reveal ═══ */}
      {forgePhase === 2 && (
        <div style={{ animation: 'fadeUp 0.5s ease-out' }}>
          {/* Compact crystal row: crystal + progress + stage */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 16, marginBottom: 16,
          }}>
            {/* Small Crystal */}
            <div style={{
              position: 'relative',
              display: 'flex', justifyContent: 'center', alignItems: 'center',
              width: 64, height: 64, flexShrink: 0,
            }}>
              <div style={{
                position: 'absolute',
                width: 50, height: 50, borderRadius: '50%',
                background: `radial-gradient(circle, ${archColors.outline}15 0%, transparent 70%)`,
              }} />
              <div style={{ transform: 'scale(0.5)', transformOrigin: 'center' }}>
                <CSSCrystal
                  stage={crystalStage}
                  outlineColor={archColors.outline}
                  shineColor={archColors.shine}
                  complete={false}
                />
              </div>
              {showParticles && Array.from({ length: 4 }, (_, i) => (
                <div
                  key={`p2-${particleCycle.current}-${i}`}
                  style={{
                    position: 'absolute',
                    top: '50%', left: '50%',
                    width: 0, height: 0,
                    transform: `rotate(${(i / 4) * 360}deg)`,
                  }}
                >
                  <div style={{
                    width: 3, height: 3, borderRadius: '50%',
                    background: i % 2 === 0 ? archColors.outline : archColors.shine,
                    boxShadow: `0 0 6px ${i % 2 === 0 ? archColors.outline : archColors.shine}`,
                    animation: `convergeIn 1.2s ease-in ${i * 0.15}s both`,
                  }} />
                </div>
              ))}
            </div>

            {/* Progress bar + label — vertical */}
            <div style={{ flex: 1, maxWidth: 200 }}>
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginBottom: 4,
              }}>
                <span style={{
                  fontFamily: t.mono, fontSize: 10, fontWeight: 700,
                  color: archColors.outline,
                }}>
                  {STAGE_NAMES[crystalStage]}
                </span>
                <span style={{
                  fontFamily: t.mono, fontSize: 12, fontWeight: 700,
                  color: archColors.outline,
                }}>
                  {Math.round(progress)}%
                </span>
              </div>
              <div style={{
                height: 5, borderRadius: 3,
                background: '#252530', overflow: 'hidden',
              }}>
                <div style={{
                  width: `${progress}%`, height: '100%', borderRadius: 3,
                  background: `linear-gradient(90deg, ${archColors.outline}, ${archColors.shine})`,
                  transition: 'width 0.15s linear',
                  boxShadow: `0 0 8px ${archColors.outline}40`,
                  position: 'relative', overflow: 'hidden',
                }}>
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                    backgroundSize: '200% 100%',
                    animation: 'shimmer 2s linear infinite',
                  }} />
                </div>
              </div>
            </div>
          </div>

          {/* Quest Map — reveals as milestones are reached */}
          <div style={{ textAlign: 'left', marginBottom: 12 }}>
            <h3 style={{
              fontFamily: t.display, fontSize: 14, fontWeight: 700,
              color: t.text, marginBottom: 12, textAlign: 'center',
              animation: 'fadeUp 0.4s ease-out',
            }}>
              Your Quest Map
            </h3>

            <div style={{
              position: 'relative', padding: '0 4px 0 28px',
            }}>
              {/* Quest path line */}
              <div style={{
                position: 'absolute', left: 17, top: 6, bottom: 6,
                width: 2, borderRadius: 1,
                background: `linear-gradient(to bottom, ${archColors.outline}40, ${t.cyan}40)`,
              }} />

              {MILESTONES.map((ms, idx) => {
                const isRevealed = revealedMilestones.includes(idx);
                const isFinal = idx === MILESTONES.length - 1;
                const MILESTONE_DESCS = [
                  'Environment setup, basics, first exercises',
                  'Key principles, essential patterns',
                  'Hands-on projects, real-world practice',
                  'Deeper patterns, optimization, architecture',
                  'Final challenge — prove your mastery',
                ];

                return (
                  <div key={idx} style={{
                    display: 'flex', alignItems: 'flex-start', gap: 12,
                    padding: '8px 0', position: 'relative',
                    opacity: isRevealed ? 1 : 0.25,
                    transition: 'opacity 0.6s ease-out',
                    animation: isRevealed ? 'slideUp 0.5s ease-out' : 'none',
                  }}>
                    {/* Node */}
                    <div style={{
                      position: 'absolute', left: -20, top: 10,
                      width: isFinal ? 20 : 14,
                      height: isFinal ? 20 : 14,
                      borderRadius: isFinal ? 5 : '50%',
                      background: isRevealed ? `${ms.rarity.color}20` : '#1A1A24',
                      border: `2px solid ${isRevealed ? ms.rarity.color : '#35354A'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      zIndex: 1, fontSize: isFinal ? 10 : 8,
                      color: isRevealed ? ms.rarity.color : '#35354A',
                      transition: 'all 0.5s ease',
                      animation: isRevealed && isFinal ? 'glowPulse 2s ease-in-out infinite' : 'none',
                      boxShadow: isRevealed ? `0 0 6px ${ms.rarity.color}25` : 'none',
                    }}>
                      {isRevealed ? ms.rarity.icon : '?'}
                    </div>

                    <div style={{ flex: 1, marginLeft: 8 }}>
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2,
                      }}>
                        <span style={{
                          fontFamily: t.mono, fontSize: 9, fontWeight: 700,
                          color: isRevealed ? archColors.outline : '#35354A',
                          background: isRevealed ? `${archColors.outline}12` : 'transparent',
                          padding: '1px 5px', borderRadius: 3,
                        }}>
                          {ms.week}
                        </span>
                        <span style={{
                          fontFamily: t.display, fontSize: 12, fontWeight: 700,
                          color: isRevealed ? t.text : '#35354A',
                        }}>
                          {isRevealed ? ms.name : '???'}
                        </span>
                      </div>
                      {isRevealed && (
                        <p style={{
                          fontFamily: t.body, fontSize: 11,
                          color: t.textMuted, margin: 0, lineHeight: 1.3,
                        }}>
                          {MILESTONE_DESCS[idx]}
                        </p>
                      )}
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 3,
                        fontFamily: t.mono, fontSize: 8, fontWeight: 700,
                        color: isRevealed ? ms.rarity.color : '#35354A',
                        textTransform: 'uppercase', letterSpacing: '0.05em',
                        marginTop: 2,
                      }}>
                        {ms.rarity.icon} {isRevealed ? ms.rarity.label : '???'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Social Proof — compact */}
          <p style={{
            fontFamily: t.body, fontSize: 10,
            color: t.textMuted, fontWeight: 400,
            textAlign: 'center',
          }} key={`sp-${socialIndex}`}>
            {SOCIAL_PROOF[socialIndex]}
          </p>
        </div>
      )}

      {/* ═══ PHASE 3: Celebration ═══ */}
      {forgePhase === 3 && (
        <div style={{ animation: 'bounceIn 0.6s ease-out', position: 'relative', zIndex: 2 }}>
          {/* Glowing crystal */}
          <div style={{
            position: 'relative',
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            height: 140, marginBottom: 12,
          }}>
            <div style={{
              position: 'absolute',
              width: 120, height: 120, borderRadius: '50%',
              background: `radial-gradient(circle, ${archColors.outline}30 0%, transparent 70%)`,
              animation: 'glowPulse 2s ease-in-out infinite',
            }} />
            <CSSCrystal
              stage={3}
              outlineColor={archColors.outline}
              shineColor={archColors.shine}
              complete={true}
            />
          </div>

          <div style={{
            fontFamily: t.mono, fontSize: 11, fontWeight: 700,
            color: archColors.shine, marginBottom: 16,
          }}>
            Crystal Complete!
          </div>

          <h2 style={{
            fontFamily: t.display, fontSize: 22, fontWeight: 900,
            marginBottom: 8,
            background: `linear-gradient(135deg, ${archColors.outline}, ${archColors.shine})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            Your crystal is forged!
          </h2>

          {/* Summary stats row */}
          <div style={{
            display: 'flex', justifyContent: 'center', gap: 20,
            marginBottom: 20,
          }}>
            {[
              { value: MILESTONES.length, label: 'Milestones', color: archColors.outline },
              { value: `${totalWeeks}w`, label: 'Journey', color: t.cyan },
              { value: '+25', label: 'XP', color: t.gold },
            ].map((stat, i) => (
              <div key={i} style={{
                textAlign: 'center',
                animation: `fadeUp 0.4s ease-out ${0.2 + i * 0.1}s both`,
              }}>
                <div style={{
                  fontFamily: t.mono, fontSize: 18, fontWeight: 800,
                  color: stat.color,
                }}>
                  {stat.value}
                </div>
                <div style={{
                  fontFamily: t.body, fontSize: 10, fontWeight: 600,
                  color: t.textMuted, textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => router.push('/timeline')}
            style={{
              width: '100%', padding: '14px 0', borderRadius: 14,
              border: 'none',
              background: `linear-gradient(135deg, ${archColors.outline}, ${archColors.shine})`,
              color: '#FFF', fontFamily: t.display,
              fontSize: 15, fontWeight: 700, cursor: 'pointer',
              animation: 'bounceIn 0.6s ease-out 0.3s both',
              boxShadow: `0 0 24px ${archColors.outline}30`,
            }}
          >
            See Your Quest Roadmap
          </button>
        </div>
      )}
    </div>
  );
}
