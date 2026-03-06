'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useNarrativeStore, useI18nStore } from '@plan2skill/store';
import { t } from '../../(onboarding)/_components/tokens';
import type { EpisodeCardData, SeasonSummary } from '@plan2skill/types';
import { trpc } from '@plan2skill/api-client';

// ═══════════════════════════════════════════
// CHRONICLE ARCHIVE — The Chronicle of Lumen
// Spec §13.1 — Season selector + episode list + inline reader
// Constitution: gamified (QuestPage pattern), inline styles,
// RPG vocabulary, a11y, reduced motion
// ═══════════════════════════════════════════

const GOLD_TINT = 'rgba(255,209,102,0.15)';
const SAGE_COLOR = '#B8C4E0';

export default function ChroniclePage() {
  const tr = useI18nStore((s) => s.t);
  const { narrativeMode, setNarrativeMode: setModeStore } = useNarrativeStore();

  // Narrative mode toggle — persists to server
  const setModeMutation = trpc.narrative.setMode.useMutation();
  const handleSetMode = useCallback((mode: 'full' | 'minimal' | 'off') => {
    const prevMode = narrativeMode;
    setModeStore(mode);
    setModeMutation.mutate({ mode }, {
      onError: () => { setModeStore(prevMode); },
    });
  }, [narrativeMode, setModeStore, setModeMutation]);

  // SSR-safe reduced motion
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

  // tRPC: Fetch seasons
  const { data: seasonsData } = trpc.narrative.seasons.useQuery();
  const seasons: SeasonSummary[] = seasonsData ?? [];

  const [selectedSeason, setSelectedSeason] = useState<string>('');
  const [expandedEpisode, setExpandedEpisode] = useState<string | null>(null);

  // Auto-select first season when data loads
  useEffect(() => {
    if (seasons.length > 0 && !selectedSeason) {
      setSelectedSeason(seasons[0]!.id);
    }
  }, [seasons, selectedSeason]);

  // tRPC: Fetch episodes for selected season
  const { data: episodesData, isLoading: loading } = trpc.narrative.seasonEpisodes.useQuery(
    { seasonId: selectedSeason },
    { enabled: !!selectedSeason },
  );
  const episodes: EpisodeCardData[] = episodesData ?? [];

  // Toggle episode expansion
  const toggleEpisode = useCallback((episodeId: string) => {
    setExpandedEpisode((prev) => (prev === episodeId ? null : episodeId));
  }, []);

  if (!hydrated) return null;

  const currentSeason = seasons.find((s) => s.id === selectedSeason);

  return (
    <div style={{
      maxWidth: 640,
      margin: '0 auto',
      padding: '0 16px',
      animation: reducedMotion ? 'none' : 'fadeUp 0.4s ease',
    }}>
      {/* Page Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{
          fontFamily: t.display,
          fontSize: 24,
          fontWeight: 800,
          color: t.text,
          marginBottom: 6,
        }}>
          {tr('chronicle.title')}
        </h1>
        <p style={{
          fontFamily: t.body,
          fontSize: 14,
          color: t.textSecondary,
          lineHeight: 1.5,
        }}>
          {tr('chronicle.subtitle')}
        </p>
      </div>

      {/* Season Selector */}
      {seasons.length > 1 && (
        <div style={{
          display: 'flex',
          gap: 8,
          marginBottom: 20,
          overflowX: 'auto',
        }}>
          {seasons.map((season) => (
            <button
              key={season.id}
              onClick={() => setSelectedSeason(season.id)}
              style={{
                background: selectedSeason === season.id ? `${t.violet}15` : t.bgCard,
                border: `1px solid ${selectedSeason === season.id ? t.violet : t.border}`,
                borderRadius: 10,
                padding: '8px 16px',
                cursor: 'pointer',
                fontFamily: t.body,
                fontSize: 13,
                fontWeight: selectedSeason === season.id ? 700 : 500,
                color: selectedSeason === season.id ? t.text : t.textSecondary,
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
              }}
            >
              {tr('chronicle.season_title').replace('{n}', String(season.seasonNumber)).replace('{title}', season.title)}
            </button>
          ))}
        </div>
      )}

      {/* Season Info */}
      {currentSeason && (
        <div style={{
          background: t.bgCard,
          borderRadius: 14,
          border: `1px solid ${t.border}`,
          padding: '14px 18px',
          marginBottom: 20,
        }}>
          <div style={{
            fontFamily: t.mono,
            fontSize: 10,
            fontWeight: 700,
            color: t.gold,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            marginBottom: 6,
          }}>
            {tr('chronicle.season_label').replace('{n}', String(currentSeason.seasonNumber)).replace('{count}', String(currentSeason.episodeCount))}
          </div>
          <p style={{
            fontFamily: t.body,
            fontSize: 13,
            color: t.textSecondary,
            lineHeight: 1.5,
            margin: 0,
          }}>
            {currentSeason.description}
          </p>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                height: 72,
                background: t.bgCard,
                borderRadius: 12,
                border: `1px solid ${t.border}`,
                animation: reducedMotion ? 'none' : 'pulse 1.5s ease-in-out infinite',
              }}
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && episodes.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '48px 20px',
          background: t.bgCard,
          borderRadius: 16,
          border: `1px solid ${t.border}`,
        }}>
          <div style={{
            fontFamily: t.display, fontSize: 32, marginBottom: 12,
            opacity: 0.3, color: t.gold,
          }}>
            &#9733;
          </div>
          <p style={{
            fontFamily: t.body, fontSize: 14, color: t.textMuted,
            lineHeight: 1.5,
          }}>
            {tr('chronicle.empty')}
          </p>
        </div>
      )}

      {/* Episode List */}
      {!loading && episodes.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {episodes.map((ep, index) => {
            const isExpanded = expandedEpisode === ep.id;

            return (
              <article
                key={ep.id}
                aria-label={`Episode ${ep.globalNumber}: ${ep.title}`}
                style={{
                  background: t.bgCard,
                  borderRadius: 14,
                  border: `1px solid ${isExpanded ? `${t.gold}30` : t.border}`,
                  overflow: 'hidden',
                  transition: 'border-color 0.2s ease',
                  animation: reducedMotion ? 'none' : `fadeUp 0.3s ease ${index * 0.05}s both`,
                }}
              >
                {/* Episode header — clickable */}
                <button
                  onClick={() => toggleEpisode(ep.id)}
                  aria-expanded={isExpanded}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '14px 16px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  {/* Episode number */}
                  <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: ep.isRead ? `${t.textMuted}12` : GOLD_TINT,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: t.mono,
                    fontSize: 12,
                    fontWeight: 700,
                    color: ep.isRead ? t.textMuted : t.gold,
                    flexShrink: 0,
                  }}>
                    {ep.globalNumber}
                  </div>

                  {/* Title + context */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontFamily: t.display,
                      fontSize: 14,
                      fontWeight: 700,
                      color: t.text,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {ep.title}
                    </div>
                    <div style={{
                      fontFamily: t.body,
                      fontSize: 12,
                      color: t.textMuted,
                      marginTop: 2,
                    }}>
                      {ep.contextSentence}
                    </div>
                  </div>

                  {/* Status badge */}
                  <div style={{
                    fontFamily: t.mono,
                    fontSize: 10,
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: 6,
                    flexShrink: 0,
                    ...(ep.isRead
                      ? { color: t.textMuted, background: `${t.textMuted}12` }
                      : { color: t.gold, background: GOLD_TINT }),
                  }}>
                    {ep.isRead ? `✓ ${tr('chronicle.read')}` : tr('chronicle.new')}
                  </div>
                </button>

                {/* Expanded content — inline reader */}
                {isExpanded && (
                  <div style={{
                    padding: '0 16px 16px',
                    borderTop: `1px solid ${t.border}`,
                    animation: reducedMotion ? 'none' : 'fadeUp 0.3s ease',
                  }}>
                    <div style={{
                      fontFamily: t.body,
                      fontSize: 14,
                      color: t.textSecondary,
                      lineHeight: 1.7,
                      paddingTop: 14,
                    }}>
                      {ep.body.split('\n\n').map((para, i) => (
                        <p key={i} style={{ margin: '0 0 10px' }}>{para}</p>
                      ))}

                      {/* Cliffhanger */}
                      <p style={{
                        fontWeight: 600,
                        color: t.text,
                        margin: '14px 0',
                      }}>
                        {ep.cliffhanger}
                      </p>

                      {/* Sage Reflection */}
                      <div style={{
                        borderLeft: `2px solid ${t.gold}`,
                        paddingLeft: 12,
                        marginTop: 14,
                      }}>
                        <p style={{
                          fontFamily: t.body,
                          fontSize: 13,
                          fontStyle: 'italic',
                          color: SAGE_COLOR,
                          lineHeight: 1.6,
                          margin: 0,
                        }}>
                          {ep.sageReflection}
                        </p>
                      </div>
                    </div>

                    {/* Read time */}
                    <div style={{
                      fontFamily: t.mono,
                      fontSize: 10,
                      color: t.textMuted,
                      marginTop: 12,
                    }}>
                      ~{Math.ceil(ep.readTimeSeconds / 60)} min read
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      {/* Narrative Mode Toggle */}
      <div style={{
        marginTop: 28,
        padding: '16px 20px',
        background: t.bgCard,
        borderRadius: 16,
        border: `1px solid ${t.border}`,
      }}>
        <div style={{
          fontFamily: t.mono, fontSize: 10, fontWeight: 700,
          color: t.textMuted, letterSpacing: '0.1em',
          textTransform: 'uppercase',
          marginBottom: 10,
        }}>
          {tr('chronicle.narrative_mode')}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['full', 'minimal', 'off'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => handleSetMode(mode)}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: 10,
                border: `1px solid ${narrativeMode === mode ? t.violet : t.border}`,
                background: narrativeMode === mode ? `${t.violet}15` : 'transparent',
                cursor: 'pointer',
                fontFamily: t.body,
                fontSize: 12,
                fontWeight: narrativeMode === mode ? 700 : 500,
                color: narrativeMode === mode ? t.text : t.textMuted,
                textTransform: 'capitalize',
                transition: 'all 0.15s ease',
              }}
            >
              {mode}
            </button>
          ))}
        </div>
        {narrativeMode === 'off' && (
          <p style={{
            fontFamily: t.body, fontSize: 12, color: t.textMuted,
            marginTop: 8, marginBottom: 0,
          }}>
            {tr('chronicle.narrative_off_warning')}
          </p>
        )}
      </div>

      {/* Keyframe styles */}
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
