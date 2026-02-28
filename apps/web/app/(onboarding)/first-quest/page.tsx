'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function FirstQuestPage() {
  const router = useRouter();
  const [completed, setCompleted] = useState(false);
  const [celebrating, setCelebrating] = useState(false);

  const handleComplete = () => {
    setCompleted(true);
    setTimeout(() => setCelebrating(true), 300);
  };

  if (celebrating) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-6" style={{ animation: 'celebratePop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
          🎉
        </div>
        <h1
          className="text-2xl font-bold mb-2"
          style={{
            fontFamily: '"Plus Jakarta Sans", system-ui',
            background: 'linear-gradient(135deg, #9D7AFF 0%, #4ECDC4 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Day 1 Complete!
        </h1>
        <p className="text-light-500 text-sm mb-8">
          You earned your first XP. The journey begins!
        </p>

        <div className="flex justify-center gap-6 mb-10">
          {[
            { label: 'XP Earned', value: '+25', color: '#9D7AFF' },
            { label: 'Level', value: '1', color: '#4ECDC4' },
            { label: 'Streak', value: '1 day', color: '#FBBF24' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-2xl font-bold font-mono" style={{ color: stat.color }}>
                {stat.value}
              </div>
              <div className="text-[10px] text-light-500 mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>

        <button
          onClick={() => router.push('/home')}
          className="w-full py-3.5 rounded-xl text-white font-semibold text-sm"
          style={{
            background: 'linear-gradient(135deg, #9D7AFF 0%, #4ECDC4 100%)',
            fontFamily: '"Plus Jakarta Sans", system-ui',
          }}
        >
          Go to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex gap-1.5 mb-8">
        {Array.from({ length: 7 }, (_, i) => (
          <div key={i} className="h-1 flex-1 rounded-full" style={{ background: i <= 5 ? '#9D7AFF' : '#252530' }} />
        ))}
      </div>

      <h1
        className="text-2xl font-bold text-white mb-2"
        style={{ fontFamily: '"Plus Jakarta Sans", system-ui' }}
      >
        Your first quest!
      </h1>
      <p className="text-light-500 text-sm mb-8">
        Complete this micro-task to earn your first XP
      </p>

      {/* Task card */}
      <div
        className="p-5 rounded-xl mb-8"
        style={{ background: '#18181F', border: '1px solid #252530' }}
      >
        <div className="flex items-center gap-2 mb-3">
          <span
            className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full uppercase"
            style={{ color: '#6EE7B7', background: '#6EE7B710' }}
          >
            article
          </span>
          <span className="text-[10px] text-light-500">~5 min</span>
          <span className="ml-auto text-xs font-mono font-bold" style={{ color: '#9D7AFF' }}>
            +25 XP
          </span>
        </div>
        <h3 className="text-sm font-semibold text-white mb-2">
          Welcome: Understanding Your Roadmap
        </h3>
        <p className="text-xs text-light-500 leading-relaxed">
          Learn how your personalized roadmap works, what milestones to expect,
          and how the gamification system will keep you motivated.
        </p>
      </div>

      <button
        onClick={handleComplete}
        disabled={completed}
        className="w-full py-3.5 rounded-xl text-white font-semibold text-sm"
        style={{
          background: completed ? '#4ECDC4' : 'linear-gradient(135deg, #9D7AFF 0%, #4ECDC4 100%)',
          fontFamily: '"Plus Jakarta Sans", system-ui',
        }}
      >
        {completed ? '✓ Done!' : 'Mark as Complete'}
      </button>
    </div>
  );
}
