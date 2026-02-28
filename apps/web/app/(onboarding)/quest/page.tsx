'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const ROLES = [
  'Software Developer',
  'Product Manager',
  'Data Scientist',
  'UX Designer',
  'DevOps Engineer',
  'Engineering Manager',
];

export default function QuestPage() {
  const router = useRouter();
  const [identity, setIdentity] = useState('');

  return (
    <div>
      {/* Step indicator */}
      <div className="flex gap-1.5 mb-8">
        {Array.from({ length: 7 }, (_, i) => (
          <div
            key={i}
            className="h-1 flex-1 rounded-full"
            style={{ background: i === 0 ? '#9D7AFF' : '#252530' }}
          />
        ))}
      </div>

      <h1
        className="text-2xl font-bold text-white mb-2"
        style={{ fontFamily: '"Plus Jakarta Sans", system-ui' }}
      >
        What's your quest?
      </h1>
      <p className="text-light-500 text-sm mb-8">
        Tell us about yourself and what you want to achieve
      </p>

      {/* Identity input */}
      <div className="mb-6">
        <label className="block text-xs font-semibold text-light-400 mb-2 uppercase tracking-wider">
          I am / I want to become
        </label>
        <input
          type="text"
          value={identity}
          onChange={(e) => setIdentity(e.target.value)}
          placeholder="e.g. Senior Software Engineer transitioning to Staff"
          className="w-full px-4 py-3 rounded-xl text-white text-sm placeholder-light-500 outline-none"
          style={{
            background: '#18181F',
            border: '1px solid #252530',
            fontFamily: '"Inter", system-ui',
          }}
        />
      </div>

      {/* Quick picks */}
      <div className="mb-8">
        <p className="text-xs text-light-500 mb-3">Quick pick:</p>
        <div className="flex flex-wrap gap-2">
          {ROLES.map((role) => (
            <button
              key={role}
              onClick={() => setIdentity(role)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{
                background: identity === role ? '#9D7AFF20' : '#18181F',
                color: identity === role ? '#9D7AFF' : '#A1A1AA',
                border: `1px solid ${identity === role ? '#9D7AFF40' : '#252530'}`,
              }}
            >
              {role}
            </button>
          ))}
        </div>
      </div>

      {/* Continue button */}
      <button
        onClick={() => router.push('/archetype')}
        disabled={!identity.trim()}
        className="w-full py-3.5 rounded-xl text-white font-semibold text-sm transition-all disabled:opacity-40"
        style={{
          background: 'linear-gradient(135deg, #9D7AFF 0%, #4ECDC4 100%)',
          fontFamily: '"Plus Jakarta Sans", system-ui',
        }}
      >
        Continue
      </button>
    </div>
  );
}
