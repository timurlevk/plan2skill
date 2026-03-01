import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ═══════════════════════════════════════════════════════════════
// Equipment Catalog Seed — Phase 5F
// ~50 items across 7 slots × 5 rarities
// Naming: {slot}_{rarity}_{type}_{nn}
// Attribute bonus range: common +2-3, uncommon +4-5, rare +6-7, epic +8-9, legendary +10-12
// ═══════════════════════════════════════════════════════════════

interface CatalogItem {
  itemId: string;
  slot: string;
  rarity: string;
  name: string;
  description: string;
  attributeBonus: Record<string, number>;
}

const CATALOG: CatalogItem[] = [
  // ─── WEAPON (Hard Skills → primary MAS) ──────────────────────

  { itemId: 'weapon_common_blade_01',     slot: 'weapon', rarity: 'common',    name: 'Novice Blade',         description: 'A simple blade for aspiring heroes. Every journey begins with a first strike.',                       attributeBonus: { MAS: 2 } },
  { itemId: 'weapon_common_staff_01',     slot: 'weapon', rarity: 'common',    name: 'Training Staff',       description: 'A wooden staff for practicing fundamentals. Light but reliable.',                                     attributeBonus: { MAS: 2, INS: 1 } },
  { itemId: 'weapon_uncommon_katana_01',  slot: 'weapon', rarity: 'uncommon',  name: 'Focused Katana',       description: 'Precision-forged steel. Cuts through complexity with a single stroke.',                               attributeBonus: { MAS: 4, INS: 2 } },
  { itemId: 'weapon_uncommon_hammer_01',  slot: 'weapon', rarity: 'uncommon',  name: 'Builder\'s Hammer',    description: 'Shaped by the Builder archetype. Turns raw materials into something remarkable.',                     attributeBonus: { MAS: 3, RES: 3 } },
  { itemId: 'weapon_rare_rapier_01',      slot: 'weapon', rarity: 'rare',      name: 'Insight Rapier',       description: 'A swift blade that reveals weak points in any problem. Favored by strategists.',                      attributeBonus: { MAS: 6, INS: 3 } },
  { itemId: 'weapon_epic_greatsword_01',  slot: 'weapon', rarity: 'epic',      name: 'Mastery Greatsword',   description: 'Forged in the fires of deep practice. Each swing carries the weight of 10,000 hours.',                attributeBonus: { MAS: 8, INS: 3, RES: 2 } },
  { itemId: 'weapon_legendary_excalibur_01', slot: 'weapon', rarity: 'legendary', name: 'Excalibur of Skill', description: 'The legendary blade that chose you. Only the truly dedicated can wield its power.',                  attributeBonus: { MAS: 12, INS: 4, RES: 3 } },

  // ─── SHIELD (Communication → primary INF) ────────────────────

  { itemId: 'shield_common_buckler_01',    slot: 'shield', rarity: 'common',    name: 'Listener\'s Buckler',   description: 'A small shield that reminds you: defense starts with understanding.',                                attributeBonus: { INF: 2 } },
  { itemId: 'shield_common_targe_01',      slot: 'shield', rarity: 'common',    name: 'Empathy Targe',         description: 'Lightweight protection. Absorbs harsh words and reflects kindness.',                                 attributeBonus: { INF: 2, RES: 1 } },
  { itemId: 'shield_uncommon_kite_01',     slot: 'shield', rarity: 'uncommon',  name: 'Diplomat\'s Kite',      description: 'A broader shield for broader conversations. Builds bridges while holding ground.',                   attributeBonus: { INF: 4, VER: 2 } },
  { itemId: 'shield_rare_tower_01',        slot: 'shield', rarity: 'rare',      name: 'Orator\'s Bastion',     description: 'Full-body protection from criticism. Your words become your greatest armor.',                        attributeBonus: { INF: 6, RES: 3 } },
  { itemId: 'shield_epic_aegis_01',        slot: 'shield', rarity: 'epic',      name: 'Aegis of Influence',    description: 'Mythical protection that inspires allies. Your presence alone shifts the room.',                     attributeBonus: { INF: 8, VER: 3, RES: 2 } },
  { itemId: 'shield_legendary_mirror_01',  slot: 'shield', rarity: 'legendary', name: 'Mirror of Resonance',   description: 'Reflects the truth others need to hear. Those who see themselves in it are forever changed.',         attributeBonus: { INF: 11, VER: 4, INS: 3 } },

  // ─── ARMOR (Personal Brand → primary RES) ────────────────────

  { itemId: 'armor_common_leather_01',     slot: 'armor', rarity: 'common',    name: 'Starter Vest',          description: 'Simple leather protection. The first layer of your professional identity.',                           attributeBonus: { RES: 2 } },
  { itemId: 'armor_common_cloth_01',       slot: 'armor', rarity: 'common',    name: 'Scholar\'s Robe',       description: 'Light fabric that marks you as a learner. Worn with pride.',                                         attributeBonus: { RES: 2, INS: 1 } },
  { itemId: 'armor_uncommon_chain_01',     slot: 'armor', rarity: 'uncommon',  name: 'Chain of Consistency',  description: 'Each link represents a day of effort. Grows stronger with every streak.',                            attributeBonus: { RES: 4, MAS: 2 } },
  { itemId: 'armor_uncommon_scale_01',     slot: 'armor', rarity: 'uncommon',  name: 'Reputation Scale',      description: 'Dragon-like scales that harden with each accomplishment. Your brand, made physical.',                 attributeBonus: { RES: 3, INF: 3 } },
  { itemId: 'armor_rare_plate_01',         slot: 'armor', rarity: 'rare',      name: 'Plate of Credibility',  description: 'Full plate forged from achievements. Each dent tells a story of growth.',                             attributeBonus: { RES: 6, INF: 3 } },
  { itemId: 'armor_epic_dragon_01',        slot: 'armor', rarity: 'epic',      name: 'Dragonhide Mantle',     description: 'Crafted from challenges conquered. Impervious to doubt and imposter syndrome.',                      attributeBonus: { RES: 9, MAS: 2, INF: 2 } },
  { itemId: 'armor_legendary_phoenix_01',  slot: 'armor', rarity: 'legendary', name: 'Phoenix Vestment',      description: 'Burns away failure and rebuilds you stronger. The ultimate expression of resilience.',                attributeBonus: { RES: 12, MAS: 3, INF: 3 } },

  // ─── HELMET (Strategy → primary INS) ─────────────────────────

  { itemId: 'helmet_common_cap_01',        slot: 'helmet', rarity: 'common',    name: 'Thinker\'s Cap',       description: 'A simple cap that helps you focus. Blocks out distractions.',                                        attributeBonus: { INS: 2 } },
  { itemId: 'helmet_common_headband_01',   slot: 'helmet', rarity: 'common',    name: 'Focus Headband',       description: 'Keeps hair and thoughts in place. Essential for clear thinking.',                                     attributeBonus: { INS: 2, MAS: 1 } },
  { itemId: 'helmet_uncommon_circlet_01',  slot: 'helmet', rarity: 'uncommon',  name: 'Analyst\'s Circlet',   description: 'A silver band that sharpens pattern recognition. Data speaks louder.',                               attributeBonus: { INS: 5, VER: 1 } },
  { itemId: 'helmet_rare_helm_01',         slot: 'helmet', rarity: 'rare',      name: 'Strategist\'s Helm',   description: 'Full helm with tactical HUD overlay. See three moves ahead.',                                        attributeBonus: { INS: 7, MAS: 2 } },
  { itemId: 'helmet_epic_crown_01',        slot: 'helmet', rarity: 'epic',      name: 'Crown of Foresight',   description: 'See the consequences of every decision before you make it.',                                         attributeBonus: { INS: 9, VER: 2, DIS: 2 } },
  { itemId: 'helmet_legendary_oracle_01',  slot: 'helmet', rarity: 'legendary', name: 'Oracle\'s Diadem',     description: 'Channel the wisdom of those who came before. Past, present, and future converge.',                    attributeBonus: { INS: 11, VER: 4, DIS: 3 } },

  // ─── BOOTS (Adaptability → primary VER) ──────────────────────

  { itemId: 'boots_common_sandals_01',     slot: 'boots', rarity: 'common',    name: 'Wanderer\'s Sandals',   description: 'Simple sandals for the curious. Light enough to explore any path.',                                   attributeBonus: { VER: 2 } },
  { itemId: 'boots_common_shoes_01',       slot: 'boots', rarity: 'common',    name: 'Steady Shoes',          description: 'Reliable footwear for daily quests. One step at a time.',                                             attributeBonus: { VER: 2, RES: 1 } },
  { itemId: 'boots_uncommon_runners_01',   slot: 'boots', rarity: 'uncommon',  name: 'Sprint Runners',        description: 'Built for pivoting fast. When plans change, you\'re already moving.',                                 attributeBonus: { VER: 4, DIS: 2 } },
  { itemId: 'boots_rare_striders_01',      slot: 'boots', rarity: 'rare',      name: 'Pathfinder Striders',   description: 'Navigate any terrain, literal or figurative. No obstacle slows you down.',                            attributeBonus: { VER: 6, DIS: 3 } },
  { itemId: 'boots_epic_wings_01',         slot: 'boots', rarity: 'epic',      name: 'Winged Greaves',        description: 'Defy gravity and convention. Move between disciplines like the wind.',                                attributeBonus: { VER: 8, DIS: 3, INS: 2 } },
  { itemId: 'boots_legendary_mercury_01',  slot: 'boots', rarity: 'legendary', name: 'Mercury\'s Talaria',    description: 'The mythical winged sandals. Cross any boundary, master any domain.',                                 attributeBonus: { VER: 11, DIS: 4, MAS: 3 } },

  // ─── RING (Expertise → primary MAS/DIS) ──────────────────────

  { itemId: 'ring_common_copper_01',       slot: 'ring', rarity: 'common',    name: 'Copper Band',            description: 'A humble ring marking your commitment to growth.',                                                   attributeBonus: { DIS: 2 } },
  { itemId: 'ring_common_iron_01',         slot: 'ring', rarity: 'common',    name: 'Iron Focus Ring',        description: 'Cold iron for cold focus. Keeps you grounded in practice.',                                           attributeBonus: { MAS: 2, DIS: 1 } },
  { itemId: 'ring_uncommon_silver_01',     slot: 'ring', rarity: 'uncommon',  name: 'Silver Scholar Ring',    description: 'Awarded to those who seek knowledge beyond the surface.',                                             attributeBonus: { DIS: 4, INS: 2 } },
  { itemId: 'ring_rare_sapphire_01',       slot: 'ring', rarity: 'rare',      name: 'Sapphire of Depth',     description: 'Deep blue clarity. Reveals hidden connections between disparate fields.',                              attributeBonus: { DIS: 5, MAS: 4 } },
  { itemId: 'ring_epic_diamond_01',        slot: 'ring', rarity: 'epic',      name: 'Diamond of Brilliance', description: 'Unbreakable and radiant. Your expertise becomes undeniable.',                                          attributeBonus: { DIS: 7, MAS: 4, INS: 2 } },
  { itemId: 'ring_legendary_infinity_01',  slot: 'ring', rarity: 'legendary', name: 'Infinity Band',         description: 'No beginning, no end — only the endless pursuit of mastery. The ring of true experts.',                attributeBonus: { DIS: 10, MAS: 5, INS: 3 } },

  // ─── COMPANION (Hobbies → primary DIS/VER) ───────────────────

  { itemId: 'companion_common_cat_01',        slot: 'companion', rarity: 'common',    name: 'Curious Cat',          description: 'A small feline companion. Nudges you toward unexplored corners.',                                attributeBonus: { DIS: 3 } },
  { itemId: 'companion_common_owl_01',        slot: 'companion', rarity: 'common',    name: 'Study Owl',            description: 'A wise owl that hoots encouragement during late-night study sessions.',                           attributeBonus: { INS: 2, DIS: 1 } },
  { itemId: 'companion_uncommon_fox_01',      slot: 'companion', rarity: 'uncommon',  name: 'Clever Fox',           description: 'Cunning and adaptable. Always finds the most efficient path through a problem.',                  attributeBonus: { VER: 3, DIS: 3 } },
  { itemId: 'companion_uncommon_parrot_01',   slot: 'companion', rarity: 'uncommon',  name: 'Echo Parrot',          description: 'Repeats key concepts at optimal intervals. Your personal spaced-repetition buddy.',               attributeBonus: { INS: 3, MAS: 3 } },
  { itemId: 'companion_rare_wolf_01',         slot: 'companion', rarity: 'rare',      name: 'Loyal Wolf',           description: 'A pack leader who teaches the value of teamwork and persistence.',                                attributeBonus: { RES: 4, INF: 3, DIS: 2 } },
  { itemId: 'companion_epic_dragon_01',       slot: 'companion', rarity: 'epic',      name: 'Ember Drake',          description: 'A young dragon with ancient wisdom. Breathes fire into your ambitions.',                           attributeBonus: { MAS: 4, DIS: 4, RES: 3 } },
  { itemId: 'companion_legendary_phoenix_01', slot: 'companion', rarity: 'legendary', name: 'Phoenix Familiar',     description: 'Rises from every setback. Teaches you that failure is just fuel for the next ascension.',           attributeBonus: { DIS: 6, RES: 5, VER: 4, MAS: 3 } },
];

async function main() {
  console.log('Seeding equipment catalog...');

  for (const item of CATALOG) {
    await prisma.equipmentCatalog.upsert({
      where: { itemId: item.itemId },
      update: {
        slot: item.slot,
        rarity: item.rarity,
        name: item.name,
        description: item.description,
        attributeBonus: item.attributeBonus,
      },
      create: {
        itemId: item.itemId,
        slot: item.slot,
        rarity: item.rarity,
        name: item.name,
        description: item.description,
        attributeBonus: item.attributeBonus,
      },
    });
  }

  console.log(`Seeded ${CATALOG.length} equipment items.`);

  // ─── Stats ───
  const stats = CATALOG.reduce((acc, item) => {
    acc[item.rarity] = (acc[item.rarity] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  console.log('Distribution:', stats);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
