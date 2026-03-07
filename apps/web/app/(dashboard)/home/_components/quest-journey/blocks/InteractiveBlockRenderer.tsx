'use client';

import React, { useState, useCallback } from 'react';
import { t } from '../../../../../(onboarding)/_components/tokens';
import { useI18nStore } from '@plan2skill/store';
import { NeonIcon } from '../../../../../(onboarding)/_components/NeonIcon';
import type { InteractiveBlock } from '@plan2skill/types';

interface InteractiveBlockRendererProps {
  block: InteractiveBlock;
}

export function InteractiveBlockRenderer({ block }: InteractiveBlockRendererProps) {
  const tr = useI18nStore((s) => s.t);
  const [userInput, setUserInput] = useState('');
  const [isChecked, setIsChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const handleCheck = useCallback(() => {
    const correct = userInput.trim().toLowerCase() === block.answer.trim().toLowerCase();
    setIsCorrect(correct);
    setIsChecked(true);
  }, [userInput, block.answer]);

  const handleReset = useCallback(() => {
    setUserInput('');
    setIsChecked(false);
    setIsCorrect(false);
    setShowHint(false);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && userInput.trim()) {
        handleCheck();
      }
    },
    [handleCheck, userInput],
  );

  const inputBorderColor = !isChecked
    ? t.border
    : isCorrect
      ? t.mint
      : t.rose;

  return (
    <div
      style={{
        padding: 16,
        borderRadius: 12,
        backgroundColor: t.bgCard,
        borderWidth: 1,
        borderStyle: 'solid',
        borderColor: t.border,
        marginBottom: 20,
      }}
    >
      {/* Prompt */}
      <p
        style={{
          fontFamily: t.body,
          fontSize: 14,
          color: t.text,
          lineHeight: 1.6,
          margin: '0 0 12px 0',
        }}
      >
        {block.prompt}
      </p>

      {/* Input row */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
        <input
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isChecked && isCorrect}
          placeholder={tr('quest.interactive.placeholder', 'Type your answer...')}
          style={{
            flex: 1,
            fontFamily: t.mono,
            fontSize: 14,
            color: t.text,
            backgroundColor: t.bgElevated,
            padding: '10px 14px',
            borderRadius: 8,
            borderWidth: 2,
            borderStyle: 'solid',
            borderColor: inputBorderColor,
            outline: 'none',
            transition: 'border-color 0.2s ease',
          }}
        />
        {!isChecked ? (
          <button
            onClick={handleCheck}
            type="button"
            disabled={!userInput.trim()}
            style={{
              fontFamily: t.body,
              fontSize: 13,
              fontWeight: 600,
              color: !userInput.trim() ? t.textMuted : '#0C0C10',
              backgroundColor: !userInput.trim() ? t.border : t.cyan,
              padding: '10px 18px',
              borderRadius: 8,
              border: 'none',
              cursor: !userInput.trim() ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s ease, color 0.2s ease',
              whiteSpace: 'nowrap',
            }}
          >
            {tr('quest.interactive.check', 'Check')}
          </button>
        ) : (
          <button
            onClick={handleReset}
            type="button"
            style={{
              fontFamily: t.body,
              fontSize: 13,
              fontWeight: 600,
              color: t.textSecondary,
              backgroundColor: t.bgElevated,
              padding: '10px 18px',
              borderRadius: 8,
              borderWidth: 1,
              borderStyle: 'solid',
              borderColor: t.border,
              cursor: 'pointer',
              transition: 'background-color 0.2s ease',
              whiteSpace: 'nowrap',
            }}
          >
            {tr('quest.interactive.reset', 'Reset')}
          </button>
        )}
      </div>

      {/* Feedback */}
      {isChecked && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: !isCorrect && block.hint ? 8 : 0,
          }}
        >
          <NeonIcon
            type={isCorrect ? 'check' : 'close'}
            size={16}
            color={isCorrect ? t.mint : t.rose}
          />
          <span
            style={{
              fontFamily: t.body,
              fontSize: 13,
              color: isCorrect ? t.mint : t.rose,
              fontWeight: 600,
            }}
          >
            {isCorrect
              ? tr('quest.interactive.correct', 'Correct!')
              : tr('quest.interactive.incorrect', 'Not quite. Try again!')}
          </span>
        </div>
      )}

      {/* Hint */}
      {isChecked && !isCorrect && block.hint && (
        <>
          {!showHint ? (
            <button
              onClick={() => setShowHint(true)}
              type="button"
              style={{
                fontFamily: t.body,
                fontSize: 12,
                color: t.gold,
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '4px 0',
                textDecoration: 'underline',
                textUnderlineOffset: 2,
              }}
            >
              {tr('quest.interactive.showHint', 'Show hint')}
            </button>
          ) : (
            <div
              style={{
                padding: '8px 12px',
                borderRadius: 8,
                backgroundColor: `${t.gold}10`,
                borderLeftWidth: 2,
                borderLeftStyle: 'solid',
                borderLeftColor: t.gold,
              }}
            >
              <span
                style={{
                  fontFamily: t.body,
                  fontSize: 12,
                  color: t.gold,
                  lineHeight: 1.5,
                }}
              >
                {block.hint}
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
