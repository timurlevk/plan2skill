'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const ARCHETYPES = [
  { id: 'strategist', icon: '◈', name: 'Strategist', color: '#5B7FCC', desc: 'Plan first, execute with precision', bonus: '+10% XP planning' },
  { id: 'explorer', icon: '◎', name: 'Explorer', color: '#2A9D8F', desc: 'Curiosity-driven, always learning new things', bonus: '+10% XP new topics' },
  { id: 'connector', icon: '◉', name: 'Connector', color: '#E05580', desc: 'Learn through community and collaboration', bonus: '+10% XP social' },
  { id: 'builder', icon: '▣', name: 'Builder', color: '#E8852E', desc: 'Hands-on, learn by creating projects', bonus: '+10% XP projects' },
  { id: 'innovator', icon: '★', name: 'Innovator', color: '#DAA520', desc: 'Think differently, find creative solutions', bonus: '+10% XP creative' },
];

export default function ArchetypePage() {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div>
      {/* Step indicator */}
      <div className="flex gap-1.5 mb-8">
        {Array.from({ length: 7 }, (_, i) => (
          <div
            key={i}
            className="h-1 flex-1 rounded-full"
            style={{ background: i <= 1 ? '#9D7AFF' : '#252530' }}
          />
        ))}
      </div>

      <h1
        className="text-2xl font-bold text-white mb-2"
        style={{ fontFamily: '"Plus Jakarta Sans", system-ui' }}
      >
        Choose your archetype
      </h1>
      <p className="text-light-500 text-sm mb-8">
        Your learning style defines your bonus XP path
      </p>

      <div className="flex flex-col gap-3 mb-8">
        {ARCHETYPES.map((arch) => (
          <button
            key={arch.id}
            onClick={() => setSelected(arch.id)}
            className="flex items-center gap-4 p-4 rounded-xl text-left transition-all"
            style={{
              background: selected === arch.id ? `${arch.color}12` : '#18181F',
              border: `1px solid ${selected === arch.id ? `${arch.color}40` : '#252530'}`,
            }}
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0"
              style={{ background: `${arch.color}15`, color: arch.color }}
            >
              {arch.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">{arch.name}</span>
                <span
                  className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full"
                  style={{ color: arch.color, background: `${arch.color}15` }}
                >
                  {arch.bonus}
                </span>
              </div>
              <p className="text-xs text-light-500 mt-0.5">{arch.desc}</p>
            </div>
          </button>
        ))}
      </div>

      <button
        onClick={() => router.push('/character')}
        disabled={!selected}
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
