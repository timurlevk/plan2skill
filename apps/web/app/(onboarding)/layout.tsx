'use client';

import { LocalePicker } from './_components/LocalePicker';
import { useLoadTranslations } from '../hooks/useLoadTranslations';

// ═══════════════════════════════════════════
// ONBOARDING — Viewport-Locked Wizard Layout
// Three-zone flex: header / scrollable content / pinned footer
// 100svh with 100vh fallback — no page-level scroll
// ═══════════════════════════════════════════

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  // Load UI translations from backend for current locale
  useLoadTranslations();

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes bounceIn {
          0%   { opacity: 0; transform: scale(0.6); }
          60%  { opacity: 1; transform: scale(1.08); }
          80%  { transform: scale(0.96); }
          100% { transform: scale(1); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-8px); }
        }
        @keyframes sparkle {
          0%, 100% { opacity: 0; transform: scale(0) rotate(0deg); }
          50%      { opacity: 1; transform: scale(1) rotate(180deg); }
        }
        @keyframes confettiFall {
          0%   { opacity: 1; transform: translateY(-20px) rotate(0deg); }
          100% { opacity: 0; transform: translateY(120px) rotate(720deg); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(40px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes celebratePop {
          0%   { opacity: 0; transform: scale(0); }
          50%  { transform: scale(1.2); }
          70%  { transform: scale(0.9); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%      { opacity: 0.5; }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes hammerStrike {
          0%   { transform: rotate(-30deg) translateY(-10px); }
          40%  { transform: rotate(10deg) translateY(5px); }
          50%  { transform: rotate(0deg) translateY(0); }
          100% { transform: rotate(-30deg) translateY(-10px); }
        }
        @keyframes sparkBurst {
          0%   { opacity: 1; transform: translate(0, 0) scale(1); }
          100% { opacity: 0; transform: translate(var(--sx), var(--sy)) scale(0); }
        }
        @keyframes xpFloat {
          0%   { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-40px); }
        }
        @keyframes cardFlip {
          0%   { transform: perspective(600px) rotateY(90deg); opacity: 0; }
          100% { transform: perspective(600px) rotateY(0deg); opacity: 1; }
        }
        @keyframes glowPulse {
          0%, 100% { box-shadow: 0 0 20px rgba(157,122,255,0.3), 0 0 40px rgba(78,205,196,0.15); }
          50%      { box-shadow: 0 0 30px rgba(157,122,255,0.5), 0 0 60px rgba(78,205,196,0.25); }
        }
        @keyframes numberTick {
          0%   { opacity: 0; transform: translateY(10px); }
          50%  { opacity: 1; transform: translateY(-2px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes pathDraw {
          from { stroke-dashoffset: 100%; }
          to   { stroke-dashoffset: 0; }
        }
        @keyframes slideLeft {
          from { opacity: 0; transform: translateX(40px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideRight {
          from { opacity: 0; transform: translateX(-40px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes crystalGrow {
          0%   { transform: scale(0.3); opacity: 0; filter: brightness(0.5); }
          60%  { transform: scale(1.1); filter: brightness(1.3); }
          100% { transform: scale(1); opacity: 1; filter: brightness(1); }
        }
        @keyframes spiralIn {
          0%   { transform: rotate(0deg) translateX(60px) scale(0.5); opacity: 1; }
          100% { transform: rotate(360deg) translateX(0) scale(0); opacity: 0; }
        }
        @keyframes convergeIn {
          0%   { transform: translateX(60px) scale(0.8); opacity: 1; }
          70%  { transform: translateX(8px) scale(1); opacity: 0.8; }
          100% { transform: translateX(0) scale(0); opacity: 0; }
        }
        @keyframes shardConverge {
          0%   { transform: translateX(70px) scale(1); opacity: 1; }
          60%  { transform: translateX(12px) scale(0.8); opacity: 0.9; }
          100% { transform: translateX(0) scale(0); opacity: 0; }
        }
        @keyframes npcBounce {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-4px); }
        }
        /* Viewport-locked shell */
        .wizard-shell {
          height: 100vh;
          height: 100svh;
        }
        .wizard-content::-webkit-scrollbar {
          display: none;
        }
        .wizard-footer {
          padding-bottom: calc(16px + env(safe-area-inset-bottom, 0px));
        }
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
      <main style={{
        background: '#0C0C10',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Ambient glow — top left (violet) */}
        <div aria-hidden="true" style={{
          position: 'fixed',
          top: '-20%',
          left: '-10%',
          width: '50vw',
          height: '50vh',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(157,122,255,0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 0,
        }} />
        {/* Ambient glow — bottom right (cyan) */}
        <div aria-hidden="true" style={{
          position: 'fixed',
          bottom: '-20%',
          right: '-10%',
          width: '50vw',
          height: '50vh',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(78,205,196,0.10) 0%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 0,
        }} />
        {/* Locale picker — top right */}
        <div style={{
          position: 'fixed',
          top: 16,
          right: 16,
          zIndex: 50,
        }}>
          <LocalePicker />
        </div>
        {/* Wizard shell — viewport-locked flex column */}
        <div
          className="wizard-shell"
          style={{
            position: 'relative',
            zIndex: 1,
            width: '100%',
            maxWidth: 520,
            margin: '0 auto',
            padding: '0 24px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {children}
        </div>
      </main>
    </>
  );
}
