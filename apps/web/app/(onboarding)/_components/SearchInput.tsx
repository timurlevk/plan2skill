'use client';

import React, { useState, useRef } from 'react';
import { t } from './tokens';
import { useSpeechToText } from '../_hooks/useSpeechToText';
import { NeonIcon } from './NeonIcon';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  placeholder: string;
  locale: string;
  disabled?: boolean;
}

export function SearchInput({
  value,
  onChange,
  onSubmit,
  placeholder,
  locale,
  disabled = false,
}: SearchInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);

  const speechLang = locale === 'uk' ? 'uk-UA' : locale === 'pl' ? 'pl-PL' : 'en-US';
  const { isListening, isSupported, startListening, stopListening } = useSpeechToText({
    lang: speechLang,
    onResult: (text) => {
      onChange(text);
      inputRef.current?.focus();
    },
  });

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && value.trim()) {
      e.preventDefault();
      onSubmit(value.trim());
    }
  };

  return (
    <div style={{
      display: 'flex',
      gap: 6,
      marginBottom: 10,
    }}>
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '0 12px',
        borderRadius: 12,
        border: `1.5px solid ${focused ? t.violet : t.border}`,
        background: t.bgCard,
        transition: 'border-color 0.2s ease',
      }}>
        <NeonIcon type="compass" size={14} color={t.textMuted} />
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          disabled={disabled}
          aria-label={placeholder}
          style={{
            flex: 1,
            padding: '10px 0',
            border: 'none',
            background: 'none',
            color: t.text,
            fontFamily: t.body,
            fontSize: 13,
            outline: 'none',
          }}
        />
      </div>

      {isSupported && (
        <button
          type="button"
          onClick={isListening ? stopListening : startListening}
          disabled={disabled}
          aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            border: `1.5px solid ${isListening ? t.violet : t.border}`,
            background: isListening ? `${t.violet}15` : t.bgCard,
            cursor: disabled ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            transition: 'border-color 0.2s ease, background 0.2s ease',
            animation: isListening ? 'pulse 1.5s ease-in-out infinite' : 'none',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="5.5" y="1" width="5" height="9" rx="2.5" fill={isListening ? t.violet : t.textMuted} />
            <path d="M3 7.5C3 10.26 5.24 12.5 8 12.5C10.76 12.5 13 10.26 13 7.5" stroke={isListening ? t.violet : t.textMuted} strokeWidth="1.5" strokeLinecap="round" />
            <line x1="8" y1="12.5" x2="8" y2="15" stroke={isListening ? t.violet : t.textMuted} strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      )}

      {value.trim() && (
        <button
          type="button"
          onClick={() => onSubmit(value.trim())}
          disabled={disabled}
          aria-label="Add custom"
          style={{
            padding: '0 14px',
            height: 40,
            borderRadius: 12,
            border: 'none',
            background: t.gradient,
            color: '#fff',
            fontFamily: t.display,
            fontSize: 12,
            fontWeight: 700,
            cursor: disabled ? 'not-allowed' : 'pointer',
            flexShrink: 0,
          }}
        >
          Add
        </button>
      )}
    </div>
  );
}
