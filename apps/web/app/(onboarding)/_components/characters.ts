// ═══════════════════════════════════════════
// 8 DIVERSE CHARACTERS — v1 (12×16) art + palettes
// Data from @plan2skill/pixelforge, plus NPC "sage"
// ═══════════════════════════════════════════

import {
  BODY_TEMPLATES_V1,
  DEFAULT_PALETTES_V1,
  CHARACTER_META,
  getBodyIds,
} from '@plan2skill/pixelforge';

export interface CharacterMeta {
  id: string;
  name: string;
  desc: string;
  color: string;
}

export const CHARACTERS: CharacterMeta[] = getBodyIds().map((id) => {
  const meta = CHARACTER_META[id];
  return { id: meta.id, name: meta.name, desc: meta.desc, color: meta.color };
});

export const charArtStrings: Record<string, string> = {
  ...BODY_TEMPLATES_V1,
  // ─── Sage: NPC guide — silver-blue hair, no glasses, casual blazer, friendly ───
  sage: '...HHHHHH...\n..HHHhHHHH..\n..HHHhHHHH..\n..HSSSSSSH..\n..SEESSEES..\n..SEwSSEwS..\n..SrSSSSrS..\n...SSmSSS...\n....SSSS....\n...BBBBBB...\n..BTTTTTTTB.\n.BBTTTTTTTBB\n.BBTTttTTTBB\n..BTTTTTTTB.\n...PP..PP...\n..FFF..FFF..',
};

export const charPalettes: Record<string, Record<string, string>> = {
  ...DEFAULT_PALETTES_V1,
  // ─── Sage (NPC-only, not a selectable character — friendly business guru) ───
  sage: { H: '#B8C4E0', h: '#D0D8F0', S: '#C8A882', E: '#1A2030', w: '#FFFFFF', r: '#B89870', m: '#C87060', B: '#3A4568', T: '#5A6A90', t: '#4A5878', A: '#C8A882', P: '#2A3050', F: '#202840' },
};
