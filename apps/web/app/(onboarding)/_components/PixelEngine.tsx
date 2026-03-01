'use client';

import React, { useState, useEffect, useMemo } from 'react';

// ═══════════════════════════════════════════
// PIXEL ART ENGINE — from v7 Style Guide
// parseArt, PixelCanvas, AnimatedPixelCanvas
// ═══════════════════════════════════════════

export const parseArt = (str: string, pal: Record<string, string>): (string | null)[][] =>
  str.trim().split('\n').map(r => [...r.trim()].map(c => c === '.' ? null : pal[c] || null));

export function PixelCanvas({ data, size = 5, style = {} }: {
  data: (string | null)[][];
  size?: number;
  style?: React.CSSProperties;
}) {
  if (!data?.length) return null;
  const w = data[0]!.length, h = data.length;
  const sh: string[] = [];
  data.forEach((row, y) => row.forEach((c, x) => {
    if (c) sh.push(`${x * size}px ${y * size}px 0 0 ${c}`);
  }));
  return (
    <div style={{
      width: size,
      height: size,
      boxShadow: sh.join(','),
      marginRight: (w - 1) * size,
      marginBottom: (h - 1) * size,
      ...style,
    }} />
  );
}

// Idle animation: slight arm movement
const idleAnim = {
  msPerFrame: 1500,
  buildFrames: (baseString: string) => {
    const rows = baseString.trim().split('\n');
    const frame0 = rows.join('\n');
    const r = [...rows];
    if (r[11]) {
      const chars = [...r[11]];
      if (chars[0] === '.') chars[0] = ' ';
      r[11] = chars.join('');
    }
    return [frame0, r.join('\n')];
  },
};

export function AnimatedPixelCanvas({ character, size = 5, glowColor, style: extraStyle = {} }: {
  character: { id: string; artString: string; palette: Record<string, string> };
  size?: number;
  glowColor?: string;
  style?: React.CSSProperties;
}) {
  const [frameIndex, setFrameIndex] = useState(0);

  const frames = useMemo(() => {
    if (!character?.artString || !character?.palette) return [];
    return idleAnim.buildFrames(character.artString).map(f => parseArt(f, character.palette));
  }, [character?.id]);

  useEffect(() => {
    if (frames.length <= 1) return;
    const iv = setInterval(() => {
      setFrameIndex(prev => (prev + 1) % frames.length);
    }, idleAnim.msPerFrame);
    return () => clearInterval(iv);
  }, [frames.length]);

  const currentFrame = frames[frameIndex] ?? frames[0];
  if (!currentFrame?.length) return null;

  return (
    <div style={{
      filter: glowColor ? `drop-shadow(0 0 12px ${glowColor}55)` : 'none',
      transition: 'filter 0.3s ease',
      ...extraStyle,
    }}>
      <PixelCanvas data={currentFrame} size={size} />
    </div>
  );
}
