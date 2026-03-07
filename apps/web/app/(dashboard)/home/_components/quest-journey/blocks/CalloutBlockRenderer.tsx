'use client';

import React from 'react';
import { t } from '../../../../../(onboarding)/_components/tokens';
import { NeonIcon } from '../../../../../(onboarding)/_components/NeonIcon';
import type { CalloutBlock } from '@plan2skill/types';

const VARIANT_CONFIG = {
  tip: { color: t.cyan, icon: 'sparkle' as const },
  info: { color: t.violet, icon: 'book' as const },
  warning: { color: t.gold, icon: 'blocked' as const },
  lore: { color: t.rose, icon: 'compass' as const },
} as const;

interface CalloutBlockRendererProps {
  block: CalloutBlock;
}

export function CalloutBlockRenderer({ block }: CalloutBlockRendererProps) {
  const config = VARIANT_CONFIG[block.variant];
  const variantColor = config.color;

  return (
    <div
      style={{
        padding: 14,
        borderRadius: 12,
        backgroundColor: `${variantColor}08`,
        borderLeftWidth: 3,
        borderLeftStyle: 'solid',
        borderLeftColor: variantColor,
        marginBottom: 20,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 8,
        }}
      >
        <NeonIcon type={config.icon} size={16} color={variantColor} />
        <span
          style={{
            fontFamily: t.display,
            fontSize: 13,
            fontWeight: 700,
            color: variantColor,
            lineHeight: 1.3,
          }}
        >
          {block.title}
        </span>
      </div>
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
  );
}
