'use client';

import React, { useState, useCallback } from 'react';
import { t } from '../../../../../(onboarding)/_components/tokens';
import { useI18nStore } from '@plan2skill/store';
import type { CodeBlock } from '@plan2skill/types';

interface CodeBlockRendererProps {
  block: CodeBlock;
}

export function CodeBlockRenderer({ block }: CodeBlockRendererProps) {
  const tr = useI18nStore((s) => s.t);
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    void navigator.clipboard.writeText(block.code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [block.code]);

  return (
    <div style={{ marginBottom: 20, position: 'relative' }}>
      <div style={{ position: 'relative' }}>
        {/* Language badge + Copy button row */}
        <div
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            zIndex: 1,
          }}
        >
          <span
            style={{
              fontFamily: t.mono,
              fontSize: 10,
              color: t.violet,
              padding: '2px 8px',
              borderRadius: 8,
              backgroundColor: `${t.violet}15`,
              lineHeight: 1.4,
              userSelect: 'none',
            }}
          >
            {block.language}
          </span>
          <button
            onClick={handleCopy}
            type="button"
            style={{
              fontFamily: t.mono,
              fontSize: 10,
              color: copied ? t.mint : t.textMuted,
              padding: '2px 8px',
              borderRadius: 8,
              backgroundColor: `${t.border}80`,
              border: 'none',
              cursor: 'pointer',
              lineHeight: 1.4,
              transition: 'color 0.2s ease',
            }}
          >
            {copied ? tr('quest.code.copied', 'Copied!') : tr('quest.code.copy', 'Copy')}
          </button>
        </div>

        <pre
          style={{
            fontFamily: t.mono,
            fontSize: 13,
            color: t.mint,
            backgroundColor: t.bgElevated,
            padding: 16,
            paddingTop: 36,
            borderRadius: 12,
            borderWidth: 1,
            borderStyle: 'solid',
            borderColor: t.border,
            margin: 0,
            overflowX: 'auto',
            lineHeight: 1.5,
            whiteSpace: 'pre',
          }}
        >
          <code>{block.code}</code>
        </pre>
      </div>

      {block.caption && (
        <p
          style={{
            fontFamily: t.body,
            fontSize: 12,
            color: t.textMuted,
            fontStyle: 'italic',
            margin: '8px 0 0 0',
            lineHeight: 1.4,
          }}
        >
          {block.caption}
        </p>
      )}
    </div>
  );
}
