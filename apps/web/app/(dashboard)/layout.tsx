'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/home', label: 'Home', icon: '⌂' },
  { href: '/roadmap', label: 'Roadmap', icon: '🗺️' },
  { href: '/character-page', label: 'Character', icon: '⚔' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-dark-900">
      {/* Sidebar */}
      <aside
        className="hidden md:flex flex-col w-64 p-4 border-r"
        style={{ borderColor: '#252530', background: '#121218' }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8 px-2">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm"
            style={{
              fontFamily: '"Plus Jakarta Sans", system-ui',
              background: 'linear-gradient(135deg, #9D7AFF 0%, #4ECDC4 100%)',
            }}
          >
            P2
          </div>
          <span
            className="text-lg font-bold text-white"
            style={{ fontFamily: '"Plus Jakarta Sans", system-ui' }}
          >
            Plan2Skill
          </span>
        </div>

        {/* Nav items */}
        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
                style={{
                  background: active ? '#9D7AFF15' : 'transparent',
                  color: active ? '#9D7AFF' : '#A1A1AA',
                }}
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="mt-auto pt-4 border-t" style={{ borderColor: '#252530' }}>
          <div className="flex items-center gap-3 px-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
              style={{ background: '#9D7AFF30' }}
            >
              A
            </div>
            <div>
              <div className="text-xs font-semibold text-white">Adventurer</div>
              <div
                className="text-[10px] font-mono"
                style={{ color: '#9D7AFF' }}
              >
                Level 1
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-8">{children}</div>
      </main>
    </div>
  );
}
