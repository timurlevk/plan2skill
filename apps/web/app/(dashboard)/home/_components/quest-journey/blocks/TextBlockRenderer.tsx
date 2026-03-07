'use client';

import React from 'react';
import { t } from '../../../../../(onboarding)/_components/tokens';
import type { TextBlock } from '@plan2skill/types';

interface TextBlockRendererProps {
  block: TextBlock;
}

export function TextBlockRenderer({ block }: TextBlockRendererProps) {
  return (
    <div style={{ marginBottom: 20 }}>
      {block.heading && (
        <h3
          style={{
            fontFamily: t.display,
            fontSize: 16,
            fontWeight: 700,
            color: t.text,
            margin: '0 0 8px 0',
            lineHeight: 1.3,
          }}
        >
          {block.heading}
        </h3>
      )}
      <p
        style={{
          fontFamily: t.body,
          fontSize: 14,
          color: t.textSecondary,
          lineHeight: 1.6,
          margin: 0,
          whiteSpace: 'pre-wrap',
        }}
      >
        {block.body}
      </p>
    </div>
  );
}
