'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const CHARACTERS = [
  { id: 'aria', name: 'Aria', desc: 'Light skin, blonde hair', color: '#E8C35A' },
  { id: 'kofi', name: 'Kofi', desc: 'Dark skin, flat-top fade', color: '#2A9D8F' },
  { id: 'mei', name: 'Mei', desc: 'Medium skin, bob with bangs', color: '#E879F9' },
  { id: 'diego', name: 'Diego', desc: 'Tan skin, wavy brown hair', color: '#3B82F6' },
  { id: 'zara', name: 'Zara', desc: 'Dark skin, afro puffs', color: '#FF6B8A' },
  { id: 'alex', name: 'Alex', desc: 'Non-binary, undercut', color: '#4ECDC4' },
  { id: 'priya', name: 'Priya', desc: 'Brown skin, long braid', color: '#FFD166' },
  { id: 'liam', name: 'Liam', desc: 'Light skin, messy auburn', color: '#818CF8' },
];

export default function CharacterSelectPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div>
      <div className="flex gap-1.5 mb-8">
        {Array.from({ length: 7 }, (_, i) => (
          <div key={i} className="h-1 flex-1 rounded-full" style={{ background: i <= 2 ? '#9D7AFF' : '#252530' }} />
        ))}
      </div>

      <h1 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: '"Plus Jakarta Sans", system-ui' }}>
        Choose your character
      </h1>
      <p className="text-light-500 text-sm mb-8">8 diverse characters — purely cosmetic</p>

      <div className="grid grid-cols-2 gap-3 mb-8">
        {CHARACTERS.map((char) => (
          <button
            key={char.id}
            onClick={() => setSelected(char.id)}
            className="p-4 rounded-xl text-center transition-all"
            style={{
              background: selected === char.id ? `${char.color}12` : '#18181F',
              border: `1px solid ${selected === char.id ? `${char.color}40` : '#252530'}`,
            }}
          >
            <div
              className="w-14 h-14 mx-auto rounded-xl mb-2 flex items-center justify-center text-2xl"
              style={{ background: `${char.color}15` }}
            >
              🧙
            </div>
            <div className="text-sm font-semibold text-white">{char.name}</div>
            <div className="text-[10px] text-light-500">{char.desc}</div>
          </button>
        ))}
      </div>

      <button
        onClick={() => router.push('/forge')}
        disabled={!selected}
        className="w-full py-3.5 rounded-xl text-white font-semibold text-sm disabled:opacity-40"
        style={{ background: 'linear-gradient(135deg, #9D7AFF 0%, #4ECDC4 100%)', fontFamily: '"Plus Jakarta Sans", system-ui' }}
      >
        Continue to The Forge
      </button>
    </div>
  );
}
