'use client';

import React, { useMemo, useState } from 'react';
import { t } from '../../(onboarding)/_components/tokens';
import {
  getBodyIds,
  CHARACTER_META,
  BODY_TEMPLATES_V2,
  DEFAULT_PALETTES_V2,
  BODY_TEMPLATES_V1,
  DEFAULT_PALETTES_V1,
  assembleCharacter,
  applyEvolutionVisuals,
  generateEquipmentSprite,
  parseArt,
  SKIN_TONES,
  HAIR_COLORS,
  OUTFIT_COLORS,
  createPaletteV2,
  createPaletteV1,
  type BodyId,
  type EvolutionTier,
  type EquipmentSlot,
  type Rarity,
} from '@plan2skill/pixelforge';
import {
  CanvasPixelRenderer,
  AnimatedCanvasRenderer,
} from '../../(onboarding)/_components/CanvasPixelRenderer';

// ═══════════════════════════════════════════
// CHARACTER SHOWCASE — Test page for all 8 heroes + NPCs
// Uses @plan2skill/pixelforge v2 (32×48) art
// ═══════════════════════════════════════════

const EVOLUTION_TIERS: EvolutionTier[] = ['novice', 'apprentice', 'practitioner', 'master'];

const TIER_COLORS: Record<EvolutionTier, string> = {
  novice: t.textMuted,
  apprentice: t.mint,
  practitioner: t.violet,
  master: t.gold,
};

// ── 8 diverse hero configurations ──
// Equal gender split: 4 fem, 3 masc, 1 non-binary
// Full skin diversity: each body uses a distinct skin tone
// Varied archetypes (class-like): warrior, mage, ranger, healer, rogue, scholar, bard, paladin
// Varied equipment loadouts

interface HeroConfig {
  bodyId: BodyId;
  skinToneIdx: number;
  hairColorIdx: number;
  outfitColorIdx: number;
  archetype: string;
  classLabel: string;
  equipment: { slot: EquipmentSlot; rarity: Rarity }[];
}

const HEROES: HeroConfig[] = [
  // Fem characters
  { bodyId: 'aria', skinToneIdx: 0, hairColorIdx: 0, outfitColorIdx: 6, archetype: 'Healer', classLabel: 'Mage', equipment: [{ slot: 'weapon', rarity: 'rare' }, { slot: 'ring', rarity: 'epic' }] },
  { bodyId: 'mei', skinToneIdx: 2, hairColorIdx: 6, outfitColorIdx: 2, archetype: 'Scholar', classLabel: 'Mage', equipment: [{ slot: 'weapon', rarity: 'epic' }, { slot: 'helmet', rarity: 'uncommon' }] },
  { bodyId: 'zara', skinToneIdx: 6, hairColorIdx: 2, outfitColorIdx: 4, archetype: 'Warrior', classLabel: 'Warrior', equipment: [{ slot: 'weapon', rarity: 'legendary' }, { slot: 'shield', rarity: 'rare' }, { slot: 'armor', rarity: 'epic' }] },
  { bodyId: 'priya', skinToneIdx: 5, hairColorIdx: 1, outfitColorIdx: 6, archetype: 'Bard', classLabel: 'Mage', equipment: [{ slot: 'companion', rarity: 'rare' }] },
  // Masc characters
  { bodyId: 'kofi', skinToneIdx: 7, hairColorIdx: 2, outfitColorIdx: 1, archetype: 'Paladin', classLabel: 'Warrior', equipment: [{ slot: 'weapon', rarity: 'epic' }, { slot: 'shield', rarity: 'legendary' }, { slot: 'armor', rarity: 'rare' }] },
  { bodyId: 'diego', skinToneIdx: 4, hairColorIdx: 1, outfitColorIdx: 3, archetype: 'Ranger', classLabel: 'Warrior', equipment: [{ slot: 'weapon', rarity: 'rare' }, { slot: 'boots', rarity: 'uncommon' }] },
  { bodyId: 'liam', skinToneIdx: 1, hairColorIdx: 3, outfitColorIdx: 7, archetype: 'Rogue', classLabel: 'Warrior', equipment: [{ slot: 'weapon', rarity: 'uncommon' }, { slot: 'boots', rarity: 'rare' }] },
  // Non-binary
  { bodyId: 'alex', skinToneIdx: 3, hairColorIdx: 4, outfitColorIdx: 5, archetype: 'Mage', classLabel: 'Mage', equipment: [{ slot: 'weapon', rarity: 'legendary' }, { slot: 'companion', rarity: 'epic' }] },
];

// ── NPC configurations ──
interface NpcConfig {
  id: string;
  name: string;
  role: string;
  skinToneIdx: number;
  hairColorIdx: number;
  outfitColorIdx: number;
  bodyId: BodyId;
}

const NPCS: NpcConfig[] = [
  { id: 'sage', name: 'Professor Sage', role: 'Quest Giver', bodyId: 'aria', skinToneIdx: 2, hairColorIdx: 7, outfitColorIdx: 0 },
  { id: 'merchant', name: 'Merchant Rin', role: 'Shop Keeper', bodyId: 'mei', skinToneIdx: 3, hairColorIdx: 5, outfitColorIdx: 6 },
  { id: 'guardian', name: 'Guardian Tau', role: 'Tutorial Guide', bodyId: 'kofi', skinToneIdx: 7, hairColorIdx: 2, outfitColorIdx: 1 },
  { id: 'oracle', name: 'Oracle Vex', role: 'Assessment NPC', bodyId: 'alex', skinToneIdx: 1, hairColorIdx: 4, outfitColorIdx: 7 },
];

// ── Hero Card ──

function HeroCard({ config, tier }: { config: HeroConfig; tier: EvolutionTier }) {
  const meta = CHARACTER_META[config.bodyId];
  const skin = SKIN_TONES[config.skinToneIdx]!;
  const hair = HAIR_COLORS[config.hairColorIdx]!;
  const outfit = OUTFIT_COLORS[config.outfitColorIdx]!;

  const character = useMemo(() => {
    const art = BODY_TEMPLATES_V2[config.bodyId];
    if (!art) return null;
    return assembleCharacter(
      { bodyId: config.bodyId, skinTone: skin, hairColor: hair, outfitColor: outfit, evolutionTier: tier },
      art,
    );
  }, [config.bodyId, skin, hair, outfit, tier]);

  if (!character) return null;

  return (
    <div style={{
      background: t.bgCard,
      borderRadius: 12,
      border: `1px solid ${t.border}`,
      padding: 16,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 10,
      minWidth: 160,
      transition: 'border-color 0.2s ease',
    }}>
      {/* Character render */}
      <div style={{
        background: `${t.bg}`,
        borderRadius: 8,
        padding: 8,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <AnimatedCanvasRenderer
          character={{ id: config.bodyId, artString: character.artString, palette: character.palette }}
          size={4}
          glowColor={tier === 'master' ? t.gold : tier === 'practitioner' ? t.violet : undefined}
          ariaLabel={`${meta.name} — ${config.archetype}`}
        />
      </div>

      {/* Name + archetype */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: t.display, fontSize: 14, fontWeight: 700, color: t.text }}>
          {meta.name}
        </div>
        <div style={{ fontFamily: t.mono, fontSize: 10, color: meta.color, fontWeight: 600 }}>
          {config.archetype}
        </div>
      </div>

      {/* Meta info */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3, width: '100%' }}>
        <MetaRow label="Body" value={meta.bodyType} />
        <MetaRow label="Skin" value={skin.id} />
        <MetaRow label="Hair" value={hair.id} colorSwatch={hair.H} />
        <MetaRow label="Outfit" value={outfit.id} colorSwatch={outfit.T} />
        <MetaRow label="Class" value={config.classLabel} />
      </div>

      {/* Tier badge */}
      <div style={{
        fontFamily: t.mono,
        fontSize: 9,
        fontWeight: 700,
        padding: '3px 10px',
        borderRadius: 6,
        color: TIER_COLORS[tier],
        background: `${TIER_COLORS[tier]}15`,
        border: `1px solid ${TIER_COLORS[tier]}30`,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
      }}>
        {tier}
      </div>

      {/* Equipment tags */}
      {config.equipment.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, justifyContent: 'center' }}>
          {config.equipment.map((eq, i) => (
            <span key={i} style={{
              fontFamily: t.mono,
              fontSize: 8,
              padding: '2px 6px',
              borderRadius: 4,
              color: t.textMuted,
              background: `${t.border}`,
            }}>
              {eq.slot} ({eq.rarity})
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function MetaRow({ label, value, colorSwatch }: { label: string; value: string; colorSwatch?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontFamily: t.body, fontSize: 10, color: t.textMuted }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {colorSwatch && (
          <div style={{ width: 8, height: 8, borderRadius: 2, background: colorSwatch }} />
        )}
        <span style={{ fontFamily: t.mono, fontSize: 10, color: t.textSecondary }}>{value}</span>
      </div>
    </div>
  );
}

// ── NPC Card ──

function NpcCard({ config }: { config: NpcConfig }) {
  const skin = SKIN_TONES[config.skinToneIdx]!;
  const hair = HAIR_COLORS[config.hairColorIdx]!;
  const outfit = OUTFIT_COLORS[config.outfitColorIdx]!;

  const pixelData = useMemo(() => {
    const art = BODY_TEMPLATES_V2[config.bodyId];
    if (!art) return null;
    const palette = createPaletteV2(skin, hair, outfit);
    return parseArt(art, palette);
  }, [config.bodyId, skin, hair, outfit]);

  if (!pixelData) return null;

  return (
    <div style={{
      background: t.bgCard,
      borderRadius: 12,
      border: `1px solid ${t.border}`,
      padding: 16,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 10,
      minWidth: 140,
    }}>
      <div style={{
        background: t.bg,
        borderRadius: 8,
        padding: 8,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <CanvasPixelRenderer data={pixelData} size={3} ariaLabel={config.name} />
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: t.display, fontSize: 13, fontWeight: 700, color: t.text }}>
          {config.name}
        </div>
        <div style={{ fontFamily: t.mono, fontSize: 10, color: t.cyan, fontWeight: 600 }}>
          {config.role}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3, width: '100%' }}>
        <MetaRow label="Base" value={config.bodyId} />
        <MetaRow label="Skin" value={skin.id} />
        <MetaRow label="Hair" value={hair.id} colorSwatch={hair.H} />
        <MetaRow label="Outfit" value={outfit.id} colorSwatch={outfit.T} />
      </div>
    </div>
  );
}

// ── Evolution Showcase ──

function EvolutionShowcase({ bodyId }: { bodyId: BodyId }) {
  const meta = CHARACTER_META[bodyId];
  const art = BODY_TEMPLATES_V2[bodyId];

  const tiers = useMemo(() => {
    if (!art) return [];
    const skin = SKIN_TONES[0]!;
    const hair = HAIR_COLORS[0]!;
    const outfit = OUTFIT_COLORS[0]!;
    const palette = createPaletteV2(skin, hair, outfit);

    return EVOLUTION_TIERS.map(tier => {
      const evolved = applyEvolutionVisuals(art, palette, tier);
      return { tier, data: parseArt(evolved.artString, evolved.palette) };
    });
  }, [art]);

  return (
    <div style={{
      background: t.bgCard,
      borderRadius: 12,
      border: `1px solid ${t.border}`,
      padding: 16,
    }}>
      <div style={{
        fontFamily: t.display, fontSize: 13, fontWeight: 700, color: t.text, marginBottom: 12,
        textAlign: 'center',
      }}>
        {meta.name} — Evolution
      </div>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', alignItems: 'flex-end' }}>
        {tiers.map(({ tier, data }) => (
          <div key={tier} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <CanvasPixelRenderer data={data} size={3} ariaLabel={`${meta.name} ${tier}`} />
            <span style={{
              fontFamily: t.mono,
              fontSize: 8,
              fontWeight: 700,
              color: TIER_COLORS[tier],
              textTransform: 'uppercase',
            }}>
              {tier}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── v1 vs v2 Comparison ──

function VersionComparison({ bodyId }: { bodyId: BodyId }) {
  const meta = CHARACTER_META[bodyId];
  const v1Art = BODY_TEMPLATES_V1[bodyId];
  const v2Art = BODY_TEMPLATES_V2[bodyId];
  const v1Palette = DEFAULT_PALETTES_V1[bodyId];
  const v2Palette = DEFAULT_PALETTES_V2[bodyId];

  const v1Data = useMemo(() => v1Art && v1Palette ? parseArt(v1Art, v1Palette) : null, [v1Art, v1Palette]);
  const v2Data = useMemo(() => v2Art && v2Palette ? parseArt(v2Art, v2Palette) : null, [v2Art, v2Palette]);

  return (
    <div style={{
      display: 'flex', gap: 16, alignItems: 'flex-end',
      background: t.bgCard, borderRadius: 12, border: `1px solid ${t.border}`, padding: 16,
    }}>
      {v1Data && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <CanvasPixelRenderer data={v1Data} size={5} ariaLabel={`${meta.name} v1`} />
          <span style={{ fontFamily: t.mono, fontSize: 9, color: t.textMuted }}>v1 (12x16)</span>
        </div>
      )}
      {v2Data && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <CanvasPixelRenderer data={v2Data} size={3} ariaLabel={`${meta.name} v2`} />
          <span style={{ fontFamily: t.mono, fontSize: 9, color: t.textMuted }}>v2 (32x48)</span>
        </div>
      )}
      <span style={{ fontFamily: t.display, fontSize: 12, fontWeight: 600, color: t.textSecondary }}>
        {meta.name}
      </span>
    </div>
  );
}

// ── Main Page ──

export default function AdminCharactersPage() {
  const [selectedTier, setSelectedTier] = useState<EvolutionTier>('novice');
  const bodyIds = getBodyIds();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      {/* Header */}
      <div>
        <h1 style={{ fontFamily: t.display, fontSize: 24, fontWeight: 800, color: t.text, margin: 0 }}>
          Character Gallery
        </h1>
        <p style={{ fontFamily: t.body, fontSize: 13, color: t.textSecondary, margin: '6px 0 0' }}>
          All 8 playable heroes + NPC variants from @plan2skill/pixelforge
        </p>
      </div>

      {/* ─── Section 1: All 8 Heroes ─── */}
      <section>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 style={{ fontFamily: t.display, fontSize: 18, fontWeight: 700, color: t.text, margin: 0 }}>
            Playable Heroes
          </h2>
          {/* Tier selector */}
          <div style={{ display: 'flex', gap: 4 }}>
            {EVOLUTION_TIERS.map(tier => (
              <button
                key={tier}
                onClick={() => setSelectedTier(tier)}
                style={{
                  fontFamily: t.mono,
                  fontSize: 10,
                  fontWeight: 700,
                  padding: '5px 12px',
                  borderRadius: 6,
                  border: `1px solid ${selectedTier === tier ? TIER_COLORS[tier] : t.border}`,
                  background: selectedTier === tier ? `${TIER_COLORS[tier]}18` : 'transparent',
                  color: selectedTier === tier ? TIER_COLORS[tier] : t.textMuted,
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  transition: 'all 0.15s ease',
                }}
              >
                {tier}
              </button>
            ))}
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
          gap: 12,
        }}>
          {HEROES.map(hero => (
            <HeroCard key={hero.bodyId} config={hero} tier={selectedTier} />
          ))}
        </div>

        {/* Diversity summary */}
        <div style={{
          marginTop: 12, padding: '10px 16px', borderRadius: 8,
          background: `${t.cyan}08`, border: `1px solid ${t.cyan}20`,
          display: 'flex', gap: 24, flexWrap: 'wrap',
        }}>
          <StatChip label="Total" value="8" />
          <StatChip label="Fem" value="4" />
          <StatChip label="Masc" value="3" />
          <StatChip label="Non-binary" value="1" />
          <StatChip label="Warrior class" value="4" />
          <StatChip label="Mage class" value="4" />
          <StatChip label="Skin tones" value="8 distinct" />
        </div>
      </section>

      {/* ─── Section 2: NPCs ─── */}
      <section>
        <h2 style={{ fontFamily: t.display, fontSize: 18, fontWeight: 700, color: t.text, margin: '0 0 16px' }}>
          NPCs
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
          gap: 12,
        }}>
          {NPCS.map(npc => (
            <NpcCard key={npc.id} config={npc} />
          ))}
        </div>
      </section>

      {/* ─── Section 3: Evolution Tiers ─── */}
      <section>
        <h2 style={{ fontFamily: t.display, fontSize: 18, fontWeight: 700, color: t.text, margin: '0 0 16px' }}>
          Evolution Tiers (Novice → Master)
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: 12,
        }}>
          {bodyIds.slice(0, 4).map(id => (
            <EvolutionShowcase key={id} bodyId={id} />
          ))}
        </div>
      </section>

      {/* ─── Section 4: v1 vs v2 Comparison ─── */}
      <section>
        <h2 style={{ fontFamily: t.display, fontSize: 18, fontWeight: 700, color: t.text, margin: '0 0 16px' }}>
          Art Version Comparison (v1 12x16 vs v2 32x48)
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: 12,
        }}>
          {bodyIds.map(id => (
            <VersionComparison key={id} bodyId={id} />
          ))}
        </div>
      </section>
    </div>
  );
}

function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ fontFamily: t.body, fontSize: 11, color: t.textMuted }}>{label}:</span>
      <span style={{ fontFamily: t.mono, fontSize: 11, fontWeight: 700, color: t.cyan }}>{value}</span>
    </div>
  );
}
