'use client';

import React, { useState, useEffect } from 'react';
import { t } from './tokens';

// ═══════════════════════════════════════════
// TILE GRID — Responsive grid + optional free-text
// Desktop: 3-col, Mobile: 2-col
// ═══════════════════════════════════════════

interface TileGridProps {
  children: React.ReactNode;
  columns?: { desktop: number; mobile: number };
  gap?: number;
  freeText?: {
    placeholder: string;
    value: string;
    onChange: (val: string) => void;
    onAdd: (val: string) => void;
  };
}

export function TileGrid({
  children,
  columns = { desktop: 3, mobile: 2 },
  gap = 10,
  freeText,
}: TileGridProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [inputVal, setInputVal] = useState('');

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 600);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const cols = isMobile ? columns.mobile : columns.desktop;

  return (
    <div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gap,
      }}>
        {children}
      </div>

      {freeText && (
        <div style={{
          display: 'flex',
          gap: 8,
          marginTop: 12,
        }}>
          <input
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && inputVal.trim()) {
                freeText.onAdd(inputVal.trim());
                setInputVal('');
              }
            }}
            placeholder={freeText.placeholder}
            aria-label={freeText.placeholder}
            style={{
              flex: 1,
              padding: '12px 16px',
              borderRadius: 12,
              border: `1.5px solid ${t.border}`,
              background: t.bgCard,
              color: t.text,
              fontFamily: t.body,
              fontSize: 13,
              outline: 'none',
              transition: 'border-color 0.2s ease',
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = t.violet; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = t.border; }}
          />
          <button
            onClick={() => {
              if (inputVal.trim()) {
                freeText.onAdd(inputVal.trim());
                setInputVal('');
              }
            }}
            disabled={!inputVal.trim()}
            aria-label="Add custom interest"
            style={{
              padding: '12px 16px',
              borderRadius: 12,
              border: 'none',
              background: inputVal.trim() ? t.gradient : t.border,
              color: inputVal.trim() ? '#FFF' : t.textMuted,
              fontFamily: t.display,
              fontSize: 13,
              fontWeight: 700,
              cursor: inputVal.trim() ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s ease',
              flexShrink: 0,
            }}
          >
            Add
          </button>
        </div>
      )}
    </div>
  );
}
