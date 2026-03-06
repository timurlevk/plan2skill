'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useOnboardingStore, useProgressionStore, useCharacterStore, getLevelInfo, useI18nStore } from '@plan2skill/store';
import { NeonIcon } from '../../(onboarding)/_components/NeonIcon';
import { t, rarity } from '../../(onboarding)/_components/tokens';
import { CHARACTERS, charArtStrings, charPalettes } from '../../(onboarding)/_components/characters';
import {
  parseArt,
  AnimatedCanvasRenderer,
} from '../../(onboarding)/_components/PixelEngine';
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
  { key: 'STR', name: 'Strength',     icon: 'shield'  as const, color: '#9D7AFF',
    description: 'Your technical might. Grows from Hard Skills milestones and equipment.' },
  { key: 'INT', name: 'Intelligence', icon: 'sparkle' as const, color: '#3B82F6',
    description: 'Strategic thinking. Grows from Strategy milestones and equipment.' },
  { key: 'CHA', name: 'Charisma',     icon: 'users'   as const, color: t.rose,
    description: 'Communication and leadership. Grows from Communication milestones.' },
  { key: 'CON', name: 'Constitution', icon: 'trophy'  as const, color: '#6EE7B7',
    description: 'Consistency and endurance. Grows from sustained practice.' },
  { key: 'DEX', name: 'Dexterity',    icon: 'compass' as const, color: '#4ECDC4',
    description: 'Adaptability and breadth. Grows from cross-domain exploration.' },
  { key: 'WIS', name: 'Wisdom',       icon: 'star'    as const, color: '#FFD166',
    description: 'Curiosity and exploration. Grows from Hobbies milestones.' },
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

// Rarity config now comes from canonical `rarity` import (tokens.ts)

export default function HeroCardPage() {
  const tr = useI18nStore((s) => s.t);

  // Reduced-motion check — §N MICRO_ANIMATION_GUIDELINES §10 (BLOCKER)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const { characterId, archetypeId, receivedEquipment } = useOnboardingStore();
  const {
    totalXp, level, coins,
    currentStreak, longestStreak,
    energyCrystals, maxEnergyCrystals,
    unlockedAchievements,
  } = useProgressionStore();
  const { computedAttributes, inventory, equipment } = useCharacterStore();
  const mastery = useSpacedRepetition();

  // Phase 5H: Attribute tooltip (hover/click popover)
  const [tooltipAttr, setTooltipAttr] = useState<string | null>(null);

  // Equipment slot hover/press micro-interactions — §N Tier Micro (100–400ms)
  const [hoveredSlot, setHoveredSlot] = useState<string | null>(null);
  const [pressedSlot, setPressedSlot] = useState<string | null>(null);

  const charMeta = CHARACTERS.find(c => c.id === characterId);
  const archetype = archetypeId ? ARCHETYPES[archetypeId] : null;

  const charData = useMemo(() => {
    if (!characterId) return null;
    if (!charArtStrings[characterId] || !charPalettes[characterId]) return null;
    return {
      id: characterId,
      artString: charArtStrings[characterId]!,
      palette: charPalettes[characterId]!,
    };
  }, [characterId]);

  const levelInfo = getLevelInfo(totalXp);
  // Energy crystals rendered as NeonIcon diamonds (replaces ●○ text)

  return (
    <div style={{ animation: prefersReducedMotion ? 'none' : 'fadeUp 0.4s ease-out' }}>
      {/* ─── Page Title ─── */}
      <h1 style={{
        display: 'flex', alignItems: 'center', gap: 10,
        fontFamily: t.display, fontSize: 26, fontWeight: 900,
        color: t.text, marginBottom: 24,
      }}>
        <NeonIcon type="crown" size={24} color="violet" />
        {tr('herocard.title')}
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
        {/* Subtle glow behind character — static radial-gradient, no glowPulse (box-shadow creates visible ellipses) */}
        {charMeta && (
          <div aria-hidden="true" style={{
            position: 'absolute', top: '5%', left: '50%', transform: 'translateX(-50%)',
            width: 240, height: 240, borderRadius: '50%',
            background: `radial-gradient(circle, ${charMeta.color}15 0%, transparent 70%)`,
            pointerEvents: 'none',
            filter: 'blur(20px)',
          }} />
        )}

        {/* Character pixel art — large */}
        {charData && (
          <div style={{
            display: 'flex', justifyContent: 'center', marginBottom: 16,
            animation: prefersReducedMotion ? 'none' : 'float 3s ease-in-out infinite',
            position: 'relative', zIndex: 1,
          }}>
            <div style={{
              padding: 12, borderRadius: '50%',
              background: `${charMeta?.color || t.violet}10`,
              border: `2px solid ${charMeta?.color || t.violet}30`,
            }}>
              <AnimatedCanvasRenderer character={charData} size={6} glowColor={charMeta?.color} />
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
            {tr('herocard.streak').replace('{n}', String(currentStreak))}
          </div>
          <div style={{ fontFamily: t.mono, fontSize: 9, color: t.textMuted, marginTop: 4 }}>
            {tr('herocard.best_streak').replace('{n}', String(longestStreak))}
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
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 4, marginBottom: 2,
          }}>
            {Array.from({ length: maxEnergyCrystals }, (_, i) => (
              <NeonIcon key={i} type={i < energyCrystals ? 'crystalFull' : 'crystalEmpty'} size={18} color="cyan" />
            ))}
          </div>
          <div style={{ fontFamily: t.body, fontSize: 11, color: t.textSecondary }}>
            {tr('herocard.energy')}
          </div>
          <div style={{ fontFamily: t.mono, fontSize: 9, color: t.textMuted, marginTop: 4 }}>
            {tr('herocard.crystals').replace('{n}', String(energyCrystals)).replace('{max}', String(maxEnergyCrystals))}
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
            {tr('herocard.total_xp')}
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
          <NeonIcon type="hexWeb" size={14} color="violet" />
          {tr('herocard.attributes')}
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {ATTRIBUTES.map((attr, i) => {
            const totalVal = computedAttributes.total[attr.key as keyof typeof computedAttributes.total] ?? 10;
            const baseVal = computedAttributes.base[attr.key as keyof typeof computedAttributes.base] ?? 10;
            const bonusVal = computedAttributes.bonus[attr.key as keyof typeof computedAttributes.bonus] ?? 0;
            const barPercent = Math.min(100, (totalVal / 100) * 100);
            const isTooltipOpen = tooltipAttr === attr.key;

            return (
              <div key={attr.key} style={{ position: 'relative' }}>
                <div
                  onClick={() => setTooltipAttr(isTooltipOpen ? null : attr.key)}
                  onMouseEnter={() => setTooltipAttr(attr.key)}
                  onMouseLeave={() => setTooltipAttr(null)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
                    animation: `fadeUp 0.3s ease-out ${0.3 + i * 0.05}s both`,
                  }}
                >
                  <NeonIcon type={attr.icon} size={16} color={attr.color} />
                  <span style={{
                    fontFamily: t.mono, fontSize: 11, fontWeight: 800,
                    color: attr.color, width: 30, flexShrink: 0,
                  }}>
                    {attr.key}
                  </span>
                  <div
                    role="progressbar"
                    aria-valuenow={totalVal}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${attr.name}: ${totalVal}. ${attr.description}`}
                    style={{
                      flex: 1, height: 6, borderRadius: 3,
                      background: t.border, overflow: 'hidden',
                    }}
                  >
                    <div style={{
                      width: '100%', height: '100%', borderRadius: 3,
                      background: attr.color,
                      transform: `scaleX(${barPercent / 100})`,
                      transformOrigin: 'left',
                      transition: 'transform 0.8s ease-out',
                      boxShadow: `0 0 6px ${attr.color}40`,
                    }} />
                  </div>
                  <span style={{
                    fontFamily: t.mono, fontSize: 10, fontWeight: 700,
                    color: bonusVal > 0 ? attr.color : t.textMuted,
                    width: 42, textAlign: 'right', flexShrink: 0,
                  }}>
                    {totalVal}{bonusVal > 0 && (
                      <span style={{ fontSize: 8, color: t.mint }}> +{bonusVal}</span>
                    )}
                  </span>
                </div>

                {/* Phase 5H: Attribute Tooltip — Micro tier (fadeUp 0.15s) */}
                {isTooltipOpen && (
                  <div
                    role="tooltip"
                    aria-label={`${attr.name} details`}
                    style={{
                      position: 'absolute', top: '100%', left: 30, right: 0,
                      marginTop: 4, padding: '10px 14px', borderRadius: 12,
                      background: t.bgElevated, border: `1px solid ${attr.color}30`,
                      boxShadow: `0 8px 24px rgba(0,0,0,0.4), 0 0 12px ${attr.color}15`,
                      zIndex: 10,
                      animation: prefersReducedMotion ? 'none' : 'fadeUp 0.15s ease-out',
                    }}
                  >
                    <div style={{
                      fontFamily: t.display, fontSize: 12, fontWeight: 800,
                      color: attr.color, marginBottom: 4,
                    }}>
                      {attr.name}
                    </div>
                    <div style={{
                      fontFamily: t.body, fontSize: 11, color: t.textSecondary,
                      lineHeight: 1.4, marginBottom: 8,
                    }}>
                      {attr.description}
                    </div>
                    <div style={{
                      display: 'flex', gap: 12,
                      fontFamily: t.mono, fontSize: 10, color: t.textMuted,
                    }}>
                      <span>Base: {baseVal}</span>
                      <span style={{ color: bonusVal > 0 ? t.mint : t.textMuted }}>
                        Equipment: {bonusVal > 0 ? `+${bonusVal}` : '—'}
                      </span>
                      <span style={{ color: attr.color, fontWeight: 700 }}>
                        Total: {totalVal}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
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
          <NeonIcon type="backpack" size={14} color="gold" />
          {tr('herocard.equipment')}
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4" style={{ gap: 8 }}>
          {EQUIPMENT_SLOTS.map((slot) => {
            // Phase W4: check real equipped items (equipment = actually equipped, not just owned)
            const equippedItem = equipment.find(
              (item) => item.slot === slot.slot
            );
            // Look up display name from inventory (has catalog data)
            const inventoryItem = equippedItem
              ? inventory.find((inv) => inv.itemId === equippedItem.itemId)
              : undefined;
            // Fallback to onboarding receivedEquipment for backward compat
            const isEquipped = !!equippedItem || receivedEquipment.includes(slot.slot);
            const itemRarity = equippedItem
              ? (rarity[equippedItem.rarity as keyof typeof rarity] ?? rarity.common)
              : (isEquipped ? rarity.rare : rarity.common);

            // Epic/Legendary rarity keys for shimmer check
            const rarityKey = equippedItem?.rarity ?? (isEquipped ? 'rare' : 'common');
            const hasShimmer = isEquipped && (rarityKey === 'epic' || rarityKey === 'legendary') && !prefersReducedMotion;

            const isHovered = hoveredSlot === slot.slot;
            const isPressed = pressedSlot === slot.slot;

            return (
              <div
                key={slot.slot}
                onMouseEnter={() => setHoveredSlot(slot.slot)}
                onMouseLeave={() => { setHoveredSlot(null); setPressedSlot(null); }}
                onMouseDown={() => setPressedSlot(slot.slot)}
                onMouseUp={() => setPressedSlot(null)}
                style={{
                  padding: 14, borderRadius: 14, textAlign: 'center',
                  background: isEquipped ? `${itemRarity.color}08` : t.bgElevated,
                  border: `1px solid ${isEquipped ? `${itemRarity.color}30` : t.border}`,
                  opacity: isEquipped ? 1 : 0.5,
                  boxShadow: isPressed
                    ? (isEquipped ? `0 2px 4px ${itemRarity.color}15` : 'none')
                    : isHovered
                      ? `0 8px 16px rgba(0,0,0,0.3)`
                      : (isEquipped ? `0 0 8px ${itemRarity.color}20` : 'none'),
                  transform: isPressed ? 'scale(0.98)' : isHovered ? 'translateY(-2px)' : 'none',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.3s ease, opacity 0.3s ease',
                  animation: hasShimmer ? 'glowPulse 8s ease-in-out infinite' : 'none',
                }}
              >
                <div style={{
                  width: 44, height: 44, borderRadius: 12, margin: '0 auto 8px',
                  background: isEquipped ? `${itemRarity.color}15` : '#18181F',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <NeonIcon
                    type={isEquipped ? slot.icon : 'lock'}
                    size={22}
                    color={isEquipped ? itemRarity.color : 'muted'}
                    active={isEquipped}
                  />
                </div>
                <div style={{
                  fontFamily: t.display, fontSize: 12, fontWeight: 700,
                  color: isEquipped ? t.text : t.textMuted, marginBottom: 2,
                }}>
                  {inventoryItem?.name ?? slot.name}
                </div>
                {isEquipped ? (
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 3,
                    fontFamily: t.mono, fontSize: 8, fontWeight: 700,
                    color: itemRarity.color, textTransform: 'uppercase',
                  }}>
                    {itemRarity.icon} {itemRarity.label}
                  </span>
                ) : (
                  <div style={{ fontFamily: t.body, fontSize: 9, color: t.textMuted }}>
                    {tr('herocard.locked')}
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
            {tr('herocard.skill_mastery')}
            <span style={{
              marginLeft: 'auto', fontFamily: t.mono, fontSize: 10,
              fontWeight: 700, color: t.cyan,
            }}>
              {tr('herocard.mastered_count').replace('{n}', String(mastery.masteredCount)).replace('{total}', String(mastery.totalSkills))}
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
          {tr('herocard.achievements')}
          <span style={{
            marginLeft: 'auto', fontFamily: t.mono, fontSize: 10,
            fontWeight: 700, color: t.gold,
          }}>
            {tr('herocard.achievement_count').replace('{n}', String(unlockedAchievements.length)).replace('{total}', String(ACHIEVEMENTS.length))}
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
            {tr('herocard.archetype')}
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
                <div
                  role="progressbar"
                  aria-valuenow={stat.value}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${stat.label}: ${stat.value}%`}
                  style={{ height: 4, borderRadius: 2, background: t.border, overflow: 'hidden' }}
                >
                  <div style={{
                    width: '100%', height: '100%', borderRadius: 2,
                    background: `linear-gradient(90deg, ${archetype.color}, ${t.cyan})`,
                    transform: `scaleX(${stat.value / 100})`,
                    transformOrigin: 'left',
                    transition: 'transform 0.8s ease-out',
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
