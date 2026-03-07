'use client';

import React, { useMemo, useState, useCallback } from 'react';
import { t, rarity as rarityTokens } from '../../(onboarding)/_components/tokens';
import {
  getBodyIds,
  CHARACTER_META,
  BODY_TEMPLATES_V2,
  assembleCharacter,
  generateEquipmentSprite,
  parseArt,
  compositeCharacterWithEquipment,
  SKIN_TONES,
  HAIR_COLORS,
  OUTFIT_COLORS,
  seedToParams,
  verifySeedDeterminism,
  type BodyId,
  type EvolutionTier,
  type EquipmentSlot,
  type Rarity,
  type EquipmentLayer,
} from '@plan2skill/pixelforge';
import {
  AnimatedCanvasRenderer,
  CanvasPixelRenderer,
} from '../../(onboarding)/_components/CanvasPixelRenderer';

// ═══════════════════════════════════════════
// CHARACTER LAB — Interactive character builder + equipment compositor
// Full test harness for @plan2skill/pixelforge pipeline
// ═══════════════════════════════════════════

const EVOLUTION_TIERS: EvolutionTier[] = ['novice', 'apprentice', 'practitioner', 'master'];
const EQUIPMENT_SLOTS: EquipmentSlot[] = ['weapon', 'shield', 'armor', 'helmet', 'boots', 'ring', 'companion'];
const RARITIES: Rarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary'];

const TIER_COLORS: Record<EvolutionTier, string> = {
  novice: t.textMuted,
  apprentice: t.mint,
  practitioner: t.violet,
  master: t.gold,
};

const RARITY_COLORS: Record<Rarity, string> = {
  common: rarityTokens.common.color,
  uncommon: rarityTokens.uncommon.color,
  rare: rarityTokens.rare.color,
  epic: rarityTokens.epic.color,
  legendary: rarityTokens.legendary.color,
};

// ─── Shared Styles ───

const cardStyle: React.CSSProperties = {
  background: t.bgCard,
  borderRadius: 12,
  border: `1px solid ${t.border}`,
  padding: 24,
};

const sectionTitle: React.CSSProperties = {
  fontFamily: t.display,
  fontSize: 16,
  fontWeight: 700,
  color: t.text,
  margin: '0 0 16px',
};

const labelStyle: React.CSSProperties = {
  fontFamily: t.mono,
  fontSize: 10,
  fontWeight: 700,
  color: t.textMuted,
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  marginBottom: 8,
};

// ─── Swatch Button ───

function SwatchButton({
  color,
  selected,
  onClick,
  label,
  size = 28,
}: {
  color: string;
  selected: boolean;
  onClick: () => void;
  label: string;
  size?: number;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      style={{
        width: size,
        height: size,
        borderRadius: 6,
        border: selected ? `2px solid ${t.text}` : `2px solid ${t.border}`,
        background: color,
        cursor: 'pointer',
        transition: 'border-color 0.15s ease',
        boxShadow: selected ? `0 0 8px ${color}60` : 'none',
        flexShrink: 0,
      }}
    />
  );
}

// ─── Pill Button ───

function PillButton({
  label,
  selected,
  onClick,
  color,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
  color?: string;
}) {
  const c = color ?? t.violet;
  return (
    <button
      onClick={onClick}
      style={{
        fontFamily: t.mono,
        fontSize: 10,
        fontWeight: 700,
        padding: '5px 12px',
        borderRadius: 6,
        border: `1px solid ${selected ? c : t.border}`,
        background: selected ? `${c}18` : 'transparent',
        color: selected ? c : t.textMuted,
        cursor: 'pointer',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        transition: 'all 0.15s ease',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </button>
  );
}

// ─── Equipment Slot Toggle ───

interface SlotState {
  enabled: boolean;
  rarity: Rarity;
}

function EquipmentSlotControl({
  slot,
  state,
  onChange,
}: {
  slot: EquipmentSlot;
  state: SlotState;
  onChange: (s: SlotState) => void;
}) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 6,
      padding: 8,
      borderRadius: 8,
      background: state.enabled ? `${t.violet}0A` : 'transparent',
      border: `1px solid ${state.enabled ? t.violet + '30' : t.border}`,
      transition: 'all 0.15s ease',
      minWidth: 80,
    }}>
      <button
        onClick={() => onChange({ ...state, enabled: !state.enabled })}
        style={{
          fontFamily: t.mono,
          fontSize: 10,
          fontWeight: 700,
          color: state.enabled ? t.violet : t.textMuted,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          textTransform: 'capitalize',
          padding: 0,
        }}
      >
        {slot}
      </button>
      {state.enabled && (
        <select
          value={state.rarity}
          onChange={e => onChange({ ...state, rarity: e.target.value as Rarity })}
          style={{
            fontFamily: t.mono,
            fontSize: 9,
            padding: '2px 4px',
            borderRadius: 4,
            border: `1px solid ${RARITY_COLORS[state.rarity]}40`,
            background: t.bgElevated,
            color: RARITY_COLORS[state.rarity],
            cursor: 'pointer',
            width: '100%',
          }}
        >
          {RARITIES.map(r => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      )}
    </div>
  );
}

// ─── Main Page ───

export default function CharacterLabPage() {
  const bodyIds = getBodyIds();

  // Character builder state
  const [bodyId, setBodyId] = useState<BodyId>('aria');
  const [skinIdx, setSkinIdx] = useState(0);
  const [hairIdx, setHairIdx] = useState(0);
  const [outfitIdx, setOutfitIdx] = useState(0);
  const [tier, setTier] = useState<EvolutionTier>('novice');

  // Equipment state
  const [slots, setSlots] = useState<Record<EquipmentSlot, SlotState>>(() => {
    const initial: Partial<Record<EquipmentSlot, SlotState>> = {};
    for (const s of EQUIPMENT_SLOTS) {
      initial[s] = { enabled: false, rarity: 'common' };
    }
    return initial as Record<EquipmentSlot, SlotState>;
  });

  // Seed state
  const [seedInput, setSeedInput] = useState('');
  const [seedResult, setSeedResult] = useState<{
    params: ReturnType<typeof seedToParams>;
    deterministic: boolean;
  } | null>(null);

  const updateSlot = useCallback((slot: EquipmentSlot, state: SlotState) => {
    setSlots(prev => ({ ...prev, [slot]: state }));
  }, []);

  // Safe index access
  const skin = SKIN_TONES[skinIdx];
  const hair = HAIR_COLORS[hairIdx];
  const outfit = OUTFIT_COLORS[outfitIdx];

  // Assemble character
  const character = useMemo(() => {
    if (!skin || !hair || !outfit) return null;
    const art = BODY_TEMPLATES_V2[bodyId];
    if (!art) return null;
    return assembleCharacter(
      { bodyId, skinTone: skin, hairColor: hair, outfitColor: outfit, evolutionTier: tier },
      art,
    );
  }, [bodyId, skinIdx, hairIdx, outfitIdx, tier, skin, hair, outfit]);

  // Build equipment layers
  const equipmentLayers = useMemo<EquipmentLayer[]>(() => {
    const layers: EquipmentLayer[] = [];
    for (const slot of EQUIPMENT_SLOTS) {
      const state = slots[slot];
      if (!state.enabled) continue;
      const sprite = generateEquipmentSprite(`${bodyId}-${slot}`, slot, state.rarity);
      layers.push({
        artString: sprite.artString,
        palette: sprite.palette,
        slot,
        rarityGlow: sprite.glow ?? undefined,
      });
    }
    return layers;
  }, [bodyId, slots]);

  // Composite character with equipment
  const equippedPixels = useMemo(() => {
    if (!character || equipmentLayers.length === 0) return null;
    return compositeCharacterWithEquipment(
      character.artString,
      character.palette,
      equipmentLayers,
    );
  }, [character, equipmentLayers]);

  // Seed character
  const seedCharacter = useMemo(() => {
    if (!seedResult) return null;
    const art = BODY_TEMPLATES_V2[seedResult.params.bodyId];
    if (!art) return null;
    return assembleCharacter(seedResult.params, art);
  }, [seedResult]);

  const handleGenerateSeed = useCallback(() => {
    if (!seedInput.trim()) return;
    const seed = /^\d+$/.test(seedInput) ? parseInt(seedInput, 10) : seedInput;
    const params = seedToParams(seed, tier);
    const deterministic = verifySeedDeterminism(seed);
    setSeedResult({ params, deterministic });
  }, [seedInput, tier]);

  const meta = CHARACTER_META[bodyId];
  const activeSlotCount = EQUIPMENT_SLOTS.filter(s => slots[s].enabled).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      {/* Header */}
      <div>
        <h1 style={{ fontFamily: t.display, fontSize: 24, fontWeight: 800, color: t.text, margin: 0 }}>
          Character Lab
        </h1>
        <p style={{ fontFamily: t.body, fontSize: 13, color: t.textSecondary, margin: '6px 0 0' }}>
          Interactive test harness for the @plan2skill/pixelforge assembly pipeline
        </p>
      </div>

      {/* ═══ Section 1A: Character Builder ═══ */}
      <section style={cardStyle}>
        <h2 style={sectionTitle}>Character Builder</h2>

        <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
          {/* Controls */}
          <div style={{ flex: 1, minWidth: 280, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Body selector */}
            <div>
              <div style={labelStyle}>Body</div>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {bodyIds.map(id => {
                  const m = CHARACTER_META[id];
                  return (
                    <button
                      key={id}
                      onClick={() => setBodyId(id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '5px 10px',
                        borderRadius: 6,
                        border: `1px solid ${bodyId === id ? m.color : t.border}`,
                        background: bodyId === id ? `${m.color}18` : 'transparent',
                        color: bodyId === id ? t.text : t.textMuted,
                        fontFamily: t.body,
                        fontSize: 11,
                        fontWeight: bodyId === id ? 600 : 400,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{
                        width: 8, height: 8, borderRadius: '50%',
                        background: m.color,
                        flexShrink: 0,
                      }} />
                      {m.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Skin tone */}
            <div>
              <div style={labelStyle}>Skin Tone</div>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {SKIN_TONES.map((s, i) => (
                  <SwatchButton
                    key={s.id}
                    color={s.color}
                    selected={skinIdx === i}
                    onClick={() => setSkinIdx(i)}
                    label={s.id}
                  />
                ))}
              </div>
            </div>

            {/* Hair color */}
            <div>
              <div style={labelStyle}>Hair Color</div>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {HAIR_COLORS.map((h, i) => (
                  <SwatchButton
                    key={h.id}
                    color={h.H}
                    selected={hairIdx === i}
                    onClick={() => setHairIdx(i)}
                    label={h.id}
                  />
                ))}
              </div>
            </div>

            {/* Outfit color */}
            <div>
              <div style={labelStyle}>Outfit Color</div>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {OUTFIT_COLORS.map((o, i) => (
                  <SwatchButton
                    key={o.id}
                    color={o.T}
                    selected={outfitIdx === i}
                    onClick={() => setOutfitIdx(i)}
                    label={o.id}
                  />
                ))}
              </div>
            </div>

            {/* Evolution tier */}
            <div>
              <div style={labelStyle}>Evolution Tier</div>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {EVOLUTION_TIERS.map(et => (
                  <PillButton
                    key={et}
                    label={et}
                    selected={tier === et}
                    onClick={() => setTier(et)}
                    color={TIER_COLORS[et]}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Live Preview */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
            padding: 24,
            background: t.bg,
            borderRadius: 12,
            border: `1px solid ${t.border}`,
            minWidth: 200,
          }}>
            <div style={labelStyle}>Live Preview</div>
            {character && (
              <AnimatedCanvasRenderer
                character={{ id: bodyId, artString: character.artString, palette: character.palette }}
                size={5}
                glowColor={tier === 'master' ? t.gold : tier === 'practitioner' ? t.violet : undefined}
                ariaLabel={`${meta.name} preview`}
              />
            )}
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: t.display, fontSize: 14, fontWeight: 700, color: t.text }}>
                {meta.name}
              </div>
              <div style={{ fontFamily: t.mono, fontSize: 10, color: meta.color }}>
                {meta.bodyType} &middot; {tier}
              </div>
            </div>
            {/* Current params display */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 3,
              width: '100%',
              marginTop: 4,
              padding: '8px 10px',
              borderRadius: 6,
              background: t.bgCard,
            }}>
              {skin && <ParamRow label="Skin" value={skin.id} swatch={skin.color} />}
              {hair && <ParamRow label="Hair" value={hair.id} swatch={hair.H} />}
              {outfit && <ParamRow label="Outfit" value={outfit.id} swatch={outfit.T} />}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ Section 1B: Equipment Compositor ═══ */}
      <section style={cardStyle}>
        <h2 style={sectionTitle}>
          Equipment Compositor
          {activeSlotCount > 0 && (
            <span style={{
              fontFamily: t.mono, fontSize: 11, fontWeight: 600,
              color: t.violet, marginLeft: 8,
            }}>
              ({activeSlotCount} slot{activeSlotCount !== 1 ? 's' : ''} active)
            </span>
          )}
        </h2>

        {/* Slot controls */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 24 }}>
          {EQUIPMENT_SLOTS.map(slot => (
            <EquipmentSlotControl
              key={slot}
              slot={slot}
              state={slots[slot]}
              onChange={state => updateSlot(slot, state)}
            />
          ))}
        </div>

        {/* Side-by-side preview */}
        <div style={{
          display: 'flex',
          gap: 32,
          justifyContent: 'center',
          alignItems: 'flex-end',
          flexWrap: 'wrap',
        }}>
          {/* Base character */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8,
            padding: 16,
            background: t.bg,
            borderRadius: 12,
            border: `1px solid ${t.border}`,
          }}>
            <div style={labelStyle}>Base</div>
            {character && (
              <CanvasPixelRenderer
                data={parseArt(character.artString, character.palette)}
                size={5}
                ariaLabel={`${meta.name} base`}
              />
            )}
          </div>

          {/* Arrow */}
          {equippedPixels && (
            <div style={{
              fontFamily: t.display,
              fontSize: 24,
              color: t.textMuted,
              alignSelf: 'center',
            }}>
              →
            </div>
          )}

          {/* Equipped character */}
          {equippedPixels && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
              padding: 16,
              background: t.bg,
              borderRadius: 12,
              border: `1px solid ${t.violet}30`,
            }}>
              <div style={{ ...labelStyle, color: t.violet }}>Equipped</div>
              <CanvasPixelRenderer
                data={equippedPixels}
                size={5}
                ariaLabel={`${meta.name} equipped`}
              />
              {/* Active equipment tags */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, justifyContent: 'center', maxWidth: 180 }}>
                {equipmentLayers.map(layer => (
                  <span key={layer.slot} style={{
                    fontFamily: t.mono,
                    fontSize: 8,
                    padding: '2px 6px',
                    borderRadius: 4,
                    color: RARITY_COLORS[slots[layer.slot].rarity],
                    background: `${RARITY_COLORS[slots[layer.slot].rarity]}15`,
                    border: `1px solid ${RARITY_COLORS[slots[layer.slot].rarity]}30`,
                  }}>
                    {layer.slot} ({slots[layer.slot].rarity})
                  </span>
                ))}
              </div>
            </div>
          )}

          {!equippedPixels && activeSlotCount === 0 && (
            <div style={{
              padding: 24,
              borderRadius: 12,
              border: `1px dashed ${t.border}`,
              fontFamily: t.body,
              fontSize: 12,
              color: t.textMuted,
              textAlign: 'center',
              minWidth: 180,
            }}>
              Enable equipment slots above to see composited result
            </div>
          )}
        </div>
      </section>

      {/* ═══ Section 1C: Seed Tester ═══ */}
      <section style={cardStyle}>
        <h2 style={sectionTitle}>Seed Tester</h2>
        <p style={{
          fontFamily: t.body, fontSize: 12, color: t.textMuted, margin: '0 0 16px',
        }}>
          Enter a seed string or number to generate a deterministic character.
          Same seed always produces the same result.
        </p>

        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          {/* Input + button */}
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="text"
              value={seedInput}
              onChange={e => setSeedInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleGenerateSeed(); }}
              placeholder="e.g. user@example.com or 42"
              style={{
                fontFamily: t.mono,
                fontSize: 12,
                padding: '8px 14px',
                borderRadius: 8,
                border: `1px solid ${t.border}`,
                background: t.bgElevated,
                color: t.text,
                width: 260,
                outline: 'none',
              }}
            />
            <button
              onClick={handleGenerateSeed}
              disabled={!seedInput.trim()}
              style={{
                fontFamily: t.body,
                fontSize: 12,
                fontWeight: 600,
                padding: '8px 18px',
                borderRadius: 8,
                border: 'none',
                background: seedInput.trim() ? t.violet : t.border,
                color: seedInput.trim() ? '#FFF' : t.textMuted,
                cursor: seedInput.trim() ? 'pointer' : 'default',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap',
              }}
            >
              Generate from seed
            </button>
          </div>

          {/* Result */}
          {seedResult && seedCharacter && (
            <div style={{
              display: 'flex',
              gap: 20,
              alignItems: 'center',
              padding: 16,
              background: t.bg,
              borderRadius: 12,
              border: `1px solid ${t.border}`,
              flex: 1,
              minWidth: 320,
            }}>
              <AnimatedCanvasRenderer
                character={{
                  id: seedResult.params.bodyId,
                  artString: seedCharacter.artString,
                  palette: seedCharacter.palette,
                }}
                size={4}
                ariaLabel="Seed-generated character"
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
                <div style={{ fontFamily: t.display, fontSize: 14, fontWeight: 700, color: t.text }}>
                  {CHARACTER_META[seedResult.params.bodyId].name}
                </div>
                <ParamRow label="Body" value={seedResult.params.bodyId} />
                <ParamRow label="Skin" value={seedResult.params.skinTone.id} swatch={seedResult.params.skinTone.color} />
                <ParamRow label="Hair" value={seedResult.params.hairColor.id} swatch={seedResult.params.hairColor.H} />
                <ParamRow label="Outfit" value={seedResult.params.outfitColor.id} swatch={seedResult.params.outfitColor.T} />
                <ParamRow label="Tier" value={tier} />
                <div style={{
                  marginTop: 4,
                  fontFamily: t.mono,
                  fontSize: 10,
                  padding: '3px 8px',
                  borderRadius: 4,
                  display: 'inline-flex',
                  alignSelf: 'flex-start',
                  color: seedResult.deterministic ? t.mint : t.rose,
                  background: seedResult.deterministic ? `${t.mint}15` : `${t.rose}15`,
                  border: `1px solid ${seedResult.deterministic ? t.mint : t.rose}30`,
                }}>
                  {seedResult.deterministic ? 'Deterministic: PASS' : 'Deterministic: FAIL'}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

// ─── Param Row ───

function ParamRow({ label, value, swatch }: { label: string; value: string; swatch?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
      <span style={{ fontFamily: t.body, fontSize: 10, color: t.textMuted }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {swatch && (
          <div style={{ width: 8, height: 8, borderRadius: 2, background: swatch, flexShrink: 0 }} />
        )}
        <span style={{ fontFamily: t.mono, fontSize: 10, color: t.textSecondary }}>{value}</span>
      </div>
    </div>
  );
}
