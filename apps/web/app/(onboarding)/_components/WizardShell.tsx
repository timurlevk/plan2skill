'use client';

import React from 'react';

// ═══════════════════════════════════════════
// WIZARD SHELL — Three-zone layout helper
// Zone 1: Header (step bar, back button) — fixed
// Zone 2: Content (NPC, cards, forms) — scrollable
// Zone 3: Footer (continue button) — pinned
// ═══════════════════════════════════════════

interface WizardShellProps {
  header: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
}

export function WizardShell({ header, footer, children }: WizardShellProps) {
  return (
    <>
      {/* Zone 1: Header — fixed height */}
      <div style={{
        flexShrink: 0,
        paddingTop: 16,
        paddingBottom: 4,
      }}>
        {header}
      </div>

      {/* Zone 2: Scrollable content */}
      <div
        className="wizard-content"
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
          scrollbarWidth: 'none',
          paddingTop: 4,
          paddingBottom: 8,
        }}
      >
        {children}
      </div>

      {/* Zone 3: Footer — pinned at bottom */}
      {footer && (
        <div
          className="wizard-footer"
          style={{
            flexShrink: 0,
            paddingTop: 12,
          }}
        >
          {footer}
        </div>
      )}
    </>
  );
}
