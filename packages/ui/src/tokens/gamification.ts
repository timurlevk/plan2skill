import type {
  ArchetypeConfig,
  AttributeConfig,
  CompanionConfig,
  EquipmentSlotConfig,
  RarityConfig,
} from '@plan2skill/types';

// ─── Archetypes ──────────────────────────────────────────────────

export const ARCHETYPES: ArchetypeConfig[] = [
  {
    id: 'strategist',
    name: 'Strategist',
    icon: '◈',
    color: '#5B7FCC',
    bonus: '+10% XP planning tasks',
    bonusPercent: 10,
  },
  {
    id: 'explorer',
    name: 'Explorer',
    icon: '◎',
    color: '#2A9D8F',
    bonus: '+10% XP new topics',
    bonusPercent: 10,
  },
  {
    id: 'connector',
    name: 'Connector',
    icon: '◉',
    color: '#E05580',
    bonus: '+10% XP social tasks',
    bonusPercent: 10,
  },
  {
    id: 'builder',
    name: 'Builder',
    icon: '▣',
    color: '#E8852E',
    bonus: '+10% XP project tasks',
    bonusPercent: 10,
  },
  {
    id: 'innovator',
    name: 'Innovator',
    icon: '★',
    color: '#DAA520',
    bonus: '+10% XP creative tasks',
    bonusPercent: 10,
  },
];

// ─── Attributes ──────────────────────────────────────────────────

export const ATTRIBUTES: AttributeConfig[] = [
  { key: 'MAS', name: 'MAS', fullName: 'Mastery', icon: '⚔', color: '#9D7AFF' },
  { key: 'INS', name: 'INS', fullName: 'Insight', icon: '◈', color: '#3B82F6' },
  { key: 'INF', name: 'INF', fullName: 'Influence', icon: '◉', color: '#FF6B8A' },
  { key: 'RES', name: 'RES', fullName: 'Resilience', icon: '◆', color: '#6EE7B7' },
  { key: 'VER', name: 'VER', fullName: 'Versatility', icon: '✦', color: '#4ECDC4' },
  { key: 'DIS', name: 'DIS', fullName: 'Discovery', icon: '★', color: '#FFD166' },
];

// ─── Rarity Tiers ────────────────────────────────────────────────

export const RARITIES: RarityConfig[] = [
  {
    id: 'common',
    label: 'Common',
    color: '#71717A',
    bgColor: 'rgba(113,113,122,0.08)',
    glow: null,
    roman: 'I',
    distribution: 40,
  },
  {
    id: 'uncommon',
    label: 'Uncommon',
    color: '#6EE7B7',
    bgColor: 'rgba(110,231,183,0.08)',
    glow: null,
    roman: 'II',
    distribution: 25,
  },
  {
    id: 'rare',
    label: 'Rare',
    color: '#3B82F6',
    bgColor: 'rgba(59,130,246,0.08)',
    glow: '0 0 12px rgba(59,130,246,0.3)',
    roman: 'III',
    distribution: 20,
  },
  {
    id: 'epic',
    label: 'Epic',
    color: '#9D7AFF',
    bgColor: 'rgba(157,122,255,0.08)',
    glow: '0 0 16px rgba(157,122,255,0.3)',
    roman: 'IV',
    distribution: 10,
  },
  {
    id: 'legendary',
    label: 'Legendary',
    color: '#FFD166',
    bgColor: 'rgba(255,209,102,0.1)',
    glow: '0 0 20px rgba(255,209,102,0.4)',
    roman: 'V',
    distribution: 5,
  },
];

// ─── Equipment Slots ─────────────────────────────────────────────

export const EQUIPMENT_SLOTS: EquipmentSlotConfig[] = [
  { slot: 'weapon', name: 'Weapon', skillCategory: 'Hard Skills', visualDescription: 'Tool' },
  {
    slot: 'shield',
    name: 'Shield',
    skillCategory: 'Communication',
    visualDescription: 'Shield/barrier',
  },
  {
    slot: 'armor',
    name: 'Armor',
    skillCategory: 'Personal Brand',
    visualDescription: 'Outfit',
  },
  {
    slot: 'helmet',
    name: 'Helmet',
    skillCategory: 'Strategic Thinking',
    visualDescription: 'Headgear',
  },
  {
    slot: 'boots',
    name: 'Boots',
    skillCategory: 'Adaptability',
    visualDescription: 'Footwear',
  },
  { slot: 'ring', name: 'Ring', skillCategory: 'Expertise', visualDescription: 'Accessory' },
  {
    slot: 'companion',
    name: 'Companion',
    skillCategory: 'Hobbies',
    visualDescription: 'Pet/companion',
  },
];

// ─── Companions ──────────────────────────────────────────────────

export const COMPANIONS: CompanionConfig[] = [
  {
    id: 'cat',
    name: 'Cat',
    nameUk: 'Котик',
    buff: '+5% creativity',
    buffPercent: 5,
    colors: ['#FF9EBF', '#FFF', '#2A2040'],
  },
  {
    id: 'plant',
    name: 'Plant',
    nameUk: 'Рослина',
    buff: '+5% consistency',
    buffPercent: 5,
    colors: ['#6EE7B7', '#8B6B4A'],
  },
  {
    id: 'guitar',
    name: 'Guitar',
    nameUk: 'Гітара',
    buff: '+5% relaxation',
    buffPercent: 5,
    colors: ['#9D7AFF', '#FFD166'],
  },
  {
    id: 'robot',
    name: 'Robot',
    nameUk: 'Робот',
    buff: '+5% tech skills',
    buffPercent: 5,
    colors: ['#818CF8', '#4ECDC4'],
  },
  {
    id: 'bird',
    name: 'Bird',
    nameUk: 'Пташка',
    buff: '+5% exploration',
    buffPercent: 5,
    colors: ['#FBBF24', '#FF6B8A'],
  },
];

// ─── XP / Level Curve ────────────────────────────────────────────

/** Logarithmic XP curve: XP needed for level N */
export function xpForLevel(level: number): number {
  if (level <= 1) return 0;
  // Logarithmic: moderate early, stable mid, rewarding late
  return Math.floor(100 * Math.pow(level, 1.5));
}

/** Calculate level from total XP */
export function levelFromXp(totalXp: number): number {
  let level = 1;
  while (xpForLevel(level + 1) <= totalXp) {
    level++;
  }
  return level;
}

/** Get level progress (0-1) */
export function levelProgress(totalXp: number): number {
  const level = levelFromXp(totalXp);
  const currentLevelXp = xpForLevel(level);
  const nextLevelXp = xpForLevel(level + 1);
  if (nextLevelXp === currentLevelXp) return 1;
  return (totalXp - currentLevelXp) / (nextLevelXp - currentLevelXp);
}
