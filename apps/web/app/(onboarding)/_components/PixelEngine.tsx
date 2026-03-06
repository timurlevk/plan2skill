'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  parseArt as _parseArt,
  composite,
  compositeCharacterWithEquipment as _compositeCharacterWithEquipment,
  EQUIPMENT_OFFSETS_V1,
  buildIdleFrames,
  IDLE_MS_PER_FRAME,
  type EquipmentLayer,
  type PixelGrid,
} from '@plan2skill/pixelforge';

// ═══════════════════════════════════════════
// PIXEL ART ENGINE — React rendering layer
// Core logic delegated to @plan2skill/pixelforge
// ═══════════════════════════════════════════

// ─── Re-exports for backwards compatibility ───

export { parseArt } from '@plan2skill/pixelforge';
export { parseArtNamespaced } from '@plan2skill/pixelforge';
export type { EquipmentLayer } from '@plan2skill/pixelforge';

export const EQUIPMENT_OFFSETS = EQUIPMENT_OFFSETS_V1;

export function compositeArt(
  baseData: PixelGrid,
  layers: { data: PixelGrid; offsetX: number; offsetY: number }[],
): PixelGrid {
  return composite(baseData, layers);
}

export function compositeCharacterWithEquipment(
  charArtString: string,
  charPalette: Record<string, string>,
  equipment: EquipmentLayer[],
): PixelGrid {
  return _compositeCharacterWithEquipment(charArtString, charPalette, equipment);
}

// ─── Single-Layer Renderer ───

export function PixelCanvas({ data, size = 5, style = {} }: {
  data: PixelGrid;
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

// ─── Layered Pixel Canvas (multi-layer with independent glow) ───

export function LayeredPixelCanvas({ character, equipment = [], size = 5, glowColor, style: extraStyle = {} }: {
  character: { artString: string; palette: Record<string, string> };
  equipment?: EquipmentLayer[];
  size?: number;
  glowColor?: string;
  style?: React.CSSProperties;
}) {
  const composited = useMemo(() => {
    if (!character?.artString || !character?.palette) return null;
    if (equipment.length === 0) return _parseArt(character.artString, character.palette);
    return _compositeCharacterWithEquipment(character.artString, character.palette, equipment);
  }, [character?.artString, character?.palette, equipment]);

  if (!composited?.length) return null;

  // Collect rarity glows from equipment
  const rarityGlows = equipment
    .filter(eq => eq.rarityGlow)
    .map(eq => `drop-shadow(0 0 8px ${eq.rarityGlow}60)`)
    .slice(0, 2); // max 2 equipment glows

  const baseGlow = glowColor ? `drop-shadow(0 0 12px ${glowColor}55)` : '';
  const allGlows = [baseGlow, ...rarityGlows].filter(Boolean).join(' ');

  return (
    <div style={{
      filter: allGlows || 'none',
      transition: 'filter 0.3s ease',
      ...extraStyle,
    }}>
      <PixelCanvas data={composited} size={size} />
    </div>
  );
}

// ─── Idle Animation ───

export function AnimatedPixelCanvas({ character, size = 5, glowColor, style: extraStyle = {} }: {
  character: { id: string; artString: string; palette: Record<string, string> };
  size?: number;
  glowColor?: string;
  style?: React.CSSProperties;
}) {
  const [frameIndex, setFrameIndex] = useState(0);

  // prefers-reduced-motion
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const frames = useMemo(() => {
    if (!character?.artString || !character?.palette) return [];
    return buildIdleFrames(character.artString).map(f => _parseArt(f, character.palette));
  }, [character?.id]);

  useEffect(() => {
    if (reducedMotion) return;
    if (frames.length <= 1) return;
    const iv = setInterval(() => {
      setFrameIndex(prev => (prev + 1) % frames.length);
    }, IDLE_MS_PER_FRAME);
    return () => clearInterval(iv);
  }, [frames.length, reducedMotion]);

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

// ─── V2 Canvas Renderers ───
export { CanvasPixelRenderer, AnimatedCanvasRenderer, LayeredCanvasRenderer, exportCharacterPNG } from './CanvasPixelRenderer';
export { detectArtVersion, getAdjustedSize, buildCustomPaletteV2, EQUIPMENT_OFFSETS_V2 } from './palette-v2';
export { charArtStringsV2, charPalettesV2, CHARACTERS_V2 } from './characters-v2';
export { lighten, darken } from '@plan2skill/pixelforge';
