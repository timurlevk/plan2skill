'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, useOnboardingStore, useOnboardingV2Store } from '@plan2skill/store';

// ─── Google Identity Services types ───
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string; select_by: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          renderButton: (parent: HTMLElement, options: {
            type?: 'standard' | 'icon';
            theme?: 'outline' | 'filled_blue' | 'filled_black';
            size?: 'large' | 'medium' | 'small';
            width?: string;
            text?: string;
          }) => void;
        };
      };
    };
  }
}

// ═══════════════════════════════════════════
// AUTH — Login Screen (Rebalanced)
// Source of truth: v7 Style Guide (8 diverse characters)
// Layout: 40% brand / 60% auth (desktop)
// ═══════════════════════════════════════════

const t = {
  violet: '#9D7AFF',
  cyan: '#4ECDC4',
  indigo: '#818CF8',
  rose: '#FF6B8A',
  gold: '#FFD166',
  gradient: 'linear-gradient(135deg, #9D7AFF 0%, #4ECDC4 100%)',
  bg: '#0C0C10',
  bgCard: '#18181F',
  bgElevated: '#121218',
  border: '#252530',
  borderHover: '#35354A',
  text: '#FFFFFF',
  textSecondary: '#A1A1AA',
  textMuted: '#71717A',
  display: '"Plus Jakarta Sans", system-ui, sans-serif',
  body: '"Inter", system-ui, sans-serif',
  mono: '"JetBrains Mono", monospace',
};

// ─── Pixel Art Engine (from v7 Style Guide) ───
const parseArt = (str: string, pal: Record<string, string>) =>
  str.trim().split('\n').map(r => [...r.trim()].map(c => c === '.' ? null : pal[c] || null));

function PixelCanvas({ data, size = 5, style = {} }: { data: (string | null)[][]; size?: number; style?: React.CSSProperties }) {
  if (!data?.length) return null;
  const w = data[0]!.length, h = data.length;
  const sh: string[] = [];
  data.forEach((row, y) => row.forEach((c, x) => { if (c) sh.push(`${x * size}px ${y * size}px 0 0 ${c}`); }));
  return <div style={{ width: size, height: size, boxShadow: sh.join(','), marginRight: (w - 1) * size, marginBottom: (h - 1) * size, ...style }} />;
}

// ─── v7 Characters: Mei (F, East Asian, Medium) & Kofi (M, African, Dark) ───
// Diversity: different gender, ethnicity, skin tone
const charArtStrings = {
  mei:  '...HHHHHH...\n..HHHHHHHH..\n.HhhhhhhhhH.\n.HHSSSSSSHH.\n.HSEESSEESH.\n.HSEwSSEwSH.\n..HrSSSSrH..\n...SSmmSS...\n....SSSS....\n...TTTTTT...\n..TTTTTTTT..\n.ATTTTTTTTA.\n.ATTTttTTTA.\n..TTTTTTTT..\n...PP..PP...\n..FFF..FFF..',
  kofi: '..HHHHHHHH..\n..HHHHHHHH..\n...HHHHHH...\n..HSSSSSSH..\n..SEESSEES..\n..SEwSSEwS..\n..SrSSSSrS..\n...SSmmSS...\n....SSSS....\n...TTTTTT...\n..TTTTTTTT..\n.ATTTTTTTTA.\n.ATTTttTTTA.\n..TTTTTTTT..\n...PP..PP...\n..FFF..FFF..',
};

const charPalettes = {
  mei:  { H: '#1A1A2E', h: '#2A2A40', S: '#DEB887', E: '#1A1020', w: '#FFF', r: '#D4A06A', m: '#C08060', T: '#E879F9', t: '#C060D0', A: '#DEB887', P: '#9040A0', F: '#7030A0' },
  kofi: { H: '#1A1008', h: '#2A1A10', S: '#8B5E3C', E: '#0A0A1E', w: '#FFF', r: '#7A4E2C', m: '#6A3E20', T: '#2A9D8F', t: '#1A7A6A', A: '#8B5E3C', P: '#155A50', F: '#104A40' },
};

const gamifChars = Object.keys(charArtStrings).map(id => ({
  id,
  artString: charArtStrings[id as keyof typeof charArtStrings],
  palette: charPalettes[id as keyof typeof charPalettes],
  art: parseArt(charArtStrings[id as keyof typeof charArtStrings], charPalettes[id as keyof typeof charPalettes]),
}));

// ─── Animation utilities ───
const mirrorArtString = (str: string) =>
  str.trim().split('\n').map(r => [...r.trim()].reverse().join('')).join('\n');

// Idle animation
const idleAnim = {
  frameCount: 2,
  msPerFrame: 1500,
  buildFrames: (baseString: string) => {
    const rows = baseString.trim().split('\n');
    const frame0 = rows.join('\n');
    const r = [...rows];
    if (r[11]) {
      const chars = [...r[11]];
      if (chars[0] === '.') chars[0] = ' ';
      r[11] = chars.join('');
    }
    const frame1 = r.join('\n');
    return [frame0, frame1];
  },
};

// ─── AnimatedPixelCanvas (for mobile idle) ───
function AnimatedPixelCanvas({ character, size = 5, glowColor }: {
  character: typeof gamifChars[0]; size?: number; glowColor?: string;
}) {
  const [frameIndex, setFrameIndex] = useState(0);

  const frames = useMemo(() => {
    if (!character?.artString || !character?.palette) return [character?.art || []];
    return idleAnim.buildFrames(character.artString).map(f => parseArt(f, character.palette));
  }, [character?.id]);

  useEffect(() => {
    if (frames.length <= 1) return;
    const iv = setInterval(() => {
      setFrameIndex(prev => (prev + 1) % frames.length);
    }, idleAnim.msPerFrame);
    return () => clearInterval(iv);
  }, [frames.length]);

  return (
    <div style={{ filter: glowColor ? `drop-shadow(0 0 10px ${glowColor}44)` : 'none' }}>
      <PixelCanvas data={(frames[frameIndex] ?? frames[0])!} size={size} />
    </div>
  );
}

// ─── MirroredAnimatedPixelCanvas (faces inward — for right-side character) ───
function MirroredAnimatedPixelCanvas({ character, size = 5, glowColor }: {
  character: typeof gamifChars[0]; size?: number; glowColor?: string;
}) {
  const [frameIndex, setFrameIndex] = useState(0);

  const frames = useMemo(() => {
    if (!character?.artString || !character?.palette) return [character?.art || []];
    const mirrored = mirrorArtString(character.artString);
    return idleAnim.buildFrames(mirrored).map(f => parseArt(f, character.palette));
  }, [character?.id]);

  useEffect(() => {
    if (frames.length <= 1) return;
    const iv = setInterval(() => {
      setFrameIndex(prev => (prev + 1) % frames.length);
    }, idleAnim.msPerFrame);
    return () => clearInterval(iv);
  }, [frames.length]);

  return (
    <div style={{ filter: glowColor ? `drop-shadow(0 0 10px ${glowColor}44)` : 'none' }}>
      <PixelCanvas data={(frames[frameIndex] ?? frames[0])!} size={size} />
    </div>
  );
}

// ─── Shared components ───
function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
      <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
  );
}

function LoadingSpinner() {
  return (
    <div style={{
      width: '20px',
      height: '20px',
      border: `2px solid ${t.border}`,
      borderTopColor: t.violet,
      borderRadius: '50%',
      animation: 'spin 0.6s linear infinite',
    }} />
  );
}

// ─── Google Auth Button: invisible Google renderButton overlay on top of our styled button ───
function GoogleAuthButton({ height, isLoading, gisReady, googleBtnRef }: {
  height: string;
  isLoading: boolean;
  gisReady: boolean;
  googleBtnRef: React.RefObject<HTMLDivElement | null>;
}) {
  return (
    <div style={{ position: 'relative', width: '100%', height }}>
      {/* Our visible styled button underneath */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        width: '100%',
        height,
        background: t.bgElevated,
        border: `1.5px solid ${t.border}`,
        borderRadius: '16px',
        fontFamily: t.body,
        fontSize: '15px',
        fontWeight: 500,
        color: isLoading ? t.textMuted : t.text,
        opacity: isLoading ? 0.6 : 1,
        transition: 'all 0.15s ease',
        pointerEvents: 'none',
      }}>
        {isLoading ? <LoadingSpinner /> : <GoogleIcon />}
        {isLoading ? 'Forging connection...' : 'Continue with Google'}
      </div>
      {/* Invisible Google renderButton overlay — catches the click, opens real popup */}
      <div
        ref={googleBtnRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height,
          opacity: 0.001,
          overflow: 'hidden',
          borderRadius: '16px',
          cursor: gisReady && !isLoading ? 'pointer' : 'not-allowed',
          pointerEvents: gisReady && !isLoading ? 'auto' : 'none',
        }}
      />
    </div>
  );
}

function SocialButton({ icon, label, height, onClick, disabled }: { icon: React.ReactNode; label: string; height: string; onClick?: () => void; disabled?: boolean }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      disabled={disabled}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        width: '100%',
        height,
        background: hov && !disabled ? '#1E1E28' : t.bgElevated,
        border: `1.5px solid ${hov && !disabled ? t.borderHover : t.border}`,
        borderRadius: '16px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontFamily: t.body,
        fontSize: '15px',
        fontWeight: 500,
        color: disabled ? t.textMuted : t.text,
        opacity: disabled ? 0.6 : 1,
        transition: 'all 0.15s ease',
      }}
    >
      {icon} {label}
    </button>
  );
}

function SocialProof({ avatarSize, bgColor, fontSize }: { avatarSize: number; bgColor: string; fontSize: string }) {
  const colors = [t.violet, t.cyan, t.rose, t.gold, t.indigo];
  const letters = ['A', 'K', 'M', 'D', 'S'];
  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: avatarSize > 30 ? '10px' : '8px' }}>
        {colors.map((c, i) => (
          <div
            key={i}
            style={{
              width: `${avatarSize}px`,
              height: `${avatarSize}px`,
              borderRadius: '50%',
              background: `${c}25`,
              border: `${avatarSize > 30 ? '2.5' : '2'}px solid ${bgColor}`,
              marginLeft: i > 0 ? `${avatarSize > 30 ? -8 : -6}px` : 0,
              position: 'relative',
              zIndex: 5 - i,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: t.display,
              fontSize: avatarSize > 30 ? '11px' : '10px',
              fontWeight: 700,
              color: c,
            }}
          >
            {letters[i]}
          </div>
        ))}
      </div>
      <p style={{ fontFamily: t.body, fontSize, color: t.textMuted }}>
        Join <span style={{ color: t.cyan, fontWeight: 600 }}>2,847</span> professionals leveling up
      </p>
    </>
  );
}

// ═══════════════════════════════════════════
// DESKTOP — Brand Panel (left 40%)
// Rebalanced: logo + interaction + tagline + social proof
// ═══════════════════════════════════════════
function BrandPanel() {
  return (
    <div
      style={{
        flex: '0 0 40%',
        background: t.bgElevated,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '60px 40px',
        position: 'relative',
        overflow: 'hidden',
        borderRight: `1px solid ${t.border}`,
      }}
    >
      {/* Ambient glows */}
      <div
        style={{
          position: 'absolute',
          top: '10%',
          left: '15%',
          width: '350px',
          height: '350px',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${t.violet}12 0%, transparent 65%)`,
          filter: 'blur(80px)',
          pointerEvents: 'none',
          animation: 'glowPulse 8s ease-in-out infinite',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '15%',
          right: '10%',
          width: '300px',
          height: '300px',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${t.cyan}10 0%, transparent 65%)`,
          filter: 'blur(60px)',
          pointerEvents: 'none',
          animation: 'glowPulse 10s ease-in-out infinite 2s',
        }}
      />

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          textAlign: 'center',
          width: '100%',
          maxWidth: '380px',
          animation: 'fadeUp 0.6s ease',
        }}
      >
        {/* ── Hero row: Mei (left) | Logo block | Kofi mirrored (right) ── */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '24px',
          marginBottom: '32px',
        }}>
          {/* Left character — Mei (F, East Asian, Medium skin) */}
          <div style={{
            animation: 'bounceIn 0.5s 0.2s cubic-bezier(0.34,1.56,0.64,1) both',
            flexShrink: 0,
          }}>
            <AnimatedPixelCanvas
              character={gamifChars[0]!}
              size={5}
              glowColor={charPalettes.mei.T}
            />
          </div>

          {/* Center — Logo + Title + Tagline */}
          <div style={{ textAlign: 'center', flexShrink: 0 }}>
            <div
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '18px',
                background: t.gradient,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: `0 16px 48px ${t.violet}25`,
                marginBottom: '16px',
                animation: 'float 5s ease-in-out infinite',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '50%',
                  background: 'linear-gradient(180deg, rgba(255,255,255,0.2) 0%, transparent 100%)',
                  borderRadius: '18px 18px 0 0',
                }}
              />
              <span
                style={{
                  fontFamily: t.display,
                  fontWeight: 800,
                  fontSize: '28px',
                  color: '#FFF',
                  position: 'relative',
                  zIndex: 1,
                  letterSpacing: '-0.02em',
                }}
              >
                P2
              </span>
            </div>

            <h1
              style={{
                fontFamily: t.display,
                fontSize: '28px',
                fontWeight: 700,
                color: t.text,
                marginBottom: '4px',
                letterSpacing: '-0.03em',
              }}
            >
              Plan<span style={{ color: t.cyan }}>2</span>Skill
            </h1>
            <p style={{ fontFamily: t.body, fontSize: '14px', color: t.textSecondary }}>
              From roadmap to results
            </p>
          </div>

          {/* Right character — Kofi mirrored (M, African, Dark skin) */}
          <div style={{
            animation: 'bounceIn 0.5s 0.4s cubic-bezier(0.34,1.56,0.64,1) both',
            flexShrink: 0,
          }}>
            <MirroredAnimatedPixelCanvas
              character={gamifChars[1]!}
              size={5}
              glowColor={charPalettes.kofi.T}
            />
          </div>
        </div>

        {/* ── Social proof ── */}
        <div style={{ animation: 'fadeUp 0.5s ease 0.6s both' }}>
          <SocialProof avatarSize={32} bgColor={t.bgElevated} fontSize="13px" />
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// MOBILE — Centered Layout
// Uses AnimatedPixelCanvas with Aria (v7) idle
// ═══════════════════════════════════════════
function MobileAuth({ onBypassAppleAuth, isLoading, gisReady, googleBtnRef }: {
  onBypassAppleAuth: () => void;
  isLoading: boolean;
  gisReady: boolean;
  googleBtnRef: React.RefObject<HTMLDivElement | null>;
}) {
  return (
    <div
      style={{
        minHeight: '100vh',
        maxWidth: '430px',
        margin: '0 auto',
        background: t.bg,
        fontFamily: t.body,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Ambient glows */}
      <div
        style={{
          position: 'fixed',
          top: '-15%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${t.violet}10 0%, transparent 65%)`,
          filter: 'blur(80px)',
          pointerEvents: 'none',
          animation: 'glowPulse 8s ease-in-out infinite',
        }}
      />
      <div
        style={{
          position: 'fixed',
          bottom: '-10%',
          right: '5%',
          width: '350px',
          height: '350px',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${t.cyan}08 0%, transparent 65%)`,
          filter: 'blur(60px)',
          pointerEvents: 'none',
          animation: 'glowPulse 10s ease-in-out infinite 2s',
        }}
      />

      <div style={{ position: 'relative', zIndex: 1, width: '100%', animation: 'fadeUp 0.5s ease' }}>
        {/* ── Animated Aria (v7) character ── */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: '20px',
          animation: 'bounceIn 0.6s cubic-bezier(0.34,1.56,0.64,1) both',
        }}>
          <AnimatedPixelCanvas
            character={gamifChars[0]!}
            size={5}
            glowColor={t.violet}
          />
        </div>

        {/* Logo + Header */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '14px',
              background: t.gradient,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: `0 8px 24px ${t.violet}25`,
              marginBottom: '24px',
              animation: 'float 5s ease-in-out infinite',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '50%',
                background: 'linear-gradient(180deg, rgba(255,255,255,0.2) 0%, transparent 100%)',
                borderRadius: '14px 14px 0 0',
              }}
            />
            <span
              style={{
                fontFamily: t.display,
                fontWeight: 800,
                fontSize: '21px',
                color: '#FFF',
                position: 'relative',
                zIndex: 1,
              }}
            >
              P2
            </span>
          </div>
          <h2
            style={{
              fontFamily: t.display,
              fontSize: '28px',
              fontWeight: 700,
              color: t.text,
              marginBottom: '8px',
              letterSpacing: '-0.03em',
            }}
          >
            Welcome to Plan2Skill
          </h2>
          <p style={{ fontFamily: t.body, fontSize: '15px', color: t.textSecondary, lineHeight: 1.5 }}>
            Sign in to start your personalized
            <br />
            learning journey
          </p>
        </div>

        {/* Auth card */}
        <div
          style={{
            background: `${t.bgCard}90`,
            backdropFilter: 'blur(20px)',
            border: `1px solid ${t.border}`,
            borderRadius: '24px',
            padding: '24px 20px',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <GoogleAuthButton height="56px" isLoading={isLoading} gisReady={gisReady} googleBtnRef={googleBtnRef} />
            {/* TODO: Replace bypass with real Apple auth */}
            <SocialButton icon={<AppleIcon />} label="Continue with Apple" height="56px" onClick={onBypassAppleAuth} disabled={isLoading} />
          </div>
        </div>

        {/* Terms */}
        <p
          style={{
            textAlign: 'center',
            marginTop: '20px',
            fontFamily: t.body,
            fontSize: '12px',
            color: t.textMuted,
            lineHeight: 1.6,
          }}
        >
          By continuing, you agree to our{' '}
          <span style={{ color: t.violet, cursor: 'pointer' }}>Terms of Service</span> and{' '}
          <span style={{ color: t.violet, cursor: 'pointer' }}>Privacy Policy</span>
        </p>

        {/* ── Mini Stat Preview ── */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '16px',
          marginTop: '16px',
          animation: 'fadeUp 0.5s ease 0.2s both',
        }}>
          {[
            { label: 'LVL 1', color: t.violet },
            { label: '0 XP', color: t.cyan },
            { label: 'Start Free', color: t.gold },
          ].map((stat, i) => (
            <span key={i} style={{
              fontFamily: t.mono,
              fontSize: '11px',
              fontWeight: 600,
              color: stat.color,
              opacity: 0.7,
            }}>
              {stat.label}
              {i < 2 && <span style={{ color: t.textMuted, margin: '0 0 0 16px' }}>&middot;</span>}
            </span>
          ))}
        </div>

        {/* Social proof */}
        <div style={{ textAlign: 'center', marginTop: '32px', animation: 'fadeUp 0.5s ease 0.3s both' }}>
          <SocialProof avatarSize={28} bgColor={t.bg} fontSize="12px" />
        </div>
      </div>
    </div>
  );
}

// ─── Error Toast ───
function ErrorToast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div style={{
      position: 'fixed',
      top: '24px',
      left: '50%',
      transform: 'translateX(-50%)',
      background: '#1E1015',
      border: `1px solid ${t.rose}40`,
      borderRadius: '12px',
      padding: '12px 20px',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      zIndex: 9999,
      fontFamily: t.body,
      fontSize: '14px',
      color: t.rose,
      boxShadow: `0 8px 32px ${t.rose}20`,
      animation: 'fadeUp 0.3s ease',
    }}>
      <span style={{ fontSize: '16px' }}>&#9888;</span>
      {message}
      <button
        onClick={onClose}
        style={{
          background: 'none',
          border: 'none',
          color: t.textMuted,
          cursor: 'pointer',
          fontSize: '16px',
          marginLeft: '8px',
          padding: 0,
        }}
      >
        &#10005;
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════
// ROOT — LoginPage
// ═══════════════════════════════════════════
export default function LoginPage() {
  const router = useRouter();
  const { setTokens, setUser, setLoading, isLoading } = useAuthStore();
  const { forgeComplete } = useOnboardingStore();
  const { onboardingCompletedAt } = useOnboardingV2Store();
  const [error, setError] = useState<string | null>(null);
  const [gisReady, setGisReady] = useState(false);
  const gisInitialized = useRef(false);
  const desktopGoogleBtnRef = useRef<HTMLDivElement>(null);
  const mobileGoogleBtnRef = useRef<HTMLDivElement>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? '';

  // ─── Google credential callback ───
  const handleGoogleResponse = useCallback(async (response: { credential: string }) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: 'google', idToken: response.credential }),
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.message || `Login failed (${res.status})`);
      }
      const data: { accessToken: string; refreshToken: string; userId: string; displayName: string } = await res.json();
      setTokens(data.accessToken, data.refreshToken);
      setUser(data.userId, data.displayName);
      // Returning users skip onboarding, new users go through it
      const onboardingDone = forgeComplete || !!onboardingCompletedAt;
      router.push(onboardingDone ? '/home' : '/intent');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The path is blocked. Try again, hero.');
    } finally {
      setLoading(false);
    }
  }, [apiUrl, setTokens, setUser, setLoading, router]);

  // ─── Load GIS SDK + renderButton into overlay containers ───
  useEffect(() => {
    if (!googleClientId || gisInitialized.current) return;

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (!window.google) return;

      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleGoogleResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      // Render invisible Google button into both desktop and mobile containers
      const btnOpts = { type: 'standard' as const, theme: 'filled_blue' as const, size: 'large' as const, width: '400' };
      if (desktopGoogleBtnRef.current) {
        window.google.accounts.id.renderButton(desktopGoogleBtnRef.current, btnOpts);
      }
      if (mobileGoogleBtnRef.current) {
        window.google.accounts.id.renderButton(mobileGoogleBtnRef.current, btnOpts);
      }

      gisInitialized.current = true;
      setGisReady(true);
    };
    script.onerror = () => {
      setError('Failed to load Google Sign-In. Check your connection.');
    };
    document.head.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [googleClientId, handleGoogleResponse]);

  // TODO: Replace bypass with real Apple auth
  const bypassAppleAuth = () => router.push('/intent');

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @keyframes glowPulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 0.8; }
        }
        @keyframes breathe {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        @keyframes bounceIn {
          0% { opacity: 0; transform: scale(0.3); }
          50% { transform: scale(1.08); }
          70% { transform: scale(0.95); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* Error Toast */}
      {error && <ErrorToast message={error} onClose={() => setError(null)} />}

      {/* Desktop: split layout */}
      <div
        style={{
          height: '100vh',
          width: '100vw',
          background: t.bg,
          fontFamily: t.body,
          overflow: 'hidden',
        }}
      >
        {/* Desktop (≥1024px) */}
        <div className="hidden lg:flex" style={{ height: '100%' }}>
          <BrandPanel />
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '40px 48px',
              overflowY: 'auto',
            }}
          >
            <div style={{ width: '100%', maxWidth: '400px', animation: 'fadeUp 0.4s ease' }}>
              <div style={{ marginBottom: '28px', textAlign: 'center' }}>
                <h2
                  style={{
                    fontFamily: t.display,
                    fontSize: '24px',
                    fontWeight: 700,
                    color: t.text,
                    marginBottom: '8px',
                    letterSpacing: '-0.03em',
                  }}
                >
                  Welcome to Plan2Skill
                </h2>
                <p style={{ fontFamily: t.body, fontSize: '14px', color: t.textSecondary }}>
                  Sign in to continue your learning journey
                </p>
              </div>

              <div
                style={{
                  background: `${t.bgCard}cc`,
                  backdropFilter: 'blur(20px)',
                  border: `1px solid ${t.border}`,
                  borderRadius: '24px',
                  padding: '28px 24px',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <GoogleAuthButton height="52px" isLoading={isLoading} gisReady={gisReady} googleBtnRef={desktopGoogleBtnRef} />
                  {/* TODO: Replace bypass with real Apple auth */}
                  <SocialButton icon={<AppleIcon />} label="Continue with Apple" height="52px" onClick={bypassAppleAuth} disabled={isLoading} />
                </div>
              </div>

              {/* Terms */}
              <p
                style={{
                  textAlign: 'center',
                  marginTop: '20px',
                  fontFamily: t.body,
                  fontSize: '12px',
                  color: t.textMuted,
                  lineHeight: 1.6,
                }}
              >
                By continuing, you agree to our{' '}
                <span style={{ color: t.violet, cursor: 'pointer' }}>Terms of Service</span> and{' '}
                <span style={{ color: t.violet, cursor: 'pointer' }}>Privacy Policy</span>
              </p>
            </div>
          </div>
        </div>

        {/* Mobile (<1024px) */}
        <div className="lg:hidden">
          <MobileAuth
            onBypassAppleAuth={bypassAppleAuth}
            isLoading={isLoading}
            gisReady={gisReady}
            googleBtnRef={mobileGoogleBtnRef}
          />
        </div>
      </div>
    </>
  );
}
