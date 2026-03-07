'use client';

import React, { useRef, useEffect } from 'react';
import { TextBlockRenderer } from './TextBlockRenderer';
import { CodeBlockRenderer } from './CodeBlockRenderer';
import { CalloutBlockRenderer } from './CalloutBlockRenderer';
import { InteractiveBlockRenderer } from './InteractiveBlockRenderer';
import { DeepLoreBlockRenderer } from './DeepLoreBlockRenderer';
import type { ContentBlock } from '@plan2skill/types';

interface BlockRendererProps {
  block: ContentBlock;
  onVisible?: () => void;
}

function renderBlock(block: ContentBlock) {
  switch (block.type) {
    case 'text':
      return <TextBlockRenderer block={block} />;
    case 'code':
      return <CodeBlockRenderer block={block} />;
    case 'callout':
      return <CalloutBlockRenderer block={block} />;
    case 'interactive':
      return <InteractiveBlockRenderer block={block} />;
    case 'deep_lore':
      return <DeepLoreBlockRenderer block={block} />;
    default: {
      // Exhaustive check: should never reach here if all types handled
      const _exhaustive: never = block;
      return null;
    }
  }
}

export function BlockRenderer({ block, onVisible }: BlockRendererProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const hasTriggeredRef = useRef(false);

  useEffect(() => {
    const element = wrapperRef.current;
    if (!element || !onVisible) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry && entry.isIntersecting && !hasTriggeredRef.current) {
          hasTriggeredRef.current = true;
          onVisible();
          observer.disconnect();
        }
      },
      { threshold: 0.5 },
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [onVisible]);

  return (
    <div ref={wrapperRef}>
      {renderBlock(block)}
    </div>
  );
}
