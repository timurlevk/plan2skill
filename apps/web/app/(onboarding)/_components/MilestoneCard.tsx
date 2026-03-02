'use client';

import React, { useState } from 'react';
import { t } from './tokens';
import { NeonIcon } from './NeonIcon';

// ═══════════════════════════════════════════
// MILESTONE CARD — Compact Stepper List row
// Part of a single card with shared borders
// 44px rows, no gaps between items
// ═══════════════════════════════════════════

interface MilestoneCardProps {
  index: number;
  text: string;
  weeks: number;
  selected: boolean;
  onToggle: () => void;
  onEdit: (text: string) => void;
  isFirst?: boolean;
  isLast?: boolean;
}

export function MilestoneCard({ index, text, weeks, selected, onToggle, onEdit, isFirst, isLast }: MilestoneCardProps) {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(text);

  const handleSave = () => {
    setEditing(false);
    if (editText.trim() && editText !== text) {
      onEdit(editText.trim());
    } else {
      setEditText(text);
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '8px 12px',
      borderTop: isFirst ? 'none' : `1px solid ${t.border}`,
      background: selected ? `${t.cyan}06` : 'transparent',
      cursor: 'pointer',
      transition: 'background 0.15s ease',
      minHeight: 44,
    }}>
      {/* Toggle checkbox */}
      <button
        onClick={onToggle}
        aria-label={selected ? 'Remove milestone' : 'Add milestone'}
        style={{
          width: 20,
          height: 20,
          borderRadius: 5,
          border: `2px solid ${selected ? t.cyan : t.border}`,
          background: selected ? t.cyan : 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          flexShrink: 0,
          transition: 'all 0.15s ease',
          padding: 0,
        }}
      >
        {selected && (
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
            <path d="M2.5 6L5 8.5L9.5 3.5" stroke="#FFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      {/* Step number circle */}
      <div style={{
        width: 22,
        height: 22,
        borderRadius: '50%',
        background: selected ? `${t.cyan}20` : `${t.textMuted}15`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: t.mono,
        fontSize: 10,
        fontWeight: 800,
        color: selected ? t.cyan : t.textMuted,
        flexShrink: 0,
      }}>
        {index + 1}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {editing ? (
          <input
            autoFocus
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onBlur={handleSave}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
              if (e.key === 'Escape') { setEditText(text); setEditing(false); }
            }}
            style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontFamily: t.body,
              fontSize: 12,
              color: t.text,
              padding: 0,
            }}
          />
        ) : (
          <span
            onClick={() => setEditing(true)}
            style={{
              fontFamily: t.body,
              fontSize: 12,
              color: selected ? t.text : t.textSecondary,
              cursor: 'text',
              lineHeight: 1.3,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {text}
          </span>
        )}
      </div>

      {/* Weeks badge */}
      <span style={{
        fontFamily: t.mono,
        fontSize: 9,
        color: t.textMuted,
        flexShrink: 0,
      }}>
        ~{weeks}w
      </span>

      {/* Edit icon */}
      {!editing && (
        <button
          onClick={(e) => { e.stopPropagation(); setEditing(true); }}
          aria-label="Edit milestone"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 2,
            flexShrink: 0,
            opacity: 0.4,
          }}
        >
          <NeonIcon type="edit" size={12} color={t.textMuted} />
        </button>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════
// MILESTONE STEPPER — Single card container
// Wraps MilestoneCard items into a shared card
// ═══════════════════════════════════════════

interface MilestoneStepperProps {
  children: React.ReactNode;
}

export function MilestoneStepper({ children }: MilestoneStepperProps) {
  return (
    <div style={{
      borderRadius: 12,
      border: `1px solid ${t.border}`,
      background: t.bgCard,
      overflow: 'hidden',
    }}>
      {children}
    </div>
  );
}
