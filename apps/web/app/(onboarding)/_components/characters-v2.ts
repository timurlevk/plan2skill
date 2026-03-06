// ═══════════════════════════════════════════
// CHARACTERS V2 — thin wrapper over @plan2skill/pixelforge
// Re-exports body templates & palettes in the legacy shape
// ═══════════════════════════════════════════

import type { EvolutionTier, BodyType } from '@plan2skill/types';
import {
  BODY_TEMPLATES_V2,
  DEFAULT_PALETTES_V2,
  CHARACTER_META,
  getBodyIds,
  type CharacterMeta,
} from '@plan2skill/pixelforge';

// ─── Re-export types for backwards compatibility ───

export type { BodyType, EvolutionTier };

export interface CharacterMetaV2 {
  id: string;
  name: string;
  desc: string;
  color: string;
  bodyType: BodyType;
}

// ─── Character Metadata (derived from library) ───

export const CHARACTERS_V2: CharacterMetaV2[] = getBodyIds().map((id) => {
  const meta = CHARACTER_META[id];
  return {
    id: meta.id,
    name: meta.name,
    desc: meta.desc,
    color: meta.color,
    bodyType: meta.bodyType,
  };
});

// ─── Art Strings: novice from library, others = '' (evolution applied dynamically) ───

export const charArtStringsV2: Record<string, Record<EvolutionTier, string>> =
  Object.fromEntries(
    getBodyIds().map((id) => [
      id,
      {
        novice: BODY_TEMPLATES_V2[id],
        apprentice: '',
        practitioner: '',
        master: '',
      },
    ]),
  );

// ─── Palettes V2 (direct re-export from library) ───

export const charPalettesV2: Record<string, Record<string, string>> =
  DEFAULT_PALETTES_V2 as Record<string, Record<string, string>>;
