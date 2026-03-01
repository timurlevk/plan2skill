'use client';

import React, { useMemo } from 'react';
import { useOnboardingStore, useProgressionStore, getLevelInfo } from '@plan2skill/store';
import { NeonIcon } from '../../(onboarding)/_components/NeonIcon';
import { t, rarity } from '../../(onboarding)/_components/tokens';
import { CHARACTERS, charArtStrings, charPalettes } from '../../(onboarding)/_components/characters';
import { parseArt, AnimatedPixelCanvas } from '../../(onboarding)/_components/PixelEngine';
import { XPBar } from '../../(onboarding)/_components/XPBar';
import { ARCHETYPES } from '../../(onboarding)/_data/archetypes';
import { MasteryRing } from '../home/_components/MasteryRing';
import { AchievementBadge } from '../home/_components/AchievementBadge';
import { ACHIEVEMENTS } from '../home/_data/achievements';
import { useSpacedRepetition } from '../home/_hooks/useSpacedRepetition';
import type { AchievementRarity } from '../home/_data/achievements';

// ═══════════════════════════════════════════
// HERO CARD — Full character profile page
// Character, stats, attributes, equipment, archetype
// ═══════════════════════════════════════════

const ATTRIBUTES = [
  { key: 'MAS', name: 'Mastery',     icon: 'shield'  as const, color: '#9D7AFF' },
  { key: 'INS', name: 'Insight',     icon: 'sparkle' as const, color: '#3B82F6' },
  { key: 'INF', name: 'Influence',   icon: 'users'   as const, color: '#FF6B8A' },
  { key: 'RES', name: 'Resilience',  icon: 'trophy'  as const, color: '#6EE7B7' },
  { key: 'VER', name: 'Versatility', icon: 'compass' as const, color: '#4ECDC4' },
  { key: 'DIS', name: 'Discovery',   icon: 'star'    as const, color: '#FFD166' },
];

const EQUIPMENT_SLOTS = [
  { slot: 'weapon',    name: 'Weapon',    skill: 'Hard Skills',     icon: 'lightning' as const },
  { slot: 'shield',    name: 'Shield',    skill: 'Communication',   icon: 'shield'   as const },
  { slot: 'armor',     name: 'Armor',     skill: 'Personal Brand',  icon: 'medal'    as const },
  { slot: 'helmet',    name: 'Helmet',    skill: 'Strategy',        icon: 'crown'    as const },
  { slot: 'boots',     name: 'Boots',     skill: 'Adaptability',    icon: 'rocket'   as const },
  { slot: 'ring',      name: 'Ring',      skill: 'Expertise',       icon: 'gem'      as const },
  { slot: 'companion', name: 'Companion', skill: 'Hobbies',         icon: 'sparkle'  as const },
];

export default function HeroCardPage() {
  const { characterId, archetypeId, receivedEquipment } = useOnboardingStore();
  const {
    totalXp, level, coins,
    currentStreak, longestStreak,
    energyCrystals, maxEnergyCrystals,
    unlockedAchievements,
  } = useProgressionStore();
  const mastery = useSpacedRepetition();

  const charMeta = CHARACTERS.find(c => c.id === characterId);
  const archetype = archetypeId ? ARCHETYPES[archetypeId] : null;

  const charData = useMemo(() => {
    if (!characterId || !charArtStrings[characterId] || !charPalettes[characterId]) return null;
    return {
      id: characterId,
      artString: charArtStrings[characterId]!,
      palette: charPalettes[characterId]!,
      art: parseArt(charArtStrings[characterId]!, charPalettes[characterId]!),
    };
  }, [characterId]);

  const levelInfo = getLevelInfo(totalXp);
  const crystalDots = Array.from({ length: maxEnergyCrystals }, (_, i) =>
    i < energyCrystals ? '●' : '○'
  ).join('');

  return (
    <div style={{ animation: 'fadeUp 0.5s ease-out' }}>
      {/* ─── Page Title ─── */}
      <h1 style={{
        display: 'flex', alignItems: 'center', gap: 10,
        fontFamily: t.display, fontSize: 26, fontWeight: 900,
        color: t.text, marginBottom: 24,
      }}>
        <NeonIcon type="shield" size={24} color="rose" />
        Hero Card
      </h1>

      {/* ─── Character Hero Section ─── */}
      <div style={{
        padding: 24, borderRadius: 16,
        background: t.bgCard, border: `1px solid ${t.border}`,
        marginBottom: 16,
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Subtle glow behind character */}
        {charMeta && (
          <div style={{
            position: 'absolute', top: '10%', left: '50%', transform: 'translateX(-50%)',
            width: 200, height: 200, borderRadius: '50%',
            background: `radial-gradient(circle, ${charMeta.color}15 0%, transparent 70%)`,
            pointerEvents: 'none',
          }} />
        )}

        {/* Character pixel art — large */}
        {charData && (
          <div style={{
            display: 'flex', justifyContent: 'center', marginBottom: 16,
            animation: 'float 3s ease-in-out infinite',
            position: 'relative', zIndex: 1,
          }}>
            <div style={{
              padding: 12, borderRadius: '50%',
              background: `${charMeta?.color || t.violet}10`,
              border: `2px solid ${charMeta?.color || t.violet}30`,
              animation: 'glowPulse 3s ease-in-out infinite',
            }}>
              <AnimatedPixelCanvas character={charData} size={6} glowColor={charMeta?.color} />
            </div>
          </div>
        )}

        {/* Name */}
        <h2 style={{
          fontFamily: t.display, fontSize: 22, fontWeight: 900,
          color: t.text, marginBottom: 6, position: 'relative', zIndex: 1,
        }}>
          {charMeta?.name || 'Hero'}
        </h2>

        {/* Level badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '4px 14px', borderRadius: 20, marginBottom: 12,
          background: `${t.violet}15`, border: `1px solid ${t.violet}30`,
        }}>
          <NeonIcon type="lightning" size={12} color="violet" />
          <span style={{ fontFamily: t.mono, fontSize: 12, fontWeight: 800, color: t.violet }}>
            Level {levelInfo.level}
          </span>
        </div>

        {/* XP to next level */}
        <div style={{ maxWidth: 280, margin: '0 auto 14px', position: 'relative', zIndex: 1 }}>
          <XPBar xp={totalXp} level={levelInfo.level} />
          <p style={{ fontFamily: t.mono, fontSize: 10, color: t.textMuted, marginTop: 4 }}>
            {levelInfo.currentXp} / {levelInfo.xpForNextLevel} XP to Level {levelInfo.level + 1}
          </p>
        </div>

        {/* Archetype pill */}
        {archetype && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '6px 16px', borderRadius: 20,
            background: `${archetype.color}12`, border: `1px solid ${archetype.color}30`,
          }}>
            <span style={{ fontSize: 16, color: archetype.color }}>{archetype.icon}</span>
            <span style={{ fontFamily: t.display, fontSize: 13, fontWeight: 700, color: archetype.color }}>
              {archetype.name}
            </span>
            <span style={{
              fontFamily: t.mono, fontSize: 9, fontWeight: 700,
              color: archetype.color, opacity: 0.7,
            }}>
              +10% XP bonus
            </span>
          </div>
        )}
      </div>

      {/* ─── Stats Grid ─── */}
      <div className="grid grid-cols-3" style={{ gap: 12, marginBottom: 16 }}>
        {/* Streak */}
        <div style={{
          padding: 16, borderRadius: 16, textAlign: 'center',
          background: t.bgCard, border: `1px solid ${t.border}`,
          animation: 'fadeUp 0.4s ease-out 0.1s both',
        }}>
          <NeonIcon type="fire" size={24} color="gold" style={{ marginBottom: 8 }} />
          <div style={{ fontFamily: t.mono, fontSize: 22, fontWeight: 800, color: t.gold, marginBottom: 2 }}>
            {currentStreak}
          </div>
          <div style={{ fontFamily: t.body, fontSize: 11, color: t.textSecondary }}>
            day streak
          </div>
          <div style={{ fontFamily: t.mono, fontSize: 9, color: t.textMuted, marginTop: 4 }}>
            Best: {longestStreak} days
          </div>
        </div>

        {/* Energy */}
        <div style={{
          padding: 16, borderRadius: 16, textAlign: 'center',
          background: t.bgCard, border: `1px solid ${t.border}`,
          animation: 'fadeUp 0.4s ease-out 0.15s both',
        }}>
          <NeonIcon type="gem" size={24} color="cyan" style={{ marginBottom: 8 }} />
          <div style={{
            fontFamily: t.mono, fontSize: 18, fontWeight: 800, color: t.cyan,
            marginBottom: 2, letterSpacing: 4,
          }}>
            {crystalDots}
          </div>
          <div style={{ fontFamily: t.body, fontSize: 11, color: t.textSecondary }}>
            energy
          </div>
          <div style={{ fontFamily: t.mono, fontSize: 9, color: t.textMuted, marginTop: 4 }}>
            {energyCrystals}/{maxEnergyCrystals} crystals
          </div>
        </div>

        {/* XP & Level */}
        <div style={{
          padding: 16, borderRadius: 16, textAlign: 'center',
          background: t.bgCard, border: `1px solid ${t.border}`,
          animation: 'fadeUp 0.4s ease-out 0.2s both',
        }}>
          <NeonIcon type="xp" size={24} color="violet" style={{ marginBottom: 8 }} />
          <div style={{ fontFamily: t.mono, fontSize: 22, fontWeight: 800, color: t.violet, marginBottom: 2 }}>
            {totalXp}
          </div>
          <div style={{ fontFamily: t.body, fontSize: 11, color: t.textSecondary }}>
            total XP
          </div>
          <div style={{ fontFamily: t.mono, fontSize: 9, color: t.textMuted, marginTop: 4 }}>
            Level {levelInfo.level}
          </div>
        </div>
      </div>

      {/* ─── Hero Attributes ─── */}
      <div style={{
        padding: 20, borderRadius: 16,
        background: t.bgCard, border: `1px solid ${t.border}`,
        marginBottom: 16, animation: 'fadeUp 0.4s ease-out 0.25s both',
      }}>
        <h3 style={{
          display: 'flex', alignItems: 'center', gap: 6,
          fontFamily: t.display, fontSize: 13, fontWeight: 700,
          color: t.textSecondary, textTransform: 'uppercase',
          letterSpacing: '0.08em', marginBottom: 16,
        }}>
          <NeonIcon type="chart" size={14} color="violet" />
          Hero Attributes
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {ATTRIBUTES.map((attr, i) => (
            <div key={attr.key} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              animation: `fadeUp 0.3s ease-out ${0.3 + i * 0.05}s both`,
            }}>
              <NeonIcon type={attr.icon} size={16} color={attr.color} />
              <span style={{
                fontFamily: t.mono, fontSize: 11, fontWeight: 800,
                color: attr.color, width: 30, flexShrink: 0,
              }}>
                {attr.key}
              </span>
              <div style={{
                flex: 1, height: 6, borderRadius: 3,
                background: '#252530', overflow: 'hidden',
              }}>
                <div style={{
                  width: '10%', height: '100%', borderRadius: 3,
                  background: attr.color,
                  transition: 'width 0.8s ease-out',
                  boxShadow: `0 0 6px ${attr.color}40`,
                }} />
              </div>
              {/* TODO Phase 5F: compute from equipment + mastery */}
              <span style={{
                fontFamily: t.mono, fontSize: 10, fontWeight: 700,
                color: t.textMuted, width: 24, textAlign: 'right', flexShrink: 0,
              }}>
                10
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Equipment Loadout ─── */}
      <div style={{
        padding: 20, borderRadius: 16,
        background: t.bgCard, border: `1px solid ${t.border}`,
        marginBottom: 16, animation: 'fadeUp 0.4s ease-out 0.35s both',
      }}>
        <h3 style={{
          display: 'flex', alignItems: 'center', gap: 6,
          fontFamily: t.display, fontSize: 13, fontWeight: 700,
          color: t.textSecondary, textTransform: 'uppercase',
          letterSpacing: '0.08em', marginBottom: 16,
        }}>
          <NeonIcon type="gift" size={14} color="gold" />
          Equipment Loadout
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4" style={{ gap: 8 }}>
          {EQUIPMENT_SLOTS.map((slot, i) => {
            const equipped = receivedEquipment.includes(slot.slot);
            const slotRarity = equipped ? rarity.rare : rarity.common;

            return (
              <div
                key={slot.slot}
                style={{
                  padding: 14, borderRadius: 14, textAlign: 'center',
                  background: equipped ? `${slotRarity.color}08` : t.bgElevated,
                  border: `1px solid ${equipped ? `${slotRarity.color}30` : t.border}`,
                  opacity: equipped ? 1 : 0.5,
                  animation: equipped ? 'glowPulse 3s ease-in-out infinite' : 'none',
                  transition: 'all 0.3s ease',
                }}
              >
                <div style={{
                  width: 44, height: 44, borderRadius: 12, margin: '0 auto 8px',
                  background: equipped ? `${slotRarity.color}15` : '#18181F',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <NeonIcon
                    type={equipped ? slot.icon : 'lock'}
                    size={22}
                    color={equipped ? slotRarity.color : 'muted'}
                    active={equipped}
                  />
                </div>
                <div style={{
                  fontFamily: t.display, fontSize: 12, fontWeight: 700,
                  color: equipped ? t.text : t.textMuted, marginBottom: 2,
                }}>
                  {slot.name}
                </div>
                {equipped ? (
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 3,
                    fontFamily: t.mono, fontSize: 8, fontWeight: 700,
                    color: slotRarity.color, textTransform: 'uppercase',
                  }}>
                    {slotRarity.icon} {slotRarity.label}
                  </span>
                ) : (
                  <div style={{ fontFamily: t.body, fontSize: 9, color: t.textMuted }}>
                    Complete quests to unlock
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── Skill Mastery (Phase 5D) ─── */}
      {mastery.skills.length > 0 && (
        <div style={{
          padding: 20, borderRadius: 16,
          background: t.bgCard, border: `1px solid ${t.border}`,
          marginBottom: 16, animation: 'fadeUp 0.4s ease-out 0.4s both',
        }}>
          <h3 style={{
            display: 'flex', alignItems: 'center', gap: 6,
            fontFamily: t.display, fontSize: 13, fontWeight: 700,
            color: t.textSecondary, textTransform: 'uppercase' as const,
            letterSpacing: '0.08em', marginBottom: 16,
          }}>
            <NeonIcon type="book" size={14} color="cyan" />
            Skill Mastery
            <span style={{
              marginLeft: 'auto', fontFamily: t.mono, fontSize: 10,
              fontWeight: 700, color: t.cyan,
            }}>
              {mastery.masteredCount}/{mastery.totalSkills} mastered
            </span>
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
            gap: 12,
          }}>
            {mastery.skills.map((skill) => (
              <div key={skill.skillId} style={{ textAlign: 'center' }}>
                <MasteryRing
                  masteryLevel={skill.masteryLevel}
                  skillDomain={skill.skillDomain}
                  isOverdue={skill.isOverdue}
                  size="lg"
                  showLabel
                />
                <div style={{
                  fontFamily: t.mono, fontSize: 9, color: t.textMuted, marginTop: 4,
                }}>
                  {skill.totalReviews} reviews
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── Achievement Board (Phase 5E) ─── */}
      <div style={{
        padding: 20, borderRadius: 16,
        background: t.bgCard, border: `1px solid ${t.border}`,
        marginBottom: 16, animation: 'fadeUp 0.4s ease-out 0.45s both',
      }}>
        <h3 style={{
          display: 'flex', alignItems: 'center', gap: 6,
          fontFamily: t.display, fontSize: 13, fontWeight: 700,
          color: t.textSecondary, textTransform: 'uppercase' as const,
          letterSpacing: '0.08em', marginBottom: 16,
        }}>
          <NeonIcon type="trophy" size={14} color="gold" />
          Achievement Board
          <span style={{
            marginLeft: 'auto', fontFamily: t.mono, fontSize: 10,
            fontWeight: 700, color: t.gold,
          }}>
            {unlockedAchievements.length}/{ACHIEVEMENTS.length}
          </span>
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
          gap: 12,
        }}>
          {ACHIEVEMENTS.map((ach) => {
            const isUnlocked = unlockedAchievements.includes(ach.id);
            return (
              <AchievementBadge
                key={ach.id}
                title={ach.title}
                icon={ach.icon}
                rarity={ach.rarity as AchievementRarity}
                state={isUnlocked ? 'unlocked' : 'locked'}
                size="md"
              />
            );
          })}
        </div>
      </div>

      {/* ─── Archetype Detail ─── */}
      {archetype && (
        <div style={{
          padding: 20, borderRadius: 16,
          background: t.bgCard, border: `1px solid ${t.border}`,
          animation: 'fadeUp 0.4s ease-out 0.4s both',
        }}>
          <h3 style={{
            fontFamily: t.display, fontSize: 13, fontWeight: 700,
            color: t.textSecondary, textTransform: 'uppercase',
            letterSpacing: '0.08em', marginBottom: 16,
          }}>
            Your Archetype
          </h3>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 16 }}>
            <div style={{
              width: 52, height: 52, borderRadius: 14,
              background: `${archetype.color}15`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 28, color: archetype.color, flexShrink: 0,
              border: `1px solid ${archetype.color}30`,
            }}>
              {archetype.icon}
            </div>
            <div>
              <h4 style={{
                fontFamily: t.display, fontSize: 18, fontWeight: 800,
                color: t.text, marginBottom: 4,
              }}>
                {archetype.name}
              </h4>
              <p style={{
                fontFamily: t.body, fontSize: 13, color: t.textSecondary,
                marginBottom: 4, lineHeight: 1.4,
              }}>
                {archetype.tagline}
              </p>
              <p style={{
                fontFamily: t.body, fontSize: 12, color: t.textMuted, lineHeight: 1.4,
              }}>
                {archetype.bestFor}
              </p>
            </div>
          </div>

          {/* Archetype stats */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {archetype.stats.map((stat, i) => (
              <div key={stat.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ fontFamily: t.body, fontSize: 11, fontWeight: 600, color: t.textSecondary }}>
                    {stat.label}
                  </span>
                  <span style={{ fontFamily: t.mono, fontSize: 10, fontWeight: 700, color: archetype.color }}>
                    {stat.value}%
                  </span>
                </div>
                <div style={{ height: 4, borderRadius: 2, background: '#252530', overflow: 'hidden' }}>
                  <div style={{
                    width: `${stat.value}%`, height: '100%', borderRadius: 2,
                    background: `linear-gradient(90deg, ${archetype.color}, ${t.cyan})`,
                    transition: 'width 0.8s ease-out',
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
