'use client';

const ATTRIBUTES = [
  { key: 'MAS', name: 'Mastery', value: 10, max: 100, color: '#9D7AFF', icon: '⚔' },
  { key: 'INS', name: 'Insight', value: 10, max: 100, color: '#3B82F6', icon: '◈' },
  { key: 'INF', name: 'Influence', value: 10, max: 100, color: '#FF6B8A', icon: '◉' },
  { key: 'RES', name: 'Resilience', value: 10, max: 100, color: '#6EE7B7', icon: '◆' },
  { key: 'VER', name: 'Versatility', value: 10, max: 100, color: '#4ECDC4', icon: '✦' },
  { key: 'DIS', name: 'Discovery', value: 10, max: 100, color: '#FFD166', icon: '★' },
];

const EQUIPMENT_SLOTS = [
  { slot: 'Weapon', skill: 'Hard Skills', equipped: false },
  { slot: 'Shield', skill: 'Communication', equipped: false },
  { slot: 'Armor', skill: 'Personal Brand', equipped: false },
  { slot: 'Helmet', skill: 'Strategy', equipped: false },
  { slot: 'Boots', skill: 'Adaptability', equipped: false },
  { slot: 'Ring', skill: 'Expertise', equipped: false },
  { slot: 'Companion', skill: 'Hobbies', equipped: false },
];

export default function CharacterPage() {
  return (
    <div>
      <h1
        className="text-2xl font-bold text-white mb-6"
        style={{ fontFamily: '"Plus Jakarta Sans", system-ui' }}
      >
        Your Character
      </h1>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Character info */}
        <div className="p-6 rounded-xl" style={{ background: '#18181F', border: '1px solid #252530' }}>
          <div className="flex items-center gap-4 mb-6">
            {/* Pixel character placeholder */}
            <div
              className="w-20 h-20 rounded-xl flex items-center justify-center text-3xl"
              style={{ background: '#121218', border: '1px solid #252530' }}
            >
              🧙
            </div>
            <div>
              <div className="text-lg font-bold text-white">Adventurer</div>
              <div className="text-xs text-light-500">Novice • Strategist</div>
              <div
                className="mt-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full inline-block"
                style={{ color: '#5B7FCC', background: '#5B7FCC15' }}
              >
                +10% XP planning
              </div>
            </div>
          </div>

          {/* Attributes */}
          <div className="flex flex-col gap-3">
            {ATTRIBUTES.map((attr) => (
              <div key={attr.key} className="flex items-center gap-3">
                <span className="text-sm w-5 text-center">{attr.icon}</span>
                <span
                  className="text-[10px] font-mono font-bold w-8"
                  style={{ color: attr.color }}
                >
                  {attr.key}
                </span>
                <div className="flex-1 h-1.5 rounded-full" style={{ background: '#252530' }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${(attr.value / attr.max) * 100}%`,
                      background: attr.color,
                    }}
                  />
                </div>
                <span className="text-[10px] font-mono text-light-500 w-6 text-right">
                  {attr.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Equipment */}
        <div className="p-6 rounded-xl" style={{ background: '#18181F', border: '1px solid #252530' }}>
          <h3
            className="text-sm font-semibold text-light-400 mb-4 uppercase tracking-wider"
            style={{ fontFamily: '"Plus Jakarta Sans", system-ui' }}
          >
            Equipment
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {EQUIPMENT_SLOTS.map((slot) => (
              <div
                key={slot.slot}
                className="p-3 rounded-xl text-center"
                style={{
                  background: '#121218',
                  border: '1px solid #252530',
                  opacity: slot.equipped ? 1 : 0.5,
                }}
              >
                <div className="w-12 h-12 mx-auto rounded-lg mb-2 flex items-center justify-center text-lg" style={{ background: '#18181F' }}>
                  {slot.equipped ? '⚔' : '?'}
                </div>
                <div className="text-xs font-semibold text-white">{slot.slot}</div>
                <div className="text-[9px] text-light-500">{slot.skill}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
