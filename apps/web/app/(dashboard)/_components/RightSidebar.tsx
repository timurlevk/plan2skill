'use client';

import React from 'react';
import Link from 'next/link';
import { useProgressionStore, useCharacterStore, useI18nStore, useAuthStore } from '@plan2skill/store';
import { t, rarity as rarityTokens, LEAGUE_TIERS } from '../../(onboarding)/_components/tokens';
import { NeonIcon } from '../../(onboarding)/_components/NeonIcon';
import type { NeonIconType } from '../../(onboarding)/_components/NeonIcon';
import { WeeklyChallenges } from '../home/_components/WeeklyChallenges';
import { MasteryRing } from '../home/_components/MasteryRing';
import { useWeeklyChallenges } from '../home/_hooks/useWeeklyChallenges';
import { useSpacedRepetition } from '../home/_hooks/useSpacedRepetition';
import { AttributeWidget } from '../home/_components/AttributeWidget';
import { trpc } from '@plan2skill/api-client';

// ═══════════════════════════════════════════
// RIGHT SIDEBAR — Refactored (UI/UX overhaul)
// BL-004: Secondary dashboard content
//
// Visual hierarchy (UX-R121):
//   1. Weekly Quests — compact challenge rows (Primary)
//   2. Skill Mastery — limited rings + due CTA (Secondary)
//   3. Equipment Preview — equipped items summary (Secondary)
//   4. Community — vertical stack, compact (Tertiary)
//
// Hero Stats moved to left sidebar (merged with Hero Identity Card).
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

const SLOT_ICONS: Record<string, { icon: NeonIconType; label: string; labelKey: string }> = {
  weapon:    { icon: 'lightning', label: 'Weapon',    labelKey: 'slot.weapon' },
  shield:    { icon: 'shield',   label: 'Shield',    labelKey: 'slot.shield' },
  armor:     { icon: 'gem',      label: 'Armor',     labelKey: 'slot.armor' },
  helmet:    { icon: 'crown',    label: 'Helm',      labelKey: 'slot.helmet' },
  boots:     { icon: 'rocket',   label: 'Boots',     labelKey: 'slot.boots' },
  ring:      { icon: 'sparkle',  label: 'Ring',      labelKey: 'slot.ring' },
  companion: { icon: 'star',     label: 'Companion', labelKey: 'slot.companion' },
};

// Rarity colors now come from canonical `rarity` import (tokens.ts)

// ═══════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════

const ADMIN_ROLES = ['admin', 'moderator', 'superadmin'];

export function RightSidebar() {
  const tr = useI18nStore((s) => s.t);
  const { quietMode } = useProgressionStore();
  const { equipment, inventory, computedAttributes } = useCharacterStore();
  const weekly = useWeeklyChallenges();
  const mastery = useSpacedRepetition();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { data: userProfile } = trpc.user.profile.useQuery(undefined, {
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5,
  });
  const isAdmin = !!userProfile?.role && ADMIN_ROLES.includes(userProfile.role as string);

  const hasWeekly = weekly.challenges.length > 0;
  const hasMastery = mastery.skills.length > 0;
  const hasEquipment = equipment.length > 0;
  const hasContent = hasWeekly || hasMastery || hasEquipment;

  return (
    <div
      role="complementary"
      aria-label={tr('sidebar.aria_label', 'Hero sidebar — stats, quests, mastery, equipment')}
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
      {/* ─── 1. Weekly Quests (Primary — Phase 5E, BL-005) ─── */}
      {hasWeekly && (
        <WeeklyChallenges
          challenges={weekly.challenges}
          weekEnd={weekly.weekEnd}
          allCompleted={weekly.allCompleted}
          bonusClaimed={weekly.bonusClaimed}
          compact
          style={{ marginBottom: 0 }}
        />
      )}

      {/* ─── 2. Skill Mastery (Secondary — Phase 5D) ─── */}
      {hasMastery && (
        <SidebarCard>
          <SectionHeader
            icon="book"
            color="cyan"
            label={tr('sidebar.skill_mastery', 'Skill Mastery')}
            badge={mastery.dueCount > 0 ? (
              <span style={{
                fontFamily: t.mono, fontSize: 9, fontWeight: 700,
                color: t.rose, padding: '2px 8px', borderRadius: 10,
                background: `${t.rose}12`, border: `1px solid ${t.rose}20`,
              }}>
                {tr('sidebar.mastery_due', '{n} due').replace('{n}', String(mastery.dueCount))}
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
                {tr('sidebar.mastery_more', '+{n} more skills →').replace('{n}', String(mastery.skills.length - 4))}
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
                {tr('sidebar.mastery_review', 'Review {n} skills →').replace('{n}', String(mastery.dueCount))}
              </div>
            </Link>
          )}
        </SidebarCard>
      )}

      {/* ─── 3. Equipment Preview (Secondary — Phase 5F) ─── */}
      {hasEquipment && (
        <SidebarCard>
          <SectionHeader icon="shield" color="violet" label={tr('sidebar.equipment', 'Equipment')} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
            {Object.entries(SLOT_ICONS).slice(0, 4).map(([slot, cfg]) => {
              const equip = equipment.find((e) => e.slot === slot);
              const rarityColor = equip ? rarityTokens[equip.rarity as keyof typeof rarityTokens]?.color ?? t.textMuted : t.border;
              // Try to find name from inventory
              const invItem = equip ? inventory.find((i) => i.itemId === equip.itemId) : null;
              return (
                <div
                  key={slot}
                  aria-label={equip ? tr('sidebar.aria_slot_equipped', '{slot}: {item} ({rarity})').replace('{slot}', tr(cfg.labelKey, cfg.label)).replace('{item}', invItem?.name ?? equip.itemId).replace('{rarity}', equip.rarity) : tr('sidebar.aria_slot_empty', '{slot}: empty').replace('{slot}', tr(cfg.labelKey, cfg.label))}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    gap: 4, padding: '8px 2px',
                  }}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: equip ? `${rarityColor}12` : '#18181F',
                    border: `1.5px solid ${equip ? `${rarityColor}35` : t.border}`,
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
                    {tr(cfg.labelKey, cfg.label)}
                  </span>
                </div>
              );
            })}
          </div>
          {/* Bottom row: remaining 3 slots */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginTop: 2 }}>
            {Object.entries(SLOT_ICONS).slice(4).map(([slot, cfg]) => {
              const equip = equipment.find((e) => e.slot === slot);
              const rarityColor = equip ? rarityTokens[equip.rarity as keyof typeof rarityTokens]?.color ?? t.textMuted : t.border;
              const invItem = equip ? inventory.find((i) => i.itemId === equip.itemId) : null;
              return (
                <div
                  key={slot}
                  aria-label={equip ? tr('sidebar.aria_slot_equipped', '{slot}: {item} ({rarity})').replace('{slot}', tr(cfg.labelKey, cfg.label)).replace('{item}', invItem?.name ?? equip.itemId).replace('{rarity}', equip.rarity) : tr('sidebar.aria_slot_empty', '{slot}: empty').replace('{slot}', tr(cfg.labelKey, cfg.label))}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    gap: 4, padding: '8px 2px',
                  }}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: equip ? `${rarityColor}12` : '#18181F',
                    border: `1.5px solid ${equip ? `${rarityColor}35` : t.border}`,
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
                    {tr(cfg.labelKey, cfg.label)}
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
              {tr('sidebar.manage_inventory', 'Manage inventory →')}
            </div>
          </Link>
        </SidebarCard>
      )}

      {/* ─── 3.5. Hero Attributes (Phase 5H) ─── */}
      <AttributeWidget compact />

      {/* ─── 4. Community (Tertiary — UX-R162: opt-in only) ─── */}
      {!quietMode && (
        <SidebarCard style={{ padding: 14 }}>
          <SectionHeader icon="trophy" color="gold" label={tr('sidebar.community', 'Community')} />

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
                  {tr('social.party_quest', 'Party Quest')}
                </div>
                <div style={{
                  fontFamily: t.body, fontSize: 9, color: t.textMuted,
                }}>
                  {tr('social.party_desc', '{n} heroes fighting · Join the hunt').replace('{n}', '4')}
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
                  {tr('social.weekly_league', 'Weekly League')}
                </div>
                <div style={{
                  fontFamily: t.body, fontSize: 9, color: t.textMuted,
                }}>
                  {tr('social.league_desc', 'Opt-in · No pressure')}
                </div>
              </div>
              <span style={{
                fontFamily: t.mono, fontSize: 8, fontWeight: 700,
                color: LEAGUE_TIERS.bronze.color, padding: '2px 6px', borderRadius: 6,
                background: `${LEAGUE_TIERS.bronze.color}1A`, border: `1px solid ${LEAGUE_TIERS.bronze.color}33`,
                textTransform: 'uppercase' as const, flexShrink: 0,
              }}>
                {tr('league.bronze', 'Bronze')}
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
            {tr('sidebar.empty_title', 'Your quest board awaits')}
          </div>
          <div style={{
            fontFamily: t.body, fontSize: 11, color: t.textMuted, lineHeight: 1.4,
          }}>
            {tr('sidebar.empty_desc', 'Complete quests to unlock weekly challenges, mastery rings, and equipment drops.')}
          </div>
        </SidebarCard>
      )}

      {/* ─── Admin Panel Link (admin/moderator/superadmin only) ─── */}
      {isAdmin && (
        <Link href="/admin" style={{ textDecoration: 'none', marginTop: 'auto' }}>
          <div
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 14px', borderRadius: 12,
              background: `${t.rose}08`, border: `1px solid ${t.rose}15`,
              cursor: 'pointer', transition: 'background 0.2s ease, border-color 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = `${t.rose}15`;
              e.currentTarget.style.borderColor = `${t.rose}30`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = `${t.rose}08`;
              e.currentTarget.style.borderColor = `${t.rose}15`;
            }}
          >
            <NeonIcon type="gear" size={14} color="rose" />
            <span style={{
              fontFamily: t.mono, fontSize: 10, fontWeight: 700,
              color: t.rose, textTransform: 'uppercase' as const,
              letterSpacing: '0.06em',
            }}>
              {tr('sidebar.admin_panel', 'Admin Panel')}
            </span>
          </div>
        </Link>
      )}
    </div>
  );
}
