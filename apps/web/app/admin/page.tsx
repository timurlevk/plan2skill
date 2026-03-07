'use client';

import React from 'react';
import { t } from '../(onboarding)/_components/tokens';
import { NeonIcon } from '../(onboarding)/_components/NeonIcon';

// ═══════════════════════════════════════════
// ADMIN DASHBOARD — Overview page
// Key metrics at a glance, system status
// ═══════════════════════════════════════════

// ─── Stat Card ───

function StatCard({ label, value, change, icon, color }: {
  label: string;
  value: string;
  change?: string;
  icon: string;
  color: string;
}) {
  const isPositive = change && !change.startsWith('-');
  return (
    <div style={{
      background: t.bgCard, border: `1px solid ${t.border}`,
      borderRadius: 12, padding: '20px 24px',
      display: 'flex', alignItems: 'flex-start', gap: 16,
      transition: 'border-color 0.2s ease',
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: `${color}12`, flexShrink: 0,
      }}>
        <NeonIcon type={icon as any} size={20} color={color} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{
          fontFamily: t.body, fontSize: 12, fontWeight: 500,
          color: t.textMuted, marginBottom: 4,
        }}>
          {label}
        </div>
        <div style={{
          fontFamily: t.display, fontSize: 28, fontWeight: 800,
          color: t.text, lineHeight: 1,
        }}>
          {value}
        </div>
        {change && (
          <div style={{
            fontFamily: t.mono, fontSize: 11, fontWeight: 600,
            color: isPositive ? t.mint : t.rose,
            marginTop: 6,
          }}>
            {isPositive ? '↑' : '↓'} {change}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Section Header ───

function SectionHeader({ title }: { title: string }) {
  return (
    <h2 style={{
      fontFamily: t.display, fontSize: 16, fontWeight: 700,
      color: t.text, margin: '32px 0 16px',
    }}>
      {title}
    </h2>
  );
}

// ─── Quick Action ───

function QuickAction({ label, description, icon, href }: {
  label: string; description: string; icon: string; href: string;
}) {
  return (
    <a
      href={href}
      style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '14px 18px', borderRadius: 10,
        background: t.bgCard, border: `1px solid ${t.border}`,
        textDecoration: 'none',
        transition: 'border-color 0.2s ease, background 0.2s ease',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = t.borderHover;
        e.currentTarget.style.background = t.bgElevated;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = t.border;
        e.currentTarget.style.background = t.bgCard;
      }}
    >
      <NeonIcon type={icon as any} size={18} color="violet" />
      <div>
        <div style={{ fontFamily: t.body, fontSize: 13, fontWeight: 600, color: t.text }}>
          {label}
        </div>
        <div style={{ fontFamily: t.body, fontSize: 11, color: t.textMuted }}>
          {description}
        </div>
      </div>
    </a>
  );
}

// ─── System Status Row ───

function StatusRow({ label, status, detail }: {
  label: string; status: 'ok' | 'warning' | 'error'; detail: string;
}) {
  const statusColor = { ok: t.mint, warning: t.gold, error: t.rose }[status];
  const statusLabel = { ok: 'Healthy', warning: 'Warning', error: 'Error' }[status];
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '10px 0',
      borderBottom: `1px solid ${t.border}`,
    }}>
      <div style={{
        width: 8, height: 8, borderRadius: '50%',
        background: statusColor, flexShrink: 0,
        boxShadow: `0 0 6px ${statusColor}60`,
      }} />
      <span style={{ fontFamily: t.body, fontSize: 13, color: t.text, flex: 1 }}>
        {label}
      </span>
      <span style={{ fontFamily: t.mono, fontSize: 11, color: statusColor, fontWeight: 600 }}>
        {statusLabel}
      </span>
      <span style={{ fontFamily: t.mono, fontSize: 11, color: t.textMuted }}>
        {detail}
      </span>
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <div style={{ maxWidth: 1100 }}>
      {/* Page header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{
          fontFamily: t.display, fontSize: 24, fontWeight: 800,
          color: t.text, margin: 0,
        }}>
          Dashboard
        </h1>
        <p style={{
          fontFamily: t.body, fontSize: 13, color: t.textMuted,
          margin: '6px 0 0',
        }}>
          Platform overview and quick actions.
        </p>
      </div>

      {/* ─── Key Metrics ─── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: 16,
      }}>
        <StatCard label="Total Users" value="—" change="+0% this week" icon="users" color={t.violet} />
        <StatCard label="DAU" value="—" change="+0% vs yesterday" icon="trendUp" color={t.cyan} />
        <StatCard label="Quests Completed" value="—" change="+0% this week" icon="check" color={t.mint} />
        <StatCard label="Revenue (MRR)" value="—" icon="coins" color={t.gold} />
      </div>

      {/* ─── Quick Actions ─── */}
      <SectionHeader title="Quick Actions" />
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 12,
      }}>
        <QuickAction
          label="Manage Users"
          description="Search, view, and manage user accounts"
          icon="users"
          href="/admin/users"
        />
        <QuickAction
          label="Equipment Catalog"
          description="Add, edit, or deactivate equipment items"
          icon="shield"
          href="/admin/equipment"
        />
        <QuickAction
          label="Feature Flags"
          description="Toggle features and control rollouts"
          icon="gear"
          href="/admin/config/flags"
        />
        <QuickAction
          label="GDPR Requests"
          description="Process pending DSAR and anonymization requests"
          icon="lock"
          href="/admin/compliance/dsar"
        />
      </div>

      {/* ─── System Status ─── */}
      <SectionHeader title="System Status" />
      <div style={{
        background: t.bgCard, border: `1px solid ${t.border}`,
        borderRadius: 12, padding: '4px 20px',
      }}>
        <StatusRow label="Database" status="ok" detail="pg 16.2 • 4ms avg" />
        <StatusRow label="API Server" status="ok" detail="NestJS • p99 120ms" />
        <StatusRow label="Auth Service" status="ok" detail="JWT • 0 failures" />
        <StatusRow label="ETL Pipeline" status="warning" detail="Not configured" />
        <StatusRow
          label="DSAR Queue"
          status="ok"
          detail="0 pending"
        />
      </div>

      {/* ─── Recent Activity ─── */}
      <SectionHeader title="Recent Admin Activity" />
      <div style={{
        background: t.bgCard, border: `1px solid ${t.border}`,
        borderRadius: 12, padding: '20px 24px',
      }}>
        <p style={{
          fontFamily: t.body, fontSize: 13, color: t.textMuted,
          textAlign: 'center', margin: '20px 0',
        }}>
          No admin actions recorded yet. Actions will appear here once the audit log is active.
        </p>
      </div>
    </div>
  );
}
