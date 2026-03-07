'use client';

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useOnboardingStore, useOnboardingV2Store, useProgressionStore, useCharacterStore, useSocialStore, useAuthStore, isOnboardingV1Hydrated, isOnboardingV2Hydrated, isAuthHydrated, getLevelInfo } from '@plan2skill/store';
import { NeonIcon } from '../(onboarding)/_components/NeonIcon';
import { t } from '../(onboarding)/_components/tokens';
import { useI18nStore } from '@plan2skill/store';
import { trpc } from '@plan2skill/api-client';
import { useLoadTranslations } from '../hooks/useLoadTranslations';
import { CHARACTERS, charArtStrings, charPalettes } from '../(onboarding)/_components/characters';
import { parseArt, PixelCanvas, AnimatedPixelCanvas } from '../(onboarding)/_components/PixelEngine';
import { XPBar } from '../(onboarding)/_components/XPBar';
import { ARCHETYPES } from '../(onboarding)/_data/archetypes';
import { RightSidebar } from './_components/RightSidebar';

// ═══════════════════════════════════════════
// DASHBOARD LAYOUT — Gamified Command Center
// Desktop sidebar + mobile bottom nav + character companion
// ═══════════════════════════════════════════

const NAV_ITEMS = [
  { href: '/home',      label: 'Command Center', labelKey: 'nav.command_center', icon: 'lightning'  as const, badge: false },
  { href: '/roadmap',   label: 'Quest Map',       labelKey: 'nav.quest_map',      icon: 'compass'   as const, badge: false },
  { href: '/forge',     label: 'The Forge',       labelKey: 'nav.forge_label',    icon: 'fire'      as const, badge: false },
  { href: '/shop',      label: 'Merchant',        labelKey: 'nav.merchant',       icon: 'coins'     as const, badge: false },
  { href: '/league',    label: 'Guild Arena',     labelKey: 'nav.guild_arena',    icon: 'trophy'    as const, badge: true  },
  { href: '/hero-card', label: 'Hero Card',       labelKey: 'nav.hero_card',      icon: 'shield'    as const, badge: false },
];

// ─── User Menu (dropdown from bottom of sidebar) ───

const USER_MENU_ITEMS = [
  { id: 'hero-card',  label: 'Hero Card',       labelKey: 'nav.hero_card',        icon: 'shield'  as const, href: '/hero-card' },
  { id: 'settings',   label: 'Hero Settings',   labelKey: 'nav.hero_settings',    icon: 'gear'    as const, href: '/settings' },
  { id: 'quiet-mode', label: 'Quiet Mode',      labelKey: 'nav.quiet_mode',       icon: 'gear'    as const, href: null, toggle: true },
  { id: 'divider' },
  { id: 'restart',    label: 'Restart Journey',  labelKey: 'nav.restart_journey',  icon: 'refresh' as const, href: null, danger: true },
  { id: 'logout',     label: 'Leave Guild',      labelKey: 'nav.leave_guild',      icon: 'close'   as const, href: null, danger: true },
] as const;

function UserMenu({ charMeta, archetype, archetypeId, level, xpTotal, displayName }: {
  charMeta: { name: string; color: string } | undefined;
  archetype: { icon: string; name: string; color: string } | null | undefined;
  archetypeId: string | null;
  level: number;
  xpTotal: number;
  displayName: string;
}) {
  const [open, setOpen] = useState(false);
  const tr = useI18nStore((s) => s.t);
  const [closing, setClosing] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const resetStore = useOnboardingStore(s => s.reset);
  const quietMode = useProgressionStore(s => s.quietMode);

  // Animated close — exit animation before unmounting (MA-TR003: exit < enter)
  const closeMenu = useCallback(() => {
    setClosing(true);
    setTimeout(() => {
      setOpen(false);
      setClosing(false);
    }, 120); // 0.12s exit < 0.15s entrance
  }, []);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        closeMenu();
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') closeMenu();
    }
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open, closeMenu]);

  function handleItemClick(item: typeof USER_MENU_ITEMS[number]) {
    if (!('label' in item)) return;
    if (item.id === 'quiet-mode') {
      useProgressionStore.getState().toggleQuietMode();
      return; // Don't close menu on toggle
    }
    closeMenu();
    if ('href' in item && item.href) {
      router.push(item.href);
    } else if (item.id === 'restart') {
      if (typeof window !== 'undefined' && window.confirm(tr('nav.restart_confirm', 'Restart your journey? All progress will be reset.'))) {
        resetStore();
        router.replace('/intent');
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
          {displayName || charMeta?.name || tr('character.hero_fallback', 'Hero')}
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

      {/* Dropdown — opens upward, animated close */}
      {open && (
        <div style={{
          position: 'absolute', bottom: '100%', left: 8, right: 8,
          marginBottom: 8, padding: '8px 0',
          background: t.bgElevated, border: `1px solid ${t.border}`,
          borderRadius: 16, zIndex: 100,
          boxShadow: '0 -8px 32px rgba(0,0,0,0.5), 0 -2px 8px rgba(0,0,0,0.3)',
          animation: closing
            ? 'fadeUp 0.12s ease-in reverse forwards'
            : 'fadeUp 0.15s ease-out',
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
                {displayName || charMeta?.name || tr('character.hero_fallback', 'Hero')}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontFamily: t.mono, fontSize: 10, fontWeight: 700, color: t.violet }}>
                  {tr('sidebar.level_badge', 'Lv.{n}').replace('{n}', String(level))}
                </span>
                <span style={{ fontFamily: t.mono, fontSize: 10, color: t.textMuted }}>
                  {tr('sidebar.xp_short', '{n} XP').replace('{n}', String(xpTotal))}
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
                {archetype.icon} {archetypeId ? tr(`archetype.${archetypeId}`, archetype.name) : archetype.name}
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
                  aria-label={isQuietActive ? tr('nav.aria_quiet_on', 'Quiet mode is on — click to turn off') : tr('nav.aria_quiet_off', 'Quiet mode is off — click to turn on')}
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
                    {tr('nav.quiet_mode', 'Quiet Mode')}
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
                      left: 2,
                      transform: isQuietActive ? 'translateX(12px)' : 'translateX(0)',
                      transition: 'transform 0.2s ease',
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
                  {'labelKey' in item ? tr(item.labelKey, item.label) : ''}
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
  const { forgeComplete } = useOnboardingStore();
  // DB-first with onboarding fallback (same pattern as home/page.tsx)
  const dbCharacterId = useCharacterStore((s) => s.characterId);
  const dbArchetypeId = useCharacterStore((s) => s.archetypeId);
  const obCharacterId = useOnboardingStore((s) => s.characterId);
  const obArchetypeId = useOnboardingStore((s) => s.archetypeId);
  const characterId = dbCharacterId || obCharacterId;
  const archetypeId = dbArchetypeId || obArchetypeId;
  const { onboardingCompletedAt } = useOnboardingV2Store();
  const { totalXp, level, currentStreak, energyCrystals, maxEnergyCrystals, coins, quietMode } = useProgressionStore();
  const displayName = useSocialStore((s) => s.displayName);
  const tr = useI18nStore((s) => s.t);
  useLoadTranslations();
  // Hydration guard — wait for ALL Zustand persisted stores to rehydrate from localStorage
  // (onboarding v1, v2, AND auth) before making any routing decisions
  const [hydrated, setHydrated] = useState(() =>
    isOnboardingV1Hydrated() && isOnboardingV2Hydrated() && isAuthHydrated()
  );
  useEffect(() => {
    if (hydrated) return;
    const id = setInterval(() => {
      if (isOnboardingV1Hydrated() && isOnboardingV2Hydrated() && isAuthHydrated()) {
        setHydrated(true);
        clearInterval(id);
      }
    }, 10);
    return () => clearInterval(id);
  }, [hydrated]);

  // Guard: if onboarding not complete, redirect to v2 onboarding
  // Server fallback: if localStorage was cleared, check DB via user.profile
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { data: serverProfile, isFetched: profileFetched } = trpc.user.profile.useQuery(
    undefined,
    { enabled: hydrated && isAuthenticated, staleTime: 1000 * 60 * 5, retry: 1 },
  );

  // Restore onboarding state from server if localStorage was cleared
  useEffect(() => {
    if (serverProfile?.onboardingCompleted && !onboardingCompletedAt) {
      useOnboardingV2Store.setState({ onboardingCompletedAt: Date.now() });
    }
  }, [serverProfile, onboardingCompletedAt]);

  const onboardingDone = forgeComplete || !!onboardingCompletedAt || !!serverProfile?.onboardingCompleted;
  // Wait for: stores hydrated + (server responded OR not authenticated)
  const serverChecked = profileFetched || !isAuthenticated;
  useEffect(() => {
    if (hydrated && serverChecked && !onboardingDone) {
      router.replace('/intent');
    }
  }, [hydrated, serverChecked, onboardingDone, router]);

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

  // Coin counter bounce — detect value change, brief scale pulse
  const prevCoinsRef = useRef<number | null>(null);
  const [coinBounce, setCoinBounce] = useState(false);
  useEffect(() => {
    if (prevCoinsRef.current === null) {
      prevCoinsRef.current = coins;
      return;
    }
    if (prevCoinsRef.current !== coins) {
      setCoinBounce(true);
      const timer = setTimeout(() => setCoinBounce(false), 200);
      prevCoinsRef.current = coins;
      return () => clearTimeout(timer);
    }
  }, [coins]);

  // Streak counter pulse — detect value change, brief scale pulse
  const prevStreakRef = useRef<number | null>(null);
  const [streakBounce, setStreakBounce] = useState(false);
  useEffect(() => {
    if (prevStreakRef.current === null) {
      prevStreakRef.current = currentStreak;
      return;
    }
    if (prevStreakRef.current !== currentStreak) {
      setStreakBounce(true);
      const timer = setTimeout(() => setStreakBounce(false), 200);
      prevStreakRef.current = currentStreak;
      return () => clearTimeout(timer);
    }
  }, [currentStreak]);

  // Mobile nav tab press state
  const [pressedTab, setPressedTab] = useState<string | null>(null);

  // ── Keyframes: always rendered (even during loading) so animations work immediately ──
  const keyframesStyle = (
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
        @keyframes hammerStrike {
          0%   { transform: rotate(0deg) scale(1); }
          40%  { transform: rotate(-30deg) scale(1.1); }
          60%  { transform: rotate(10deg) scale(0.95); }
          100% { transform: rotate(0deg) scale(1); }
        }
        @keyframes sparkBurst {
          0%   { opacity: 1; transform: scale(0) rotate(0deg); }
          50%  { opacity: 1; transform: scale(1.5) rotate(180deg); }
          100% { opacity: 0; transform: scale(2) rotate(360deg); }
        }
        @keyframes cardFlip {
          0%   { transform: perspective(800px) rotateY(180deg) scale(0.8); opacity: 0; }
          60%  { transform: perspective(800px) rotateY(-10deg) scale(1.05); opacity: 1; }
          100% { transform: perspective(800px) rotateY(0deg) scale(1); opacity: 1; }
        }
        @keyframes confettiFall {
          0%   { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25%      { transform: translateX(4px); }
          75%      { transform: translateX(-4px); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes shineSweep {
          0%, 85%  { transform: translateX(-120%) rotate(25deg); }
          100%     { transform: translateX(120%) rotate(25deg); }
        }
        @keyframes ctaAmbient {
          0%, 100% { box-shadow: 0 0 30px rgba(157,122,255,0.08), 0 0 60px rgba(78,205,196,0.04); border-color: rgba(157,122,255,0.15); }
          50% { box-shadow: 0 0 50px rgba(157,122,255,0.18), 0 0 90px rgba(78,205,196,0.08), 0 0 120px rgba(157,122,255,0.04); border-color: rgba(157,122,255,0.35); }
        }
        @keyframes particleFloat1 {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.3; }
          25% { transform: translateY(-3px) scale(1.2); opacity: 0.8; }
          50% { transform: translateY(1px) scale(0.9); opacity: 0.2; }
          75% { transform: translateY(-2px) scale(1.1); opacity: 0.6; }
        }
        @keyframes particleFloat2 {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.2; }
          35% { transform: translateY(3px) scale(1.15); opacity: 0.7; }
          65% { transform: translateY(-2px) scale(0.9); opacity: 0.15; }
          90% { transform: translateY(1px) scale(1.05); opacity: 0.5; }
        }
        @keyframes mistDrift {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.5; }
          25% { transform: translate(8px, -6px) scale(1.03); opacity: 0.9; }
          50% { transform: translate(15px, -3px) scale(1.06); opacity: 0.7; }
          75% { transform: translate(-5px, 4px) scale(0.98); opacity: 1; }
        }
        @keyframes shimmerSweep {
          0% { left: -80%; }
          40%, 100% { left: 180%; }
        }
        @keyframes btnGlow {
          0%, 100% { box-shadow: 0 4px 20px rgba(157,122,255,0.3), 0 0 40px rgba(157,122,255,0.1); }
          50%      { box-shadow: 0 4px 28px rgba(157,122,255,0.5), 0 0 60px rgba(157,122,255,0.2); }
        }
        @keyframes completedGlow {
          0%, 100% { box-shadow: 0 0 8px rgba(255,215,0,0.15), inset 0 0 6px rgba(255,215,0,0.08); }
          50%      { box-shadow: 0 0 16px rgba(255,215,0,0.3), inset 0 0 10px rgba(255,215,0,0.15); }
        }
        @keyframes activeBreath {
          0%, 100% { transform: scale(1); box-shadow: 0 0 20px rgba(157,122,255,0.25), 0 0 40px rgba(157,122,255,0.12), 0 0 60px rgba(78,205,196,0.06); }
          50%      { transform: scale(1.06); box-shadow: 0 0 28px rgba(157,122,255,0.4), 0 0 56px rgba(157,122,255,0.2), 0 0 80px rgba(78,205,196,0.1); }
        }
        @keyframes activeRingPulse {
          0%   { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(1.8); opacity: 0; }
        }
        @keyframes lockedTease {
          0%, 100% { box-shadow: 0 0 6px rgba(157,122,255,0.08); border-color: rgba(157,122,255,0.2); }
          50%      { box-shadow: 0 0 18px rgba(157,122,255,0.2); border-color: rgba(157,122,255,0.45); }
        }
        @keyframes lockedTrophyTease {
          0%, 100% { box-shadow: 0 0 8px rgba(255,215,0,0.08); border-color: rgba(255,215,0,0.2); }
          50%      { box-shadow: 0 0 22px rgba(255,215,0,0.2); border-color: rgba(255,215,0,0.45); }
        }
        @keyframes trackShimmer {
          0%, 85% { transform: translateX(-120%); }
          100%    { transform: translateX(120%); }
        }
        @keyframes cardBreath {
          0%, 100% { box-shadow: 0 0 14px rgba(157,122,255,0.1); }
          50%      { box-shadow: 0 0 44px rgba(157,122,255,0.25); }
        }
        @keyframes barShimmer {
          0%, 75% { transform: translateX(-100%); }
          100%    { transform: translateX(200%); }
        }
        @keyframes doneGlow {
          0%, 100% { box-shadow: 0 0 20px rgba(78,205,196,0.1); }
          50%      { box-shadow: 0 0 40px rgba(78,205,196,0.25); }
        }
        @keyframes celebrateBounce {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-8px); }
        }
        @keyframes sparkleFloat {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.5; }
          50%      { transform: translateY(-10px) scale(1.2); opacity: 1; }
        }
        @keyframes trophyShine {
          0%, 100% { filter: brightness(1); }
          50%      { filter: brightness(1.2); }
        }
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
        /* BL-004: Right sidebar — visible only on wide desktop */
        .dashboard-right-sidebar {
          display: none;
        }
        /* BL-004: Sidebar content inline in main — hidden when sidebar visible */
        .sidebar-content-inline {
          display: block;
        }
        @media (min-width: 1200px) {
          .dashboard-right-sidebar {
            display: flex;
            flex-direction: column;
            flex-shrink: 0;
            width: 300px;
          }
          .sidebar-content-inline {
            display: none;
          }
        }
        @media (min-width: 1200px) and (max-width: 1399px) {
          .dashboard-right-sidebar {
            width: 260px;
          }
        }
      `}</style>
  );

  // Early return AFTER all hooks (Rules of Hooks)
  // Keyframes are always injected so animations work on first paint
  if (!hydrated || !onboardingDone) return keyframesStyle;

  return (
    <>
      {keyframesStyle}

      <div className="flex" style={{ background: t.bg, position: 'relative', height: '100vh', overflow: 'hidden' }}>
        {/* Ambient glows — static radial-gradient backgrounds (§6: ambient background motion) */}
        {/* No animation — glowPulse adds box-shadow which creates visible ellipse shapes */}
        <div aria-hidden="true" style={{
          position: 'fixed', top: '-20%', left: '-10%',
          width: '50vw', height: '50vh', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(157,122,255,0.12) 0%, transparent 70%)',
          pointerEvents: 'none', zIndex: 0,
          filter: 'blur(40px)',
        }} />
        <div aria-hidden="true" style={{
          position: 'fixed', bottom: '-20%', right: '-10%',
          width: '50vw', height: '50vh', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(78,205,196,0.10) 0%, transparent 70%)',
          pointerEvents: 'none', zIndex: 0,
          filter: 'blur(40px)',
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
          <Link href="/home" aria-label={tr('nav.aria_home', 'Go to Command Center')} style={{ textDecoration: 'none' }}>
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

          {/* Hero Identity Card — merged widget (avatar + stats) */}
          {(() => {
            const heroLevelInfo = getLevelInfo(totalXp);
            const heroXpPct = Math.min(100, heroLevelInfo.progress * 100);
            return (
              <div
                role="region"
                aria-label={tr('sidebar.aria_hero_status', 'Hero status')}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  padding: '14px 12px 12px', marginBottom: 16,
                  borderRadius: 16, background: t.bgCard,
                  border: `1px solid ${t.border}`,
                }}
              >
                {/* Avatar */}
                {charData && (
                  <div style={{ animation: 'float 3s ease-in-out infinite', marginBottom: 6 }}>
                    <AnimatedPixelCanvas
                      character={charData}
                      size={3}
                      glowColor={charMeta?.color}
                    />
                  </div>
                )}
                {/* Name */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                  <span style={{ fontFamily: t.display, fontSize: 13, fontWeight: 700, color: t.text }}>
                    {displayName || charMeta?.name || tr('character.hero_fallback', 'Hero')}
                  </span>
                </div>
                {/* Archetype badge */}
                {archetype && (
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    padding: '2px 10px', borderRadius: 20, marginBottom: 8,
                    background: `${archetype.color}15`, border: `1px solid ${archetype.color}30`,
                  }}>
                    <span style={{ fontSize: 10, color: archetype.color }}>{archetype.icon}</span>
                    <span style={{
                      fontFamily: t.mono, fontSize: 10, fontWeight: 700, color: archetype.color,
                    }}>
                      {archetypeId ? tr(`archetype.${archetypeId}`, archetype.name) : archetype.name}
                    </span>
                  </div>
                )}

                {/* XP progress bar with exact numbers */}
                <div style={{ width: '100%', padding: '0 2px', marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{
                      fontFamily: t.mono, fontSize: 9, fontWeight: 700, color: t.gold,
                    }}>
                      {tr('sidebar.xp_progress', '{current} / {max} XP').replace('{current}', String(heroLevelInfo.currentXp)).replace('{max}', String(heroLevelInfo.xpForNextLevel))}
                    </span>
                    <span style={{
                      fontFamily: t.mono, fontSize: 9, fontWeight: 700, color: t.textMuted,
                    }}>
                      {tr('sidebar.level_badge', 'Lv.{n}').replace('{n}', String(level + 1))}
                    </span>
                  </div>
                  <div
                    role="progressbar"
                    aria-valuenow={heroLevelInfo.currentXp}
                    aria-valuemax={heroLevelInfo.xpForNextLevel}
                    aria-label={tr('sidebar.aria_xp_bar', 'Level {level}: {current} of {max} XP').replace('{level}', String(level)).replace('{current}', String(heroLevelInfo.currentXp)).replace('{max}', String(heroLevelInfo.xpForNextLevel))}
                    style={{
                      height: 6, borderRadius: 3,
                      background: t.border, overflow: 'hidden',
                    }}
                  >
                    <div style={{
                      width: '100%', height: '100%', borderRadius: 3,
                      background: t.gradient,
                      transform: `scaleX(${heroXpPct / 100})`,
                      transformOrigin: 'left',
                      transition: 'transform 0.6s ease-out',
                      boxShadow: heroXpPct >= 85 ? `0 0 12px rgba(157,122,255,0.5)` : `0 0 4px ${t.violet}30`,
                      // Near-level glowPulse — guarded by reduced-motion via CSS @media rule
                      animation: heroXpPct >= 85 ? 'glowPulse 2s ease-in-out infinite' : 'none',
                    }} />
                  </div>
                </div>

                {/* Quick stats: Streak / Energy / Coins */}
                <div style={{
                  display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
                  gap: 4, width: '100%',
                }}>
                  {/* Streak — bounce on value change */}
                  <div
                    aria-label={tr('stats.aria_streak', '{n} day streak').replace('{n}', String(currentStreak))}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center',
                      gap: 1, padding: '6px 2px', borderRadius: 10,
                      background: currentStreak > 0 ? `${t.gold}08` : 'transparent',
                    }}
                  >
                    <NeonIcon type="fire" size={13} color={currentStreak > 0 ? 'gold' : 'muted'} />
                    <span style={{
                      fontFamily: t.mono, fontSize: 12, fontWeight: 800,
                      color: currentStreak > 0 ? t.gold : t.textMuted,
                      transform: streakBounce ? 'scale(1.15)' : 'scale(1)',
                      transition: 'transform 0.1s ease-out',
                      display: 'inline-block',
                    }}>
                      {currentStreak}
                    </span>
                    <span style={{ fontFamily: t.body, fontSize: 7, color: t.textMuted }}>
                      {tr('dashboard.streak_label', 'streak')}
                    </span>
                  </div>

                  {/* Energy */}
                  <div
                    aria-label={tr('sidebar.aria_energy', '{n} of {max} energy crystals').replace('{n}', String(energyCrystals)).replace('{max}', String(maxEnergyCrystals))}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center',
                      gap: 1, padding: '6px 2px', borderRadius: 10,
                      background: energyCrystals > 0 ? `${t.cyan}08` : `${t.rose}06`,
                    }}
                  >
                    <NeonIcon type="gem" size={13} color={energyCrystals > 0 ? 'cyan' : 'rose'} />
                    <span style={{
                      fontFamily: t.mono, fontSize: 12, fontWeight: 800,
                      color: energyCrystals > 0 ? t.cyan : t.rose,
                    }}>
                      {energyCrystals}/{maxEnergyCrystals}
                    </span>
                    <span style={{ fontFamily: t.body, fontSize: 7, color: t.textMuted }}>
                      {tr('dashboard.energy_label', 'energy')}
                    </span>
                  </div>

                  {/* Coins — bounce on value change */}
                  <div
                    aria-label={tr('sidebar.aria_coins', '{n} coins').replace('{n}', String(coins))}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center',
                      gap: 1, padding: '6px 2px', borderRadius: 10,
                      background: coins > 0 ? `${t.gold}06` : 'transparent',
                    }}
                  >
                    <NeonIcon type="coins" size={13} color="gold" />
                    <span style={{
                      fontFamily: t.mono, fontSize: 12, fontWeight: 800,
                      color: t.gold,
                      transform: coinBounce ? 'scale(1.15)' : 'scale(1)',
                      transition: 'transform 0.1s ease-out',
                      display: 'inline-block',
                    }}>
                      {coins}
                    </span>
                    <span style={{ fontFamily: t.body, fontSize: 7, color: t.textMuted }}>
                      {tr('dashboard.coins_label', 'coins')}
                    </span>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ═══ ZONE 2 — NAV (4 items) ═══ */}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    textDecoration: 'none', borderRadius: 12,
                    outline: 'none',
                  }}
                  onFocus={(e) => {
                    const div = e.currentTarget.firstElementChild as HTMLElement;
                    if (div) div.style.boxShadow = `0 0 0 2px ${t.violet}60`;
                  }}
                  onBlur={(e) => {
                    const div = e.currentTarget.firstElementChild as HTMLElement;
                    if (div) div.style.boxShadow = 'none';
                  }}
                >
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 14px', borderRadius: 12,
                    minHeight: 44, // UX-R153: Touch target ≥ 44px
                    background: active ? `${t.violet}15` : 'transparent',
                    transition: 'background 0.2s ease',
                    cursor: 'pointer',
                  }}>
                    <NeonIcon type={item.icon} size={20} color={active ? 'violet' : 'muted'} active={active} />
                    <span style={{
                      fontFamily: t.body, fontSize: 14, fontWeight: active ? 700 : 500,
                      color: active ? t.violet : t.textSecondary,
                      transition: 'color 0.2s ease',
                    }}>
                      {tr(item.labelKey, item.label)}
                    </span>
                    {active && (
                      <div style={{
                        marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%',
                        background: t.violet, boxShadow: `0 0 8px ${t.violet}80`,
                      }} />
                    )}
                    {!active && item.badge && !quietMode && (
                      <div
                        aria-label={tr('nav.aria_new_activity', 'New activity')}
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
              archetypeId={archetypeId}
              level={level}
              xpTotal={totalXp}
              displayName={displayName}
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

        {/* ═══ Main Content + Right Sidebar ═══ */}
        <div style={{ flex: 1, position: 'relative', zIndex: 1, overflowY: 'auto' }}>
          <div style={{ display: 'flex', minHeight: '100%' }}>
            <main style={{ flex: 1, minWidth: 0 }}>
              {/* Mobile top padding for sticky header */}
              <div className="md:hidden" style={{ height: 56 }} />
              <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 24px 96px' }}>
                {children}
              </div>
            </main>

            {/* ═══ Right Sidebar — BL-004: secondary content, sticky ═══ */}
            <aside
              className="dashboard-right-sidebar"
              style={{
                borderLeft: `1px solid ${t.border}`,
              }}
            >
              <div style={{
                position: 'sticky',
                top: 0,
                maxHeight: '100vh',
                overflowY: 'auto',
                paddingLeft: 20,
                paddingRight: 20,
              }}>
                <RightSidebar />
              </div>
            </aside>
          </div>
        </div>

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
            const isPressed = pressedTab === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{ textDecoration: 'none' }}
                onMouseDown={() => setPressedTab(item.href)}
                onMouseUp={() => setPressedTab(null)}
                onMouseLeave={() => setPressedTab(null)}
                onTouchStart={() => setPressedTab(item.href)}
                onTouchEnd={() => setPressedTab(null)}
              >
                <div style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                  padding: '6px 12px', borderRadius: 12,
                  minWidth: 64, minHeight: 44, // UX-R153: Touch target ≥ 44px
                  transition: 'background 0.2s ease, color 0.2s ease, transform 0.15s ease-out',
                  animation: active ? 'tabGlow 2s ease-in-out infinite' : 'none',
                  transform: isPressed ? 'scale(0.95)' : 'scale(1)',
                }}>
                  <NeonIcon type={item.icon} size={20} color={active ? 'violet' : 'muted'} active={active} />
                  <span style={{
                    fontFamily: t.body, fontSize: 9, fontWeight: active ? 700 : 500,
                    color: active ? t.violet : t.textMuted,
                    transition: 'color 0.2s ease',
                    lineHeight: 1,
                  }}>
                    {tr(item.labelKey, item.label)}
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
