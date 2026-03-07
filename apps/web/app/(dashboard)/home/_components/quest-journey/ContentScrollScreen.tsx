'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { t } from '../../../../(onboarding)/_components/tokens';
import { NeonIcon } from '../../../../(onboarding)/_components/NeonIcon';
import { NPCInline } from '../../../../(onboarding)/_components/NPCBubble';
import { useI18nStore } from '@plan2skill/store';
import type { ContentBlock } from '@plan2skill/types';
import { BlockRenderer } from './blocks/BlockRenderer';

// ===================================================
// CONTENT SCROLL SCREEN -- Renders content blocks
// sequentially, tracks reading progress via
// IntersectionObserver, and gates "Continue to Trial"
// behind >=80% blocks read.
// ===================================================

interface ContentScrollScreenProps {
  contentBlocks: ContentBlock[] | null;
  articleBody: string | null;
  onContinue: () => void;
  characterId: string | null;
}

/** Simple markdown fallback renderer (basic paragraphs, bold, headers) */
function ArticleFallback({ body }: { body: string }) {
  const paragraphs = body.split(/\n\n+/);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {paragraphs.map((paragraph, i) => {
        const trimmed = paragraph.trim();
        if (!trimmed) return null;

        // Simple heading detection
        const h2Match = trimmed.match(/^##\s+(.+)/);
        if (h2Match) {
          const heading = h2Match[1];
          if (!heading) return null;
          return (
            <h3 key={i} style={{
              fontFamily: t.display,
              fontSize: 16,
              fontWeight: 700,
              color: t.text,
              margin: '8px 0 0 0',
            }}>
              {heading}
            </h3>
          );
        }

        const h1Match = trimmed.match(/^#\s+(.+)/);
        if (h1Match) {
          const heading = h1Match[1];
          if (!heading) return null;
          return (
            <h2 key={i} style={{
              fontFamily: t.display,
              fontSize: 18,
              fontWeight: 700,
              color: t.text,
              margin: '8px 0 0 0',
            }}>
              {heading}
            </h2>
          );
        }

        // Code block detection
        if (trimmed.startsWith('```')) {
          const lines = trimmed.split('\n');
          const code = lines.slice(1, -1).join('\n');
          return (
            <pre key={i} style={{
              fontFamily: t.mono,
              fontSize: 13,
              color: t.cyan,
              lineHeight: 1.5,
              padding: '12px 16px',
              borderRadius: 10,
              background: '#0D0D14',
              border: `1px solid ${t.border}`,
              overflow: 'auto',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              margin: 0,
            }}>
              {code}
            </pre>
          );
        }

        // Regular paragraph
        return (
          <p key={i} style={{
            fontFamily: t.body,
            fontSize: 14,
            color: t.textSecondary,
            lineHeight: 1.6,
            margin: 0,
          }}>
            {trimmed}
          </p>
        );
      })}
    </div>
  );
}

export function ContentScrollScreen({
  contentBlocks,
  articleBody,
  onContinue,
  characterId,
}: ContentScrollScreenProps) {
  const tr = useI18nStore((s) => s.t);

  // Determine items to track
  const blocks = contentBlocks ?? [];
  const hasBlocks = blocks.length > 0;
  const totalItems = hasBlocks ? blocks.length : 1; // articleBody counts as 1

  // Track which blocks have been read (entered viewport)
  const [readSet, setReadSet] = useState<Set<number>>(() => new Set());
  const blockRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // NPC encouragement at midpoint
  const midpoint = Math.floor(totalItems / 2);
  const showMidpointNpc = hasBlocks && readSet.size >= midpoint && readSet.size < totalItems;

  // Progress
  const readCount = readSet.size;
  const readPercent = totalItems > 0 ? readCount / totalItems : 0;
  const canContinue = readPercent >= 0.8 || totalItems <= 1;

  // IntersectionObserver to track block visibility
  useEffect(() => {
    if (!hasBlocks) {
      // If no blocks, mark the single articleBody as read
      setReadSet(new Set([0]));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = Number(entry.target.getAttribute('data-block-index'));
            if (!isNaN(idx)) {
              setReadSet((prev) => {
                if (prev.has(idx)) return prev;
                const next = new Set(prev);
                next.add(idx);
                return next;
              });
            }
          }
        });
      },
      {
        root: scrollContainerRef.current,
        threshold: 0.5,
      },
    );

    // Observe all block refs
    blockRefs.current.forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, [hasBlocks, blocks.length]);

  // Callback ref to register block DOM nodes
  const setBlockRef = useCallback((index: number, el: HTMLDivElement | null) => {
    if (el) {
      blockRefs.current.set(index, el);
    } else {
      blockRefs.current.delete(index);
    }
  }, []);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      animation: 'fadeUp 0.4s ease-out',
    }}>
      {/* Progress header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 0 12px 0',
        borderBottom: `1px solid ${t.border}`,
        marginBottom: 12,
        flexShrink: 0,
      }}>
        <span style={{
          fontFamily: t.mono,
          fontSize: 12,
          fontWeight: 600,
          color: t.textSecondary,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}>
          <NeonIcon type="scroll" size={14} color="cyan" />
          {tr('quest.content.progress', '{read} of {total} scrolls').replace('{read}', String(readCount)).replace('{total}', String(totalItems))}
        </span>

        {/* Progress bar */}
        <div style={{
          width: 100,
          height: 4,
          borderRadius: 2,
          background: t.border,
          overflow: 'hidden',
        }}>
          <div style={{
            width: `${Math.round(readPercent * 100)}%`,
            height: '100%',
            borderRadius: 2,
            background: canContinue ? t.mint : t.cyan,
            transition: 'width 0.3s ease',
          }} />
        </div>
      </div>

      {/* Scrollable content area */}
      <div
        ref={scrollContainerRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          paddingBottom: 16,
          // Custom scrollbar styling
          scrollbarWidth: 'thin' as 'thin',
          scrollbarColor: `${t.border} transparent`,
        }}
      >
        {hasBlocks ? (
          <>
            {blocks.map((block, i) => (
              <React.Fragment key={i}>
                <div
                  ref={(el) => setBlockRef(i, el)}
                  data-block-index={i}
                  style={{
                    opacity: readSet.has(i) ? 1 : 0.7,
                    transition: 'opacity 0.3s ease',
                  }}
                >
                  <BlockRenderer block={block} onVisible={() => {
                    setReadSet((prev) => {
                      if (prev.has(i)) return prev;
                      const next = new Set(prev);
                      next.add(i);
                      return next;
                    });
                  }} />
                </div>

                {/* NPC encouragement at midpoint */}
                {i === midpoint && showMidpointNpc && (
                  <NPCInline
                    characterId="sage"
                    message={tr(
                      'quest.content.midpoint',
                      'Great progress, hero! You\'re halfway through the material. Keep going!',
                    )}
                    emotion="happy"
                  />
                )}
              </React.Fragment>
            ))}
          </>
        ) : articleBody ? (
          <div
            ref={(el) => setBlockRef(0, el)}
            data-block-index={0}
          >
            <ArticleFallback body={articleBody} />
          </div>
        ) : (
          <div style={{
            padding: '40px 20px',
            textAlign: 'center' as const,
          }}>
            <NeonIcon type="book" size={32} color="muted" />
            <p style={{
              fontFamily: t.body,
              fontSize: 14,
              color: t.textMuted,
              marginTop: 12,
            }}>
              {tr('quest.content.no_content', 'Content is being prepared...')}
            </p>
          </div>
        )}
      </div>

      {/* Continue to Trial button */}
      <div style={{
        paddingTop: 12,
        borderTop: `1px solid ${t.border}`,
        flexShrink: 0,
      }}>
        <button
          onClick={onContinue}
          disabled={!canContinue}
          style={{
            width: '100%',
            padding: '13px 24px',
            borderRadius: 12,
            border: 'none',
            background: canContinue ? t.gradient : t.bgElevated,
            color: canContinue ? '#FFFFFF' : t.textMuted,
            fontFamily: t.display,
            fontSize: 15,
            fontWeight: 700,
            cursor: canContinue ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            transition: 'transform 0.15s ease, opacity 0.3s ease',
            opacity: canContinue ? 1 : 0.5,
            boxShadow: canContinue ? '0 4px 16px rgba(157,122,255,0.25)' : 'none',
          }}
          onMouseDown={(e) => {
            if (canContinue) e.currentTarget.style.transform = 'scale(0.97)';
          }}
          onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
        >
          <NeonIcon type="swords" size={16} color={canContinue ? 'text' : 'muted'} />
          {tr('quest.content.continue_trial', 'Continue to Trial')}
        </button>

        {!canContinue && (
          <p style={{
            fontFamily: t.body,
            fontSize: 11,
            color: t.textMuted,
            textAlign: 'center' as const,
            marginTop: 6,
            marginBottom: 0,
          }}>
            {tr('quest.content.read_more', 'Read at least 80% of the material to continue')}
          </p>
        )}
      </div>
    </div>
  );
}
