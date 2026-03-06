'use client';

import React, { useRef, useEffect, useMemo, useState, useCallback } from 'react';
import {
  parseArt,
  composite as compositeArt,
  compositeCharacterWithEquipment,
  buildIdleFrames,
  IDLE_MS_PER_FRAME,
  EQUIPMENT_OFFSETS_V2,
  type EquipmentLayer,
} from '@plan2skill/pixelforge';

// ═══════════════════════════════════════════
// CANVAS PIXEL RENDERER v2
// Drop-in replacements for PixelCanvas, AnimatedPixelCanvas, LayeredPixelCanvas
// Uses Canvas 2D fillRect instead of CSS box-shadow
// ═══════════════════════════════════════════

// ─── CanvasPixelRenderer (drop-in for PixelCanvas) ───

export function CanvasPixelRenderer({
  data,
  size = 4,
  style,
  className,
  ariaLabel,
}: {
  data: (string | null)[][];
  size?: number;
  style?: React.CSSProperties;
  className?: string;
  ariaLabel?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const width = data[0]?.length ?? 0;
  const height = data.length;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let y = 0; y < data.length; y++) {
      const row = data[y];
      if (!row) continue;
      for (let x = 0; x < row.length; x++) {
        const color = row[x];
        if (color) {
          ctx.fillStyle = color;
          ctx.fillRect(x * size, y * size, size, size);
        }
      }
    }
  }, [data, size]);

  if (!data?.length) return null;

  return (
    <canvas
      ref={canvasRef}
      width={width * size}
      height={height * size}
      className={className}
      aria-label={ariaLabel}
      role={ariaLabel ? 'img' : undefined}
      style={{
        imageRendering: 'pixelated',
        ...style,
      }}
    />
  );
}

// ─── AnimatedCanvasRenderer (drop-in for AnimatedPixelCanvas) ───

export function AnimatedCanvasRenderer({
  character,
  size = 4,
  glowColor,
  style: extraStyle,
  ariaLabel,
}: {
  character: { id: string; artString: string; palette: Record<string, string> };
  size?: number;
  glowColor?: string;
  style?: React.CSSProperties;
  ariaLabel?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const frameRef = useRef(0);
  const lastTimeRef = useRef(0);

  // prefers-reduced-motion
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Parse frames and cache
  const frames = useMemo(() => {
    if (!character?.artString || !character?.palette) return [];
    return buildIdleFrames(character.artString).map(f => parseArt(f, character.palette));
  }, [character?.id, character?.artString, character?.palette]);

  const width = frames[0]?.[0]?.length ?? 0;
  const height = frames[0]?.length ?? 0;

  const drawFrame = useCallback(
    (ctx: CanvasRenderingContext2D, frameData: (string | null)[][]) => {
      ctx.clearRect(0, 0, width * size, height * size);
      for (let y = 0; y < frameData.length; y++) {
        const row = frameData[y];
        if (!row) continue;
        for (let x = 0; x < row.length; x++) {
          const color = row[x];
          if (color) {
            ctx.fillStyle = color;
            ctx.fillRect(x * size, y * size, size, size);
          }
        }
      }
    },
    [width, height, size],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || frames.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;
    drawFrame(ctx, frames[0]!);

    if (reducedMotion || frames.length <= 1) return;

    frameRef.current = 0;
    lastTimeRef.current = 0;

    const tick = (time: number) => {
      if (lastTimeRef.current === 0) lastTimeRef.current = time;
      if (time - lastTimeRef.current >= IDLE_MS_PER_FRAME) {
        frameRef.current = (frameRef.current + 1) % frames.length;
        drawFrame(ctx, frames[frameRef.current]!);
        lastTimeRef.current = time;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(rafRef.current);
  }, [frames, reducedMotion, drawFrame]);

  if (!frames.length || !width || !height) return null;

  return (
    <div
      style={{
        filter: glowColor ? `drop-shadow(0 0 12px ${glowColor}55)` : 'none',
        transition: 'filter 0.3s ease',
        display: 'inline-block',
        ...extraStyle,
      }}
    >
      <canvas
        ref={canvasRef}
        width={width * size}
        height={height * size}
        aria-label={ariaLabel || `${character.id} character`}
        role="img"
        style={{ imageRendering: 'pixelated' }}
      />
    </div>
  );
}

// ─── LayeredCanvasRenderer (drop-in for LayeredPixelCanvas) ───
// 11-layer compositing: glow → cape → base → armor → boots → helmet → shield → weapon → ring → companion → particles
// Phase 1: only layers 1 (glow wrapper) and 3 (base character) active

export function LayeredCanvasRenderer({
  character,
  equipment = [],
  companion,
  size = 4,
  glowColor,
  evolutionTier,
  style: extraStyle,
  ariaLabel,
}: {
  character: { artString: string; palette: Record<string, string> };
  equipment?: EquipmentLayer[];
  companion?: { artString: string; palette: Record<string, string> };
  size?: number;
  glowColor?: string;
  evolutionTier?: string;
  style?: React.CSSProperties;
  ariaLabel?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const composited = useMemo(() => {
    if (!character?.artString || !character?.palette) return null;

    // Phase 1: equipment compositing uses v2 offsets when present
    if (equipment.length === 0 && !companion) {
      return parseArt(character.artString, character.palette);
    }

    // Full compositing with equipment layers
    return compositeCharacterWithEquipment(character.artString, character.palette, equipment);
  }, [character?.artString, character?.palette, equipment, companion]);

  const width = composited?.[0]?.length ?? 0;
  const height = composited?.length ?? 0;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !composited) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let y = 0; y < composited.length; y++) {
      const row = composited[y];
      if (!row) continue;
      for (let x = 0; x < row.length; x++) {
        const color = row[x];
        if (color) {
          ctx.fillStyle = color;
          ctx.fillRect(x * size, y * size, size, size);
        }
      }
    }
  }, [composited, size]);

  if (!composited?.length) return null;

  // Collect rarity glows from equipment
  const rarityGlows = equipment
    .filter(eq => eq.rarityGlow)
    .map(eq => `drop-shadow(0 0 8px ${eq.rarityGlow}60)`)
    .slice(0, 2);

  const baseGlow = glowColor ? `drop-shadow(0 0 12px ${glowColor}55)` : '';
  const allGlows = [baseGlow, ...rarityGlows].filter(Boolean).join(' ');

  return (
    <div
      style={{
        filter: allGlows || 'none',
        transition: 'filter 0.3s ease',
        display: 'inline-block',
        ...extraStyle,
      }}
    >
      <canvas
        ref={canvasRef}
        width={width * size}
        height={height * size}
        aria-label={ariaLabel}
        role={ariaLabel ? 'img' : undefined}
        style={{ imageRendering: 'pixelated' }}
      />
    </div>
  );
}

// ─── PNG Export ───

export function exportCharacterPNG(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      blob => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to export PNG'));
      },
      'image/png',
    );
  });
}
