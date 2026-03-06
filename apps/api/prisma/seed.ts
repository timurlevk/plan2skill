import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ═══════════════════════════════════════════════════════════════
// Equipment Catalog Seed — Phase 5F (attribute keys: Phase 5H D&D rename)
// ~50 items across 7 slots × 5 rarities
// Naming: {slot}_{rarity}_{type}_{nn}
// Attribute bonus range: common +2-3, uncommon +4-5, rare +6-7, epic +8-9, legendary +10-12
// Keys: STR (Strength), INT (Intelligence), CHA (Charisma), CON (Constitution), DEX (Dexterity), WIS (Wisdom)
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
  // ─── WEAPON (Hard Skills → primary STR) ──────────────────────

  { itemId: 'weapon_common_blade_01',     slot: 'weapon', rarity: 'common',    name: 'Novice Blade',         description: 'A simple blade for aspiring heroes. Every journey begins with a first strike.',                       attributeBonus: { STR: 2 } },
  { itemId: 'weapon_common_staff_01',     slot: 'weapon', rarity: 'common',    name: 'Training Staff',       description: 'A wooden staff for practicing fundamentals. Light but reliable.',                                     attributeBonus: { STR: 2, INT: 1 } },
  { itemId: 'weapon_uncommon_katana_01',  slot: 'weapon', rarity: 'uncommon',  name: 'Focused Katana',       description: 'Precision-forged steel. Cuts through complexity with a single stroke.',                               attributeBonus: { STR: 4, INT: 2 } },
  { itemId: 'weapon_uncommon_hammer_01',  slot: 'weapon', rarity: 'uncommon',  name: 'Builder\'s Hammer',    description: 'Shaped by the Builder archetype. Turns raw materials into something remarkable.',                     attributeBonus: { STR: 3, CON: 3 } },
  { itemId: 'weapon_rare_rapier_01',      slot: 'weapon', rarity: 'rare',      name: 'Insight Rapier',       description: 'A swift blade that reveals weak points in any problem. Favored by strategists.',                      attributeBonus: { STR: 6, INT: 3 } },
  { itemId: 'weapon_epic_greatsword_01',  slot: 'weapon', rarity: 'epic',      name: 'Mastery Greatsword',   description: 'Forged in the fires of deep practice. Each swing carries the weight of 10,000 hours.',                attributeBonus: { STR: 8, INT: 3, CON: 2 } },
  { itemId: 'weapon_legendary_excalibur_01', slot: 'weapon', rarity: 'legendary', name: 'Excalibur of Skill', description: 'The legendary blade that chose you. Only the truly dedicated can wield its power.',                  attributeBonus: { STR: 12, INT: 4, CON: 3 } },

  // ─── SHIELD (Communication → primary CHA) ────────────────────

  { itemId: 'shield_common_buckler_01',    slot: 'shield', rarity: 'common',    name: 'Listener\'s Buckler',   description: 'A small shield that reminds you: defense starts with understanding.',                                attributeBonus: { CHA: 2 } },
  { itemId: 'shield_common_targe_01',      slot: 'shield', rarity: 'common',    name: 'Empathy Targe',         description: 'Lightweight protection. Absorbs harsh words and reflects kindness.',                                 attributeBonus: { CHA: 2, CON: 1 } },
  { itemId: 'shield_uncommon_kite_01',     slot: 'shield', rarity: 'uncommon',  name: 'Diplomat\'s Kite',      description: 'A broader shield for broader conversations. Builds bridges while holding ground.',                   attributeBonus: { CHA: 4, DEX: 2 } },
  { itemId: 'shield_rare_tower_01',        slot: 'shield', rarity: 'rare',      name: 'Orator\'s Bastion',     description: 'Full-body protection from criticism. Your words become your greatest armor.',                        attributeBonus: { CHA: 6, CON: 3 } },
  { itemId: 'shield_epic_aegis_01',        slot: 'shield', rarity: 'epic',      name: 'Aegis of Influence',    description: 'Mythical protection that inspires allies. Your presence alone shifts the room.',                     attributeBonus: { CHA: 8, DEX: 3, CON: 2 } },
  { itemId: 'shield_legendary_mirror_01',  slot: 'shield', rarity: 'legendary', name: 'Mirror of Resonance',   description: 'Reflects the truth others need to hear. Those who see themselves in it are forever changed.',         attributeBonus: { CHA: 11, DEX: 4, INT: 3 } },

  // ─── ARMOR (Personal Brand → primary CON) ────────────────────

  { itemId: 'armor_common_leather_01',     slot: 'armor', rarity: 'common',    name: 'Starter Vest',          description: 'Simple leather protection. The first layer of your professional identity.',                           attributeBonus: { CON: 2 } },
  { itemId: 'armor_common_cloth_01',       slot: 'armor', rarity: 'common',    name: 'Scholar\'s Robe',       description: 'Light fabric that marks you as a learner. Worn with pride.',                                         attributeBonus: { CON: 2, INT: 1 } },
  { itemId: 'armor_uncommon_chain_01',     slot: 'armor', rarity: 'uncommon',  name: 'Chain of Consistency',  description: 'Each link represents a day of effort. Grows stronger with every streak.',                            attributeBonus: { CON: 4, STR: 2 } },
  { itemId: 'armor_uncommon_scale_01',     slot: 'armor', rarity: 'uncommon',  name: 'Reputation Scale',      description: 'Dragon-like scales that harden with each accomplishment. Your brand, made physical.',                 attributeBonus: { CON: 3, CHA: 3 } },
  { itemId: 'armor_rare_plate_01',         slot: 'armor', rarity: 'rare',      name: 'Plate of Credibility',  description: 'Full plate forged from achievements. Each dent tells a story of growth.',                             attributeBonus: { CON: 6, CHA: 3 } },
  { itemId: 'armor_epic_dragon_01',        slot: 'armor', rarity: 'epic',      name: 'Dragonhide Mantle',     description: 'Crafted from challenges conquered. Impervious to doubt and imposter syndrome.',                      attributeBonus: { CON: 9, STR: 2, CHA: 2 } },
  { itemId: 'armor_legendary_phoenix_01',  slot: 'armor', rarity: 'legendary', name: 'Phoenix Vestment',      description: 'Burns away failure and rebuilds you stronger. The ultimate expression of resilience.',                attributeBonus: { CON: 12, STR: 3, CHA: 3 } },

  // ─── HELMET (Strategy → primary INT) ─────────────────────────

  { itemId: 'helmet_common_cap_01',        slot: 'helmet', rarity: 'common',    name: 'Thinker\'s Cap',       description: 'A simple cap that helps you focus. Blocks out distractions.',                                        attributeBonus: { INT: 2 } },
  { itemId: 'helmet_common_headband_01',   slot: 'helmet', rarity: 'common',    name: 'Focus Headband',       description: 'Keeps hair and thoughts in place. Essential for clear thinking.',                                     attributeBonus: { INT: 2, STR: 1 } },
  { itemId: 'helmet_uncommon_circlet_01',  slot: 'helmet', rarity: 'uncommon',  name: 'Analyst\'s Circlet',   description: 'A silver band that sharpens pattern recognition. Data speaks louder.',                               attributeBonus: { INT: 5, DEX: 1 } },
  { itemId: 'helmet_rare_helm_01',         slot: 'helmet', rarity: 'rare',      name: 'Strategist\'s Helm',   description: 'Full helm with tactical HUD overlay. See three moves ahead.',                                        attributeBonus: { INT: 7, STR: 2 } },
  { itemId: 'helmet_epic_crown_01',        slot: 'helmet', rarity: 'epic',      name: 'Crown of Foresight',   description: 'See the consequences of every decision before you make it.',                                         attributeBonus: { INT: 9, DEX: 2, WIS: 2 } },
  { itemId: 'helmet_legendary_oracle_01',  slot: 'helmet', rarity: 'legendary', name: 'Oracle\'s Diadem',     description: 'Channel the wisdom of those who came before. Past, present, and future converge.',                    attributeBonus: { INT: 11, DEX: 4, WIS: 3 } },

  // ─── BOOTS (Adaptability → primary DEX) ──────────────────────

  { itemId: 'boots_common_sandals_01',     slot: 'boots', rarity: 'common',    name: 'Wanderer\'s Sandals',   description: 'Simple sandals for the curious. Light enough to explore any path.',                                   attributeBonus: { DEX: 2 } },
  { itemId: 'boots_common_shoes_01',       slot: 'boots', rarity: 'common',    name: 'Steady Shoes',          description: 'Reliable footwear for daily quests. One step at a time.',                                             attributeBonus: { DEX: 2, CON: 1 } },
  { itemId: 'boots_uncommon_runners_01',   slot: 'boots', rarity: 'uncommon',  name: 'Sprint Runners',        description: 'Built for pivoting fast. When plans change, you\'re already moving.',                                 attributeBonus: { DEX: 4, WIS: 2 } },
  { itemId: 'boots_rare_striders_01',      slot: 'boots', rarity: 'rare',      name: 'Pathfinder Striders',   description: 'Navigate any terrain, literal or figurative. No obstacle slows you down.',                            attributeBonus: { DEX: 6, WIS: 3 } },
  { itemId: 'boots_epic_wings_01',         slot: 'boots', rarity: 'epic',      name: 'Winged Greaves',        description: 'Defy gravity and convention. Move between disciplines like the wind.',                                attributeBonus: { DEX: 8, WIS: 3, INT: 2 } },
  { itemId: 'boots_legendary_mercury_01',  slot: 'boots', rarity: 'legendary', name: 'Mercury\'s Talaria',    description: 'The mythical winged sandals. Cross any boundary, master any domain.',                                 attributeBonus: { DEX: 11, WIS: 4, STR: 3 } },

  // ─── RING (Expertise → primary STR/WIS) ──────────────────────

  { itemId: 'ring_common_copper_01',       slot: 'ring', rarity: 'common',    name: 'Copper Band',            description: 'A humble ring marking your commitment to growth.',                                                   attributeBonus: { WIS: 2 } },
  { itemId: 'ring_common_iron_01',         slot: 'ring', rarity: 'common',    name: 'Iron Focus Ring',        description: 'Cold iron for cold focus. Keeps you grounded in practice.',                                           attributeBonus: { STR: 2, WIS: 1 } },
  { itemId: 'ring_uncommon_silver_01',     slot: 'ring', rarity: 'uncommon',  name: 'Silver Scholar Ring',    description: 'Awarded to those who seek knowledge beyond the surface.',                                             attributeBonus: { WIS: 4, INT: 2 } },
  { itemId: 'ring_rare_sapphire_01',       slot: 'ring', rarity: 'rare',      name: 'Sapphire of Depth',     description: 'Deep blue clarity. Reveals hidden connections between disparate fields.',                              attributeBonus: { WIS: 5, STR: 4 } },
  { itemId: 'ring_epic_diamond_01',        slot: 'ring', rarity: 'epic',      name: 'Diamond of Brilliance', description: 'Unbreakable and radiant. Your expertise becomes undeniable.',                                          attributeBonus: { WIS: 7, STR: 4, INT: 2 } },
  { itemId: 'ring_legendary_infinity_01',  slot: 'ring', rarity: 'legendary', name: 'Infinity Band',         description: 'No beginning, no end — only the endless pursuit of mastery. The ring of true experts.',                attributeBonus: { WIS: 10, STR: 5, INT: 3 } },

  // ─── COMPANION (Hobbies → primary WIS/DEX) ───────────────────

  { itemId: 'companion_common_cat_01',        slot: 'companion', rarity: 'common',    name: 'Curious Cat',          description: 'A small feline companion. Nudges you toward unexplored corners.',                                attributeBonus: { WIS: 3 } },
  { itemId: 'companion_common_owl_01',        slot: 'companion', rarity: 'common',    name: 'Study Owl',            description: 'A wise owl that hoots encouragement during late-night study sessions.',                           attributeBonus: { INT: 2, WIS: 1 } },
  { itemId: 'companion_uncommon_fox_01',      slot: 'companion', rarity: 'uncommon',  name: 'Clever Fox',           description: 'Cunning and adaptable. Always finds the most efficient path through a problem.',                  attributeBonus: { DEX: 3, WIS: 3 } },
  { itemId: 'companion_uncommon_parrot_01',   slot: 'companion', rarity: 'uncommon',  name: 'Echo Parrot',          description: 'Repeats key concepts at optimal intervals. Your personal spaced-repetition buddy.',               attributeBonus: { INT: 3, STR: 3 } },
  { itemId: 'companion_rare_wolf_01',         slot: 'companion', rarity: 'rare',      name: 'Loyal Wolf',           description: 'A pack leader who teaches the value of teamwork and persistence.',                                attributeBonus: { CON: 4, CHA: 3, WIS: 2 } },
  { itemId: 'companion_epic_dragon_01',       slot: 'companion', rarity: 'epic',      name: 'Ember Drake',          description: 'A young dragon with ancient wisdom. Breathes fire into your ambitions.',                           attributeBonus: { STR: 4, WIS: 4, CON: 3 } },
  { itemId: 'companion_legendary_phoenix_01', slot: 'companion', rarity: 'legendary', name: 'Phoenix Familiar',     description: 'Rises from every setback. Teaches you that failure is just fuel for the next ascension.',           attributeBonus: { WIS: 6, CON: 5, DEX: 4, STR: 3 } },
];

// ═══════════════════════════════════════════════════════════════
// Skill Domain → Attribute Mapping (Phase 5H, SCD Type 2)
// ═══════════════════════════════════════════════════════════════

const SKILL_DOMAIN_ATTRIBUTES = [
  { skillDomain: 'Hard Skills',     displayName: 'Hard Skills',     primaryAttr: 'STR', secondaryAttr: 'INT', primaryGrowth: 2, secondaryGrowth: 1, icon: '⚔', color: '#9D7AFF' },
  { skillDomain: 'Communication',   displayName: 'Communication',   primaryAttr: 'CHA', secondaryAttr: 'CON', primaryGrowth: 2, secondaryGrowth: 1, icon: '◉', color: '#FF6B8A' },
  { skillDomain: 'Personal Brand',  displayName: 'Personal Brand',  primaryAttr: 'CHA', secondaryAttr: 'WIS', primaryGrowth: 2, secondaryGrowth: 1, icon: '◉', color: '#FF6B8A' },
  { skillDomain: 'Strategy',        displayName: 'Strategy',        primaryAttr: 'INT', secondaryAttr: 'STR', primaryGrowth: 2, secondaryGrowth: 1, icon: '◈', color: '#3B82F6' },
  { skillDomain: 'Adaptability',    displayName: 'Adaptability',    primaryAttr: 'DEX', secondaryAttr: 'CON', primaryGrowth: 2, secondaryGrowth: 1, icon: '✦', color: '#4ECDC4' },
  { skillDomain: 'Expertise',       displayName: 'Expertise',       primaryAttr: 'STR', secondaryAttr: 'WIS', primaryGrowth: 2, secondaryGrowth: 1, icon: '⚔', color: '#9D7AFF' },
  { skillDomain: 'Hobbies',         displayName: 'Hobbies',         primaryAttr: 'WIS', secondaryAttr: 'DEX', primaryGrowth: 2, secondaryGrowth: 1, icon: '★', color: '#FFD166' },
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

  // ─── Skill Domain → Attribute Mapping (Phase 5H) ───
  console.log('Seeding skill domain → attribute mappings...');

  for (const mapping of SKILL_DOMAIN_ATTRIBUTES) {
    await prisma.skillDomainAttribute.upsert({
      where: {
        skillDomain_validFrom: {
          skillDomain: mapping.skillDomain,
          validFrom: new Date('2026-01-01T00:00:00Z'),
        },
      },
      update: {
        displayName: mapping.displayName,
        primaryAttr: mapping.primaryAttr,
        secondaryAttr: mapping.secondaryAttr,
        primaryGrowth: mapping.primaryGrowth,
        secondaryGrowth: mapping.secondaryGrowth,
        icon: mapping.icon,
        color: mapping.color,
      },
      create: {
        skillDomain: mapping.skillDomain,
        displayName: mapping.displayName,
        primaryAttr: mapping.primaryAttr,
        secondaryAttr: mapping.secondaryAttr,
        primaryGrowth: mapping.primaryGrowth,
        secondaryGrowth: mapping.secondaryGrowth,
        icon: mapping.icon,
        color: mapping.color,
        validFrom: new Date('2026-01-01T00:00:00Z'),
        validTo: null,
      },
    });
  }

  console.log(`Seeded ${SKILL_DOMAIN_ATTRIBUTES.length} skill domain mappings.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
