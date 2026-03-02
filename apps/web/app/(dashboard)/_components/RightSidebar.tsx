'use client';

import React from 'react';
import Link from 'next/link';
import { useProgressionStore, useCharacterStore, getLevelInfo } from '@plan2skill/store';
import { t } from '../../(onboarding)/_components/tokens';
import { NeonIcon } from '../../(onboarding)/_components/NeonIcon';
import type { NeonIconType } from '../../(onboarding)/_components/NeonIcon';
import { WeeklyChallenges } from '../home/_components/WeeklyChallenges';
import { MasteryRing } from '../home/_components/MasteryRing';
import { useWeeklyChallenges } from '../home/_hooks/useWeeklyChallenges';
import { useSpacedRepetition } from '../home/_hooks/useSpacedRepetition';

// ═══════════════════════════════════════════
// RIGHT SIDEBAR — Refactored (UI/UX overhaul)
// BL-004: Secondary dashboard content
//
// Visual hierarchy (UX-R121):
//   1. Hero Stats — XP bar, level, streak, energy, coins (Primary)
//   2. Weekly Quests — compact challenge rows (Primary)
//   3. Skill Mastery — limited rings + due CTA (Secondary)
//   4. Equipment Preview — equipped items summary (Secondary)
//   5. Community — vertical stack, compact (Tertiary)
//
// Fixes:
//   - Social cards stacked vertically (was 2-col in 260px — broken)
//   - Added progression stats (UX-R110: XP bar in sidebar)
//   - Added equipment preview (Phase 5F)
//   - Mastery capped at 4 visible (UX-R144: overwhelm prevention)
//   - Consistent section headers
//   - Empty state with RPG CTA
// ═══════════════════════════════════════════

// ─── Shared Section Header ─────────────────────────────────────

function SectionHeader({ icon, color, label, badge }: {
  icon: NeonIconType;
  color: string;
  label: string;
  badge?: React.ReactNode;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
      <NeonIcon type={icon} size={14} color={color} />
      <span style={{
        fontFamily: t.display, fontSize: 10, fontWeight: 700,
        color: t.textSecondary, textTransform: 'uppercase' as const,
        letterSpacing: '0.06em', flex: 1,
      }}>
        {label}
      </span>
      {badge}
    </div>
  );
}

// ─── Section Card Wrapper ──────────────────────────────────────

function SidebarCard({ children, style }: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div style={{
      padding: 16,
      borderRadius: 16,
      background: t.bgCard,
      border: `1px solid ${t.border}`,
      ...style,
    }}>
      {children}
    </div>
  );
}

// ─── Equipment slot config ─────────────────────────────────────

const SLOT_ICONS: Record<string, { icon: NeonIconType; label: string }> = {
  weapon:    { icon: 'lightning', label: 'Weapon' },
  shield:    { icon: 'shield',   label: 'Shield' },
  armor:     { icon: 'gem',      label: 'Armor' },
  helmet:    { icon: 'crown',    label: 'Helm' },
  boots:     { icon: 'rocket',   label: 'Boots' },
  ring:      { icon: 'sparkle',  label: 'Ring' },
  companion: { icon: 'star',     label: 'Companion' },
};

const RARITY_COLORS: Record<string, string> = {
  common: '#71717A',
  uncommon: '#6EE7B7',
  rare: '#3B82F6',
  epic: '#9D7AFF',
  legendary: '#FFD166',
};

// ═══════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════

export function RightSidebar() {
  const { totalXp, level, currentStreak, energyCrystals, maxEnergyCrystals, coins, quietMode } = useProgressionStore();
  const { equipment, inventory, computedAttributes } = useCharacterStore();
  const weekly = useWeeklyChallenges();
  const mastery = useSpacedRepetition();

  const levelInfo = getLevelInfo(totalXp);
  const xpPct = Math.min(100, levelInfo.progress * 100);

  const hasWeekly = weekly.challenges.length > 0;
  const hasMastery = mastery.skills.length > 0;
  const hasEquipment = equipment.length > 0;
  const hasContent = hasWeekly || hasMastery || hasEquipment;

  return (
    <div
      role="complementary"
      aria-label="Hero sidebar — stats, quests, mastery, equipment"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        paddingTop: 24,
        paddingBottom: 32,
        overflowY: 'auto',
        overflowX: 'hidden',
        height: '100%',
      }}
    >
      {/* ─── 1. Hero Stats (Primary — UX-R110, UX-R111) ─── */}
      <SidebarCard>
        {/* Level + XP Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          {/* Level badge */}
          <div style={{
            width: 36, height: 36, borderRadius: 12,
            background: `${t.violet}18`,
            border: `1.5px solid ${t.violet}40`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <span style={{
              fontFamily: t.mono, fontSize: 14, fontWeight: 900, color: t.violet,
            }}>
              {level}
            </span>
          </div>

          {/* XP progress */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{
                fontFamily: t.display, fontSize: 11, fontWeight: 700, color: t.text,
              }}>
                Level {level}
              </span>
              <span style={{
                fontFamily: t.mono, fontSize: 9, fontWeight: 700, color: t.textMuted,
              }}>
                {levelInfo.currentXp}/{levelInfo.xpForNextLevel} XP
              </span>
            </div>
            <div
              role="progressbar"
              aria-valuenow={levelInfo.currentXp}
              aria-valuemax={levelInfo.xpForNextLevel}
              aria-label={`Level ${level}: ${levelInfo.currentXp} of ${levelInfo.xpForNextLevel} XP`}
              style={{
                height: 6, borderRadius: 3,
                background: '#252530', overflow: 'hidden',
              }}
            >
              <div style={{
                width: `${xpPct}%`, height: '100%', borderRadius: 3,
                background: t.gradient,
                transition: 'width 0.8s ease-out',
                boxShadow: xpPct > 85 ? `0 0 8px ${t.violet}60` : 'none',
              }} />
            </div>
          </div>
        </div>

        {/* Quick stats row */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
          gap: 8,
        }}>
          {/* Streak */}
          <div
            aria-label={`Current streak: ${currentStreak} days`}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: 2, padding: '8px 4px', borderRadius: 10,
              background: currentStreak > 0 ? `${t.gold}08` : 'transparent',
            }}
          >
            <NeonIcon type="fire" size={14} color={currentStreak > 0 ? 'gold' : 'muted'} />
            <span style={{
              fontFamily: t.mono, fontSize: 13, fontWeight: 800,
              color: currentStreak > 0 ? t.gold : t.textMuted,
            }}>
              {currentStreak}
            </span>
            <span style={{ fontFamily: t.body, fontSize: 8, color: t.textMuted }}>
              streak
            </span>
          </div>

          {/* Energy */}
          <div
            aria-label={`Energy crystals: ${energyCrystals} of ${maxEnergyCrystals}`}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: 2, padding: '8px 4px', borderRadius: 10,
              background: energyCrystals > 0 ? `${t.cyan}08` : `${t.rose}06`,
            }}
          >
            <NeonIcon type="gem" size={14} color={energyCrystals > 0 ? 'cyan' : 'rose'} />
            <span style={{
              fontFamily: t.mono, fontSize: 13, fontWeight: 800,
              color: energyCrystals > 0 ? t.cyan : t.rose,
            }}>
              {energyCrystals}/{maxEnergyCrystals}
            </span>
            <span style={{ fontFamily: t.body, fontSize: 8, color: t.textMuted }}>
              energy
            </span>
          </div>

          {/* Coins */}
          <div
            aria-label={`Coins: ${coins}`}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: 2, padding: '8px 4px', borderRadius: 10,
              background: coins > 0 ? `${t.gold}06` : 'transparent',
            }}
          >
            <NeonIcon type="coins" size={14} color="gold" />
            <span style={{
              fontFamily: t.mono, fontSize: 13, fontWeight: 800,
              color: t.gold,
            }}>
              {coins}
            </span>
            <span style={{ fontFamily: t.body, fontSize: 8, color: t.textMuted }}>
              coins
            </span>
          </div>
        </div>
      </SidebarCard>

      {/* ─── 2. Weekly Quests (Primary — Phase 5E, BL-005) ─── */}
      {hasWeekly && (
        <WeeklyChallenges
          challenges={weekly.challenges}
          weekEnd={weekly.weekEnd}
          compact
          style={{ marginBottom: 0 }}
        />
      )}

      {/* ─── 3. Skill Mastery (Secondary — Phase 5D) ─── */}
      {hasMastery && (
        <SidebarCard>
          <SectionHeader
            icon="book"
            color="cyan"
            label="Skill Mastery"
            badge={mastery.dueCount > 0 ? (
              <span style={{
                fontFamily: t.mono, fontSize: 9, fontWeight: 700,
                color: t.rose, padding: '2px 8px', borderRadius: 10,
                background: `${t.rose}12`, border: `1px solid ${t.rose}20`,
              }}>
                {mastery.dueCount} due
              </span>
            ) : undefined}
          />
          {/* UX-R144: Max 4 visible, "See all" for rest */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, justifyItems: 'center' }}>
            {mastery.skills.slice(0, 4).map((skill: { skillId: string; masteryLevel: number; skillDomain: string; isOverdue: boolean }) => (
              <MasteryRing
                key={skill.skillId}
                masteryLevel={skill.masteryLevel}
                skillDomain={skill.skillDomain}
                isOverdue={skill.isOverdue}
                size="sm"
                showLabel
              />
            ))}
          </div>
          {mastery.skills.length > 4 && (
            <Link href="/hero-card" style={{ textDecoration: 'none' }}>
              <div style={{
                marginTop: 10, textAlign: 'center' as const,
                fontFamily: t.mono, fontSize: 10, fontWeight: 700,
                color: t.cyan, cursor: 'pointer',
              }}>
                +{mastery.skills.length - 4} more skills →
              </div>
            </Link>
          )}
          {mastery.dueCount > 0 && (
            <Link href="/home" style={{ textDecoration: 'none' }}>
              <div style={{
                marginTop: 10, padding: '8px 12px', borderRadius: 10,
                background: `${t.cyan}12`, border: `1px solid ${t.cyan}20`,
                textAlign: 'center' as const,
                fontFamily: t.display, fontSize: 11, fontWeight: 700,
                color: t.cyan, cursor: 'pointer',
                transition: 'background 0.2s ease',
              }}>
                Review {mastery.dueCount} skill{mastery.dueCount > 1 ? 's' : ''} →
              </div>
            </Link>
          )}
        </SidebarCard>
      )}

      {/* ─── 4. Equipment Preview (Secondary — Phase 5F) ─── */}
      {hasEquipment && (
        <SidebarCard>
          <SectionHeader icon="shield" color="violet" label="Equipment" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
            {Object.entries(SLOT_ICONS).slice(0, 4).map(([slot, cfg]) => {
              const equip = equipment.find((e) => e.slot === slot);
              const rarityColor = equip ? RARITY_COLORS[equip.rarity] ?? '#71717A' : '#252530';
              // Try to find name from inventory
              const invItem = equip ? inventory.find((i) => i.itemId === equip.itemId) : null;
              return (
                <div
                  key={slot}
                  aria-label={equip ? `${cfg.label}: ${invItem?.name ?? equip.itemId} (${equip.rarity})` : `${cfg.label}: empty`}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    gap: 4, padding: '8px 2px',
                  }}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: equip ? `${rarityColor}12` : '#18181F',
                    border: `1.5px solid ${equip ? `${rarityColor}35` : '#252530'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: equip?.rarity === 'legendary' ? `0 0 8px ${rarityColor}30` : 'none',
                  }}>
                    <NeonIcon type={cfg.icon} size={16} color={equip ? rarityColor : 'muted'} />
                  </div>
                  <span style={{
                    fontFamily: t.mono, fontSize: 7, fontWeight: 700,
                    color: equip ? rarityColor : t.textMuted,
                    textTransform: 'uppercase' as const,
                  }}>
                    {cfg.label}
                  </span>
                </div>
              );
            })}
          </div>
          {/* Bottom row: remaining 3 slots */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginTop: 2 }}>
            {Object.entries(SLOT_ICONS).slice(4).map(([slot, cfg]) => {
              const equip = equipment.find((e) => e.slot === slot);
              const rarityColor = equip ? RARITY_COLORS[equip.rarity] ?? '#71717A' : '#252530';
              const invItem = equip ? inventory.find((i) => i.itemId === equip.itemId) : null;
              return (
                <div
                  key={slot}
                  aria-label={equip ? `${cfg.label}: ${invItem?.name ?? equip.itemId} (${equip.rarity})` : `${cfg.label}: empty`}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    gap: 4, padding: '8px 2px',
                  }}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: equip ? `${rarityColor}12` : '#18181F',
                    border: `1.5px solid ${equip ? `${rarityColor}35` : '#252530'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: equip?.rarity === 'legendary' ? `0 0 8px ${rarityColor}30` : 'none',
                  }}>
                    <NeonIcon type={cfg.icon} size={16} color={equip ? rarityColor : 'muted'} />
                  </div>
                  <span style={{
                    fontFamily: t.mono, fontSize: 7, fontWeight: 700,
                    color: equip ? rarityColor : t.textMuted,
                    textTransform: 'uppercase' as const,
                  }}>
                    {cfg.label}
                  </span>
                </div>
              );
            })}
          </div>
          {/* Attribute bonus summary */}
          {computedAttributes.bonus && Object.values(computedAttributes.bonus).some((v) => v > 0) && (
            <div style={{
              marginTop: 8, padding: '6px 10px', borderRadius: 8,
              background: `${t.violet}08`,
              display: 'flex', flexWrap: 'wrap' as const, gap: 6,
              justifyContent: 'center',
            }}>
              {Object.entries(computedAttributes.bonus).map(([key, val]) =>
                val > 0 ? (
                  <span key={key} style={{
                    fontFamily: t.mono, fontSize: 9, fontWeight: 700,
                    color: t.mint,
                  }}>
                    {key} +{val}
                  </span>
                ) : null,
              )}
            </div>
          )}
          <Link href="/hero-card" style={{ textDecoration: 'none' }}>
            <div style={{
              marginTop: 8, textAlign: 'center' as const,
              fontFamily: t.mono, fontSize: 10, fontWeight: 700,
              color: t.violet, cursor: 'pointer',
            }}>
              Manage inventory →
            </div>
          </Link>
        </SidebarCard>
      )}

      {/* ─── 5. Community (Tertiary — UX-R162: opt-in only) ─── */}
      {!quietMode && (
        <SidebarCard style={{ padding: 14 }}>
          <SectionHeader icon="trophy" color="gold" label="Community" />

          {/* Party Quest — compact */}
          <Link href="/league" style={{ textDecoration: 'none' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 12px', borderRadius: 12,
              background: t.bgElevated, border: `1px solid ${t.border}`,
              marginBottom: 8, cursor: 'pointer',
              transition: 'border-color 0.2s ease',
            }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = `${t.rose}40`; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = t.border; }}
            >
              <div style={{
                width: 32, height: 32, borderRadius: 10,
                background: `${t.rose}12`, border: `1px solid ${t.rose}20`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16, flexShrink: 0,
              }}>
                🐉
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontFamily: t.display, fontSize: 11, fontWeight: 700,
                  color: t.text, marginBottom: 2,
                }}>
                  Party Quest
                </div>
                <div style={{
                  fontFamily: t.body, fontSize: 9, color: t.textMuted,
                }}>
                  4 heroes fighting · Join the hunt
                </div>
              </div>
              <NeonIcon type="compass" size={12} color="rose" />
            </div>
          </Link>

          {/* Weekly League — compact */}
          <Link href="/league" style={{ textDecoration: 'none' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 12px', borderRadius: 12,
              background: t.bgElevated, border: `1px solid ${t.border}`,
              cursor: 'pointer',
              transition: 'border-color 0.2s ease',
            }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = `${t.gold}40`; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = t.border; }}
            >
              <div style={{
                width: 32, height: 32, borderRadius: 10,
                background: `${t.gold}12`, border: `1px solid ${t.gold}20`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <NeonIcon type="trophy" size={16} color="gold" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontFamily: t.display, fontSize: 11, fontWeight: 700,
                  color: t.text, marginBottom: 2,
                }}>
                  Weekly League
                </div>
                <div style={{
                  fontFamily: t.body, fontSize: 9, color: t.textMuted,
                }}>
                  Opt-in · No pressure
                </div>
              </div>
              <span style={{
                fontFamily: t.mono, fontSize: 8, fontWeight: 700,
                color: '#CD7F32', padding: '2px 6px', borderRadius: 6,
                background: 'rgba(205,127,50,0.10)', border: '1px solid rgba(205,127,50,0.20)',
                textTransform: 'uppercase' as const, flexShrink: 0,
              }}>
                Bronze
              </span>
            </div>
          </Link>
        </SidebarCard>
      )}

      {/* ─── Empty state ─── */}
      {!hasContent && quietMode && (
        <SidebarCard style={{ textAlign: 'center' as const, padding: 24 }}>
          <NeonIcon type="compass" size={28} color="muted" style={{ marginBottom: 12 }} />
          <div style={{
            fontFamily: t.display, fontSize: 13, fontWeight: 700,
            color: t.textSecondary, marginBottom: 4,
          }}>
            Your quest board awaits
          </div>
          <div style={{
            fontFamily: t.body, fontSize: 11, color: t.textMuted, lineHeight: 1.4,
          }}>
            Complete quests to unlock weekly challenges, mastery rings, and equipment drops.
          </div>
        </SidebarCard>
      )}
    </div>
  );
}
