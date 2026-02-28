import React, { useMemo } from 'react';

export interface PixelCanvasProps {
  data: (string | null)[][];
  pixelSize?: number;
  style?: React.CSSProperties;
}

/** Parse pixel art string into 2D color array */
export function parsePixelArt(
  str: string,
  palette: Record<string, string>,
): (string | null)[][] {
  return str
    .trim()
    .split('\n')
    .map((row) =>
      [...row.trim()].map((c) => (c === '.' ? null : palette[c] || null)),
    );
}

/** Render pixel art using CSS box-shadow technique (no images) */
export function PixelCanvas({ data, pixelSize = 5, style }: PixelCanvasProps) {
  const { shadows, width, height } = useMemo(() => {
    const shadowParts: string[] = [];
    let maxX = 0;
    let maxY = 0;

    data.forEach((row, y) => {
      row.forEach((color, x) => {
        if (color) {
          shadowParts.push(`${x * pixelSize}px ${y * pixelSize}px 0 0 ${color}`);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
        }
      });
    });

    return {
      shadows: shadowParts.join(', '),
      width: (maxX + 1) * pixelSize,
      height: (maxY + 1) * pixelSize,
    };
  }, [data, pixelSize]);

  if (!shadows) return null;

  return (
    <div
      style={{
        position: 'relative',
        width,
        height,
        ...style,
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: pixelSize,
          height: pixelSize,
          boxShadow: shadows,
        }}
      />
    </div>
  );
}
