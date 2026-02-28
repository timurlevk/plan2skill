export type MotionLevel = 'reduced' | 'normal' | 'expressive';

export const motionPresets = {
  reduced: { duration: 0, scale: 1 },
  normal: { duration: 200, scale: 1.02 },
  expressive: { duration: 350, scale: 1.05 },
} as const;

export const easings = {
  ease: 'ease',
  easeIn: 'ease-in',
  easeOut: 'ease-out',
  spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
} as const;

export const durations = {
  instant: 0,
  fast: 150,
  normal: 200,
  slow: 350,
  xSlow: 600,
} as const;
