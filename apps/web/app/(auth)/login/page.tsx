'use client';

import { useState } from 'react';

// ═══════════════════════════════════════════
// AUTH — Responsive: Mobile (<1024) + Desktop (≥1024)
// From approved designs: screens/mobile/Auth.jsx + screens/desktop/Auth.jsx
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
};

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

function SocialButton({ icon, label, height }: { icon: React.ReactNode; label: string; height: string }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        width: '100%',
        height,
        background: hov ? '#1E1E28' : t.bgElevated,
        border: `1.5px solid ${hov ? t.borderHover : t.border}`,
        borderRadius: '16px',
        cursor: 'pointer',
        fontFamily: t.body,
        fontSize: '15px',
        fontWeight: 500,
        color: t.text,
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

const featureItems = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9D7AFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="6" />
        <circle cx="12" cy="12" r="2" />
      </svg>
    ),
    text: 'AI-powered personalized roadmaps',
    color: '#9D7AFF',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4ECDC4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
    ),
    text: 'Daily micro-tasks that fit your schedule',
    color: '#4ECDC4',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFD166" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 9H4.5a2.5 2.5 0 010-5C7 4 7 7 7 7" />
        <path d="M18 9h1.5a2.5 2.5 0 000-5C17 4 17 7 17 7" />
        <path d="M4 22h16" />
        <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
        <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
        <path d="M18 2H6v7a6 6 0 1012 0V2z" />
      </svg>
    ),
    text: 'Gamification that actually works',
    color: '#FFD166',
  },
];

// ── Brand Panel (desktop only, left 45%) ──
function BrandPanel() {
  return (
    <div
      style={{
        flex: '0 0 45%',
        background: t.bgElevated,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '60px 48px',
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
          maxWidth: '360px',
          animation: 'fadeUp 0.6s ease',
        }}
      >
        {/* Logo */}
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
            marginBottom: '28px',
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
            fontSize: '34px',
            fontWeight: 700,
            color: t.text,
            marginBottom: '6px',
            letterSpacing: '-0.03em',
          }}
        >
          Plan<span style={{ color: t.cyan }}>2</span>Skill
        </h1>
        <p style={{ fontFamily: t.body, fontSize: '15px', color: t.textSecondary, marginBottom: '48px' }}>
          From roadmap to results
        </p>

        {/* Feature highlights */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left' }}>
          {featureItems.map((item, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                padding: '14px 18px',
                background: `${item.color}06`,
                border: `1px solid ${item.color}15`,
                borderRadius: '12px',
                animation: `fadeUp 0.5s ease ${0.2 + i * 0.1}s both`,
              }}
            >
              <span style={{ display: 'flex', flexShrink: 0 }}>{item.icon}</span>
              <span style={{ fontFamily: t.body, fontSize: '14px', color: t.textSecondary }}>
                {item.text}
              </span>
            </div>
          ))}
        </div>

        {/* Social proof */}
        <div style={{ marginTop: '52px', animation: 'fadeUp 0.5s ease 0.6s both' }}>
          <SocialProof avatarSize={32} bgColor={t.bgElevated} fontSize="13px" />
        </div>
      </div>
    </div>
  );
}

// ── Mobile Layout (centered, full-screen) ──
function MobileAuth() {
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
            <SocialButton icon={<GoogleIcon />} label="Continue with Google" height="56px" />
            <SocialButton icon={<AppleIcon />} label="Continue with Apple" height="56px" />
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

        {/* Social proof */}
        <div style={{ textAlign: 'center', marginTop: '48px', animation: 'fadeUp 0.5s ease 0.3s both' }}>
          <SocialProof avatarSize={28} bgColor={t.bg} fontSize="12px" />
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
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
      `}</style>

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
                  <SocialButton icon={<GoogleIcon />} label="Continue with Google" height="52px" />
                  <SocialButton icon={<AppleIcon />} label="Continue with Apple" height="52px" />
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
          <MobileAuth />
        </div>
      </div>
    </>
  );
}
