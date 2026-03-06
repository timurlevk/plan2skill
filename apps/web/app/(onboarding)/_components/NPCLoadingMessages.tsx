'use client';

import React, { useState, useEffect } from 'react';
import { NPCBubble } from './NPCBubble';
import { t } from './tokens';

interface NPCLoadingMessagesProps {
  messages: string[];
  subtitle?: string;
  intervalMs?: number;
  characterId?: string;
}

export function NPCLoadingMessages({
  messages,
  subtitle,
  intervalMs = 3000,
  characterId = 'sage',
}: NPCLoadingMessagesProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % messages.length);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [messages.length, intervalMs]);

  return (
    <>
      <NPCBubble
        characterId={characterId}
        message={messages[index] || messages[0]!}
        emotion="thinking"
      />

      <div style={{ height: 12 }} />

      {/* Skeleton quiz card with spinner overlay */}
      <div style={{
        borderRadius: 16,
        background: t.bgCard,
        border: `1px solid ${t.border}`,
        padding: '20px 16px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Spinner + informative text overlay */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 12,
          padding: '8px 0 20px',
        }}>
          {/* Animated spinner */}
          <div style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            border: `3px solid ${t.border}`,
            borderTopColor: t.violet,
            animation: 'spin 0.8s linear infinite',
          }} />
          {subtitle && (
            <p style={{
              fontFamily: t.body,
              fontSize: 12,
              color: t.textSecondary,
              textAlign: 'center',
              lineHeight: 1.5,
              maxWidth: 260,
              margin: 0,
            }}>
              {subtitle}
            </p>
          )}
        </div>

        {/* Ghost quiz skeleton — faded behind */}
        <div style={{ opacity: 0.35 }}>
          {/* Question skeleton */}
          <div style={{
            height: 16,
            width: '85%',
            borderRadius: 8,
            background: t.bgElevated,
            marginBottom: 12,
            animation: 'pulse 1.5s ease-in-out infinite',
          }} />
          {/* 3 option skeletons (compact) */}
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                height: 38,
                borderRadius: 10,
                background: t.bgElevated,
                marginBottom: i < 2 ? 6 : 0,
                animation: `pulse 1.5s ease-in-out ${i * 0.15}s infinite`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Keyframe for spinner */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}
