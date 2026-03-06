'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useOnboardingV2Store, useI18nStore } from '@plan2skill/store';
import type { CharacterId, ArchetypeId } from '@plan2skill/types';
import { trpc } from '@plan2skill/api-client';
import { t } from '../_components/tokens';
import { StepBarV2 } from '../_components/StepBarV2';
import { BackButton, ContinueButton } from '../_components/ContinueButton';
import { NPCBubble } from '../_components/NPCBubble';
import { WizardShell } from '../_components/WizardShell';
import {
  parseArt,
  CanvasPixelRenderer, AnimatedCanvasRenderer,
} from '../_components/PixelEngine';
import { CHARACTERS, charArtStrings, charPalettes } from '../_components/characters';
import { ARCHETYPES } from '../_data/archetypes';

// ═══════════════════════════════════════════
// CHARACTER — Step 4: Choose Your Hero
// Two paths: pick preset OR create custom (default)
// Archetype inferred from assessment, user can override
// ═══════════════════════════════════════════

// Precompute character data for carousel — v1 art + Canvas renderers
const gamifChars = CHARACTERS.map(c => ({
  id: c.id,
  artString: charArtStrings[c.id]!,
  palette: charPalettes[c.id]!,
  art: parseArt(charArtStrings[c.id]!, charPalettes[c.id]!),
}));

// ─── Constructor data ───
// Body shapes use existing character silhouettes
const BODY_SHAPES = [
  { id: 'aria',  label: 'Style A', desc: 'Long straight' },
  { id: 'kofi',  label: 'Style B', desc: 'Flat-top fade' },
  { id: 'mei',   label: 'Style C', desc: 'Bob with bangs' },
  { id: 'diego', label: 'Style D', desc: 'Wavy' },
  { id: 'zara',  label: 'Style E', desc: 'Afro puffs' },
  { id: 'alex',  label: 'Style F', desc: 'Undercut' },
  { id: 'priya', label: 'Style G', desc: 'Long braid' },
  { id: 'liam',  label: 'Style H', desc: 'Messy' },
];

const SKIN_TONES = [
  { id: 'light',      color: '#FFE0C0', arm: '#FFBBA0', blush: '#FFB5A0', mouth: '#E8907A', label: 'Light' },
  { id: 'fair',       color: '#FFDAB9', arm: '#FFB5A0', blush: '#FFB5A0', mouth: '#E8907A', label: 'Fair' },
  { id: 'medium',     color: '#DEB887', arm: '#D4A06A', blush: '#D4A06A', mouth: '#C08060', label: 'Medium' },
  { id: 'tan',        color: '#D4A574', arm: '#C89058', blush: '#C89058', mouth: '#B07848', label: 'Tan' },
  { id: 'olive',      color: '#D2A37C', arm: '#C0905A', blush: '#C0905A', mouth: '#A87848', label: 'Olive' },
  { id: 'brown',      color: '#C68642', arm: '#B87530', blush: '#B87530', mouth: '#A06828', label: 'Brown' },
  { id: 'dark-brown', color: '#8B5E3C', arm: '#7A4E2C', blush: '#7A4E2C', mouth: '#6A3E20', label: 'Dark brown' },
  { id: 'deep',       color: '#7B4B2A', arm: '#6A3B1A', blush: '#6A3B1A', mouth: '#5A3018', label: 'Deep' },
];

const HAIR_COLORS = [
  { id: 'blonde',  H: '#E8C35A', h: '#FFD980', label: 'Blonde' },
  { id: 'brown',   H: '#5C3A1E', h: '#7A5030', label: 'Brown' },
  { id: 'black',   H: '#1A1008', h: '#2A1A10', label: 'Black' },
  { id: 'auburn',  H: '#CC4422', h: '#E85830', label: 'Auburn' },
  { id: 'purple',  H: '#6B48A8', h: '#9D7AFF', label: 'Purple' },
  { id: 'pink',    H: '#D04080', h: '#E879F9', label: 'Pink' },
  { id: 'teal',    H: '#2A8A80', h: '#4ECDC4', label: 'Teal' },
  { id: 'silver',  H: '#A0A8B8', h: '#C0C8D8', label: 'Silver' },
];

const SHIRT_COLORS = [
  { id: 'violet', T: '#9D7AFF', t_dark: '#7B5FCC', label: 'Violet' },
  { id: 'cyan',   T: '#4ECDC4', t_dark: '#3AABA0', label: 'Cyan' },
  { id: 'rose',   T: '#FF6B8A', t_dark: '#D04A6A', label: 'Rose' },
  { id: 'gold',   T: '#FFD166', t_dark: '#E0B040', label: 'Gold' },
  { id: 'blue',   T: '#3B82F6', t_dark: '#2A60C0', label: 'Blue' },
  { id: 'indigo', T: '#818CF8', t_dark: '#6060D0', label: 'Indigo' },
  { id: 'teal',   T: '#2A9D8F', t_dark: '#1A7A6A', label: 'Teal' },
  { id: 'fuchsia', T: '#E879F9', t_dark: '#C060D0', label: 'Fuchsia' },
];

function buildCustomPalette(
  bodyId: string,
  skinTone: typeof SKIN_TONES[0],
  hairColor: typeof HAIR_COLORS[0],
  shirtColor: typeof SHIRT_COLORS[0],
): Record<string, string> {
  return {
    H: hairColor.H,
    h: hairColor.h,
    S: skinTone.color,
    A: skinTone.color,
    E: '#1A1020',
    w: '#FFFFFF',
    r: skinTone.blush,
    m: skinTone.mouth,
    T: shirtColor.T,
    t: shirtColor.t_dark,
    P: shirtColor.t_dark,
    F: shirtColor.t_dark,
  };
}

// Color swatch
function Swatch({ color, selected, onClick, size = 32, label }: {
  color: string; selected: boolean; onClick: () => void; size?: number; label?: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      style={{
        width: size,
        height: size,
        borderRadius: size > 28 ? 10 : '50%',
        background: color,
        border: selected ? '3px solid #FFF' : '2px solid #35354A',
        cursor: 'pointer',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease',
        boxShadow: selected ? `0 0 12px ${color}60` : 'none',
        transform: selected ? 'scale(1.15)' : 'scale(1)',
        flexShrink: 0,
      }}
    />
  );
}

export default function CharacterPage() {
  const router = useRouter();
  const {
    characterId, inferredArchetypeId, overrideArchetypeId, discoveryPath,
    setCharacter, setOverrideArchetype, addXP, completeOnboarding,
  } = useOnboardingV2Store();
  const locale = useI18nStore((s) => s.locale);
  const tr = useI18nStore((s) => s.t);

  const createCharacterMutation = trpc.character.create.useMutation();
  const completeOnboardingMutation = trpc.user.completeOnboarding.useMutation();

  // Fetch archetypes from API with mock fallback
  const { data: apiArchetypes } = trpc.onboarding.archetypes.useQuery(
    { locale },
    { staleTime: 5 * 60 * 1000, retry: 1 },
  );

  const archetypeMap = useMemo(() => {
    if (apiArchetypes && apiArchetypes.length > 0) {
      const map: Record<string, typeof ARCHETYPES[string]> = {};
      for (const a of apiArchetypes) {
        map[a.id] = { icon: a.icon, name: a.name, color: a.color, tagline: a.tagline, bestFor: a.bestFor, stats: a.stats };
      }
      return map;
    }
    return ARCHETYPES;
  }, [apiArchetypes]);

  const finalArchetypeId = (overrideArchetypeId || inferredArchetypeId || 'explorer') as string;
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const activeArchetype = (archetypeMap[finalArchetypeId] ?? archetypeMap['explorer'] ?? ARCHETYPES['explorer'])!;
  const [showArchetypePicker, setShowArchetypePicker] = useState(false);

  const [mode, setMode] = useState<'pick' | 'create'>('pick');
  const [avatarSelected, setAvatarSelected] = useState<string | null>(characterId || 'custom');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Constructor state
  const [bodyShape, setBodyShape] = useState('aria');
  const [skinIdx, setSkinIdx] = useState(1); // fair
  const [hairIdx, setHairIdx] = useState(0); // blonde
  const [shirtIdx, setShirtIdx] = useState(0); // violet

  // prefers-reduced-motion
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Auto-scroll carousel to "Create custom" card in the middle on mount
  const hasScrolledRef = useRef(false);
  useEffect(() => {
    if (scrollRef.current && !hasScrolledRef.current) {
      // "Create custom" is at index 4 (middle of 9 items)
      const cardWidth = 100; // approximate card width + gap
      scrollRef.current.scrollTo({ left: 4 * cardWidth - scrollRef.current.clientWidth / 2 + 45, behavior: 'smooth' });
      hasScrolledRef.current = true;
    }
  }, []);

  // Scroll to selected character when picking
  useEffect(() => {
    if (scrollRef.current && avatarSelected && hasScrolledRef.current) {
      const idx = CHARACTERS.findIndex(c => c.id === avatarSelected);
      // Account for "Create custom" card at position 4
      const scrollIdx = idx < 4 ? idx : idx + 1;
      if (idx >= 0) {
        scrollRef.current.scrollTo({ left: scrollIdx * 100, behavior: 'smooth' });
      }
    }
  }, [avatarSelected]);

  // Custom character preview
  const customPalette = useMemo(() =>
    buildCustomPalette(bodyShape, SKIN_TONES[skinIdx]!, HAIR_COLORS[hairIdx]!, SHIRT_COLORS[shirtIdx]!),
    [bodyShape, skinIdx, hairIdx, shirtIdx]
  );

  const customArtString = charArtStrings[bodyShape]!;
  const customArt = useMemo(() =>
    parseArt(customArtString, customPalette),
    [customArtString, customPalette]
  );
  const customAccentColor = SHIRT_COLORS[shirtIdx]!.T;

  const selectedCharMeta = CHARACTERS.find(c => c.id === avatarSelected);

  // Archetype badge + picker (shared between pick/create modes)
  const archetypeBadge = (
    <div style={{ marginTop: 16 }}>
      <button
        type="button"
        onClick={() => setShowArchetypePicker(!showArchetypePicker)}
        aria-expanded={showArchetypePicker}
        aria-label={`Archetype: ${activeArchetype.name}. Click to change`}
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          width: '100%',
          padding: '10px 14px', borderRadius: 12,
          background: `${activeArchetype.color}10`,
          border: `1px solid ${activeArchetype.color}30`,
          cursor: 'pointer',
          transition: 'background 0.2s ease',
          textAlign: 'left',
        }}
      >
        <span style={{ fontSize: 18 }}>{activeArchetype.icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{
            fontFamily: t.display, fontSize: 12, fontWeight: 700,
            color: activeArchetype.color,
          }}>
            {activeArchetype.name}
          </div>
          <div style={{
            fontFamily: t.body, fontSize: 11, color: t.textMuted,
          }}>
            {activeArchetype.tagline}
          </div>
        </div>
        <span style={{
          fontFamily: t.body, fontSize: 10, color: activeArchetype.color,
          textDecoration: 'underline',
          textUnderlineOffset: 2,
          fontWeight: 600,
        }}>
          {tr('common.change')}
        </span>
      </button>

      {/* Archetype picker overlay */}
      {showArchetypePicker && (
        <div style={{
          display: 'flex', flexDirection: 'column', gap: 6,
          marginTop: 8, padding: 8, borderRadius: 12,
          background: t.bgCard, border: `1px solid ${t.border}`,
        }}>
          {Object.entries(archetypeMap).map(([id, arch]) => {
            const isActive = id === finalArchetypeId;
            return (
              <button
                key={id}
                onClick={() => {
                  setOverrideArchetype(id as ArchetypeId);
                  setShowArchetypePicker(false);
                }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 12px', borderRadius: 10,
                  background: isActive ? `${arch.color}15` : 'transparent',
                  border: isActive ? `1px solid ${arch.color}30` : '1px solid transparent',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <span style={{ fontSize: 16 }}>{arch.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontFamily: t.display, fontSize: 12, fontWeight: 600,
                    color: isActive ? arch.color : t.text,
                  }}>
                    {arch.name}
                  </div>
                  <div style={{
                    fontFamily: t.body, fontSize: 10, color: t.textMuted,
                  }}>
                    {arch.bestFor}
                  </div>
                </div>
                {isActive && (
                  <svg width="14" height="14" viewBox="0 0 12 12" fill="none">
                    <path d="M2.5 6L5 8.5L9.5 3.5" stroke={arch.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );

  const [isSaving, setIsSaving] = useState(false);

  const handleContinue = async () => {
    if (mode === 'pick' && avatarSelected === 'custom') {
      setMode('create');
      return;
    }

    const finalCharacterId = (mode === 'pick' && avatarSelected)
      ? avatarSelected as CharacterId
      : bodyShape as CharacterId;

    setIsSaving(true);

    try {
      // Save character to DB first
      await createCharacterMutation.mutateAsync({
        characterId: finalCharacterId,
        archetypeId: finalArchetypeId as any,
        companionId: null,
      });

      // Complete onboarding (fire-and-forget — non-critical)
      completeOnboardingMutation.mutate(undefined, {
        onError: (err) => console.warn('[user.completeOnboarding]', err.message),
      });

      // Update stores after DB confirms
      setCharacter(finalCharacterId);
      addXP(10);
      completeOnboarding();

      router.push('/home');
    } catch (err) {
      console.error('[character.create] failed:', err);
      setIsSaving(false);
    }
  };

  // ─── CREATE MODE ───
  if (mode === 'create') {
    return (
      <WizardShell
        header={
          <>
            <StepBarV2 current={2} />
            <BackButton onClick={() => {
              if (discoveryPath === 'guided') router.push('/goal/guided');
              else router.push('/assessment');
            }} />
          </>
        }
        footer={
          <>
            <ContinueButton onClick={handleContinue} disabled={isSaving}>
              {isSaving ? tr('common.saving') : tr('onboarding.forge_hero')}
            </ContinueButton>
            <p style={{
              fontFamily: t.body,
              fontSize: 11,
              color: t.textMuted,
              marginTop: 10,
              textAlign: 'center',
            }}>
              {tr('onboarding.cosmetic_note')}
            </p>
          </>
        }
      >
        <NPCBubble
          characterId="sage"
          message={tr('npc.character_create')}
          emotion="impressed"
        />

        <div style={{ height: 12 }} />

        {/* Live preview */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: 20,
        }}>
          <div style={{
            padding: '16px 20px 12px',
            borderRadius: 16,
            background: t.bgCard,
            border: `2px solid ${customAccentColor}40`,
            boxShadow: `0 0 24px ${customAccentColor}20`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8,
            animation: reducedMotion ? 'none' : 'glowPulse 8s ease-in-out infinite',
          }}>
            <div style={{ filter: `drop-shadow(0 0 10px ${customAccentColor}55)` }}>
              <CanvasPixelRenderer data={customArt} size={6} />
            </div>
            <span style={{
              fontFamily: t.mono,
              fontSize: 10,
              color: t.textMuted,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              {tr('onboarding.live_preview')}
            </span>
          </div>
        </div>

        {/* Hair style (body shape) */}
        <div style={{ marginBottom: 16 }}>
          <h3 style={{
            fontFamily: t.display,
            fontSize: 13,
            fontWeight: 700,
            color: t.textSecondary,
            marginBottom: 8,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}>
            {tr('onboarding.hair_style')}
          </h3>
          <div style={{
            display: 'flex',
            gap: 8,
            overflowX: 'auto',
            padding: '4px 0',
            scrollbarWidth: 'none',
          }}>
            {BODY_SHAPES.map((b) => {
              const isActive = bodyShape === b.id;
              const previewPal = buildCustomPalette(b.id, SKIN_TONES[skinIdx]!, HAIR_COLORS[hairIdx]!, SHIRT_COLORS[shirtIdx]!);
              const previewArt = parseArt(charArtStrings[b.id]!, previewPal);
              return (
                <button
                  key={b.id}
                  onClick={() => setBodyShape(b.id)}
                  aria-label={`Hair style: ${b.desc}`}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 4,
                    padding: '8px 6px 6px',
                    borderRadius: 12,
                    border: `2px solid ${isActive ? customAccentColor : t.border}`,
                    background: isActive ? `${customAccentColor}10` : t.bgCard,
                    cursor: 'pointer',
                    flexShrink: 0,
                    minWidth: 56,
                    transition: 'border-color 0.15s ease, background 0.15s ease',
                  }}
                >
                  <CanvasPixelRenderer data={previewArt} size={3} />
                  <span style={{
                    fontFamily: t.body,
                    fontSize: 9,
                    color: isActive ? t.text : t.textMuted,
                    fontWeight: isActive ? 600 : 400,
                  }}>
                    {b.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Skin tone */}
        <div style={{ marginBottom: 16 }}>
          <h3 style={{
            fontFamily: t.display,
            fontSize: 13,
            fontWeight: 700,
            color: t.textSecondary,
            marginBottom: 8,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}>
            {tr('onboarding.skin_tone')}
          </h3>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {SKIN_TONES.map((s, i) => (
              <Swatch
                key={s.id}
                color={s.color}
                selected={skinIdx === i}
                onClick={() => setSkinIdx(i)}
                label={`Skin tone: ${s.label}`}
              />
            ))}
          </div>
        </div>

        {/* Hair color */}
        <div style={{ marginBottom: 16 }}>
          <h3 style={{
            fontFamily: t.display,
            fontSize: 13,
            fontWeight: 700,
            color: t.textSecondary,
            marginBottom: 8,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}>
            {tr('onboarding.hair_color')}
          </h3>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {HAIR_COLORS.map((hc, i) => (
              <Swatch
                key={hc.id}
                color={hc.H}
                selected={hairIdx === i}
                onClick={() => setHairIdx(i)}
                label={`Hair color: ${hc.label}`}
              />
            ))}
          </div>
        </div>

        {/* Shirt color */}
        <div style={{ marginBottom: 0 }}>
          <h3 style={{
            fontFamily: t.display,
            fontSize: 13,
            fontWeight: 700,
            color: t.textSecondary,
            marginBottom: 8,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}>
            {tr('onboarding.outfit_color')}
          </h3>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {SHIRT_COLORS.map((sc, i) => (
              <Swatch
                key={sc.id}
                color={sc.T}
                selected={shirtIdx === i}
                onClick={() => setShirtIdx(i)}
                label={`Outfit color: ${sc.label}`}
              />
            ))}
          </div>
        </div>

        {/* Archetype badge */}
        {archetypeBadge}
      </WizardShell>
    );
  }

  // ─── PICK MODE (preset characters) ───
  return (
    <WizardShell
      header={
        <>
          <StepBarV2 current={2} />
          <BackButton onClick={() => {
              if (discoveryPath === 'guided') router.push('/goal/guided');
              else router.push('/assessment');
            }} />
        </>
      }
      footer={
        <>
          <ContinueButton
            onClick={handleContinue}
            disabled={!avatarSelected || isSaving}
          >
            {isSaving ? tr('common.saving') : avatarSelected === 'custom' ? tr('onboarding.create_custom') : tr('onboarding.choose_hero')}
          </ContinueButton>
          <p style={{
            fontFamily: t.body,
            fontSize: 11,
            color: t.textMuted,
            marginTop: 10,
            textAlign: 'center',
          }}>
            {tr('onboarding.cosmetic_note')}
          </p>
        </>
      }
    >
      <NPCBubble
        characterId="sage"
        message={tr('npc.character_intro')}
        emotion="happy"
      />

      <div style={{ height: 12 }} />

      {/* Choose Your Hero */}
      <h2 style={{
        fontFamily: t.display,
        fontSize: 20,
        fontWeight: 800,
        color: t.text,
        marginBottom: 12,
        textAlign: 'center',
      }}>
        {tr('onboarding.choose_hero')}
      </h2>

      {/* Horizontal Carousel */}
      <div
        ref={scrollRef}
        style={{
          display: 'flex',
          gap: 12,
          overflowX: 'auto',
          scrollSnapType: 'x mandatory',
          padding: '8px 4px 12px',
          marginBottom: 8,
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
        }}
      >
        {CHARACTERS.slice(0, 4).map((char) => {
          const isSelected = avatarSelected === char.id;
          const gChar = gamifChars.find(g => g.id === char.id)!;
          return (
            <button
              key={char.id}
              onClick={() => setAvatarSelected(char.id)}
              aria-label={`Select ${char.name}`}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: isSelected ? '16px 12px 10px' : '12px 8px 8px',
                borderRadius: 16,
                border: `2px solid ${isSelected ? char.color : t.border}`,
                background: isSelected ? `${char.color}10` : t.bgCard,
                cursor: 'pointer',
                transition: 'border-color 0.25s ease, background 0.25s ease, box-shadow 0.25s ease, opacity 0.25s ease',
                scrollSnapAlign: 'center',
                flexShrink: 0,
                minWidth: isSelected ? 110 : 90,
                boxShadow: isSelected ? `0 0 20px ${char.color}30` : 'none',
                opacity: isSelected ? 1 : 0.7,
                position: 'relative',
              }}
            >
              <div style={{
                marginBottom: 6,
                filter: isSelected ? `drop-shadow(0 0 10px ${char.color}55)` : 'none',
                transition: 'filter 0.2s ease',
              }}>
                {isSelected ? (
                  <AnimatedCanvasRenderer character={gChar} size={6} glowColor={char.color} />
                ) : (
                  <CanvasPixelRenderer data={gChar.art} size={5} />
                )}
              </div>
              <span style={{
                fontFamily: t.display,
                fontSize: isSelected ? 13 : 11,
                fontWeight: isSelected ? 700 : 600,
                color: isSelected ? t.text : t.textMuted,
                transition: 'color 0.2s ease, font-size 0.2s ease',
              }}>
                {char.name}
              </span>
              {isSelected && (
                <div style={{
                  position: 'absolute', top: 6, right: 6,
                  width: 16, height: 16, borderRadius: '50%',
                  background: char.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  animation: reducedMotion ? 'none' : 'celebratePop 0.3s ease-out',
                }}>
                  <svg width="8" height="8" viewBox="0 0 12 12" fill="none">
                    <path d="M2.5 6L5 8.5L9.5 3.5" stroke="#FFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              )}
            </button>
          );
        })}

        {/* Create Custom Hero — in the middle of carousel */}
        {(() => {
          const isCustomSelected = avatarSelected === 'custom';
          return (
            <button
              onClick={() => setAvatarSelected('custom')}
              aria-label="Create custom character"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: isCustomSelected ? '16px 12px 10px' : '12px 8px 8px',
                borderRadius: 16,
                border: isCustomSelected
                  ? `2px solid ${t.violet}`
                  : `2px dashed ${t.violet}50`,
                background: isCustomSelected ? `${t.violet}12` : `${t.violet}08`,
                cursor: 'pointer',
                transition: 'border-color 0.25s ease, background 0.25s ease, box-shadow 0.25s ease, opacity 0.25s ease',
                scrollSnapAlign: 'center',
                flexShrink: 0,
                minWidth: isCustomSelected ? 110 : 90,
                minHeight: 110,
                boxShadow: isCustomSelected ? `0 0 20px ${t.violet}30` : 'none',
                opacity: isCustomSelected ? 1 : 0.7,
                position: 'relative',
              }}
            >
              <div style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: `${t.violet}15`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M10 4v12M4 10h12" stroke={t.violet} strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
              <span style={{
                fontFamily: t.display,
                fontSize: isCustomSelected ? 13 : 11,
                fontWeight: isCustomSelected ? 700 : 600,
                color: t.violet,
                textAlign: 'center',
                lineHeight: 1.2,
                transition: 'font-size 0.2s ease',
              }}>
                {tr('onboarding.create_custom')}
              </span>
              {isCustomSelected && (
                <div style={{
                  position: 'absolute', top: 6, right: 6,
                  width: 16, height: 16, borderRadius: '50%',
                  background: t.violet,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  animation: reducedMotion ? 'none' : 'celebratePop 0.3s ease-out',
                }}>
                  <svg width="8" height="8" viewBox="0 0 12 12" fill="none">
                    <path d="M2.5 6L5 8.5L9.5 3.5" stroke="#FFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              )}
            </button>
          );
        })()}

        {CHARACTERS.slice(4).map((char) => {
          const isSelected = avatarSelected === char.id;
          const gChar = gamifChars.find(g => g.id === char.id)!;
          return (
            <button
              key={char.id}
              onClick={() => setAvatarSelected(char.id)}
              aria-label={`Select ${char.name}`}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: isSelected ? '16px 12px 10px' : '12px 8px 8px',
                borderRadius: 16,
                border: `2px solid ${isSelected ? char.color : t.border}`,
                background: isSelected ? `${char.color}10` : t.bgCard,
                cursor: 'pointer',
                transition: 'border-color 0.25s ease, background 0.25s ease, box-shadow 0.25s ease, opacity 0.25s ease',
                scrollSnapAlign: 'center',
                flexShrink: 0,
                minWidth: isSelected ? 110 : 90,
                boxShadow: isSelected ? `0 0 20px ${char.color}30` : 'none',
                opacity: isSelected ? 1 : 0.7,
                position: 'relative',
              }}
            >
              <div style={{
                marginBottom: 6,
                filter: isSelected ? `drop-shadow(0 0 10px ${char.color}55)` : 'none',
                transition: 'filter 0.2s ease',
              }}>
                {isSelected ? (
                  <AnimatedCanvasRenderer character={gChar} size={6} glowColor={char.color} />
                ) : (
                  <CanvasPixelRenderer data={gChar.art} size={5} />
                )}
              </div>
              <span style={{
                fontFamily: t.display,
                fontSize: isSelected ? 13 : 11,
                fontWeight: isSelected ? 700 : 600,
                color: isSelected ? t.text : t.textMuted,
                transition: 'color 0.2s ease, font-size 0.2s ease',
              }}>
                {char.name}
              </span>
              {isSelected && (
                <div style={{
                  position: 'absolute', top: 6, right: 6,
                  width: 16, height: 16, borderRadius: '50%',
                  background: char.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  animation: reducedMotion ? 'none' : 'celebratePop 0.3s ease-out',
                }}>
                  <svg width="8" height="8" viewBox="0 0 12 12" fill="none">
                    <path d="M2.5 6L5 8.5L9.5 3.5" stroke="#FFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Scroll indicator dots */}
      <div style={{
        display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 8,
      }}>
        {CHARACTERS.map((char) => {
          const isActive = avatarSelected === char.id;
          return (
            <div
              key={char.id}
              style={{
                width: 16,
                height: 6,
                borderRadius: 3,
                background: isActive ? char.color : '#35354A',
                transform: isActive ? 'scaleX(1)' : 'scaleX(0.375)',
                transformOrigin: 'center',
                transition: reducedMotion ? 'none' : 'transform 0.3s ease, background 0.3s ease',
              }}
            />
          );
        })}
      </div>

      {/* Selected character info */}
      {selectedCharMeta && (
        <p style={{
          fontFamily: t.body,
          fontSize: 12,
          color: t.textMuted,
          textAlign: 'center',
        }}>
          {selectedCharMeta.name} — {selectedCharMeta.desc}
        </p>
      )}

      {/* Archetype badge */}
      {archetypeBadge}
    </WizardShell>
  );
}
