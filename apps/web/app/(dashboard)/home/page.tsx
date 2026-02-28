'use client';

export default function HomePage() {
  return (
    <div>
      {/* Greeting */}
      <div className="mb-8">
        <h1
          className="text-2xl font-bold text-white mb-1"
          style={{ fontFamily: '"Plus Jakarta Sans", system-ui' }}
        >
          Good morning, Adventurer!
        </h1>
        <p className="text-light-500 text-sm">Today&apos;s focus: Getting Started</p>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[
          { label: 'Level', value: '1', color: '#9D7AFF', icon: '⚡' },
          { label: 'Streak', value: '0 days', color: '#FBBF24', icon: '🔥' },
          { label: 'XP', value: '0', color: '#4ECDC4', icon: '✦' },
          { label: 'Energy', value: '3/3', color: '#9D7AFF', icon: '💎' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="p-4 rounded-xl"
            style={{ background: '#18181F', border: '1px solid #252530' }}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm">{stat.icon}</span>
              <span className="text-xs text-light-500">{stat.label}</span>
            </div>
            <div
              className="text-lg font-bold"
              style={{
                fontFamily: '"JetBrains Mono", monospace',
                color: stat.color,
              }}
            >
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* Active Roadmap */}
      <div className="mb-8">
        <h2
          className="text-sm font-semibold text-light-400 mb-3 uppercase tracking-wider"
          style={{ fontFamily: '"Plus Jakarta Sans", system-ui' }}
        >
          Active Roadmap
        </h2>
        <div
          className="p-5 rounded-xl"
          style={{ background: '#18181F', border: '1px solid #252530' }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-white font-semibold text-sm">System Design Fundamentals</span>
            <span
              className="text-xs font-mono font-bold"
              style={{ color: '#4ECDC4' }}
            >
              0%
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full" style={{ background: '#252530' }}>
            <div
              className="h-full rounded-full"
              style={{
                width: '0%',
                background: 'linear-gradient(90deg, #9D7AFF, #4ECDC4)',
              }}
            />
          </div>
          <p className="text-xs text-light-500 mt-2">
            Current milestone: Foundations & Setup
          </p>
        </div>
      </div>

      {/* Today's Tasks */}
      <div>
        <h2
          className="text-sm font-semibold text-light-400 mb-3 uppercase tracking-wider"
          style={{ fontFamily: '"Plus Jakarta Sans", system-ui' }}
        >
          Today&apos;s Tasks
        </h2>
        <div className="flex flex-col gap-2">
          {[
            { title: 'Welcome: Understanding Your Roadmap', type: 'article', xp: 15, rarity: 'common', mins: 5 },
            { title: 'System Design Overview Video', type: 'video', xp: 25, rarity: 'common', mins: 10 },
            { title: 'Quiz: Design Principles', type: 'quiz', xp: 30, rarity: 'uncommon', mins: 5 },
          ].map((task, i) => (
            <div
              key={i}
              className="flex items-center gap-4 px-4 py-3 rounded-xl transition-all"
              style={{
                background: '#18181F',
                border: '1px solid #252530',
                cursor: 'pointer',
              }}
            >
              {/* Checkbox */}
              <div
                className="w-6 h-6 rounded-full border-2 shrink-0"
                style={{ borderColor: '#35354A' }}
              />
              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white">{task.title}</div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span
                    className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full uppercase"
                    style={{
                      color: task.rarity === 'uncommon' ? '#6EE7B7' : '#71717A',
                      background: task.rarity === 'uncommon' ? '#6EE7B710' : '#71717A10',
                    }}
                  >
                    {task.type}
                  </span>
                  <span className="text-[10px] text-light-500">{task.mins} min</span>
                </div>
              </div>
              {/* XP reward */}
              <span
                className="text-xs font-mono font-bold shrink-0"
                style={{ color: '#9D7AFF' }}
              >
                +{task.xp} XP
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
