'use client';

import { useState } from 'react';

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-dark-900">
      {/* Ambient glows */}
      <div className="pointer-events-none fixed inset-0">
        <div
          className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(157,122,255,0.1) 0%, transparent 70%)',
            filter: 'blur(80px)',
          }}
        />
        <div
          className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(78,205,196,0.08) 0%, transparent 70%)',
            filter: 'blur(60px)',
          }}
        />
      </div>

      {/* Split panel: left = branding, right = auth card */}
      <div className="relative z-10 flex w-full max-w-[960px] mx-auto gap-12 px-6">
        {/* Left: Branding (hidden on mobile) */}
        <div className="hidden lg:flex flex-col justify-center flex-1">
          <div className="mb-6">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-xl"
              style={{
                fontFamily: '"Plus Jakarta Sans", system-ui',
                background: 'linear-gradient(135deg, #9D7AFF 0%, #4ECDC4 100%)',
              }}
            >
              P2
            </div>
          </div>
          <h1
            className="text-4xl font-extrabold text-white mb-3"
            style={{ fontFamily: '"Plus Jakarta Sans", system-ui' }}
          >
            Your skills.
            <br />
            <span className="bg-gradient-to-r from-violet to-cyan bg-clip-text text-transparent">
              Your roadmap.
            </span>
          </h1>
          <p className="text-light-400 text-base max-w-md leading-relaxed">
            AI-powered learning roadmaps with gamification.
            Turn your goals into daily quests and level up your career.
          </p>

          {/* Feature highlights */}
          <div className="mt-8 flex flex-col gap-3">
            {[
              { icon: '🗺️', text: 'AI generates your personalized 90-day roadmap' },
              { icon: '⚔️', text: 'Earn XP, level up, and equip your character' },
              { icon: '🔥', text: 'Build streaks and track your consistency' },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-3 text-sm text-light-400">
                <span className="text-base">{item.icon}</span>
                {item.text}
              </div>
            ))}
          </div>
        </div>

        {/* Right: Auth Card */}
        <div className="flex-1 max-w-[420px] mx-auto lg:mx-0">
          <div
            className="p-8 rounded-2xl"
            style={{
              background: 'rgba(24, 24, 31, 0.9)',
              backdropFilter: 'blur(20px)',
              border: '1px solid #252530',
            }}
          >
            {/* Mobile logo */}
            <div className="lg:hidden flex justify-center mb-6">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-xl"
                style={{
                  fontFamily: '"Plus Jakarta Sans", system-ui',
                  background: 'linear-gradient(135deg, #9D7AFF 0%, #4ECDC4 100%)',
                }}
              >
                P2
              </div>
            </div>

            <h2
              className="text-2xl font-bold text-white text-center mb-2"
              style={{ fontFamily: '"Plus Jakarta Sans", system-ui' }}
            >
              Welcome to Plan2Skill
            </h2>
            <p className="text-light-500 text-sm text-center mb-8">
              Sign in to start your personalized learning journey
            </p>

            {/* Social auth buttons */}
            <div className="flex flex-col gap-3">
              <button
                onClick={() => setIsLoading(true)}
                className="flex items-center justify-center gap-3 w-full py-3.5 px-4 rounded-xl text-white font-semibold text-sm transition-all"
                style={{
                  background: '#18181F',
                  border: '1px solid #252530',
                  fontFamily: '"Plus Jakarta Sans", system-ui',
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Continue with Google
              </button>

              <button
                onClick={() => setIsLoading(true)}
                className="flex items-center justify-center gap-3 w-full py-3.5 px-4 rounded-xl text-white font-semibold text-sm transition-all"
                style={{
                  background: '#18181F',
                  border: '1px solid #252530',
                  fontFamily: '"Plus Jakarta Sans", system-ui',
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                  <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.52-3.23 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                </svg>
                Continue with Apple
              </button>
            </div>

            {/* Social proof */}
            <div className="mt-8 flex items-center justify-center gap-2">
              <div className="flex -space-x-1.5">
                {['#9D7AFF', '#4ECDC4', '#FF6B8A', '#FFD166', '#818CF8'].map((color, i) => (
                  <div
                    key={i}
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-bold text-white"
                    style={{
                      background: `${color}40`,
                      border: '2px solid #18181F',
                    }}
                  >
                    {['A', 'K', 'M', 'D', 'Z'][i]}
                  </div>
                ))}
              </div>
              <p className="text-xs text-light-500">
                Join <span className="font-semibold text-white">2,847</span> professionals leveling up
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
