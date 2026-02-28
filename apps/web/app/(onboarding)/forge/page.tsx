'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const FORGE_PHASES = [
  { label: 'Analyzing your goals...', duration: 2000 },
  { label: 'Crafting milestones...', duration: 3000 },
  { label: 'Generating daily tasks...', duration: 2500 },
  { label: 'Calibrating difficulty...', duration: 1500 },
  { label: 'Polishing your roadmap...', duration: 1000 },
];

export default function ForgePage() {
  const router = useRouter();
  const [phase, setPhase] = useState(0);
  const [progress, setProgress] = useState(0);
  const [complete, setComplete] = useState(false);
  const [milestones, setMilestones] = useState<string[]>([]);

  useEffect(() => {
    let elapsed = 0;
    const totalDuration = FORGE_PHASES.reduce((sum, p) => sum + p.duration, 0);

    const interval = setInterval(() => {
      elapsed += 50;
      const pct = Math.min((elapsed / totalDuration) * 100, 100);
      setProgress(pct);

      // Determine current phase
      let cumulative = 0;
      for (let i = 0; i < FORGE_PHASES.length; i++) {
        cumulative += FORGE_PHASES[i].duration;
        if (elapsed < cumulative) {
          setPhase(i);
          break;
        }
      }

      // Reveal milestones at intervals
      if (pct > 25 && milestones.length < 1) setMilestones((m) => [...m, 'Foundations & Setup']);
      if (pct > 40 && milestones.length < 2) setMilestones((m) => [...m, 'Core Concepts']);
      if (pct > 55 && milestones.length < 3) setMilestones((m) => [...m, 'Practical Projects']);
      if (pct > 70 && milestones.length < 4) setMilestones((m) => [...m, 'Advanced Patterns']);
      if (pct > 85 && milestones.length < 5) setMilestones((m) => [...m, 'Capstone Challenge']);

      if (pct >= 100) {
        clearInterval(interval);
        setTimeout(() => setComplete(true), 500);
      }
    }, 50);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="text-center">
      {/* Step indicator */}
      <div className="flex gap-1.5 mb-8">
        {Array.from({ length: 7 }, (_, i) => (
          <div
            key={i}
            className="h-1 flex-1 rounded-full"
            style={{ background: i <= 4 ? '#9D7AFF' : '#252530' }}
          />
        ))}
      </div>

      {/* Forge title */}
      <h1
        className="text-2xl font-bold mb-2"
        style={{
          fontFamily: '"Plus Jakarta Sans", system-ui',
          background: 'linear-gradient(135deg, #9D7AFF 0%, #4ECDC4 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        The Forge
      </h1>
      <p className="text-light-500 text-sm mb-10">
        Crafting your personalized 90-day roadmap
      </p>

      {/* Progress circle */}
      <div className="relative mx-auto w-40 h-40 mb-8">
        <svg className="w-full h-full" viewBox="0 0 120 120">
          <circle
            cx="60"
            cy="60"
            r="52"
            fill="none"
            stroke="#252530"
            strokeWidth="6"
          />
          <circle
            cx="60"
            cy="60"
            r="52"
            fill="none"
            stroke="url(#forgeGrad)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 52}
            strokeDashoffset={2 * Math.PI * 52 * (1 - progress / 100)}
            style={{ transition: 'stroke-dashoffset 0.3s ease', transform: 'rotate(-90deg)', transformOrigin: 'center' }}
          />
          <defs>
            <linearGradient id="forgeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#9D7AFF" />
              <stop offset="100%" stopColor="#4ECDC4" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {complete ? (
            <span className="text-3xl">✓</span>
          ) : (
            <span
              className="text-2xl font-bold"
              style={{
                fontFamily: '"JetBrains Mono", monospace',
                color: '#9D7AFF',
              }}
            >
              {Math.round(progress)}%
            </span>
          )}
        </div>
      </div>

      {/* Phase label */}
      <p className="text-sm text-light-400 mb-8 h-5">
        {complete ? 'Your roadmap is ready!' : FORGE_PHASES[phase]?.label}
      </p>

      {/* Milestones revealed */}
      <div className="flex flex-col gap-2 text-left mb-8">
        {milestones.map((ms, i) => (
          <div
            key={i}
            className="flex items-center gap-3 px-4 py-3 rounded-xl"
            style={{
              background: '#18181F',
              border: '1px solid #252530',
              animation: 'fadeIn 0.5s ease',
            }}
          >
            <span className="text-xs font-mono font-bold text-violet">
              W{(i * 2 + 1)}-{(i * 2 + 2) + (i === 4 ? 1 : 0)}
            </span>
            <span className="text-sm text-white">{ms}</span>
            <span className="ml-auto text-xs text-light-500">✦</span>
          </div>
        ))}
      </div>

      {/* Continue */}
      {complete && (
        <button
          onClick={() => router.push('/first-quest')}
          className="w-full py-3.5 rounded-xl text-white font-semibold text-sm"
          style={{
            background: 'linear-gradient(135deg, #9D7AFF 0%, #4ECDC4 100%)',
            fontFamily: '"Plus Jakarta Sans", system-ui',
            animation: 'fadeIn 0.5s ease',
          }}
        >
          Start Your Journey
        </button>
      )}
    </div>
  );
}
