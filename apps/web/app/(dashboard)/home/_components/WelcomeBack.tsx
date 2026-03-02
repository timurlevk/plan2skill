'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { NeonIcon } from '../../../(onboarding)/_components/NeonIcon';
import { t, rarity } from '../../../(onboarding)/_components/tokens';
import { CHARACTERS, charArtStrings, charPalettes } from '../../../(onboarding)/_components/characters';
import { parseArt, PixelCanvas } from '../../../(onboarding)/_components/PixelEngine';
import type { QuestTask } from '../_utils/quest-templates';
import { TYPE_ICONS } from '../_utils/quest-templates';

// ═══════════════════════════════════════════
// WELCOME BACK — Interactive Return Flow (UX-R102)
// Tiered warm-up quest based on absence duration
// No guilt trip, always positive framing (UX-R141)
// Door-to-quest < 8s — warm-up is top of dashboard (UX-R100)
// Endowed Progress pattern (UX-R105)
// ═══════════════════════════════════════════

export interface WelcomeBackProps {
  lastActivityDate: string | null;
  characterId: string | null;
  characterName: string;
  warmupQuest: QuestTask | null;
  isQuestCompleted: boolean;
  onStartQuest: (questId: string) => void;
  onCompleteQuest: (questId: string, xp: number) => void;
  onChooseDifferent: () => void;
  daysAbsent: number;
  isFirstVisit?: boolean; // BL-001: onboardingCompletedAt exists AND lastActivityDate === null
}

export function getDaysSince(dateStr: string | null): number {
  if (!dateStr) return 999;
  const last = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - last.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

interface WelcomeConfig {
  greeting: string;
  subtitle: string;
  showWarmup: boolean;
  showBonus: boolean;
  showRefreshGoals: boolean;
}

function getWelcomeConfig(days: number, name: string, isFirstVisit: boolean): WelcomeConfig | null {
  // BL-001: First visit after onboarding — unique celebration (UX-R105: endowed progress)
  if (isFirstVisit) return {
    greeting: `Your adventure begins, ${name}!`,
    subtitle: 'Your first quest awaits, hero!',
    showWarmup: true,
    showBonus: false, // No bonus badge for first visit — no comparison baseline
    showRefreshGoals: false,
  };
  if (days < 1) return null; // Same day — no special greeting
  if (days <= 3) return {
    greeting: `Ready for more, ${name}?`,
    subtitle: 'Your quests await, hero!',
    showWarmup: false,
    showBonus: false,
    showRefreshGoals: false,
  };
  if (days <= 7) return {
    greeting: `We missed you, ${name}!`,
    subtitle: 'Pick up where you left off with an easy quest.',
    showWarmup: true,
    showBonus: false,
    showRefreshGoals: false,
  };
  if (days <= 30) return {
    greeting: `Let's refresh, ${name}!`,
    subtitle: 'Start with something light to rebuild momentum.',
    showWarmup: true,
    showBonus: true,
    showRefreshGoals: false,
  };
  return {
    greeting: `Welcome back, ${name}!`,
    subtitle: 'Great to see you again! Ready for a fresh start?',
    showWarmup: true,
    showBonus: true,
    showRefreshGoals: true,
  };
}

export function WelcomeBack({
  lastActivityDate, characterId, characterName,
  warmupQuest, isQuestCompleted,
  onStartQuest, onCompleteQuest, onChooseDifferent,
  daysAbsent, isFirstVisit = false,
}: WelcomeBackProps) {
  const [dismissed, setDismissed] = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);
  const days = daysAbsent;
  const config = getWelcomeConfig(days, characterName, isFirstVisit);

  const charData = useMemo(() => {
    if (!characterId || !charArtStrings[characterId] || !charPalettes[characterId]) return null;
    return parseArt(charArtStrings[characterId]!, charPalettes[characterId]!);
  }, [characterId]);
  const charMeta = CHARACTERS.find(c => c.id === characterId);

  // Auto-dismiss after inline completion (2s delay)
  useEffect(() => {
    if (justCompleted) {
      const timer = setTimeout(() => setDismissed(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [justCompleted]);

  const handleInlineComplete = useCallback(() => {
    if (!warmupQuest || isQuestCompleted) return;
    onCompleteQuest(warmupQuest.id, warmupQuest.xp);
    setJustCompleted(true);
  }, [warmupQuest, isQuestCompleted, onCompleteQuest]);

  if (!config || dismissed) return null;

  const showWarmupCard = config.showWarmup && warmupQuest;
  const questDone = isQuestCompleted || justCompleted;
  const r = warmupQuest ? rarity[warmupQuest.rarity] : null;
  const typeIcon = warmupQuest ? TYPE_ICONS[warmupQuest.type] : null;

  return (
    <div
      role="status"
      aria-label={config.greeting}
      style={{
        padding: '16px 20px', borderRadius: 16,
        background: t.bgCard, border: `1px solid ${isFirstVisit ? `${t.violet}40` : `${t.violet}20`}`,
        boxShadow: isFirstVisit ? `0 0 30px ${t.violet}15, 0 0 60px ${t.cyan}08` : `0 0 20px ${t.violet}08`,
        marginBottom: 24,
        animation: isFirstVisit ? 'celebratePop 0.6s ease-out' : 'fadeUp 0.5s ease-out',
        position: 'relative',
      }}
    >
      {/* Top row: character + greeting + dismiss */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {/* Character companion */}
        {charData && (
          <div style={{
            flexShrink: 0,
            filter: `drop-shadow(0 0 6px ${charMeta?.color || t.violet}30)`,
            animation: 'float 3s ease-in-out infinite',
          }}>
            <PixelCanvas data={charData} size={3} />
          </div>
        )}

        {/* Greeting text */}
        <div style={{ flex: 1 }}>
          <div style={{
            fontFamily: t.display, fontSize: 16, fontWeight: 800,
            color: t.text, marginBottom: 2,
          }}>
            {config.greeting}
          </div>
          <div style={{
            fontFamily: t.body, fontSize: 13, color: t.textSecondary,
          }}>
            {config.subtitle}
          </div>
        </div>

        {/* Dismiss button — 44px touch target (UX-R153) */}
        <button
          onClick={() => setDismissed(true)}
          aria-label="Dismiss welcome message"
          style={{
            width: 28, height: 28, borderRadius: '50%',
            background: t.border, border: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', flexShrink: 0,
            minWidth: 44, minHeight: 44,
            margin: '-8px -12px -8px 0',
          }}
        >
          <NeonIcon type="close" size={10} color="muted" />
        </button>
      </div>

      {/* Warm-up quest card (4+ days absent, quest available) */}
      {showWarmupCard && (
        <div style={{
          marginTop: 14,
          padding: '12px 14px',
          borderRadius: 12,
          background: `${t.bgElevated}`,
          border: `1px solid ${questDone ? `${t.cyan}30` : `${t.border}`}`,
          transition: 'border-color 0.3s ease, background 0.3s ease',
        }}>
          {/* Quest info row */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            {/* Quest type icon */}
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: questDone ? `${t.cyan}15` : `${r?.color || t.violet}12`,
              flexShrink: 0, marginTop: 1,
            }}>
              <NeonIcon
                type={questDone ? 'check' : (typeIcon?.icon || 'book')}
                size={16}
                color={questDone ? 'cyan' : 'violet'}
              />
            </div>

            {/* Quest title + meta */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontFamily: t.display, fontSize: 13, fontWeight: 700,
                color: questDone ? t.textMuted : t.text,
                textDecoration: questDone ? 'line-through' : 'none',
                lineHeight: 1.3,
                transition: 'color 0.3s ease',
              }}>
                {questDone ? 'Quest Complete!' : warmupQuest.title}
              </div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                marginTop: 4, flexWrap: 'wrap',
              }}>
                {/* Rarity badge (double-coded: color + icon) */}
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 3,
                  fontFamily: t.mono, fontSize: 9, fontWeight: 700,
                  padding: '2px 8px', borderRadius: 8,
                  color: questDone ? t.textMuted : r?.color,
                  background: questDone ? `${t.textMuted}10` : `${r?.color}10`,
                  textTransform: 'uppercase' as const,
                }}>
                  {r?.icon} {r?.label?.toLowerCase()}
                </span>

                {/* Duration */}
                <span style={{
                  fontFamily: t.body, fontSize: 11, color: t.textMuted,
                }}>
                  {warmupQuest.mins} min
                </span>

                {/* XP reward */}
                <span style={{
                  fontFamily: t.mono, fontSize: 11, fontWeight: 700,
                  color: questDone ? t.textMuted : t.gold,
                }}>
                  +{warmupQuest.xp} XP
                </span>
              </div>
            </div>
          </div>

          {/* Action row: checkbox + open quest */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            marginTop: 12,
          }}>
            {/* Inline complete checkbox — 44px touch target (UX-R153) */}
            <button
              onClick={handleInlineComplete}
              disabled={questDone}
              aria-label={questDone ? 'Quest completed' : `Complete quest: ${warmupQuest.title}`}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 14px', borderRadius: 10,
                background: questDone ? `${t.cyan}15` : `${t.violet}12`,
                border: `1px solid ${questDone ? `${t.cyan}30` : `${t.violet}25`}`,
                cursor: questDone ? 'default' : 'pointer',
                minHeight: 44, minWidth: 44,
                fontFamily: t.body, fontSize: 12, fontWeight: 700,
                color: questDone ? t.cyan : t.violet,
                transition: 'all 0.2s ease',
                opacity: questDone ? 0.7 : 1,
              }}
            >
              <span style={{
                width: 18, height: 18, borderRadius: 5,
                border: `2px solid ${questDone ? t.cyan : t.violet}60`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: questDone ? `${t.cyan}20` : 'transparent',
                transition: 'all 0.2s ease',
              }}>
                {questDone && <NeonIcon type="check" size={10} color="cyan" />}
              </span>
              {questDone ? 'Completed' : 'Complete'}
            </button>

            {/* Open quest details — Session Extension CTA (UX-R108) */}
            {!questDone && (
              <button
                onClick={() => onStartQuest(warmupQuest.id)}
                aria-label={`Open quest details: ${warmupQuest.title}`}
                style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  padding: '6px 14px', borderRadius: 10,
                  background: 'transparent',
                  border: `1px solid ${t.border}`,
                  cursor: 'pointer',
                  minHeight: 44,
                  fontFamily: t.body, fontSize: 12, fontWeight: 600,
                  color: t.textSecondary,
                  transition: 'all 0.2s ease',
                }}
              >
                Open quest details
                <NeonIcon type="compass" size={11} color="secondary" />
              </button>
            )}
          </div>

          {/* Welcome back bonus badge — visual only, shown for 7+ days (UX-R105) */}
          {config.showBonus && !questDone && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              marginTop: 10, padding: '5px 12px', borderRadius: 10,
              background: `${t.gold}08`, border: `1px solid ${t.gold}18`,
              animation: 'shimmer 2s ease-in-out infinite',
            }}>
              <NeonIcon type="gift" size={12} color="gold" />
              <span style={{
                fontFamily: t.body, fontSize: 11, fontWeight: 700, color: t.gold,
              }}>
                Welcome back bonus: 2x XP!
              </span>
            </div>
          )}

          {/* Refresh goals link — 30+ days */}
          {config.showRefreshGoals && !questDone && (
            <div style={{ marginTop: 8 }}>
              <button
                onClick={onChooseDifferent}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontFamily: t.body, fontSize: 11, fontWeight: 600,
                  color: t.textMuted, textDecoration: 'underline',
                  textUnderlineOffset: 3, padding: '4px 0',
                  minHeight: 44, display: 'inline-flex', alignItems: 'center',
                }}
              >
                Refresh goals?
              </button>
            </div>
          )}
        </div>
      )}

      {/* "Choose a different quest" link — scrolls to DailyQuests */}
      {showWarmupCard && !questDone && (
        <div style={{ textAlign: 'center', marginTop: 10 }}>
          <button
            onClick={onChooseDifferent}
            aria-label="Choose a different quest — scroll to Today's Quests"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: t.body, fontSize: 11, fontWeight: 600,
              color: t.textMuted, padding: '4px 8px',
              minHeight: 44, display: 'inline-flex', alignItems: 'center',
              transition: 'color 0.2s ease',
            }}
          >
            Choose a different quest
          </button>
        </div>
      )}
    </div>
  );
}
