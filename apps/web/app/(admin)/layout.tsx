'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { t } from '../(onboarding)/_components/tokens';
import { NeonIcon } from '../(onboarding)/_components/NeonIcon';

// ═══════════════════════════════════════════════════════
// ADMIN LAYOUT — Clean, functional, data-dense
// NOT gamified. No pixel art, no RPG vocabulary.
// Same design tokens (dark theme) as main app.
// ═══════════════════════════════════════════════════════

// ─── Navigation Structure (matches ADMIN_PANEL_SPEC §4) ───

interface NavItem {
  href: string;
  label: string;
  icon: string;
  children?: { href: string; label: string }[];
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    title: '',
    items: [
      { href: '/admin', label: 'Overview', icon: 'chart' },
    ],
  },
  {
    title: 'MANAGE',
    items: [
      { href: '/admin/users', label: 'Users', icon: 'users' },
      {
        href: '/admin/equipment',
        label: 'Content',
        icon: 'book',
        children: [
          { href: '/admin/equipment', label: 'Equipment Catalog' },
          { href: '/admin/content', label: 'Quest Moderation' },
          { href: '/admin/characters', label: 'Characters' },
        ],
      },
    ],
  },
  {
    title: 'CONFIGURE',
    items: [
      {
        href: '/admin/config',
        label: 'Config',
        icon: 'gear',
        children: [
          { href: '/admin/config', label: 'Reference Data' },
          { href: '/admin/config/flags', label: 'Feature Flags' },
          { href: '/admin/config/balance', label: 'Balancing' },
          { href: '/admin/config/drops', label: 'Drop Rates' },
        ],
      },
    ],
  },
  {
    title: 'COMPLY',
    items: [
      {
        href: '/admin/compliance',
        label: 'Compliance',
        icon: 'shield',
        children: [
          { href: '/admin/compliance', label: 'GDPR Dashboard' },
          { href: '/admin/compliance/dsar', label: 'DSAR Requests' },
          { href: '/admin/compliance/consent', label: 'Consent Log' },
          { href: '/admin/compliance/audit', label: 'Audit Log' },
        ],
      },
    ],
  },
  {
    title: 'ANALYZE',
    items: [
      { href: '/admin/analytics', label: 'Analytics', icon: 'chart' },
      { href: '/admin/ops', label: 'Operations', icon: 'lightning' },
    ],
  },
];

// ─── Sidebar Nav Item ───

function SidebarItem({ item, pathname }: { item: NavItem; pathname: string }) {
  const isParentActive = pathname === item.href ||
    (item.children?.some(c => pathname === c.href));
  const [expanded, setExpanded] = useState(isParentActive);

  const hasChildren = item.children && item.children.length > 0;

  return (
    <div>
      {/* Parent item */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <Link
          href={item.href}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            flex: 1, padding: '8px 12px', borderRadius: 8,
            background: pathname === item.href && !hasChildren ? `${t.violet}15` : 'transparent',
            textDecoration: 'none',
            transition: 'background 0.15s ease',
          }}
          onMouseEnter={e => {
            if (pathname !== item.href || hasChildren) {
              (e.currentTarget as HTMLElement).style.background = `${t.violet}08`;
            }
          }}
          onMouseLeave={e => {
            if (pathname !== item.href || hasChildren) {
              (e.currentTarget as HTMLElement).style.background = 'transparent';
            }
          }}
        >
          <NeonIcon
            type={item.icon as any}
            size={18}
            color={isParentActive ? 'violet' : 'muted'}
          />
          <span style={{
            fontFamily: t.body, fontSize: 13, fontWeight: isParentActive ? 600 : 400,
            color: isParentActive ? t.text : t.textSecondary,
            flex: 1,
          }}>
            {item.label}
          </span>
        </Link>

        {hasChildren && (
          <button
            onClick={() => setExpanded(e => !e)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '8px 10px', color: t.textMuted, fontSize: 10,
              transition: 'transform 0.2s ease',
              transform: expanded ? 'rotate(180deg)' : 'rotate(0)',
            }}
            aria-label={expanded ? 'Collapse' : 'Expand'}
          >
            ▼
          </button>
        )}
      </div>

      {/* Children */}
      {hasChildren && expanded && (
        <div style={{ paddingLeft: 28, display: 'flex', flexDirection: 'column', gap: 1 }}>
          {item.children!.map(child => {
            const childActive = pathname === child.href;
            return (
              <Link
                key={child.href}
                href={child.href}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '6px 12px', borderRadius: 6,
                  background: childActive ? `${t.violet}15` : 'transparent',
                  textDecoration: 'none',
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={e => {
                  if (!childActive) (e.currentTarget as HTMLElement).style.background = `${t.violet}08`;
                }}
                onMouseLeave={e => {
                  if (!childActive) (e.currentTarget as HTMLElement).style.background = 'transparent';
                }}
              >
                <div style={{
                  width: 4, height: 4, borderRadius: '50%',
                  background: childActive ? t.violet : t.textMuted,
                  flexShrink: 0,
                }} />
                <span style={{
                  fontFamily: t.body, fontSize: 12, fontWeight: childActive ? 600 : 400,
                  color: childActive ? t.text : t.textMuted,
                }}>
                  {child.label}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Main Admin Layout ───

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  // TODO: Wire to real auth — check ctx.user.role via tRPC
  const userRole: string = 'admin';
  const userName: string = 'Admin';

  const roleBadgeColor: Record<string, string> = {
    moderator: t.mint,
    admin: t.violet,
    superadmin: t.gold,
  };

  return (
    <div className="flex" style={{ background: t.bg, height: '100vh', overflow: 'hidden' }}>

      {/* ═══ Sidebar — 220px fixed ═══ */}
      <aside
        style={{
          width: 220, flexShrink: 0,
          display: 'flex', flexDirection: 'column',
          borderRight: `1px solid ${t.border}`,
          background: t.bgElevated,
          height: '100%', overflowY: 'auto',
        }}
      >
        {/* Logo */}
        <Link href="/admin" style={{ textDecoration: 'none' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '16px 16px 12px',
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#FFF', fontWeight: 800, fontSize: 11,
              fontFamily: t.display, background: t.gradient,
            }}>
              P2
            </div>
            <div>
              <span style={{
                fontFamily: t.display, fontSize: 14, fontWeight: 700, color: t.text,
                display: 'block', lineHeight: 1.2,
              }}>
                Plan2Skill
              </span>
              <span style={{
                fontFamily: t.mono, fontSize: 9, fontWeight: 600,
                color: t.textMuted, letterSpacing: '0.1em',
              }}>
                ADMIN
              </span>
            </div>
          </div>
        </Link>

        <div style={{ height: 1, background: t.border, margin: '0 12px 8px' }} />

        {/* Navigation Groups */}
        <nav style={{ flex: 1, padding: '0 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {NAV_GROUPS.map((group, gi) => (
            <div key={gi}>
              {group.title && (
                <div style={{
                  fontFamily: t.mono, fontSize: 9, fontWeight: 700,
                  color: t.textMuted, letterSpacing: '0.15em',
                  padding: '16px 12px 6px',
                }}>
                  {group.title}
                </div>
              )}
              {group.items.map(item => (
                <SidebarItem key={item.href + item.label} item={item} pathname={pathname} />
              ))}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div style={{
          padding: '12px 16px',
          borderTop: `1px solid ${t.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{ fontFamily: t.mono, fontSize: 9, color: t.textMuted }}>
            v1.0
          </span>
          <Link
            href="/home"
            style={{
              fontFamily: t.body, fontSize: 11, color: t.textMuted,
              textDecoration: 'none',
              transition: 'color 0.15s ease',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = t.violet)}
            onMouseLeave={e => (e.currentTarget.style.color = t.textMuted)}
          >
            ← Back to app
          </Link>
        </div>
      </aside>

      {/* ═══ Main area — top bar + content ═══ */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Top bar — 52px */}
        <header style={{
          height: 52, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
          padding: '0 24px', gap: 12,
          borderBottom: `1px solid ${t.border}`,
          background: t.bgElevated,
        }}>
          {/* Role badge */}
          <span style={{
            fontFamily: t.mono, fontSize: 10, fontWeight: 700,
            padding: '3px 10px', borderRadius: 6,
            color: roleBadgeColor[userRole] || t.textMuted,
            background: `${roleBadgeColor[userRole] || t.textMuted}12`,
            border: `1px solid ${roleBadgeColor[userRole] || t.textMuted}30`,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}>
            {userRole}
          </span>

          {/* User name */}
          <span style={{
            fontFamily: t.body, fontSize: 13, fontWeight: 500,
            color: t.textSecondary,
          }}>
            {userName}
          </span>

          {/* Logout */}
          <button
            onClick={() => router.push('/home')}
            style={{
              background: 'none', border: `1px solid ${t.border}`,
              borderRadius: 6, padding: '4px 10px', cursor: 'pointer',
              fontFamily: t.body, fontSize: 11, color: t.textMuted,
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = t.violet;
              e.currentTarget.style.color = t.violet;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = t.border;
              e.currentTarget.style.color = t.textMuted;
            }}
          >
            Exit Admin
          </button>
        </header>

        {/* Content area */}
        <main style={{
          flex: 1, overflowY: 'auto',
          padding: '28px 32px',
          background: t.bg,
        }}>
          {children}
        </main>
      </div>
    </div>
  );
}
