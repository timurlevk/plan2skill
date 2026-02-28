'use client';

export default function RoadmapPage() {
  const milestones = [
    { title: 'Foundations & Setup', week: 'W1-W2', status: 'active', progress: 0, tasks: 12 },
    { title: 'Core Concepts', week: 'W3-W4', status: 'locked', progress: 0, tasks: 15 },
    { title: 'Practical Projects', week: 'W5-W7', status: 'locked', progress: 0, tasks: 14 },
    { title: 'Advanced Patterns', week: 'W8-W10', status: 'locked', progress: 0, tasks: 13 },
    { title: 'Integration & Testing', week: 'W11-W12', status: 'locked', progress: 0, tasks: 10 },
    { title: 'Capstone Challenge', week: 'W13', status: 'locked', progress: 0, tasks: 5 },
  ];

  return (
    <div>
      <h1
        className="text-2xl font-bold text-white mb-2"
        style={{ fontFamily: '"Plus Jakarta Sans", system-ui' }}
      >
        Your Roadmap
      </h1>
      <p className="text-light-500 text-sm mb-8">System Design Fundamentals — 90 days</p>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div
          className="absolute left-5 top-0 bottom-0 w-0.5"
          style={{ background: '#252530' }}
        />

        {milestones.map((ms, i) => (
          <div key={i} className="relative flex gap-5 mb-6">
            {/* Dot */}
            <div
              className="relative z-10 w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-xs font-bold"
              style={{
                background: ms.status === 'active' ? '#9D7AFF' : '#252530',
                color: ms.status === 'active' ? '#FFF' : '#71717A',
                fontFamily: '"JetBrains Mono", monospace',
              }}
            >
              {i + 1}
            </div>

            {/* Card */}
            <div
              className="flex-1 p-4 rounded-xl"
              style={{
                background: '#18181F',
                border: `1px solid ${ms.status === 'active' ? '#9D7AFF30' : '#252530'}`,
                opacity: ms.status === 'locked' ? 0.6 : 1,
              }}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold text-white">{ms.title}</span>
                <span className="text-[10px] font-mono text-light-500">{ms.week}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-1 rounded-full" style={{ background: '#252530' }}>
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${ms.progress}%`,
                      background: 'linear-gradient(90deg, #9D7AFF, #4ECDC4)',
                    }}
                  />
                </div>
                <span className="text-[10px] text-light-500 font-mono">
                  0/{ms.tasks} tasks
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
