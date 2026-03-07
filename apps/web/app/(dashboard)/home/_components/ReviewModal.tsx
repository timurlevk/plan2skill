'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { NeonIcon } from '../../../(onboarding)/_components/NeonIcon';
import { t } from '../../../(onboarding)/_components/tokens';
import { useI18nStore } from '@plan2skill/store';
import { MasteryRing } from './MasteryRing';

interface ReviewModalProps {
  skillDomain: string;
  masteryLevel: number;
  onSubmit: (quality: number) => void;
  onClose: () => void;
  isSubmitting: boolean;
}

const QUALITY_OPTIONS = [
  { value: 1, label: 'Forgot', labelKey: 'review.forgot', color: '#FF6B6B', icon: 'x' as const },
  { value: 2, label: 'Hard', labelKey: 'review.hard', color: '#FFA94D', icon: 'fire' as const },
  { value: 3, label: 'OK', labelKey: 'review.ok', color: '#FFD93D', icon: 'check' as const },
  { value: 4, label: 'Easy', labelKey: 'review.easy', color: '#69DB7C', icon: 'sparkle' as const },
  { value: 5, label: 'Perfect', labelKey: 'review.perfect', color: '#4ECDC4', icon: 'crown' as const },
];

export function ReviewModal({ skillDomain, masteryLevel, onSubmit, onClose, isSubmitting }: ReviewModalProps) {
  const tr = useI18nStore((s) => s.t);
  const [selectedQuality, setSelectedQuality] = useState<number | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Save previous focus and lock body scroll on mount
  useEffect(() => {
    previousFocusRef.current = document.activeElement as HTMLElement | null;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
      previousFocusRef.current?.focus();
    };
  }, []);

  // Auto-focus first quality button on mount
  useEffect(() => {
    const modal = modalRef.current;
    if (!modal) return;
    const first = modal.querySelector<HTMLElement>('button');
    first?.focus();
  }, []);

  // Escape key handler
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  // Focus trap
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key !== 'Tab') return;
    const modal = modalRef.current;
    if (!modal) return;
    const focusable = modal.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    if (focusable.length === 0) return;
    const first = focusable[0]!;
    const last = focusable[focusable.length - 1]!;
    if (e.shiftKey) {
      if (document.activeElement === first) { e.preventDefault(); last.focus(); }
    } else {
      if (document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }, []);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20, animation: 'fadeIn 0.2s ease-out',
      }}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-label={tr('review.dialog_title', 'Review: {skill}').replace('{skill}', skillDomain)}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
        style={{
          width: '100%', maxWidth: 400,
          padding: 28, borderRadius: 20,
          background: t.bgCard, border: `1px solid ${t.border}`,
          animation: 'slideUp 0.3s ease-out',
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
            <MasteryRing
              masteryLevel={masteryLevel}
              skillDomain={skillDomain}
              size="lg"
              showLabel
            />
          </div>
          <div style={{
            fontFamily: t.display, fontSize: 18, fontWeight: 800, color: t.text,
          }}>
            {skillDomain}
          </div>
          <div style={{
            fontFamily: t.body, fontSize: 13, color: t.textSecondary, marginTop: 4,
          }}>
            {tr('review.how_well', 'How well do you remember this topic?')}
          </div>
        </div>

        {/* Quality buttons */}
        <div style={{
          display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 20,
        }}>
          {QUALITY_OPTIONS.map((opt) => {
            const isSelected = selectedQuality === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setSelectedQuality(opt.value)}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  gap: 4, padding: '10px 12px', borderRadius: 12,
                  background: isSelected ? `${opt.color}20` : t.bgElevated,
                  border: `2px solid ${isSelected ? opt.color : t.border}`,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                  minWidth: 56,
                }}
              >
                <NeonIcon type={opt.icon} size={16} color={opt.color} />
                <span style={{
                  fontFamily: t.mono, fontSize: 9, fontWeight: 700,
                  color: isSelected ? opt.color : t.textMuted,
                }}>
                  {tr(opt.labelKey, opt.label)}
                </span>
              </button>
            );
          })}
        </div>

        {/* Submit / Cancel */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: '10px 16px', borderRadius: 12,
              background: 'transparent', border: `1px solid ${t.border}`,
              cursor: 'pointer',
              fontFamily: t.display, fontSize: 13, fontWeight: 700, color: t.textMuted,
            }}
          >
            {tr('common.cancel', 'Cancel')}
          </button>
          <button
            onClick={() => selectedQuality != null && onSubmit(selectedQuality)}
            disabled={selectedQuality == null || isSubmitting}
            style={{
              flex: 2, padding: '10px 16px', borderRadius: 12,
              background: selectedQuality ? t.gradient : t.bgElevated,
              border: 'none', cursor: selectedQuality ? 'pointer' : 'not-allowed',
              fontFamily: t.display, fontSize: 13, fontWeight: 800,
              color: selectedQuality ? '#fff' : t.textMuted,
              opacity: isSubmitting ? 0.6 : 1,
            }}
          >
            {isSubmitting
              ? tr('review.submitting', 'Submitting...')
              : tr('review.submit', 'Submit Review')}
          </button>
        </div>
      </div>
    </div>
  );
}
