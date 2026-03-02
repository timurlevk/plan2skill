'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useOnboardingV2Store, PICKER_LOCALES, LOCALE_ENDONYMS, detectLocale } from '@plan2skill/store';
import type { SupportedLocale } from '@plan2skill/store';
import { t } from './tokens';

// ═══════════════════════════════════════════
// LOCALE PICKER — Globe icon + dropdown
// Auto-detects from navigator.languages
// Compact: renders as globe button in header
// ═══════════════════════════════════════════

export function LocalePicker() {
  const { locale, setLocale } = useOnboardingV2Store();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Auto-detect on first mount if still default
  useEffect(() => {
    const detected = detectLocale();
    if (detected !== 'en' && locale === 'en') {
      setLocale(detected);
    }
  }, []);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      {/* Globe button */}
      <button
        onClick={() => setOpen(!open)}
        aria-label="Change language"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 10px',
          borderRadius: 10,
          border: `1px solid ${t.border}`,
          background: open ? t.bgCard : 'transparent',
          color: t.textSecondary,
          cursor: 'pointer',
          fontFamily: t.body,
          fontSize: 12,
          fontWeight: 500,
          transition: 'all 0.15s ease',
        }}
      >
        {/* Globe SVG */}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8" />
          <path d="M2 12h20M12 2c3 3.6 3 12.4 0 20M12 2c-3 3.6-3 12.4 0 20" stroke="currentColor" strokeWidth="1.5" />
        </svg>
        <span>{LOCALE_ENDONYMS[locale]}</span>
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          marginTop: 4,
          minWidth: 160,
          padding: '4px 0',
          borderRadius: 12,
          border: `1px solid ${t.border}`,
          background: t.bgCard,
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
          zIndex: 100,
          animation: 'fadeUp 0.2s ease-out',
        }}>
          {PICKER_LOCALES.map((loc) => {
            const isActive = locale === loc;
            return (
              <button
                key={loc}
                onClick={() => {
                  setLocale(loc as SupportedLocale);
                  setOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  padding: '10px 14px',
                  border: 'none',
                  background: isActive ? `${t.violet}12` : 'transparent',
                  color: isActive ? t.text : t.textSecondary,
                  cursor: 'pointer',
                  fontFamily: t.body,
                  fontSize: 13,
                  fontWeight: isActive ? 600 : 400,
                  textAlign: 'left',
                  transition: 'background 0.1s ease',
                }}
              >
                <span>{LOCALE_ENDONYMS[loc as SupportedLocale]}</span>
                {isActive && (
                  <svg width="14" height="14" viewBox="0 0 12 12" fill="none">
                    <path d="M2.5 6L5 8.5L9.5 3.5" stroke={t.violet} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
