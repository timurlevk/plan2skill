// ═══════════════════════════════════════════
// 8 DIVERSE CHARACTERS — from v7 Style Guide
// Art strings, palettes, metadata
// ═══════════════════════════════════════════

export interface CharacterMeta {
  id: string;
  name: string;
  desc: string;
  color: string;
}

export const CHARACTERS: CharacterMeta[] = [
  { id: 'aria',  name: 'Aria',  desc: 'Light skin, blonde hair',   color: '#E8C35A' },
  { id: 'kofi',  name: 'Kofi',  desc: 'Dark skin, flat-top fade',  color: '#2A9D8F' },
  { id: 'mei',   name: 'Mei',   desc: 'Medium skin, bob w/ bangs', color: '#E879F9' },
  { id: 'diego', name: 'Diego', desc: 'Tan skin, wavy brown hair', color: '#3B82F6' },
  { id: 'zara',  name: 'Zara',  desc: 'Dark skin, afro puffs',     color: '#FF6B8A' },
  { id: 'alex',  name: 'Alex',  desc: 'Non-binary, undercut',      color: '#4ECDC4' },
  { id: 'priya', name: 'Priya', desc: 'Brown skin, long braid',    color: '#FFD166' },
  { id: 'liam',  name: 'Liam',  desc: 'Light skin, messy auburn',  color: '#818CF8' },
];

export const charArtStrings: Record<string, string> = {
  aria:  '....HHHH....\n...HHHHHH...\n..HHHhHHHH..\n.HHSSSSSSHH.\n.HSEESSEESH.\n.HSEwSSEwSH.\n.HSrSSSSrSH.\n..HSSmmSSH..\n...HSSSSH...\n...TTTTTT...\n..TTTTTTTT..\n.ATTTTTTTTA.\n.ATTTttTTTA.\n..TTTTTTTT..\n...PP..PP...\n..FFF..FFF..',
  kofi:  '..HHHHHHHH..\n..HHHHHHHH..\n...HHHHHH...\n..HSSSSSSH..\n..SEESSEES..\n..SEwSSEwS..\n..SrSSSSrS..\n...SSmmSS...\n....SSSS....\n...TTTTTT...\n..TTTTTTTT..\n.ATTTTTTTTA.\n.ATTTttTTTA.\n..TTTTTTTT..\n...PP..PP...\n..FFF..FFF..',
  mei:   '...HHHHHH...\n..HHHHHHHH..\n.HhhhhhhhhH.\n.HHSSSSSSHH.\n.HSEESSEESH.\n.HSEwSSEwSH.\n..HrSSSSrH..\n...SSmmSS...\n....SSSS....\n...TTTTTT...\n..TTTTTTTT..\n.ATTTTTTTTA.\n.ATTTttTTTA.\n..TTTTTTTT..\n...PP..PP...\n..FFF..FFF..',
  diego: '..H.HHhH.H..\n..HHHHHHHH..\n..HHHhHHHH..\n..HSSSSSSH..\n..SEESSEES..\n..SEwSSEwS..\n..SrSSSSrS..\n...SSmmSS...\n....SSSS....\n...TTTTTT...\n..TTTTTTTT..\n.ATTTTTTTTA.\n.ATTTttTTTA.\n..TTTTTTTT..\n...PP..PP...\n..FFF..FFF..',
  zara:  '..HHH..HHH..\n.HHHH..HHHH.\n..HHHHHHHH..\n..HSSSSSSH..\n..SEESSEES..\n..SEwSSEwS..\n..SrSSSSrS..\n...SSmmSS...\n....SSSS....\n...TTTTTT...\n..TTTTTTTT..\n.ATTTTTTTTA.\n.ATTTttTTTA.\n..TTTTTTTT..\n...PP..PP...\n..FFF..FFF..',
  alex:  '..HHHH......\n..HHHHHHH...\n..HHHhHHHH..\n..HSSSSSSH..\n..SEESSEES..\n..SEwSSEwS..\n..SrSSSSrS..\n...SSmmSS...\n....SSSS....\n...TTTTTT...\n..TTTTTTTT..\n.ATTTTTTTTA.\n.ATTTttTTTA.\n..TTTTTTTT..\n...PP..PP...\n..FFF..FFF..',
  priya: '....HHHH....\n...HHHHHH...\n..HHHhHHHH..\n.HHSSSSSSHH.\n.HSEESSEESH.\n.HSEwSSEwSH.\n..SrSSSSrSH.\n...SSmmSS.H.\n....SSSS.H..\n...TTTTTT...\n..TTTTTTTT..\n.ATTTTTTTTA.\n.ATTTttTTTA.\n..TTTTTTTT..\n...PP..PP...\n..FFF..FFF..',
  liam:  '.H..HHHH..H.\n.HHHHHHHHHH.\n..HHHhHHHH..\n..HSSSSSSH..\n..SEESSEES..\n..SEwSSEwS..\n..SrSSSSrS..\n...SSmmSS...\n....SSSS....\n...TTTTTT...\n..TTTTTTTT..\n.ATTTTTTTTA.\n.ATTTttTTTA.\n..TTTTTTTT..\n...PP..PP...\n..FFF..FFF..',
  // ─── Sage: NPC guide — silver-blue hair, glasses, scholarly robe ───
  sage:  '...HHHHHH...\n..HHHhHHHH..\n..HHHhHHHH..\n..HSSSSSSH..\n..SGESSGES..\n..SGwSSGwS..\n..SrSSSSrS..\n...SSmmSS...\n....SSSS....\n...TTTTTT...\n..TTTTTTTT..\n.ATTTTTTTTA.\n.ATTTttTTTA.\n..TTTTTTTT..\n...PP..PP...\n..FFF..FFF..',
};

export const charPalettes: Record<string, Record<string, string>> = {
  aria:  { H: '#E8C35A', h: '#FFD980', S: '#FFDAB9', E: '#2A2040', w: '#FFF', r: '#FFB5A0', m: '#E8907A', T: '#9D7AFF', t: '#7B5FCC', A: '#FFDAB9', P: '#6B4FBB', F: '#5A3FAA' },
  kofi:  { H: '#1A1008', h: '#2A1A10', S: '#8B5E3C', E: '#0A0A1E', w: '#FFF', r: '#7A4E2C', m: '#6A3E20', T: '#2A9D8F', t: '#1A7A6A', A: '#8B5E3C', P: '#155A50', F: '#104A40' },
  mei:   { H: '#1A1A2E', h: '#2A2A40', S: '#DEB887', E: '#1A1020', w: '#FFF', r: '#D4A06A', m: '#C08060', T: '#E879F9', t: '#C060D0', A: '#DEB887', P: '#9040A0', F: '#7030A0' },
  diego: { H: '#5C3A1E', h: '#7A5030', S: '#D4A574', E: '#1A1020', w: '#FFF', r: '#C89058', m: '#B07848', T: '#3B82F6', t: '#2A60C0', A: '#D4A574', P: '#1A3070', F: '#102060' },
  zara:  { H: '#1A1008', h: '#2A1A10', S: '#7B4B2A', E: '#0A0A1E', w: '#FFF', r: '#6A3B1A', m: '#5A3018', T: '#FF6B8A', t: '#D04A6A', A: '#7B4B2A', P: '#8A2040', F: '#701838' },
  alex:  { H: '#6B48A8', h: '#9D7AFF', S: '#D2A37C', E: '#1A1020', w: '#FFF', r: '#C0905A', m: '#A87848', T: '#4ECDC4', t: '#3AABA0', A: '#D2A37C', P: '#1A6A60', F: '#105A50' },
  priya: { H: '#1A1008', h: '#2A1810', S: '#C68642', E: '#0A0A1E', w: '#FFF', r: '#B87530', m: '#A06828', T: '#FFD166', t: '#E0B040', A: '#C68642', P: '#8A6A10', F: '#705808' },
  liam:  { H: '#CC4422', h: '#E85830', S: '#FFE0C0', E: '#1A2030', w: '#FFF', r: '#FFBBA0', m: '#E8907A', T: '#818CF8', t: '#6060D0', A: '#FFE0C0', P: '#3A3080', F: '#2A2070' },
  // ─── Sage (NPC-only, not a selectable character) ───
  sage:  { H: '#B8C4E0', h: '#D0D8F0', S: '#C8A882', E: '#1A2030', w: '#FFF', r: '#B89870', m: '#A08060', G: '#8899BB', T: '#4A5580', t: '#3A4568', A: '#C8A882', P: '#2A3050', F: '#202840' },
};
