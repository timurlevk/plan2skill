'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNarrativeStore, useI18nStore } from '@plan2skill/store';
import { t } from '../../../(onboarding)/_components/tokens';
import type { EpisodeCardData } from '@plan2skill/types';
import { trpc } from '@plan2skill/api-client';

// ═══════════════════════════════════════════
// DAILY EPISODE CARD — Narrative system home widget
// Spec §9.2 — gamified card with XP reward
// State: loading → unread → read | dismissed
// Constitution: inline styles, tokens, a11y, ethical, GDPR
// ═══════════════════════════════════════════

// Gold tint from constitution compliance matrix
const GOLD_TINT = 'rgba(255,209,102,0.15)';
const GOLD_BORDER = 'rgba(255,209,102,0.25)';
const SAGE_COLOR = '#B8C4E0';

// XP per category
const CATEGORY_XP: Record<string, number> = {
  standard: 5,
  climax: 10,
  lore_drop: 5,
  character_focus: 5,
  season_finale: 25,
};

type CardState = 'loading' | 'unread' | 'read' | 'dismissed';

export function DailyEpisodeCard() {
  const {
    narrativeMode,
    todayEpisode,
    episodeExpanded,
    episodeDismissed,
    setTodayEpisode,
    expandEpisode,
    dismissEpisode: dismissEpisodeStore,
    markEpisodeRead: markEpisodeReadStore,
    setNarrativeMode,
  } = useNarrativeStore();

  const tr = useI18nStore((s) => s.t);

  // SSR-safe reduced motion detection (Constitution §7)
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Hydration guard
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => { setHydrated(true); }, []);

  // XP float animation
  const [showXpFloat, setShowXpFloat] = useState(false);
  const xpTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Mutation error feedback — auto-clears after 3s
  const [mutationError, setMutationError] = useState<string | null>(null);
  const errorTimerRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (mutationError) {
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
      errorTimerRef.current = setTimeout(() => setMutationError(null), 3000);
    }
    return () => {
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    };
  }, [mutationError]);

  // Read timer for tracking read duration
  const readStartRef = useRef<number | null>(null);

  // tRPC: Fetch today's episode
  const { data: episodeData } = trpc.narrative.todayEpisode.useQuery(
    undefined,
    { enabled: hydrated },
  );

  // tRPC: Mutations
  const markReadMutation = trpc.narrative.markRead.useMutation();
  const dismissMutation = trpc.narrative.dismiss.useMutation();

  // tRPC: Fetch narrative preference
  const { data: prefData } = trpc.narrative.preference.useQuery(
    undefined,
    { enabled: hydrated },
  );

  // Sync tRPC data → store
  useEffect(() => {
    if (episodeData !== undefined) {
      setTodayEpisode(episodeData);
    }
  }, [episodeData, setTodayEpisode]);

  useEffect(() => {
    if (prefData) {
      setNarrativeMode(prefData.narrativeMode);
    }
  }, [prefData, setNarrativeMode]);

  // Determine card state
  const cardState: CardState = !hydrated
    ? 'loading'
    : episodeDismissed
      ? 'dismissed'
      : todayEpisode?.isRead
        ? 'read'
        : 'unread';

  // Handle read action
  const handleRead = useCallback(() => {
    if (!todayEpisode || todayEpisode.isRead) return;

    const durationSec = readStartRef.current
      ? Math.floor((Date.now() - readStartRef.current) / 1000)
      : undefined;

    markEpisodeReadStore();

    // Show XP float
    setShowXpFloat(true);
    if (xpTimerRef.current) clearTimeout(xpTimerRef.current);
    xpTimerRef.current = setTimeout(() => setShowXpFloat(false), 800);

    markReadMutation.mutate(
      {
        episodeId: todayEpisode.id,
        source: 'home' as const,
        durationSec,
      },
      {
        onError: (err: { message: string }) => {
          console.warn('[DailyEpisode] markRead failed:', err.message);
          setMutationError(tr('episode.error_read', 'Could not mark as read. Try again.'));
        },
      },
    );
  }, [todayEpisode, markEpisodeReadStore, markReadMutation]);

  // Handle dismiss
  const handleDismiss = useCallback(() => {
    if (!todayEpisode) return;
    dismissEpisodeStore();
    dismissMutation.mutate(
      { episodeId: todayEpisode.id },
      {
        onError: (err: { message: string }) => {
          console.warn('[DailyEpisode] dismiss failed:', err.message);
          setMutationError(tr('episode.error_dismiss', 'Could not dismiss episode. Try again.'));
        },
      },
    );
  }, [todayEpisode, dismissEpisodeStore, dismissMutation]);

  // Handle expand
  const handleExpand = useCallback(() => {
    expandEpisode();
    readStartRef.current = Date.now();
  }, [expandEpisode]);

  // Keyboard handler
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !episodeExpanded) {
      handleExpand();
    } else if (e.key === 'Escape' && episodeExpanded) {
      // Don't dismiss on Escape if expanded, just collapse
      useNarrativeStore.setState({ episodeExpanded: false });
    }
  }, [episodeExpanded, handleExpand]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (xpTimerRef.current) clearTimeout(xpTimerRef.current);
    };
  }, []);

  // ─── Render nothing for off/dismissed/no-episode ───

  if (!hydrated) return null;
  if (narrativeMode === 'off') return null;
  if (cardState === 'dismissed') return null;
  if (!todayEpisode) return null;

  const xpAmount = CATEGORY_XP[todayEpisode.category] || 5;
  const isRead = todayEpisode.isRead;
  const isMinimal = narrativeMode === 'minimal';

  // ─── Minimal mode: compact banner ───

  if (isMinimal) {
    return (
      <>
        <div
          role="article"
          aria-label={`Episode ${todayEpisode.globalNumber}: ${todayEpisode.title}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '10px 16px',
            background: t.bgCard,
            borderRadius: 12,
            border: `1px solid ${isRead ? t.border : GOLD_BORDER}`,
            marginBottom: mutationError ? 4 : 16,
            animation: reducedMotion ? 'none' : 'fadeUp 0.4s ease',
          }}
        >
          <div style={{
            fontFamily: t.mono, fontSize: 10, fontWeight: 700,
            color: t.textMuted, whiteSpace: 'nowrap',
          }}>
            EP {todayEpisode.globalNumber}
          </div>
          <div style={{
            flex: 1, fontFamily: t.body, fontSize: 14, fontWeight: 600,
            color: t.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {todayEpisode.title}
          </div>
          {!isRead && (
            <button
              onClick={handleRead}
              style={{
                background: 'none', border: `1px solid ${GOLD_BORDER}`,
                borderRadius: 8, padding: '4px 10px', cursor: 'pointer',
                fontFamily: t.mono, fontSize: 10, fontWeight: 700, color: t.gold,
              }}
              aria-label={tr('episode.aria_read', 'Mark as read and earn {n} XP').replace('{n}', String(xpAmount))}
            >
              +{xpAmount} XP
            </button>
          )}
          {isRead && (
            <span style={{
              fontFamily: t.mono, fontSize: 10, fontWeight: 700, color: t.textMuted,
            }}>
              {tr('dashboard.episode_read', '✓ Read')}
            </span>
          )}
          <button
            onClick={handleDismiss}
            aria-label="Dismiss episode"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: t.body, fontSize: 16, color: t.textMuted, padding: '0 4px',
            }}
          >
            &times;
          </button>
        </div>
        {mutationError && (
          <div style={{ fontFamily: t.body, fontSize: 11, color: t.rose, marginTop: 0, marginBottom: 16 }}>
            {mutationError}
          </div>
        )}
      </>
    );
  }

  // ─── Full mode: rich card ───

  return (
    <article
      aria-label={`Episode ${todayEpisode.globalNumber}: ${todayEpisode.title}`}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      style={{
        maxWidth: 480,
        margin: '0 auto 20px',
        background: t.bgCard,
        borderRadius: 20,
        border: `1.5px solid ${isRead ? t.border : GOLD_BORDER}`,
        boxShadow: isRead ? 'none' : `0 4px 24px rgba(255,209,102,0.06)`,
        overflow: 'hidden',
        animation: reducedMotion ? 'none' : 'fadeUp 0.4s ease',
        position: 'relative',
      }}
    >
      {/* XP Float Animation */}
      {showXpFloat && !reducedMotion && (
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: t.display,
            fontSize: 24,
            fontWeight: 900,
            color: t.gold,
            textShadow: '0 0 12px rgba(255,209,102,0.5)',
            animation: 'xpFloat 0.8s ease-out forwards',
            pointerEvents: 'none',
            zIndex: 10,
          }}
        >
          +{xpAmount} XP
        </div>
      )}

      {/* Illustration area */}
      <div style={{
        height: 150,
        background: todayEpisode.illustrationUrl
          ? `url(${todayEpisode.illustrationUrl}) center/cover`
          : `linear-gradient(135deg, ${t.bgElevated}, ${GOLD_TINT})`,
        borderRadius: '16px 16px 0 0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {!todayEpisode.illustrationUrl && (
          <div style={{
            fontFamily: t.display,
            fontSize: 40,
            opacity: 0.15,
            color: t.gold,
          }}>
            &#9733;
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: '16px 20px 20px' }}>
        {/* Episode meta */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 8,
        }}>
          <span style={{
            fontFamily: t.mono, fontSize: 11, fontWeight: 600,
            color: t.textMuted, letterSpacing: '0.03em',
          }}>
            {tr('episode.meta', 'Episode {ep} · Season {s}').replace('{ep}', String(todayEpisode.globalNumber)).replace('{s}', String(todayEpisode.seasonNumber))}
          </span>
          <a
            href="/chronicle"
            style={{
              fontFamily: t.mono, fontSize: 11, fontWeight: 600,
              color: t.cyan, textDecoration: 'none',
              letterSpacing: '0.03em',
            }}
          >
            {tr('dashboard.episode_chronicle', 'Chronicle →')}
          </a>
        </div>

        {/* Title */}
        <h3 style={{
          fontFamily: t.display,
          fontSize: 18,
          fontWeight: 700,
          color: t.text,
          margin: '0 0 10px',
          lineHeight: 1.3,
        }}>
          {todayEpisode.title}
        </h3>

        {/* Context sentence */}
        <p style={{
          fontFamily: t.body,
          fontSize: 13,
          color: t.textMuted,
          fontStyle: 'italic',
          margin: '0 0 12px',
          lineHeight: 1.5,
        }}>
          {todayEpisode.contextSentence}
        </p>

        {/* Body — truncated unless expanded */}
        <div style={{
          fontFamily: t.body,
          fontSize: 14,
          color: t.textSecondary,
          lineHeight: 1.7,
          marginBottom: 12,
        }}>
          {episodeExpanded ? (
            <>
              {todayEpisode.body.split('\n\n').map((para, i) => (
                <p key={i} style={{ margin: '0 0 10px' }}>{para}</p>
              ))}
              {/* Cliffhanger */}
              <p style={{
                fontWeight: 600, color: t.text,
                margin: '12px 0 0',
              }}>
                {todayEpisode.cliffhanger}
              </p>
            </>
          ) : (
            <>
              <p style={{ margin: 0 }}>
                {todayEpisode.body.split('\n\n')[0]}
              </p>
              <button
                onClick={handleExpand}
                aria-expanded={false}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontFamily: t.body, fontSize: 13, fontWeight: 600,
                  color: t.cyan, padding: '8px 0 0', display: 'block',
                }}
              >
                {tr('dashboard.episode_readmore', 'Read More ▼')}
              </button>
            </>
          )}
        </div>

        {/* Sage Reflection — always visible when expanded or read */}
        {(episodeExpanded || isRead) && (
          <div style={{
            borderLeft: `2px solid ${t.gold}`,
            paddingLeft: 12,
            marginBottom: 16,
            animation: reducedMotion ? 'none' : 'fadeUp 0.3s ease',
          }}>
            <p style={{
              fontFamily: t.body,
              fontSize: 13,
              fontStyle: 'italic',
              color: SAGE_COLOR,
              lineHeight: 1.6,
              margin: 0,
            }}>
              {todayEpisode.sageReflection}
            </p>
          </div>
        )}

        {/* Actions */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: 4,
        }}>
          {!isRead ? (
            <button
              onClick={handleRead}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: `${t.gold}15`,
                border: `1px solid ${GOLD_BORDER}`,
                borderRadius: 10,
                padding: '8px 16px',
                cursor: 'pointer',
                fontFamily: t.mono, fontSize: 12, fontWeight: 700,
                color: t.gold,
                transition: 'background 0.15s ease',
              }}
              aria-label={tr('episode.aria_read', 'Mark as read and earn {n} XP').replace('{n}', String(xpAmount))}
            >
              +{xpAmount} XP {tr('dashboard.episode_read', '✓ Read')}
            </button>
          ) : (
            <span style={{
              display: 'flex', alignItems: 'center', gap: 6,
              fontFamily: t.mono, fontSize: 12, fontWeight: 700,
              color: t.textMuted,
            }}>
              {tr('dashboard.episode_read', '✓ Read')}
            </span>
          )}

          <button
            onClick={handleDismiss}
            aria-label="Dismiss episode"
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              background: 'none', border: 'none',
              cursor: 'pointer',
              fontFamily: t.body, fontSize: 12,
              color: t.textMuted,
              padding: '8px 12px',
            }}
          >
            {tr('dashboard.episode_dismiss', 'Dismiss')} &times;
          </button>
        </div>
      </div>

      {/* Mutation error feedback */}
      {mutationError && (
        <div style={{
          padding: '0 20px 12px',
          fontFamily: t.body, fontSize: 11, color: t.rose,
        }}>
          {mutationError}
        </div>
      )}

      {/* Keyframe styles */}
      <style>{`
        @keyframes xpFloat {
          0% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          100% { opacity: 0; transform: translate(-50%, -120%) scale(1.3); }
        }
      `}</style>
    </article>
  );
}
