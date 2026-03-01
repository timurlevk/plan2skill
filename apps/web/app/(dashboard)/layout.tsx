'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useOnboardingStore } from '@plan2skill/store';
import { NeonIcon } from '../(onboarding)/_components/NeonIcon';
import { t, rarity } from '../(onboarding)/_components/tokens';
import { CHARACTERS, charArtStrings, charPalettes } from '../(onboarding)/_components/characters';
import { parseArt, PixelCanvas, AnimatedPixelCanvas } from '../(onboarding)/_components/PixelEngine';
import { XPBar } from '../(onboarding)/_components/XPBar';
import { ARCHETYPES } from '../(onboarding)/_data/archetypes';

// ═══════════════════════════════════════════
// DASHBOARD LAYOUT — Gamified Command Center
// Desktop sidebar + mobile bottom nav + character companion
// ═══════════════════════════════════════════

const NAV_ITEMS = [
  { href: '/home',      label: 'Command Center', icon: 'compass' as const },
  { href: '/roadmap',   label: 'Quest Log',      icon: 'map'     as const },
  { href: '/hero-card', label: 'Hero Card',       icon: 'shield'  as const },
];

// ─── User Menu (dropdown from bottom of sidebar) ───

const USER_MENU_ITEMS = [
  { id: 'hero-card', label: 'Hero Card',       icon: 'shield'  as const, href: '/hero-card' },
  { id: 'settings',  label: 'Hero Settings',   icon: 'gear'    as const, href: null },
  { id: 'divider' },
  { id: 'restart',   label: 'Restart Journey',  icon: 'refresh' as const, href: null, danger: true },
  { id: 'logout',    label: 'Leave Guild',      icon: 'close'   as const, href: null, danger: true },
] as const;

function UserMenu({ charData, charMeta, archetype, level, xpTotal }: {
  charData: { id: string; art: (string | null)[][] } | null;
  charMeta: { name: string; color: string } | undefined;
  archetype: { icon: string; name: string; color: string } | null | undefined;
  level: number;
  xpTotal: number;
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const resetStore = useOnboardingStore(s => s.reset);

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
      {/* Trigger button */}
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
        {/* Avatar */}
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: `${charMeta?.color || t.violet}15`,
          border: `1.5px solid ${charMeta?.color || t.violet}40`,
          flexShrink: 0,
        }}>
          {charData ? (
            <PixelCanvas data={charData.art} size={2} />
          ) : (
            <NeonIcon type="shield" size={14} color="violet" />
          )}
        </div>
        <div style={{ flex: 1, textAlign: 'left' }}>
          <div style={{ fontFamily: t.body, fontSize: 12, fontWeight: 600, color: t.text }}>
            {charMeta?.name || 'Hero'}
          </div>
          <div style={{ fontFamily: t.body, fontSize: 10, color: t.textMuted }}>
            Hero Settings
          </div>
        </div>
        <NeonIcon type="gear" size={14} color={open ? 'violet' : 'muted'} />
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
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: `${charMeta?.color || t.violet}15`,
              border: `1.5px solid ${charMeta?.color || t.violet}40`,
              flexShrink: 0,
            }}>
              {charData ? (
                <PixelCanvas data={charData.art} size={2} />
              ) : (
                <NeonIcon type="shield" size={16} color="violet" />
              )}
            </div>
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
  const { characterId, archetypeId, xpTotal, level, forgeComplete } = useOnboardingStore();

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
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32, paddingLeft: 4 }}>
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

          {/* Nav items */}
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
                  </div>
                </Link>
              );
            })}
          </nav>

          {/* Spacer */}
          <div style={{ flex: 1 }} />

          {/* Character companion */}
          {charData && (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              padding: '16px 12px 12px', marginBottom: 16,
              borderRadius: 16, background: t.bgCard,
              border: `1px solid ${t.border}`,
            }}>
              <div style={{ animation: 'float 3s ease-in-out infinite', marginBottom: 12 }}>
                <AnimatedPixelCanvas
                  character={charData}
                  size={3}
                  glowColor={charMeta?.color}
                />
              </div>
              <span style={{
                fontFamily: t.display, fontSize: 13, fontWeight: 700,
                color: t.text, marginBottom: 4,
              }}>
                {charMeta?.name || 'Hero'}
              </span>
              {archetype && (
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  padding: '2px 10px', borderRadius: 20,
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
            </div>
          )}

          {/* ═══ Party Quest — Cooperative Boss Fight (Habitica model) ═══ */}
          <div style={{
            padding: 14, borderRadius: 16,
            background: t.bgCard, border: `1px solid ${t.border}`,
            marginBottom: 12,
          }}>
            {/* Section header */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10,
            }}>
              <NeonIcon type="lightning" size={14} color="rose" />
              <span style={{
                fontFamily: t.display, fontSize: 11, fontWeight: 700,
                color: t.textSecondary, textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}>
                Party Quest
              </span>
            </div>

            {/* Boss info */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10,
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: `${t.rose}12`, border: `1px solid ${t.rose}25`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18,
              }}>
                🐉
              </div>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontFamily: t.display, fontSize: 13, fontWeight: 700, color: t.text,
                  marginBottom: 2,
                }}>
                  Procrastination Dragon
                </div>
                <span style={{
                  fontFamily: t.mono, fontSize: 9, fontWeight: 700,
                  color: rarity.epic.color, textTransform: 'uppercase',
                }}>
                  {rarity.epic.icon} Epic Boss
                </span>
              </div>
            </div>

            {/* Boss HP bar */}
            <div style={{ marginBottom: 6 }}>
              <div style={{
                display: 'flex', justifyContent: 'space-between', marginBottom: 4,
              }}>
                <span style={{ fontFamily: t.mono, fontSize: 9, fontWeight: 700, color: t.rose }}>
                  HP
                </span>
                <span style={{ fontFamily: t.mono, fontSize: 9, fontWeight: 700, color: t.textMuted }}>
                  847 / 1200
                </span>
              </div>
              <div style={{
                height: 6, borderRadius: 3, background: '#252530', overflow: 'hidden',
              }}>
                <div style={{
                  width: '70.6%', height: '100%', borderRadius: 3,
                  background: `linear-gradient(90deg, ${t.rose}, #FF8FA3)`,
                  transition: 'width 0.6s ease-out',
                }} />
              </div>
            </div>

            {/* Party members */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: -4, marginBottom: 8,
            }}>
              {/* Stacked avatars */}
              <div style={{ display: 'flex', marginRight: 8 }}>
                {['#9D7AFF', '#4ECDC4', '#FF6B8A', '#FFD166'].map((c, i) => (
                  <div key={i} style={{
                    width: 20, height: 20, borderRadius: '50%',
                    background: `${c}30`, border: `1.5px solid ${c}`,
                    marginLeft: i > 0 ? -6 : 0, zIndex: 4 - i,
                  }} />
                ))}
              </div>
              <span style={{
                fontFamily: t.body, fontSize: 10, color: t.textMuted,
              }}>
                4 heroes fighting
              </span>
            </div>

            {/* Your contribution */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '6px 10px', borderRadius: 8,
              background: `${t.violet}08`, border: `1px solid ${t.violet}15`,
            }}>
              <span style={{ fontFamily: t.body, fontSize: 10, fontWeight: 600, color: t.textSecondary }}>
                Your damage
              </span>
              <span style={{ fontFamily: t.mono, fontSize: 11, fontWeight: 800, color: t.violet }}>
                0 DMG
              </span>
            </div>
            <div style={{
              fontFamily: t.body, fontSize: 9, color: t.textMuted,
              marginTop: 6, textAlign: 'center', fontStyle: 'italic',
            }}>
              Complete quests to deal damage!
            </div>
          </div>

          {/* ═══ League — Opt-in (Duolingo model) ═══ */}
          <div style={{
            padding: 14, borderRadius: 16,
            background: t.bgCard, border: `1px solid ${t.border}`,
            marginBottom: 12,
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10,
            }}>
              <NeonIcon type="trophy" size={14} color="gold" />
              <span style={{
                fontFamily: t.display, fontSize: 11, fontWeight: 700,
                color: t.textSecondary, textTransform: 'uppercase',
                letterSpacing: '0.06em', flex: 1,
              }}>
                League
              </span>
              {/* League tier badge */}
              <span style={{
                fontFamily: t.mono, fontSize: 9, fontWeight: 700,
                color: '#CD7F32', padding: '2px 8px', borderRadius: 8,
                background: 'rgba(205,127,50,0.10)', border: '1px solid rgba(205,127,50,0.20)',
                textTransform: 'uppercase',
              }}>
                ● Bronze
              </span>
            </div>

            {/* League tiers visual */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              marginBottom: 10, padding: '0 4px',
            }}>
              {[
                { label: 'Bronze', color: '#CD7F32', active: true },
                { label: 'Silver', color: '#C0C0C0', active: false },
                { label: 'Gold', color: '#FFD700', active: false },
                { label: 'Diamond', color: '#4ECDC4', active: false },
              ].map((league) => (
                <div key={league.label} style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: '50%',
                    background: league.active ? `${league.color}25` : `${t.border}`,
                    border: `2px solid ${league.active ? league.color : t.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: league.active ? `0 0 8px ${league.color}40` : 'none',
                    animation: league.active ? 'pulse 2s ease-in-out infinite' : 'none',
                  }}>
                    <div style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: league.active ? league.color : t.textMuted,
                    }} />
                  </div>
                  <span style={{
                    fontFamily: t.mono, fontSize: 8, fontWeight: 700,
                    color: league.active ? league.color : t.textMuted,
                  }}>
                    {league.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Weekly standings */}
            <div style={{
              padding: '8px 10px', borderRadius: 8,
              background: t.bgElevated, border: `1px solid ${t.border}`,
              marginBottom: 8,
            }}>
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginBottom: 4,
              }}>
                <span style={{ fontFamily: t.body, fontSize: 10, fontWeight: 600, color: t.textSecondary }}>
                  Your rank
                </span>
                <span style={{ fontFamily: t.mono, fontSize: 12, fontWeight: 800, color: t.text }}>
                  #— / 30
                </span>
              </div>
              <div style={{
                fontFamily: t.body, fontSize: 9, color: t.textMuted,
              }}>
                Top 10 promote • Bottom 5 demote
              </div>
            </div>

            {/* Join CTA (opt-in only — ethical) */}
            <button style={{
              width: '100%', padding: '8px 0', borderRadius: 10,
              background: `${t.gold}12`, border: `1px solid ${t.gold}25`,
              cursor: 'pointer',
              fontFamily: t.display, fontSize: 11, fontWeight: 700,
              color: t.gold, transition: 'all 0.2s ease',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}>
              <NeonIcon type="trophy" size={12} color="gold" />
              Join Weekly League
            </button>
            <div style={{
              fontFamily: t.body, fontSize: 8, color: t.textMuted,
              marginTop: 4, textAlign: 'center',
            }}>
              Opt-in • Resets weekly • No pressure
            </div>
          </div>

          {/* XP Bar */}
          <div style={{ padding: '0 4px', marginBottom: 12 }}>
            <XPBar xp={xpTotal} level={level} />
          </div>

          {/* User menu */}
          <UserMenu
            charData={charData}
            charMeta={charMeta}
            archetype={archetype}
            level={level}
            xpTotal={xpTotal}
          />
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
            <XPBar xp={xpTotal} level={level} />
          </div>
          {/* Streak indicator */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '4px 8px', borderRadius: 12,
            background: `${t.gold}10`,
          }}>
            <NeonIcon type="fire" size={14} color="gold" />
            <span style={{ fontFamily: t.mono, fontSize: 10, fontWeight: 700, color: t.gold }}>
              0
            </span>
          </div>
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
