'use client';

import React from 'react';
import { t } from '../../(onboarding)/_components/tokens';
import { trpc } from '@plan2skill/api-client';

export default function AiOpsPage() {
  const { data: costs, isLoading: costsLoading } = trpc.admin.llmCosts.useQuery(
    { days: 30 },
    { staleTime: 1000 * 60 * 5, retry: 1 },
  );
  const { data: usage, isLoading: usageLoading } = trpc.admin.llmUsage.useQuery(
    { days: 30 },
    { staleTime: 1000 * 60 * 5, retry: 1 },
  );
  const { data: errors } = trpc.admin.llmErrors.useQuery(
    { limit: 20 },
    { staleTime: 1000 * 60 * 5, retry: 1 },
  );
  const { data: cacheStats } = trpc.admin.llmCacheStats.useQuery(
    undefined,
    { staleTime: 1000 * 60 * 5, retry: 1 },
  );
  const { data: topUsers } = trpc.admin.llmTopUsers.useQuery(
    { days: 30, limit: 10 },
    { staleTime: 1000 * 60 * 5, retry: 1 },
  );

  const isLoading = costsLoading || usageLoading;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div>
        <h1 style={{
          fontFamily: t.display, fontSize: 22, fontWeight: 700,
          color: t.text, margin: 0,
        }}>
          AI Operations
        </h1>
        <p style={{
          fontFamily: t.body, fontSize: 13, color: t.textMuted,
          margin: '4px 0 0',
        }}>
          LLM usage, costs, and performance (last 30 days)
        </p>
      </div>

      {isLoading ? (
        <div style={{
          fontFamily: t.body, fontSize: 13, color: t.textMuted,
          padding: 40, textAlign: 'center',
        }}>
          Loading AI metrics...
        </div>
      ) : (
        <>
          {/* ── Summary Cards ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            <MetricCard
              label="Total Cost"
              value={`$${(costs?.totalCost ?? 0).toFixed(2)}`}
              sub={`${costs?.totalCalls ?? 0} calls`}
              color={t.mint}
            />
            <MetricCard
              label="Total Calls"
              value={String(usage?.totalCalls ?? 0)}
              sub={`${usage?.successCount ?? 0} success`}
              color={t.violet}
            />
            <MetricCard
              label="Avg Latency"
              value={`${(usage?.avgLatencyMs ?? 0).toLocaleString()}ms`}
              sub={`p95: ${(usage?.p95LatencyMs ?? 0).toLocaleString()}ms`}
              color={t.gold}
            />
            <MetricCard
              label="Error Rate"
              value={`${((usage?.errorRate ?? 0) * 100).toFixed(1)}%`}
              sub={`${usage?.failureCount ?? 0} failures`}
              color={(usage?.errorRate ?? 0) > 0.05 ? '#ff4444' : t.mint}
            />
          </div>

          {/* ── Cost by Generator ── */}
          <Card title="Cost by Generator">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {costs?.byGenerator.map((g) => {
                const pct = costs.totalCost > 0 ? (g.totalCost / costs.totalCost) * 100 : 0;
                return (
                  <div key={g.generatorType} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{
                      fontFamily: t.mono, fontSize: 11, color: t.text,
                      width: 100, flexShrink: 0,
                    }}>
                      {g.generatorType}
                    </span>
                    <div style={{
                      flex: 1, height: 20, background: `${t.violet}12`,
                      borderRadius: 4, overflow: 'hidden',
                    }}>
                      <div style={{
                        width: `${pct}%`, height: '100%',
                        background: t.violet, borderRadius: 4,
                        minWidth: pct > 0 ? 4 : 0,
                      }} />
                    </div>
                    <span style={{
                      fontFamily: t.mono, fontSize: 11, color: t.textMuted,
                      width: 80, textAlign: 'right',
                    }}>
                      ${g.totalCost.toFixed(2)} ({pct.toFixed(0)}%)
                    </span>
                    <span style={{
                      fontFamily: t.mono, fontSize: 10, color: t.textMuted,
                      width: 60, textAlign: 'right',
                    }}>
                      {g.callCount} calls
                    </span>
                  </div>
                );
              })}
              {(!costs?.byGenerator.length) && (
                <span style={{ fontFamily: t.body, fontSize: 12, color: t.textMuted }}>
                  No usage data yet
                </span>
              )}
            </div>
          </Card>

          {/* ── Generator Stats + Cache ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Card title="Generator Performance">
              <Table
                headers={['Generator', 'Calls', 'Avg Latency', 'Errors', 'Cache Hit']}
                rows={(usage?.byGenerator ?? []).map((g) => [
                  g.generatorType,
                  String(g.calls),
                  `${g.avgLatencyMs}ms`,
                  `${(g.errorRate * 100).toFixed(1)}%`,
                  `${(g.cacheHitRate * 100).toFixed(0)}%`,
                ])}
              />
            </Card>

            <Card title="Cache Stats">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontFamily: t.body, fontSize: 12, color: t.textMuted }}>
                    Total Entries
                  </span>
                  <span style={{ fontFamily: t.mono, fontSize: 12, color: t.text }}>
                    {cacheStats?.totalEntries ?? 0}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontFamily: t.body, fontSize: 12, color: t.textMuted }}>
                    Total Hits
                  </span>
                  <span style={{ fontFamily: t.mono, fontSize: 12, color: t.text }}>
                    {cacheStats?.totalHits ?? 0}
                  </span>
                </div>
                <div style={{ height: 1, background: t.border, margin: '4px 0' }} />
                {cacheStats?.byGenerator.map((g) => (
                  <div key={g.generatorType} style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontFamily: t.mono, fontSize: 11, color: t.textMuted }}>
                      {g.generatorType}
                    </span>
                    <span style={{ fontFamily: t.mono, fontSize: 11, color: t.text }}>
                      {g.entries} entries, {g.totalHits} hits
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* ── Recent Errors ── */}
          <Card title="Recent Errors">
            <Table
              headers={['Time', 'Generator', 'Model', 'Error', 'Latency']}
              rows={(errors ?? []).slice(0, 10).map((e) => [
                new Date(e.createdAt).toLocaleString(),
                e.generatorType,
                e.model,
                e.errorMessage.slice(0, 60) + (e.errorMessage.length > 60 ? '...' : ''),
                `${e.durationMs}ms`,
              ])}
            />
          </Card>

          {/* ── Top Users by Cost ── */}
          <Card title="Top Users by Cost">
            <Table
              headers={['User ID', 'Cost', 'Calls', 'Avg Latency']}
              rows={(topUsers ?? []).map((u) => [
                u.userId.slice(0, 12) + '...',
                `$${u.totalCost.toFixed(4)}`,
                String(u.callCount),
                `${u.avgLatencyMs}ms`,
              ])}
            />
          </Card>
        </>
      )}
    </div>
  );
}

// ── Reusable Components ──

function MetricCard({ label, value, sub, color }: {
  label: string; value: string; sub: string; color: string;
}) {
  return (
    <div style={{
      background: t.bgElevated, borderRadius: 12,
      border: `1px solid ${t.border}`,
      padding: '20px 24px',
    }}>
      <div style={{
        fontFamily: t.body, fontSize: 11, color: t.textMuted,
        marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em',
      }}>
        {label}
      </div>
      <div style={{
        fontFamily: t.display, fontSize: 28, fontWeight: 700,
        color,
      }}>
        {value}
      </div>
      <div style={{
        fontFamily: t.mono, fontSize: 10, color: t.textMuted,
        marginTop: 4,
      }}>
        {sub}
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: t.bgElevated, borderRadius: 12,
      border: `1px solid ${t.border}`,
      padding: 20,
    }}>
      <h3 style={{
        fontFamily: t.display, fontSize: 14, fontWeight: 600,
        color: t.text, margin: '0 0 16px',
      }}>
        {title}
      </h3>
      {children}
    </div>
  );
}

function Table({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{
        width: '100%', borderCollapse: 'collapse',
        fontFamily: t.mono, fontSize: 11,
      }}>
        <thead>
          <tr>
            {headers.map((h) => (
              <th key={h} style={{
                padding: '8px 12px', textAlign: 'left',
                color: t.textMuted, fontWeight: 600,
                borderBottom: `1px solid ${t.border}`,
                whiteSpace: 'nowrap',
              }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={headers.length} style={{
                padding: '16px 12px', textAlign: 'center',
                color: t.textMuted,
              }}>
                No data
              </td>
            </tr>
          ) : (
            rows.map((row, i) => (
              <tr key={i}>
                {row.map((cell, j) => (
                  <td key={j} style={{
                    padding: '6px 12px',
                    color: t.textSecondary,
                    borderBottom: `1px solid ${t.border}15`,
                    whiteSpace: 'nowrap',
                  }}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
