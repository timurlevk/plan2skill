'use client';

import React from 'react';
import { t } from '../../../(onboarding)/_components/tokens';

// ═══════════════════════════════════════════
// SKELETON LOADER — Shimmer cards while hydrating
// Shown while useProgressionStore.persist.hasHydrated() === false
// Uses existing `shimmer` keyframe from dashboard layout
// ═══════════════════════════════════════════

function ShimmerBox({ width, height, borderRadius = 8, style = {} }: {
  width: string | number;
  height: number;
  borderRadius?: number;
  style?: React.CSSProperties;
}) {
  return (
    <div style={{
      width, height, borderRadius,
      background: `linear-gradient(90deg, ${t.border} 0%, ${t.borderHover} 50%, ${t.border} 100%)`,
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.5s ease-in-out infinite',
      ...style,
    }} />
  );
}

export function SkeletonLoader() {
  return (
    <div style={{ animation: 'fadeUp 0.3s ease-out' }} aria-hidden="true" role="presentation">
      {/* Greeting skeleton */}
      <div style={{ marginBottom: 32 }}>
        <ShimmerBox width={240} height={28} borderRadius={6} style={{ marginBottom: 8 }} />
        <ShimmerBox width={180} height={16} borderRadius={4} />
      </div>

      {/* Stats row skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4" style={{ gap: 12, marginBottom: 32 }}>
        {[0, 1, 2, 3].map(i => (
          <div key={i} style={{
            padding: 16, borderRadius: 16,
            background: t.bgCard, border: `1px solid ${t.border}`,
          }}>
            <ShimmerBox width={60} height={12} borderRadius={4} style={{ marginBottom: 10 }} />
            <ShimmerBox width={80} height={22} borderRadius={4} />
          </div>
        ))}
      </div>

      {/* Active quests skeleton */}
      <div style={{ marginBottom: 32 }}>
        <ShimmerBox width={120} height={14} borderRadius={4} style={{ marginBottom: 14 }} />
        {[0, 1].map(i => (
          <div key={i} style={{
            padding: 20, borderRadius: 16,
            background: t.bgCard, border: `1px solid ${t.border}`,
            marginBottom: 12,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <ShimmerBox width={40} height={40} borderRadius={12} />
              <div style={{ flex: 1 }}>
                <ShimmerBox width="70%" height={16} borderRadius={4} style={{ marginBottom: 6 }} />
                <ShimmerBox width={100} height={12} borderRadius={4} />
              </div>
            </div>
            <ShimmerBox width="100%" height={4} borderRadius={2} />
          </div>
        ))}
      </div>

      {/* Daily quests skeleton */}
      <div>
        <ShimmerBox width={120} height={14} borderRadius={4} style={{ marginBottom: 14 }} />
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '12px 16px', borderRadius: 16,
            background: t.bgCard, border: `1px solid ${t.border}`,
            marginBottom: 8,
          }}>
            <ShimmerBox width={22} height={22} borderRadius={11} />
            <div style={{ flex: 1 }}>
              <ShimmerBox width="60%" height={14} borderRadius={4} style={{ marginBottom: 6 }} />
              <ShimmerBox width={80} height={10} borderRadius={4} />
            </div>
            <ShimmerBox width={50} height={14} borderRadius={4} />
          </div>
        ))}
      </div>
    </div>
  );
}
