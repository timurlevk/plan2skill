import { useCallback } from 'react';

// ─── Completion Sound via Web Audio API (Micro tier: 150–400ms) ───

export function playCompleteSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    // Two-tone chime: C5 → E5
    [523.25, 659.25].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.15, ctx.currentTime + i * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.12);
      osc.stop(ctx.currentTime + i * 0.12 + 0.3);
    });
    setTimeout(() => ctx.close(), 600);
  } catch { /* Web Audio not available — silent fallback */ }
}

export function useSound() {
  const play = useCallback(() => playCompleteSound(), []);
  return { playCompleteSound: play };
}
