'use client';

import React, { useState, useEffect, useMemo } from 'react';

// ═══════════════════════════════════════════
// PIXEL ART ENGINE — from v7 Style Guide
// parseArt, PixelCanvas, AnimatedPixelCanvas
// + LayeredPixelCanvas for equipment overlays
// ═══════════════════════════════════════════

// ─── Core Parsers ───

export const parseArt = (str: string, pal: Record<string, string>): (string | null)[][] =>
  str.trim().split('\n').map(r => [...r.trim()].map(c => c === '.' ? null : pal[c] || null));

// Parse art string with namespaced palette keys (e.g., 'e_V' for equipment 'V')
export const parseArtNamespaced = (
  str: string,
  pal: Record<string, string>,
  namespace: string,
): (string | null)[][] =>
  str.trim().split('\n').map(r =>
    [...r.trim()].map(c => c === '.' ? null : pal[`${namespace}_${c}`] || pal[c] || null)
  );

// ─── Single-Layer Renderer ───

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

// ─── Equipment Overlay Types ───

export interface EquipmentLayer {
  artString: string;
  palette: Record<string, string>;
  slot: string; // 'weapon' | 'shield' | 'armor' | 'helmet' | 'boots' | 'ring' | 'companion'
  rarityGlow?: string; // hex color for glow
}

// Equipment slot → pixel offset relative to character (12×16 base)
export const EQUIPMENT_OFFSETS: Record<string, { x: number; y: number }> = {
  helmet:    { x: 2,  y: -2 },  // Above head
  armor:     { x: 1,  y: 9 },   // Over torso
  weapon:    { x: 10, y: 7 },   // Right hand
  shield:    { x: -2, y: 7 },   // Left hand
  boots:     { x: 2,  y: 14 },  // Over feet
  ring:      { x: 10, y: 10 },  // On right hand
  companion: { x: -5, y: 10 },  // Beside character
};

// ─── Composite Renderer: Character + Equipment Layers ───

export function compositeArt(
  baseData: (string | null)[][],
  layers: { data: (string | null)[][]; offsetX: number; offsetY: number }[],
): (string | null)[][] {
  // Determine total canvas bounds
  let minX = 0, minY = 0;
  let maxX = baseData[0]?.length || 0;
  let maxY = baseData.length;

  for (const layer of layers) {
    const lw = layer.data[0]?.length || 0;
    const lh = layer.data.length;
    minX = Math.min(minX, layer.offsetX);
    minY = Math.min(minY, layer.offsetY);
    maxX = Math.max(maxX, layer.offsetX + lw);
    maxY = Math.max(maxY, layer.offsetY + lh);
  }

  const width = maxX - minX;
  const height = maxY - minY;
  const baseOffX = -minX;
  const baseOffY = -minY;

  // Create empty canvas
  const canvas: (string | null)[][] = Array.from({ length: height }, () =>
    Array.from({ length: width }, () => null)
  );

  // Paint base character
  baseData.forEach((row, y) => row.forEach((c, x) => {
    if (c) {
      const cy = y + baseOffY;
      const cx = x + baseOffX;
      if (cy >= 0 && cy < height && cx >= 0 && cx < width) {
        canvas[cy]![cx] = c;
      }
    }
  }));

  // Paint equipment layers (later layers paint over earlier ones)
  for (const layer of layers) {
    layer.data.forEach((row, y) => row.forEach((c, x) => {
      if (c) {
        const cy = y + layer.offsetY + baseOffY;
        const cx = x + layer.offsetX + baseOffX;
        if (cy >= 0 && cy < height && cx >= 0 && cx < width) {
          canvas[cy]![cx] = c;
        }
      }
    }));
  }

  return canvas;
}

// Build composite character + equipment
export function compositeCharacterWithEquipment(
  charArtString: string,
  charPalette: Record<string, string>,
  equipment: EquipmentLayer[],
): (string | null)[][] {
  const baseData = parseArt(charArtString, charPalette);

  const layers = equipment.map(eq => {
    const offset = EQUIPMENT_OFFSETS[eq.slot] || { x: 0, y: 0 };
    return {
      data: parseArt(eq.artString, eq.palette),
      offsetX: offset.x,
      offsetY: offset.y,
    };
  });

  return compositeArt(baseData, layers);
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
    if (equipment.length === 0) return parseArt(character.artString, character.palette);
    return compositeCharacterWithEquipment(character.artString, character.palette, equipment);
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
