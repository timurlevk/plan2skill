'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useProgressionStore, useCharacterStore, useI18nStore, useRoadmapStore } from '@plan2skill/store';
import { trpc } from '@plan2skill/api-client';
import { NeonIcon } from '../../../(onboarding)/_components/NeonIcon';
import { t } from '../../../(onboarding)/_components/tokens';
import { RoadmapTierModal } from '../_components/RoadmapTierModal';
import { TIER_LIMITS } from '../_components/constants';
import { MiniForge } from './_components/MiniForge';
import { useRoadmapProgress } from '../../home/_hooks/useRoadmapProgress';

// ═══════════════════════════════════════════
// NEW QUEST LINE WIZARD — /roadmap/new
// 3-step mini-wizard: Goal → Pace → Forge
// Pattern from adjust/page.tsx (Phase 5H)
// ═══════════════════════════════════════════

const PACE_OPTIONS = [15, 30, 60, 90] as const;

const DOMAIN_CHIPS = [
  { id: 'development', label: 'Development', icon: 'code' as const, color: t.cyan },
  { id: 'design', label: 'Design', icon: 'sparkle' as const, color: t.fuchsia },
  { id: 'data', label: 'Data', icon: 'chart' as const, color: t.violet },
  { id: 'business', label: 'Business', icon: 'briefcase' as const, color: t.gold },
];


export default function NewRoadmapPage() {
  const router = useRouter();
  const tr = useI18nStore((s) => s.t);

  // SSR-safe reduced-motion (Крок 7 rule 3)
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    setReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  // Wizard state
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [goal, setGoal] = useState('');
  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);
  const [dailyMinutes, setDailyMinutes] = useState<15 | 30 | 60 | 90>(30);
  const [isForging, setIsForging] = useState(false);

  // Tier pre-check
  const subscriptionTier = useProgressionStore((s) => s.subscriptionTier);
  const { data: gate, isLoading: isCheckingLimit } = trpc.roadmap.checkLimit.useQuery();
  const [showTierModal, setShowTierModal] = useState(false);

  // If tier limit hit on page entry → show modal
  useEffect(() => {
    if (gate && !gate.allowed) {
      setShowTierModal(true);
    }
  }, [gate]);

  // Character info for generate call
  const archetypeId = useCharacterStore((s) => s.archetypeId);

  const generateMutation = trpc.roadmap.generate.useMutation();

  // SSE progress — watches store for roadmap with status: 'generating'
  const { progress: sseProgress, isComplete: sseComplete } = useRoadmapProgress();

  // Forge error state
  const [forgeError, setForgeError] = useState<string | null>(null);

  // SSE-driven redirect on completion
  useEffect(() => {
    if (sseComplete && isForging) {
      router.push('/roadmap');
    }
  }, [sseComplete, isForging, router]);

  // SSE error detection
  useEffect(() => {
    if (sseProgress.phase === 'error' && isForging) {
      setForgeError(sseProgress.message || tr('questmap.forge_error', 'Generation failed. Please try again.'));
      setIsForging(false);
    }
  }, [sseProgress.phase, sseProgress.message, isForging, tr]);

  // ─── Step navigation ─────────────────────────────────────

  const canProceedStep1 = goal.trim().length >= 5 && goal.trim().length <= 500;

  const handleNext = useCallback(() => {
    if (step === 1 && canProceedStep1) setStep(2);
    if (step === 2) setStep(3);
  }, [step, canProceedStep1]);

  const handleBack = useCallback(() => {
    if (step === 1) {
      router.push('/roadmap');
    } else {
      setStep((s) => (s - 1) as 1 | 2);
    }
  }, [step, router]);

  // ─── Forge (Step 3) ──────────────────────────────────────

  const forgeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleForge = useCallback(async () => {
    setIsForging(true);
    setForgeError(null);

    try {
      const result = await generateMutation.mutateAsync({
        goal: goal.trim(),
        currentRole: archetypeId ?? 'learner',
        experienceLevel: 'intermediate',
        dailyMinutes,
        selectedTools: selectedDomains,
        superpower: '',
      });

      // Check if tier limit was hit server-side
      if ('status' in result && result.status === 'tier_limit') {
        setIsForging(false);
        setShowTierModal(true);
        return;
      }

      // Inject generating roadmap into store → triggers useRoadmapProgress SSE
      if ('id' in result && result.id) {
        const store = useRoadmapStore.getState();
        store.setRoadmaps([...store.roadmaps, { id: result.id, status: 'generating' } as any]);
        store.setGenerating(true);
      }

      // 30s safety timeout — if SSE never fires 'complete'
      forgeTimeoutRef.current = setTimeout(() => {
        router.push('/roadmap');
      }, 30000);
    } catch (err) {
      console.error('[NewRoadmap] Generation failed:', err);
      setForgeError(tr('questmap.forge_error', 'Generation failed. Please try again.'));
      setIsForging(false);
    }
  }, [goal, archetypeId, dailyMinutes, selectedDomains, generateMutation, router, tr]);

  // Skip forge animation → immediate redirect
  const handleSkipForge = useCallback(() => {
    if (forgeTimeoutRef.current) clearTimeout(forgeTimeoutRef.current);
    router.push('/roadmap');
  }, [router]);

  // Cleanup timeout on unmount (§15 MA-LL006)
  useEffect(() => {
    return () => {
      if (forgeTimeoutRef.current) clearTimeout(forgeTimeoutRef.current);
    };
  }, []);

  // Toggle domain chip
  const toggleDomain = useCallback((id: string) => {
    setSelectedDomains((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id],
    );
  }, []);

  return (
    <div style={{
      maxWidth: 520, margin: '0 auto',
      animation: reducedMotion ? 'none' : 'fadeUp 0.4s ease-out',
    }}>
      {/* ─── Back button ─── */}
      <button
        onClick={handleBack}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'none', border: 'none', cursor: 'pointer',
          fontFamily: t.display, fontSize: 13, fontWeight: 700,
          color: t.textMuted, marginBottom: 20,
          transition: 'color 0.15s ease',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.color = t.text; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = t.textMuted; }}
      >
        <NeonIcon type="compass" size={14} color="muted" />
        {step === 1 ? tr('questmap.back', 'Back to Quest Map') : 'Back'}
      </button>

      {/* ─── Title ─── */}
      <h1 style={{
        display: 'flex', alignItems: 'center', gap: 10,
        fontFamily: t.display, fontSize: 22, fontWeight: 900,
        color: t.text, marginBottom: 4,
      }}>
        <NeonIcon type="fire" size={22} color="violet" />
        {tr('questmap.forge_new', 'Forge New Quest Line')}
      </h1>
      <p style={{
        fontFamily: t.body, fontSize: 13, color: t.textSecondary,
        marginBottom: 24,
      }}>
        {tr('questmap.step_label', 'Step {n} of 3 — {title}').replace('{n}', String(step)).replace('{title}', step === 1 ? 'Set your goal' : step === 2 ? 'Choose your pace' : 'Forging...')}
      </p>

      {/* ─── Step indicator ─── */}
      <div style={{
        display: 'flex', gap: 6, marginBottom: 24,
      }}>
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            style={{
              flex: 1, height: 3, borderRadius: 2,
              background: s <= step ? t.gradient : `${t.violet}15`,
              transition: 'background 0.3s ease',
            }}
          />
        ))}
      </div>

      {/* ═══ Step 1: Goal ═══ */}
      {step === 1 && (
        <div style={{
          padding: 24, borderRadius: 16,
          background: t.bgCard, border: `1px solid ${t.border}`,
          animation: reducedMotion ? 'none' : 'fadeUp 0.3s ease-out',
        }}>
          <label style={{
            fontFamily: t.display, fontSize: 13, fontWeight: 700,
            color: t.textSecondary, display: 'block', marginBottom: 10,
          }}>
            {tr('questmap.goal_prompt', 'What do you want to master?')}
          </label>
          <input
            type="text"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="e.g. Master TypeScript, Learn UI Design, Build a SaaS..."
            maxLength={500}
            style={{
              width: '100%', padding: '14px 16px', borderRadius: 12,
              background: t.bgElevated, border: `1px solid ${t.border}`,
              fontFamily: t.body, fontSize: 14, color: t.text,
              outline: 'none',
              transition: 'border-color 0.2s ease',
              boxSizing: 'border-box',
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = t.violet; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = t.border; }}
            autoFocus
          />
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginTop: 6,
          }}>
            <span style={{
              fontFamily: t.body, fontSize: 11, color: t.textMuted,
            }}>
              {goal.length < 5 ? `${5 - goal.length} more chars needed` : ''}
            </span>
            <span style={{
              fontFamily: t.mono, fontSize: 10, color: t.textMuted,
            }}>
              {goal.length}/500
            </span>
          </div>

          {/* Optional domain chips */}
          <div style={{ marginTop: 20 }}>
            <label style={{
              fontFamily: t.display, fontSize: 12, fontWeight: 700,
              color: t.textMuted, display: 'block', marginBottom: 10,
            }}>
              {tr('questmap.domain_label', 'Skill domain (optional)')}
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {DOMAIN_CHIPS.map((chip) => {
                const isSelected = selectedDomains.includes(chip.id);
                return (
                  <button
                    key={chip.id}
                    onClick={() => toggleDomain(chip.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '8px 14px', borderRadius: 10,
                      background: isSelected ? `${chip.color}12` : t.bgElevated,
                      border: `1.5px solid ${isSelected ? `${chip.color}50` : t.border}`,
                      cursor: 'pointer',
                      transition: 'border-color 0.2s ease, background 0.2s ease',
                      fontFamily: t.display, fontSize: 12, fontWeight: 700,
                      color: isSelected ? chip.color : t.textSecondary,
                    }}
                  >
                    <NeonIcon type={chip.icon} size={14} color={isSelected ? chip.color : t.textMuted} />
                    {chip.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Next button */}
          <div style={{
            display: 'flex', justifyContent: 'flex-end', marginTop: 24,
          }}>
            <button
              onClick={handleNext}
              disabled={!canProceedStep1}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '12px 24px', borderRadius: 12,
                background: canProceedStep1 ? t.gradient : t.border,
                border: 'none',
                cursor: canProceedStep1 ? 'pointer' : 'not-allowed',
                fontFamily: t.display, fontSize: 14, fontWeight: 700,
                color: canProceedStep1 ? '#FFF' : t.textMuted,
                opacity: canProceedStep1 ? 1 : 0.5,
                transition: 'transform 0.15s ease',
              }}
              onMouseEnter={(e) => { if (canProceedStep1) e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              Next
              <NeonIcon type="lightning" size={14} color="#FFF" />
            </button>
          </div>
        </div>
      )}

      {/* ═══ Step 2: Pace ═══ */}
      {step === 2 && (
        <div style={{
          padding: 24, borderRadius: 16,
          background: t.bgCard, border: `1px solid ${t.border}`,
          animation: reducedMotion ? 'none' : 'fadeUp 0.3s ease-out',
        }}>
          <label style={{
            fontFamily: t.display, fontSize: 13, fontWeight: 700,
            color: t.textSecondary, display: 'block', marginBottom: 12,
          }}>
            {tr('questmap.pace_label', 'Daily training pace')}
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {PACE_OPTIONS.map((mins) => {
              const isSelected = dailyMinutes === mins;
              return (
                <button
                  key={mins}
                  onClick={() => setDailyMinutes(mins)}
                  style={{
                    padding: '16px 8px', borderRadius: 12,
                    background: isSelected ? `${t.cyan}15` : t.bgElevated,
                    border: `1.5px solid ${isSelected ? t.cyan : t.border}`,
                    cursor: 'pointer',
                    transition: 'border-color 0.2s ease, background 0.2s ease',
                    textAlign: 'center',
                  }}
                >
                  <div style={{
                    fontFamily: t.display, fontSize: 22, fontWeight: 900,
                    color: isSelected ? t.cyan : t.text,
                  }}>
                    {mins}
                  </div>
                  <div style={{
                    fontFamily: t.mono, fontSize: 9, fontWeight: 700,
                    color: t.textMuted, textTransform: 'uppercase',
                  }}>
                    {tr('questmap.pace_unit', 'min/day')}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Helpful context */}
          <p style={{
            fontFamily: t.body, fontSize: 12, color: t.textMuted,
            lineHeight: 1.5, marginTop: 16,
          }}>
            {dailyMinutes <= 15
              ? 'Steady and consistent — great for building habits!'
              : dailyMinutes <= 30
                ? 'Balanced pace — you\'ll make solid progress each week.'
                : dailyMinutes <= 60
                  ? 'Intensive training — fast results for the dedicated hero.'
                  : 'Full speed ahead — you\'ll conquer this in record time!'}
          </p>

          {/* Action buttons */}
          <div style={{
            display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24,
          }}>
            <button
              onClick={() => setStep(1)}
              style={{
                padding: '12px 20px', borderRadius: 12,
                background: 'transparent', border: `1px solid ${t.border}`,
                cursor: 'pointer',
                fontFamily: t.display, fontSize: 13, fontWeight: 700,
                color: t.textSecondary,
                transition: 'border-color 0.15s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = t.textMuted; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = t.border; }}
            >
              Back
            </button>
            <button
              onClick={handleNext}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '12px 24px', borderRadius: 12,
                background: t.gradient, border: 'none',
                cursor: 'pointer',
                fontFamily: t.display, fontSize: 14, fontWeight: 700,
                color: '#FFF',
                transition: 'transform 0.15s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <NeonIcon type="fire" size={14} color="#FFF" />
              {tr('questmap.forge_btn', 'Forge Quest Line')}
            </button>
          </div>
        </div>
      )}

      {/* ═══ Step 3: Forge animation ═══ */}
      {step === 3 && (
        <div style={{
          padding: 24, borderRadius: 16,
          background: t.bgCard, border: `1px solid ${t.border}`,
          animation: reducedMotion ? 'none' : 'fadeUp 0.3s ease-out',
          textAlign: 'center',
        }}>
          {!isForging ? (
            /* Pre-forge summary */
            <div>
              <div style={{
                padding: 16, borderRadius: 12,
                background: t.bgElevated, border: `1px solid ${t.border}`,
                marginBottom: 20, textAlign: 'left',
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontFamily: t.body, fontSize: 12, color: t.textMuted }}>
                      Goal
                    </span>
                    <span style={{
                      fontFamily: t.body, fontSize: 12, fontWeight: 700, color: t.text,
                      maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {goal}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontFamily: t.body, fontSize: 12, color: t.textMuted }}>
                      Pace
                    </span>
                    <span style={{ fontFamily: t.mono, fontSize: 12, fontWeight: 700, color: t.cyan }}>
                      {dailyMinutes} min/day
                    </span>
                  </div>
                  {selectedDomains.length > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontFamily: t.body, fontSize: 12, color: t.textMuted }}>
                        Domains
                      </span>
                      <span style={{ fontFamily: t.body, fontSize: 12, color: t.violet }}>
                        {selectedDomains.map((d) =>
                          DOMAIN_CHIPS.find((c) => c.id === d)?.label ?? d,
                        ).join(', ')}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div style={{
                display: 'flex', justifyContent: 'flex-end', gap: 10,
              }}>
                <button
                  onClick={() => setStep(2)}
                  style={{
                    padding: '12px 20px', borderRadius: 12,
                    background: 'transparent', border: `1px solid ${t.border}`,
                    cursor: 'pointer',
                    fontFamily: t.display, fontSize: 13, fontWeight: 700,
                    color: t.textSecondary,
                    transition: 'border-color 0.15s ease',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = t.textMuted; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = t.border; }}
                >
                  Back
                </button>
                <button
                  onClick={handleForge}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '12px 24px', borderRadius: 12,
                    background: t.gradient, border: 'none',
                    cursor: 'pointer',
                    fontFamily: t.display, fontSize: 14, fontWeight: 700,
                    color: '#FFF',
                    transition: 'transform 0.15s ease',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  <NeonIcon type="fire" size={14} color="#FFF" />
                  {tr('questmap.begin_forging', 'Begin Forging')}
                </button>
              </div>
            </div>
          ) : forgeError ? (
            /* Forge error with retry */
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                marginBottom: 16,
              }}>
                <NeonIcon type="blocked" size={18} color="rose" />
                <span style={{ fontFamily: t.body, fontSize: 14, color: t.rose }}>
                  {forgeError}
                </span>
              </div>
              <button
                onClick={handleForge}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '10px 20px', borderRadius: 12,
                  background: t.gradient, border: 'none', cursor: 'pointer',
                  fontFamily: t.display, fontSize: 13, fontWeight: 700, color: '#FFF',
                }}
              >
                <NeonIcon type="fire" size={14} color="#FFF" />
                {tr('questmap.retry', 'Retry')}
              </button>
            </div>
          ) : (
            <MiniForge
              isForging={isForging}
              onSkip={handleSkipForge}
              progress={sseProgress.percent > 0 ? sseProgress.percent : undefined}
              phase={sseProgress.message || undefined}
            />
          )}
        </div>
      )}

      {/* Tier gate modal */}
      {showTierModal && gate && (
        <RoadmapTierModal
          isOpen
          onClose={() => {
            setShowTierModal(false);
            // If on page entry (not mid-forge), redirect back
            if (step === 1 && !isForging) {
              router.push('/roadmap');
            }
          }}
          tierInfo={{ tier: gate.tier, current: gate.current, limit: gate.limit }}
        />
      )}
    </div>
  );
}
