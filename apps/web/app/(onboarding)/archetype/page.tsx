'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useOnboardingStore } from '@plan2skill/store';
import type { ArchetypeId, CharacterId } from '@plan2skill/types';
import { t } from '../_components/tokens';
import { StepBar } from '../_components/StepBar';
import { ContinueButton, BackButton } from '../_components/ContinueButton';
import { parseArt, PixelCanvas, AnimatedPixelCanvas } from '../_components/PixelEngine';
import { CHARACTERS, charArtStrings, charPalettes } from '../_components/characters';
import { EquipmentReveal } from '../_components/EquipmentReveal';
import { ARCHETYPES } from '../_data/archetypes';

// ═══════════════════════════════════════════
// ARCHETYPE — Quiz + Reveal+Avatar + Equipment (Step 3/5)
// 3 phases: quiz → reveal+avatar (merged) → equipment
// Carousel character selection, equipment gift
// ═══════════════════════════════════════════

// ─── Quiz Scenarios ───
type ScoreMap = Partial<Record<string, number>>;

const SCENARIOS: { question: string; options: { text: string; scores: ScoreMap }[] }[] = [
  {
    question: 'A new project drops. You first...',
    options: [
      { text: 'Map out the full plan before touching code', scores: { strategist: 2 } },
      { text: 'Dive in, explore, figure it out', scores: { explorer: 2 } },
      { text: 'Ask the team what they think', scores: { connector: 2 } },
    ],
  },
  {
    question: 'You have a free weekend to learn. You...',
    options: [
      { text: 'Build a side project from scratch', scores: { builder: 2 } },
      { text: 'Deep-dive into a topic you\'ve been curious about', scores: { explorer: 1, innovator: 1 } },
      { text: 'Take a structured online course', scores: { strategist: 1, builder: 1 } },
    ],
  },
  {
    question: 'A teammate is stuck. You...',
    options: [
      { text: 'Share a creative workaround you thought of', scores: { innovator: 2 } },
      { text: 'Pair up and solve it together', scores: { connector: 2 } },
      { text: 'Point them to the docs & best practices', scores: { strategist: 1, builder: 1 } },
    ],
  },
];

// ─── Character art for archetype reveal ───
const archetypeChars: Record<string, { art: string; palette: Record<string, string> }> = {
  strategist: {
    art: charArtStrings.aria!,
    palette: { ...charPalettes.aria!, T: '#5B7FCC', t: '#4A6AB0', P: '#3A5090', F: '#2A4080' },
  },
  explorer: {
    art: charArtStrings.kofi!,
    palette: { ...charPalettes.kofi! },
  },
  connector: {
    art: charArtStrings.zara!,
    palette: { ...charPalettes.zara! },
  },
  builder: {
    art: charArtStrings.diego!,
    palette: { ...charPalettes.diego!, T: '#E8852E', t: '#C06A20', P: '#8A4A10', F: '#703A08' },
  },
  innovator: {
    art: charArtStrings.alex!,
    palette: { ...charPalettes.alex!, T: '#DAA520', t: '#B88A18', P: '#8A6A10', F: '#705808' },
  },
};

// Precompute gamified character data
const gamifChars = CHARACTERS.map(c => ({
  id: c.id,
  artString: charArtStrings[c.id]!,
  palette: charPalettes[c.id]!,
  art: parseArt(charArtStrings[c.id]!, charPalettes[c.id]!),
}));

export default function ArchetypePage() {
  const router = useRouter();
  const {
    archetypeId, archetypeQuizAnswers, characterId,
    setArchetype, setArchetypeQuizAnswers, setCharacter,
    addXP, addEquipment,
  } = useOnboardingStore();

  // Phase: quiz → reveal (merged with avatar) → equipment
  const [phase, setPhase] = useState<'quiz' | 'reveal' | 'override' | 'equipment'>(
    archetypeId ? (characterId ? 'equipment' : 'reveal') : 'quiz'
  );
  const [quizStep, setQuizStep] = useState(0);
  const [answers, setAnswers] = useState<number[]>(archetypeQuizAnswers || []);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [hoveredOption, setHoveredOption] = useState<number | null>(null);
  const [overrideSelected, setOverrideSelected] = useState<string | null>(null);
  const [hoveredArch, setHoveredArch] = useState<string | null>(null);

  // Avatar carousel
  const [avatarSelected, setAvatarSelected] = useState<string | null>(characterId);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Calculate winner
  const scores = useMemo(() => {
    const s: Record<string, number> = { strategist: 0, explorer: 0, connector: 0, builder: 0, innovator: 0 };
    answers.forEach((ansIdx, qIdx) => {
      const option = SCENARIOS[qIdx]?.options[ansIdx];
      if (option) {
        Object.entries(option.scores).forEach(([k, v]) => { s[k] = (s[k] || 0) + (v || 0); });
      }
    });
    return s;
  }, [answers]);

  const winnerId = useMemo(() => {
    let max = 0; let winner = 'strategist';
    Object.entries(scores).forEach(([k, v]) => { if (v > max) { max = v; winner = k; } });
    return winner;
  }, [scores]);

  const finalArchetype = overrideSelected || archetypeId || winnerId;
  const arch = ARCHETYPES[finalArchetype]!;

  // Auto-scroll carousel to selected character
  useEffect(() => {
    if (scrollRef.current && avatarSelected) {
      const idx = CHARACTERS.findIndex(c => c.id === avatarSelected);
      if (idx >= 0) {
        const scrollTarget = idx * 100;
        scrollRef.current.scrollTo({ left: scrollTarget, behavior: 'smooth' });
      }
    }
  }, [avatarSelected]);

  const handleAnswer = (optIndex: number) => {
    setSelectedOption(optIndex);
    setTimeout(() => {
      const newAnswers = [...answers, optIndex];
      setAnswers(newAnswers);
      setSelectedOption(null);
      setHoveredOption(null);
      if (newAnswers.length >= SCENARIOS.length) {
        setArchetypeQuizAnswers(newAnswers);
        const s: Record<string, number> = { strategist: 0, explorer: 0, connector: 0, builder: 0, innovator: 0 };
        newAnswers.forEach((ansIdx, qIdx) => {
          const option = SCENARIOS[qIdx]?.options[ansIdx];
          if (option) {
            Object.entries(option.scores).forEach(([k, v]) => { s[k] = (s[k] || 0) + (v || 0); });
          }
        });
        let max = 0; let w = 'strategist';
        Object.entries(s).forEach(([k, v]) => { if (v > max) { max = v; w = k; } });
        setArchetype(w as ArchetypeId);
        addXP(15);
        setPhase('reveal');
      } else {
        setQuizStep(prev => prev + 1);
      }
    }, 400);
  };

  // ─── Phase 1: Quiz ───
  if (phase === 'quiz') {
    const scenario = SCENARIOS[quizStep];
    if (!scenario) return null;
    return (
      <div style={{ animation: 'fadeUp 0.5s ease-out' }} key={quizStep}>
        <StepBar current={2} />

        <BackButton onClick={() => {
          if (quizStep > 0) {
            setQuizStep(prev => prev - 1);
            setAnswers(prev => prev.slice(0, -1));
          } else {
            router.push('/skills');
          }
        }} />
        <div style={{ height: 16 }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
          <span style={{ fontFamily: t.mono, fontSize: 12, color: t.cyan, fontWeight: 700 }}>
            {quizStep + 1}/{SCENARIOS.length}
          </span>
          <div style={{ flex: 1, height: 3, borderRadius: 2, background: '#252530', overflow: 'hidden' }}>
            <div style={{
              width: `${((quizStep + 1) / SCENARIOS.length) * 100}%`,
              height: '100%', borderRadius: 2, background: t.gradient, transition: 'width 0.4s ease',
            }} />
          </div>
        </div>

        <p style={{
          fontFamily: t.body, fontSize: 13, color: t.cyan, fontWeight: 600,
          textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12,
        }}>
          Scenario {quizStep + 1}
        </p>

        <h2 style={{
          fontFamily: t.display, fontSize: 24, fontWeight: 800,
          color: t.text, marginBottom: 32, lineHeight: 1.3,
        }}>
          {scenario.question}
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {scenario.options.map((opt, i) => {
            const isSelected = selectedOption === i;
            const isHovered = hoveredOption === i;
            const isDimmed = selectedOption !== null && !isSelected;
            // Find dominant archetype for this option
            const dominantArch = Object.entries(opt.scores).sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))[0];
            const archKey = dominantArch?.[0] || 'strategist';
            const archDef = ARCHETYPES[archKey]!;
            const archIcon = archDef.icon;
            const archColor = archDef.color;

            return (
              <button
                key={i}
                onClick={() => selectedOption === null && handleAnswer(i)}
                onMouseEnter={() => setHoveredOption(i)}
                onMouseLeave={() => setHoveredOption(null)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14, width: '100%',
                  padding: '16px 18px', borderRadius: 16,
                  border: `2px solid ${isSelected ? archColor : isHovered ? t.borderHover : t.border}`,
                  // 3D pushable bottom border (Duolingo pattern)
                  borderBottom: isSelected
                    ? `2px solid ${archColor}`
                    : `5px solid ${isHovered ? '#1A1A24' : '#111118'}`,
                  background: isSelected
                    ? `${archColor}10`
                    : isHovered ? 'rgba(255,255,255,0.02)' : t.bgCard,
                  cursor: selectedOption === null ? 'pointer' : 'default',
                  textAlign: 'left',
                  // Press: scale down + collapse bottom border
                  transition: 'all 0.15s ease',
                  transform: isSelected
                    ? 'scale(0.98) translateY(3px)'
                    : 'scale(1) translateY(0)',
                  animation: `fadeUp 0.35s ease-out ${i * 0.1}s both`,
                  boxShadow: isSelected ? `0 0 16px ${archColor}25` : 'none',
                  opacity: isDimmed ? 0.5 : 1,
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Left accent bar */}
                <div style={{
                  position: 'absolute',
                  left: 0,
                  top: '15%',
                  bottom: '15%',
                  width: 4,
                  borderRadius: '0 3px 3px 0',
                  background: isSelected ? archColor : `${archColor}30`,
                  transition: 'background 0.2s ease',
                }} />

                {/* Icon container */}
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: isSelected ? `${archColor}20` : '#1E1E28',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 22, flexShrink: 0,
                  color: isSelected ? archColor : t.textMuted,
                  transition: 'all 0.2s ease',
                  transform: isSelected ? 'scale(1.1)' : 'scale(1)',
                  marginLeft: 6,
                }}>
                  {archIcon}
                </div>

                {/* Text */}
                <span style={{
                  fontFamily: t.body, fontSize: 15, fontWeight: 500,
                  color: isSelected ? t.text : '#D4D4D8', lineHeight: 1.4,
                  flex: 1,
                }}>
                  {opt.text}
                </span>

                {/* Selection indicator */}
                <div style={{
                  width: 22, height: 22, borderRadius: '50%',
                  border: `2px solid ${isSelected ? archColor : '#35354A'}`,
                  background: isSelected ? archColor : 'transparent',
                  flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s ease',
                  transform: isSelected ? 'scale(1.15)' : 'scale(1)',
                }}>
                  {isSelected && (
                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                      <path d="M2.5 6L5 8.5L9.5 3.5" stroke="#FFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ─── Phase 2: Reveal + Avatar Carousel (MERGED) ───
  if (phase === 'reveal') {
    const charData = archetypeChars[finalArchetype];
    const pixelData = charData ? parseArt(charData.art, charData.palette) : null;
    const selectedCharMeta = CHARACTERS.find(c => c.id === avatarSelected);

    return (
      <div style={{ animation: 'fadeUp 0.6s ease-out' }}>
        <StepBar current={2} />

        {/* Archetype result — compact */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <p style={{
            fontFamily: t.body, fontSize: 13, color: t.cyan, fontWeight: 600,
            textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12,
            animation: 'fadeUp 0.5s ease-out 0.2s both',
          }}>
            Your archetype is
          </p>

          {pixelData && (
            <div style={{
              display: 'flex', justifyContent: 'center', marginBottom: 16,
              animation: 'bounceIn 0.6s ease-out 0.3s both',
              filter: `drop-shadow(0 0 16px ${arch.color}44)`,
            }}>
              <PixelCanvas data={pixelData} size={5} />
            </div>
          )}

          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 6,
            animation: 'bounceIn 0.6s ease-out 0.5s both',
          }}>
            <span style={{ fontSize: 36, color: arch.color, lineHeight: 1 }}>{arch.icon}</span>
            <h1 style={{
              fontFamily: t.display, fontSize: 28, fontWeight: 900,
              background: `linear-gradient(135deg, ${arch.color} 0%, ${t.cyan} 100%)`,
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              {arch.name}
            </h1>
          </div>
          <p style={{
            fontFamily: t.body, fontSize: 14, color: t.textSecondary, marginBottom: 6,
          }}>
            {arch.tagline}
          </p>

          {/* Stat bars — compact */}
          <div style={{
            background: t.bgCard, borderRadius: 14, padding: '14px 18px',
            marginBottom: 8, border: `1px solid ${t.border}`,
            animation: 'fadeUp 0.5s ease-out 0.7s both', textAlign: 'left',
          }}>
            {arch.stats.map((stat, i) => (
              <div key={stat.label} style={{ marginBottom: i < arch.stats.length - 1 ? 10 : 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontFamily: t.body, fontSize: 12, fontWeight: 600, color: t.textSecondary }}>
                    {stat.label}
                  </span>
                  <span style={{ fontFamily: t.mono, fontSize: 11, color: arch.color, fontWeight: 700 }}>
                    {stat.value}%
                  </span>
                </div>
                <div style={{ height: 5, borderRadius: 3, background: '#252530', overflow: 'hidden' }}>
                  <div style={{
                    width: `${stat.value}%`, height: '100%', borderRadius: 3,
                    background: `linear-gradient(90deg, ${arch.color}, ${t.cyan})`,
                    transition: 'width 1s ease-out',
                    animation: `slideUp 0.8s ease-out ${0.8 + i * 0.15}s both`,
                  }} />
                </div>
              </div>
            ))}
          </div>

          {/* Override link */}
          <button
            onClick={() => setPhase('override')}
            style={{
              background: 'none', border: 'none', color: t.textMuted,
              fontFamily: t.body, fontSize: 12, cursor: 'pointer',
              textDecoration: 'underline', textUnderlineOffset: 3,
            }}
          >
            Not quite right? Choose manually
          </button>
        </div>

        {/* ─── Choose Your Hero ─── */}
        <h2 style={{
          fontFamily: t.display, fontSize: 20, fontWeight: 800,
          color: t.text, marginBottom: 16, textAlign: 'center',
          animation: 'fadeUp 0.5s ease-out 0.9s both',
        }}>
          Choose Your Hero
        </h2>

        {/* Horizontal Carousel */}
        <div
          ref={scrollRef}
          style={{
            display: 'flex',
            gap: 12,
            overflowX: 'auto',
            scrollSnapType: 'x mandatory',
            padding: '8px 4px 16px',
            marginBottom: 8,
            WebkitOverflowScrolling: 'touch',
            msOverflowStyle: 'none',
            scrollbarWidth: 'none',
          }}
        >
          {CHARACTERS.map((char) => {
            const isSelected = avatarSelected === char.id;
            const gChar = gamifChars.find(g => g.id === char.id)!;
            const pixSize = isSelected ? 8 : 6;
            return (
              <button
                key={char.id}
                onClick={() => setAvatarSelected(char.id)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: isSelected ? '16px 12px 10px' : '12px 8px 8px',
                  borderRadius: 16,
                  border: `2px solid ${isSelected ? char.color : t.border}`,
                  background: isSelected ? `${char.color}10` : t.bgCard,
                  cursor: 'pointer',
                  transition: 'all 0.25s ease',
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
                    <AnimatedPixelCanvas character={gChar} size={pixSize} glowColor={char.color} />
                  ) : (
                    <PixelCanvas data={gChar.art} size={pixSize} />
                  )}
                </div>
                {/* Name always visible */}
                <span style={{
                  fontFamily: t.display,
                  fontSize: isSelected ? 13 : 11,
                  fontWeight: isSelected ? 700 : 600,
                  color: isSelected ? t.text : t.textMuted,
                  transition: 'all 0.2s ease',
                }}>
                  {char.name}
                </span>
                {isSelected && (
                  <div style={{
                    position: 'absolute', top: 6, right: 6,
                    width: 16, height: 16, borderRadius: '50%',
                    background: char.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    animation: 'celebratePop 0.3s ease-out',
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
          {CHARACTERS.map((char) => (
            <div
              key={char.id}
              style={{
                width: avatarSelected === char.id ? 16 : 6,
                height: 6,
                borderRadius: 3,
                background: avatarSelected === char.id ? char.color : '#35354A',
                transition: 'all 0.3s ease',
              }}
            />
          ))}
        </div>

        {/* Selected character info */}
        {selectedCharMeta && (
          <p style={{
            fontFamily: t.body, fontSize: 12, color: t.textMuted,
            textAlign: 'center', marginBottom: 24,
          }}>
            {selectedCharMeta.name} — {selectedCharMeta.desc}
          </p>
        )}

        <ContinueButton
          onClick={() => {
            if (avatarSelected) {
              setCharacter(avatarSelected as CharacterId);
              addXP(10);
              setPhase('equipment');
            }
          }}
          disabled={!avatarSelected}
        >
          Choose {selectedCharMeta?.name || 'hero'}
        </ContinueButton>

        <p style={{
          fontFamily: t.body, fontSize: 11, color: t.textMuted,
          marginTop: 10, textAlign: 'center',
        }}>
          Purely cosmetic — you can change anytime in Hero Settings
        </p>
      </div>
    );
  }

  // ─── Phase: Override ───
  if (phase === 'override') {
    return (
      <div style={{ animation: 'fadeUp 0.5s ease-out' }}>
        <StepBar current={2} />

        <h2 style={{
          fontFamily: t.display, fontSize: 24, fontWeight: 800,
          color: t.text, marginBottom: 8,
        }}>
          Choose your archetype
        </h2>
        <p style={{
          fontFamily: t.body, fontSize: 14, color: t.textSecondary, marginBottom: 24,
        }}>
          Pick the learning style that resonates with you
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 32 }}>
          {Object.entries(ARCHETYPES).map(([id, a], i) => {
            const isSelected = overrideSelected === id;
            const isHovered = hoveredArch === id;
            const charDataItem = archetypeChars[id];
            const pixelDataItem = charDataItem ? parseArt(charDataItem.art, charDataItem.palette) : null;
            return (
              <button
                key={id}
                onClick={() => setOverrideSelected(id)}
                onMouseEnter={() => setHoveredArch(id)}
                onMouseLeave={() => setHoveredArch(null)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 16, width: '100%',
                  padding: '16px 20px', borderRadius: 16,
                  border: `2px solid ${isSelected ? a.color : isHovered ? t.borderHover : t.border}`,
                  background: isSelected ? `${a.color}12` : isHovered ? 'rgba(255,255,255,0.02)' : t.bgCard,
                  cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s ease',
                  animation: `fadeUp 0.4s ease-out ${i * 0.06}s both`,
                  boxShadow: isSelected ? `0 0 20px ${a.color}25` : 'none',
                }}
              >
                {pixelDataItem ? (
                  <div style={{
                    filter: isSelected ? `drop-shadow(0 0 8px ${a.color}44)` : 'none',
                    flexShrink: 0, transition: 'filter 0.2s ease',
                  }}>
                    <PixelCanvas data={pixelDataItem} size={3} />
                  </div>
                ) : (
                  <div style={{
                    width: 40, height: 40, borderRadius: 10,
                    background: `${a.color}15`, color: a.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 20, flexShrink: 0,
                  }}>
                    {a.icon}
                  </div>
                )}
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontFamily: t.display, fontSize: 15, fontWeight: 700,
                    color: isSelected ? t.text : '#D4D4D8', marginBottom: 2,
                  }}>
                    {a.icon} {a.name}
                  </div>
                  <div style={{ fontFamily: t.body, fontSize: 12, color: t.textMuted }}>
                    {a.tagline}
                  </div>
                </div>
                <div style={{
                  width: 22, height: 22, borderRadius: '50%',
                  border: `2px solid ${isSelected ? a.color : '#35354A'}`,
                  background: isSelected ? a.color : 'transparent', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s ease',
                }}>
                  {isSelected && (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2.5 6L5 8.5L9.5 3.5" stroke="#FFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={() => { setPhase('reveal'); setOverrideSelected(null); }}
            style={{
              flex: 1, padding: '16px 0', borderRadius: 16,
              border: `1px solid ${t.border}`, background: 'transparent',
              color: t.textSecondary, fontFamily: t.display, fontSize: 15, fontWeight: 700, cursor: 'pointer',
            }}
          >
            Back
          </button>
          <ContinueButton
            onClick={() => {
              if (overrideSelected) {
                setArchetype(overrideSelected as ArchetypeId);
                setPhase('reveal');
              }
            }}
            disabled={!overrideSelected}
            style={{ flex: 2 }}
          />
        </div>
      </div>
    );
  }

  // ─── Phase 3: Equipment Gift ───
  return (
    <div style={{ animation: 'slideUp 0.6s ease-out', textAlign: 'center' }}>
      <StepBar current={2} />

      <h1 style={{
        fontFamily: t.display, fontSize: 26, fontWeight: 900,
        marginBottom: 8,
        background: t.gradient, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
      }}>
        Your First Forge Gift!
      </h1>
      <p style={{
        fontFamily: t.body, fontSize: 14, color: t.textSecondary, marginBottom: 32,
      }}>
        Every hero needs their tools. Here&apos;s your starter equipment.
      </p>

      <EquipmentReveal
        slot="weapon"
        name="Code Hammer"
        rarity="rare"
        onClaim={() => {
          addEquipment('weapon');
          addXP(20);
          setTimeout(() => router.push('/forge'), 800);
        }}
      />
    </div>
  );
}
