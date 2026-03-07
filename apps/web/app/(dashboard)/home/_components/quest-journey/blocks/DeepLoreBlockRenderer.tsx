'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { t } from '../../../../../(onboarding)/_components/tokens';
import { NeonIcon } from '../../../../../(onboarding)/_components/NeonIcon';
import { useI18nStore } from '@plan2skill/store';
import type { DeepLoreBlock } from '@plan2skill/types';

interface DeepLoreBlockRendererProps {
  block: DeepLoreBlock;
}

export function DeepLoreBlockRenderer({ block }: DeepLoreBlockRendererProps) {
  const tr = useI18nStore((s) => s.t);
  const [isExpanded, setIsExpanded] = useState(false);
  const [contentHeight, setContentHeight] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, [block.body, isExpanded]);

  const toggleExpanded = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  const transitionDuration = prefersReducedMotion ? '0s' : '0.3s';

  return (
    <div
      style={{
        borderRadius: 12,
        backgroundColor: `${t.rose}06`,
        borderWidth: 1,
        borderStyle: 'solid',
        borderColor: `${t.rose}20`,
        marginBottom: 20,
        overflow: 'hidden',
      }}
    >
      {/* Header (clickable) */}
      <button
        onClick={toggleExpanded}
        type="button"
        aria-expanded={isExpanded}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          width: '100%',
          padding: 14,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <NeonIcon type="compass" size={16} color={t.rose} />
        <span
          style={{
            fontFamily: t.display,
            fontSize: 13,
            fontWeight: 700,
            color: t.rose,
            lineHeight: 1.3,
            flex: 1,
          }}
        >
          {tr('quest.deepLore.label', 'Deep Lore')}: {block.title}
        </span>
        {/* Chevron indicator */}
        <svg
          width={14}
          height={14}
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          style={{
            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: `transform ${transitionDuration} ease`,
            flexShrink: 0,
          }}
        >
          <path
            d="M6 9l6 6 6-6"
            stroke={t.rose}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* Collapsible body */}
      <div
        style={{
          maxHeight: isExpanded ? contentHeight : 0,
          overflow: 'hidden',
          transition: `max-height ${transitionDuration} ease`,
        }}
      >
        <div ref={contentRef} style={{ padding: '0 14px 14px 14px' }}>
          <p
            style={{
              fontFamily: t.body,
              fontSize: 13,
              color: t.textSecondary,
              lineHeight: 1.6,
              margin: 0,
              whiteSpace: 'pre-wrap',
            }}
          >
            {block.body}
          </p>
        </div>
      </div>
    </div>
  );
}
