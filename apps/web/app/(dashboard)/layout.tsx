'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useOnboardingStore, useProgressionStore } from '@plan2skill/store';
import { NeonIcon } from '../(onboarding)/_components/NeonIcon';
import { t } from '../(onboarding)/_components/tokens';
import { CHARACTERS, charArtStrings, charPalettes } from '../(onboarding)/_components/characters';
import { parseArt, PixelCanvas, AnimatedPixelCanvas } from '../(onboarding)/_components/PixelEngine';
import { XPBar } from '../(onboarding)/_components/XPBar';
import { ARCHETYPES } from '../(onboarding)/_data/archetypes';

// ═══════════════════════════════════════════
// DASHBOARD LAYOUT — Gamified Command Center
// Desktop sidebar + mobile bottom nav + character companion
// ═══════════════════════════════════════════

const NAV_ITEMS = [
  { href: '/home',      label: 'Command Center', icon: 'compass' as const, badge: false },
  { href: '/roadmap',   label: 'Quest Log',      icon: 'map'     as const, badge: false },
  { href: '/league',    label: 'Guild Arena',     icon: 'trophy'  as const, badge: true  },
  { href: '/hero-card', label: 'Hero Card',       icon: 'shield'  as const, badge: false },
];

// ─── User Menu (dropdown from bottom of sidebar) ───

const USER_MENU_ITEMS = [
  { id: 'hero-card',  label: 'Hero Card',       icon: 'shield'  as const, href: '/hero-card' },
  { id: 'settings',   label: 'Hero Settings',   icon: 'gear'    as const, href: null },
  { id: 'quiet-mode', label: 'Quiet Mode',      icon: 'gear'    as const, href: null, toggle: true },
  { id: 'divider' },
  { id: 'restart',    label: 'Restart Journey',  icon: 'refresh' as const, href: null, danger: true },
  { id: 'logout',     label: 'Leave Guild',      icon: 'close'   as const, href: null, danger: true },
] as const;

function UserMenu({ charMeta, archetype, level, xpTotal }: {
  charMeta: { name: string; color: string } | undefined;
  archetype: { icon: string; name: string; color: string } | null | undefined;
  level: number;
  xpTotal: number;
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const resetStore = useOnboardingStore(s => s.reset);
  const quietMode = useProgressionStore(s => s.quietMode);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  function handleItemClick(item: typeof USER_MENU_ITEMS[number]) {
    if (!('label' in item)) return;
    if (item.id === 'quiet-mode') {
      useProgressionStore.getState().toggleQuietMode();
      return; // Don't close menu on toggle
    }
    setOpen(false);
    if ('href' in item && item.href) {
      router.push(item.href);
    } else if (item.id === 'restart') {
      if (typeof window !== 'undefined' && window.confirm('Restart your journey? All progress will be reset.')) {
        resetStore();
        router.replace('/goals');
      }
    } else if (item.id === 'logout') {
      // Placeholder — wire to actual auth later
      router.replace('/login');
    }
  }

  return (
    <div ref={menuRef} style={{ position: 'relative' }}>
      {/* Trigger button — no avatar (avatar is in Hero Identity Card) */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          width: '100%', padding: '10px 12px',
          background: open ? `${t.violet}08` : 'none', border: 'none',
          borderTop: `1px solid ${t.border}`,
          cursor: 'pointer', transition: 'background 0.2s ease',
          borderRadius: 0,
        }}
        onMouseEnter={e => { if (!open) e.currentTarget.style.background = `${t.violet}08`; }}
        onMouseLeave={e => { if (!open) e.currentTarget.style.background = 'none'; }}
      >
        <NeonIcon type="gear" size={16} color={open ? 'violet' : 'muted'} />
        <span style={{
          flex: 1, textAlign: 'left',
          fontFamily: t.body, fontSize: 12, fontWeight: 600, color: t.text,
        }}>
          {charMeta?.name || 'Hero'}
        </span>
        <span style={{
          fontFamily: t.body, fontSize: 10, color: open ? t.violet : t.textMuted,
          transition: 'transform 0.2s ease',
          transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          display: 'inline-block',
        }}>
          ▲
        </span>
      </button>

      {/* Dropdown — opens upward */}
      {open && (
        <div style={{
          position: 'absolute', bottom: '100%', left: 8, right: 8,
          marginBottom: 8, padding: '8px 0',
          background: t.bgElevated, border: `1px solid ${t.border}`,
          borderRadius: 16, zIndex: 100,
          boxShadow: '0 -8px 32px rgba(0,0,0,0.5), 0 -2px 8px rgba(0,0,0,0.3)',
          animation: 'fadeUp 0.15s ease-out',
        }}>
          {/* User header inside dropdown */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '8px 16px 12px',
            borderBottom: `1px solid ${t.border}`,
            marginBottom: 4,
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: t.display, fontSize: 13, fontWeight: 700, color: t.text }}>
                {charMeta?.name || 'Hero'}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontFamily: t.mono, fontSize: 10, fontWeight: 700, color: t.violet }}>
                  Lv.{level}
                </span>
                <span style={{ fontFamily: t.mono, fontSize: 10, color: t.textMuted }}>
                  {xpTotal} XP
                </span>
              </div>
            </div>
            {archetype && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 3,
                padding: '2px 8px', borderRadius: 12,
                background: `${archetype.color}12`,
                fontFamily: t.mono, fontSize: 9, fontWeight: 700, color: archetype.color,
              }}>
                {archetype.icon} {archetype.name}
              </span>
            )}
          </div>

          {/* Menu items */}
          {USER_MENU_ITEMS.map((item) => {
            if (item.id === 'divider') {
              return <div key="divider" style={{ height: 1, background: t.border, margin: '4px 12px' }} />;
            }
            if (!('label' in item)) return null;
            const danger = 'danger' in item && item.danger;
            const isToggle = 'toggle' in item && item.toggle;
            const isQuietActive = item.id === 'quiet-mode' && quietMode;

            // Quiet Mode toggle row
            if (isToggle) {
              return (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  role="switch"
                  aria-checked={isQuietActive}
                  aria-label={isQuietActive ? 'Quiet mode is on — click to turn off' : 'Quiet mode is off — click to turn on'}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    width: '100%', padding: '8px 16px',
                    background: 'none', border: 'none',
                    cursor: 'pointer', transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = `${t.violet}08`)}
                  onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                >
                  <NeonIcon type="gear" size={16} color={isQuietActive ? 'violet' : 'muted'} />
                  <span style={{
                    fontFamily: t.body, fontSize: 13, fontWeight: 500,
                    color: isQuietActive ? t.violet : t.textSecondary, flex: 1, textAlign: 'left',
                  }}>
                    Quiet Mode
                  </span>
                  <div style={{
                    width: 28, height: 16, borderRadius: 8,
                    background: isQuietActive ? t.violet : t.border,
                    position: 'relative', transition: 'background 0.2s ease',
                    flexShrink: 0,
                  }}>
                    <div style={{
                      width: 12, height: 12, borderRadius: '50%',
                      background: '#FFF', position: 'absolute', top: 2,
                      left: isQuietActive ? 14 : 2,
                      transition: 'left 0.2s ease',
                    }} />
                  </div>
                </button>
              );
            }

            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  width: '100%', padding: '8px 16px',
                  background: 'none', border: 'none',
                  cursor: 'pointer', transition: 'background 0.15s ease',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = danger ? `${t.rose}08` : `${t.violet}08`)}
                onMouseLeave={e => (e.currentTarget.style.background = 'none')}
              >
                {'icon' in item && <NeonIcon type={item.icon} size={16} color={danger ? 'rose' : 'muted'} />}
                <span style={{
                  fontFamily: t.body, fontSize: 13, fontWeight: 500,
                  color: danger ? t.rose : t.textSecondary,
                }}>
                  {'label' in item ? item.label : ''}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { characterId, archetypeId, forgeComplete } = useOnboardingStore();
  const { totalXp, level, currentStreak, energyCrystals, maxEnergyCrystals, quietMode } = useProgressionStore();

  // Guard: if onboarding not complete, redirect
  if (!forgeComplete) {
    if (typeof window !== 'undefined') {
      router.replace('/goals');
    }
    return null;
  }

  const charMeta = CHARACTERS.find(c => c.id === characterId);
  const archetype = archetypeId ? ARCHETYPES[archetypeId] : null;

  const charData = useMemo(() => {
    if (!characterId || !charArtStrings[characterId] || !charPalettes[characterId]) return null;
    return {
      id: characterId,
      artString: charArtStrings[characterId]!,
      palette: charPalettes[characterId]!,
      art: parseArt(charArtStrings[characterId]!, charPalettes[characterId]!),
    };
  }, [characterId]);

  return (
    <>
      {/* ── Keyframes: synced 1:1 with onboarding layout ── */}
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
        @keyframes glowPulse {
          0%, 100% { box-shadow: 0 0 20px rgba(157,122,255,0.3), 0 0 40px rgba(78,205,196,0.15); }
          50%      { box-shadow: 0 0 30px rgba(157,122,255,0.5), 0 0 60px rgba(78,205,196,0.25); }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50%      { transform: scale(1.05); }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(40px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes xpFloat {
          0%   { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-40px); }
        }
        @keyframes celebratePop {
          0%   { opacity: 0; transform: scale(0); }
          50%  { transform: scale(1.2); }
          70%  { transform: scale(0.9); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes tabGlow {
          0%, 100% { box-shadow: 0 0 6px rgba(157,122,255,0.2); }
          50%      { box-shadow: 0 0 14px rgba(157,122,255,0.5); }
        }
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>

      <div className="flex" style={{ background: t.bg, position: 'relative', height: '100vh', overflow: 'hidden' }}>
        {/* Ambient glows — same radial-gradient as onboarding */}
        <div style={{
          position: 'fixed', top: '-20%', left: '-10%',
          width: '50vw', height: '50vh', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(157,122,255,0.12) 0%, transparent 70%)',
          pointerEvents: 'none', zIndex: 0,
        }} />
        <div style={{
          position: 'fixed', bottom: '-20%', right: '-10%',
          width: '50vw', height: '50vh', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(78,205,196,0.10) 0%, transparent 70%)',
          pointerEvents: 'none', zIndex: 0,
        }} />

        {/* ═══ Desktop Sidebar ═══ */}
        <aside
          className="hidden md:flex flex-col"
          style={{
            width: 260, flexShrink: 0, padding: 16,
            borderRight: `1px solid ${t.border}`,
            background: t.bgElevated,
            height: '100%', overflowY: 'auto',
            zIndex: 10,
          }}
        >
          {/* ═══ ZONE 1 — BRAND + HERO IDENTITY (pinned top) ═══ */}

          {/* Logo — clickable → /home */}
          <Link href="/home" aria-label="Go to Command Center" style={{ textDecoration: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, paddingLeft: 4 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#FFF', fontWeight: 800, fontSize: 14,
                fontFamily: t.display, background: t.gradient,
              }}>
                P2
              </div>
              <span style={{ fontFamily: t.display, fontSize: 18, fontWeight: 800, color: t.text }}>
                Plan2Skill
              </span>
            </div>
          </Link>

          {/* Hero Identity Card */}
          <div
            role="region"
            aria-label="Hero status"
            style={{
              position: 'relative',
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              padding: '16px 12px 12px', marginBottom: 16,
              borderRadius: 16, background: t.bgCard,
              border: `1px solid ${t.border}`,
            }}
          >
            {/* Streak — top left corner */}
            <div
              aria-label={`${currentStreak} day streak`}
              style={{
                position: 'absolute', top: 8, left: 10,
                display: 'flex', alignItems: 'center', gap: 3,
              }}
            >
              <NeonIcon type="fire" size={12} color="gold" />
              <span style={{ fontFamily: t.mono, fontSize: 10, fontWeight: 700, color: t.gold }}>
                {currentStreak}d
              </span>
            </div>
            {/* Crystals — top right corner */}
            <div
              aria-label={`${energyCrystals} of ${maxEnergyCrystals} energy crystals`}
              style={{
                position: 'absolute', top: 8, right: 10,
                display: 'flex', alignItems: 'center', gap: 3,
              }}
            >
              <NeonIcon type="gem" size={12} color="cyan" />
              <span style={{ fontFamily: t.mono, fontSize: 10, fontWeight: 700, color: t.cyan }}>
                {energyCrystals}/{maxEnergyCrystals}
              </span>
            </div>

            {/* Avatar */}
            {charData && (
              <div style={{ animation: 'float 3s ease-in-out infinite', marginBottom: 8 }}>
                <AnimatedPixelCanvas
                  character={charData}
                  size={3}
                  glowColor={charMeta?.color}
                />
              </div>
            )}
            {/* Name + Level */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <span style={{ fontFamily: t.display, fontSize: 13, fontWeight: 700, color: t.text }}>
                {charMeta?.name || 'Hero'}
              </span>
              <span style={{
                fontFamily: t.mono, fontSize: 10, fontWeight: 700,
                color: t.violet, padding: '1px 6px', borderRadius: 6,
                background: `${t.violet}12`,
              }}>
                Lv.{level}
              </span>
            </div>
            {/* Archetype badge */}
            {archetype && (
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '2px 10px', borderRadius: 20, marginBottom: 10,
                background: `${archetype.color}15`, border: `1px solid ${archetype.color}30`,
              }}>
                <span style={{ fontSize: 10, color: archetype.color }}>{archetype.icon}</span>
                <span style={{
                  fontFamily: t.mono, fontSize: 10, fontWeight: 700, color: archetype.color,
                }}>
                  {archetype.name}
                </span>
              </div>
            )}
            {/* XP Bar */}
            <div style={{ width: '100%', padding: '0 4px' }}>
              <XPBar xp={totalXp} level={level} />
            </div>
          </div>

          {/* ═══ ZONE 2 — NAV (4 items) ═══ */}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href;
              return (
                <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 12px', borderRadius: 12,
                    background: active ? `${t.violet}15` : 'transparent',
                    transition: 'all 0.2s ease',
                    cursor: 'pointer',
                  }}>
                    <NeonIcon type={item.icon} size={20} color={active ? 'violet' : 'muted'} active={active} />
                    <span style={{
                      fontFamily: t.body, fontSize: 14, fontWeight: active ? 700 : 500,
                      color: active ? t.violet : t.textSecondary,
                      transition: 'color 0.2s ease',
                    }}>
                      {item.label}
                    </span>
                    {active && (
                      <div style={{
                        marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%',
                        background: t.violet, boxShadow: `0 0 8px ${t.violet}80`,
                      }} />
                    )}
                    {!active && item.badge && !quietMode && (
                      <div
                        aria-label="New activity"
                        style={{
                          marginLeft: 'auto', width: 8, height: 8, borderRadius: '50%',
                          background: t.rose, boxShadow: `0 0 6px ${t.rose}60`,
                          animation: 'pulse 2s ease-in-out infinite',
                        }}
                      />
                    )}
                  </div>
                </Link>
              );
            })}
          </nav>

          {/* ═══ ZONE 3 — USER MENU (pinned bottom) ═══ */}
          <div style={{ marginTop: 'auto' }}>
            <UserMenu
              charMeta={charMeta}
              archetype={archetype}
              level={level}
              xpTotal={totalXp}
            />
          </div>
        </aside>

        {/* ═══ Mobile Header ═══ */}
        {/* NOTE: no inline display — Tailwind flex/hidden controls visibility */}
        <div
          className="flex md:hidden"
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
            padding: '10px 16px',
            background: `${t.bgElevated}F0`,
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            borderBottom: `1px solid ${t.border}`,
            alignItems: 'center', gap: 12,
          }}
        >
          {/* Mini character */}
          {charData && (
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: `${charMeta?.color || t.violet}15`,
              border: `1.5px solid ${charMeta?.color || t.violet}40`,
              flexShrink: 0,
            }}>
              <PixelCanvas data={charData.art} size={2} />
            </div>
          )}
          {/* XP bar — compact */}
          <div style={{ flex: 1 }}>
            <XPBar xp={totalXp} level={level} />
          </div>
          {/* Streak indicator — hidden in quiet mode */}
          {!quietMode && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '4px 8px', borderRadius: 12,
              background: `${t.gold}10`,
            }}>
              <NeonIcon type="fire" size={14} color="gold" />
              <span style={{ fontFamily: t.mono, fontSize: 10, fontWeight: 700, color: t.gold }}>
                {currentStreak}
              </span>
            </div>
          )}
        </div>

        {/* ═══ Main Content ═══ */}
        <main style={{ flex: 1, position: 'relative', zIndex: 1, height: '100%', overflowY: 'auto' }}>
          {/* Mobile top padding for sticky header */}
          <div className="md:hidden" style={{ height: 56 }} />
          <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px 96px' }}>
            {children}
          </div>
        </main>

        {/* ═══ Mobile Bottom Tab Bar ═══ */}
        {/* NOTE: no inline display — Tailwind flex/hidden controls visibility */}
        <nav
          className="flex md:hidden"
          style={{
            position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
            alignItems: 'center', justifyContent: 'space-around',
            padding: '8px 0 env(safe-area-inset-bottom, 8px)',
            background: `${t.bgElevated}F5`,
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            borderTop: `1px solid ${t.border}`,
          }}
        >
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
                <div style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                  padding: '8px 12px', borderRadius: 12,
                  minWidth: 64, minHeight: 48,
                  transition: 'all 0.2s ease',
                  animation: active ? 'tabGlow 2s ease-in-out infinite' : 'none',
                }}>
                  <NeonIcon type={item.icon} size={20} color={active ? 'violet' : 'muted'} active={active} />
                  <span style={{
                    fontFamily: t.body, fontSize: 9, fontWeight: active ? 700 : 500,
                    color: active ? t.violet : t.textMuted,
                    transition: 'color 0.2s ease',
                    lineHeight: 1,
                  }}>
                    {item.label}
                  </span>
                </div>
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}
