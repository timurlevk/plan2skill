'use client';

import React, { useState, useMemo } from 'react';
import { useCharacterStore } from '@plan2skill/store';
import { trpc } from '@plan2skill/api-client';
import { NeonIcon } from '../../../(onboarding)/_components/NeonIcon';
import { t } from '../../../(onboarding)/_components/tokens';
import type { EquipmentSlot, Rarity } from '@plan2skill/types';

// ═══════════════════════════════════════════
// INVENTORY DRAWER — Equipment management
// Bottom sheet (mobile) / side panel (desktop)
// Items grouped by slot, rarity badges (double-coded)
// ═══════════════════════════════════════════

// Rarity double-coded: color + shape + icon (UX-R: accessibility)
const RARITY_CONFIG: Record<string, { color: string; icon: string; label: string; shape: string }> = {
  common:    { color: '#71717A', icon: '●',  label: 'Common',    shape: 'circle' },
  uncommon:  { color: '#6EE7B7', icon: '◆',  label: 'Uncommon',  shape: 'pentagon' },
  rare:      { color: '#3B82F6', icon: '⬡',  label: 'Rare',      shape: 'hexagon' },
  epic:      { color: '#9D7AFF', icon: '◈',  label: 'Epic',      shape: 'diamond' },
  legendary: { color: '#FFD166', icon: '★',  label: 'Legendary', shape: 'octagon' },
};

const SLOT_META: Record<string, { name: string; icon: string }> = {
  weapon:    { name: 'Weapon',    icon: 'lightning' },
  shield:    { name: 'Shield',    icon: 'shield'    },
  armor:     { name: 'Armor',     icon: 'medal'     },
  helmet:    { name: 'Helmet',    icon: 'crown'     },
  boots:     { name: 'Boots',     icon: 'rocket'    },
  ring:      { name: 'Ring',      icon: 'gem'       },
  companion: { name: 'Companion', icon: 'sparkle'   },
};

const RARITY_ORDER: Rarity[] = ['legendary', 'epic', 'rare', 'uncommon', 'common'];

interface InventoryDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function InventoryDrawer({ open, onClose }: InventoryDrawerProps) {
  const { inventory } = useCharacterStore();
  const [filterSlot, setFilterSlot] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'rarity' | 'name'>('rarity');

  const equipMutation = trpc.equipment.equip.useMutation();
  const unequipMutation = trpc.equipment.unequip.useMutation();

  const filteredItems = useMemo(() => {
    let items = [...inventory];
    if (filterSlot) items = items.filter((i) => i.slot === filterSlot);
    if (sortBy === 'rarity') {
      items.sort((a, b) => RARITY_ORDER.indexOf(a.rarity as Rarity) - RARITY_ORDER.indexOf(b.rarity as Rarity));
    } else {
      items.sort((a, b) => a.name.localeCompare(b.name));
    }
    return items;
  }, [inventory, filterSlot, sortBy]);

  // Group by slot
  const groupedBySlot = useMemo(() => {
    const groups: Record<string, typeof filteredItems> = {};
    for (const item of filteredItems) {
      if (!groups[item.slot]) groups[item.slot] = [];
      groups[item.slot]!.push(item);
    }
    return groups;
  }, [filteredItems]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-label="Equipment Inventory"
      style={{
        position: 'fixed', inset: 0, zIndex: 150,
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute', inset: 0,
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
        }}
      />

      {/* Drawer panel */}
      <div style={{
        position: 'relative', width: '100%', maxWidth: 560,
        maxHeight: '80vh', borderRadius: '24px 24px 0 0',
        background: t.bgCard, border: `1px solid ${t.border}`,
        borderBottom: 'none', padding: '20px 20px 32px',
        overflowY: 'auto', animation: 'slideUp 0.4s ease-out',
      }}>
        {/* Handle */}
        <div style={{
          width: 40, height: 4, borderRadius: 2, margin: '0 auto 16px',
          background: t.border,
        }} />

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 style={{
            display: 'flex', alignItems: 'center', gap: 8,
            fontFamily: t.display, fontSize: 18, fontWeight: 900, color: t.text,
          }}>
            <NeonIcon type="gift" size={20} color="gold" />
            Inventory
            <span style={{ fontFamily: t.mono, fontSize: 11, fontWeight: 700, color: t.textMuted }}>
              ({inventory.length} items)
            </span>
          </h2>
          <button
            onClick={onClose}
            aria-label="Close inventory"
            style={{
              width: 32, height: 32, borderRadius: 8,
              background: t.bgElevated, border: `1px solid ${t.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <NeonIcon type="close" size={14} color="muted" />
          </button>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
          <button
            onClick={() => setFilterSlot(null)}
            style={{
              padding: '4px 12px', borderRadius: 8, border: 'none',
              background: !filterSlot ? `${t.violet}20` : t.bgElevated,
              fontFamily: t.mono, fontSize: 10, fontWeight: 700,
              color: !filterSlot ? t.violet : t.textMuted,
              cursor: 'pointer',
            }}
          >
            All
          </button>
          {Object.entries(SLOT_META).map(([slot, meta]) => (
            <button
              key={slot}
              onClick={() => setFilterSlot(filterSlot === slot ? null : slot)}
              style={{
                padding: '4px 12px', borderRadius: 8, border: 'none',
                background: filterSlot === slot ? `${t.violet}20` : t.bgElevated,
                fontFamily: t.mono, fontSize: 10, fontWeight: 700,
                color: filterSlot === slot ? t.violet : t.textMuted,
                cursor: 'pointer',
              }}
            >
              {meta.name}
            </button>
          ))}
        </div>

        {/* Sort */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <button
            onClick={() => setSortBy('rarity')}
            style={{
              padding: '3px 10px', borderRadius: 6, border: 'none',
              background: sortBy === 'rarity' ? `${t.cyan}15` : 'none',
              fontFamily: t.mono, fontSize: 9, fontWeight: 700,
              color: sortBy === 'rarity' ? t.cyan : t.textMuted,
              cursor: 'pointer',
            }}
          >
            Sort by Rarity
          </button>
          <button
            onClick={() => setSortBy('name')}
            style={{
              padding: '3px 10px', borderRadius: 6, border: 'none',
              background: sortBy === 'name' ? `${t.cyan}15` : 'none',
              fontFamily: t.mono, fontSize: 9, fontWeight: 700,
              color: sortBy === 'name' ? t.cyan : t.textMuted,
              cursor: 'pointer',
            }}
          >
            Sort by Name
          </button>
        </div>

        {/* Items */}
        {inventory.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <NeonIcon type="gift" size={32} color="muted" style={{ marginBottom: 12 }} />
            <p style={{ fontFamily: t.display, fontSize: 14, fontWeight: 700, color: t.textSecondary }}>
              No artifacts yet
            </p>
            <p style={{ fontFamily: t.body, fontSize: 12, color: t.textMuted, marginTop: 4 }}>
              Complete quests to earn equipment drops!
            </p>
          </div>
        ) : (
          Object.entries(groupedBySlot).map(([slot, items]) => {
            const meta = SLOT_META[slot] ?? { name: slot, icon: 'gear' };
            return (
              <div key={slot} style={{ marginBottom: 20 }}>
                <h3 style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  fontFamily: t.display, fontSize: 11, fontWeight: 700,
                  color: t.textSecondary, textTransform: 'uppercase',
                  letterSpacing: '0.08em', marginBottom: 8,
                }}>
                  <NeonIcon type={meta.icon as any} size={12} color="muted" />
                  {meta.name}
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {items.map((item) => {
                    const rc = RARITY_CONFIG[item.rarity] ?? RARITY_CONFIG.common!;
                    return (
                      <div
                        key={item.id || item.itemId}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          padding: '10px 12px', borderRadius: 12,
                          background: `${rc.color}06`, border: `1px solid ${rc.color}20`,
                          transition: 'border-color 0.2s ease',
                        }}
                      >
                        {/* Rarity icon */}
                        <div style={{
                          width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                          background: `${rc.color}12`, display: 'flex',
                          alignItems: 'center', justifyContent: 'center',
                        }}>
                          <span style={{ fontSize: 18, color: rc.color }}>{rc.icon}</span>
                        </div>

                        {/* Item info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontFamily: t.display, fontSize: 12, fontWeight: 700,
                            color: t.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                          }}>
                            {item.name}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{
                              fontFamily: t.mono, fontSize: 8, fontWeight: 700,
                              color: rc.color, textTransform: 'uppercase',
                            }}>
                              {rc.icon} {rc.label}
                            </span>
                            {item.quantity > 1 && (
                              <span style={{ fontFamily: t.mono, fontSize: 9, color: t.textMuted }}>
                                ×{item.quantity}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Attribute bonuses */}
                        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                          {Object.entries(item.attributeBonus).map(([key, val]) => (
                            <span key={key} style={{
                              padding: '2px 6px', borderRadius: 4,
                              background: `${t.mint}12`,
                              fontFamily: t.mono, fontSize: 8, fontWeight: 700,
                              color: t.mint,
                            }}>
                              +{val}
                            </span>
                          ))}
                        </div>

                        {/* Equip button */}
                        <button
                          onClick={() => {
                            equipMutation.mutate(
                              { slot: item.slot as EquipmentSlot, itemId: item.itemId },
                              {
                                onSuccess: () => {
                                  // Refresh will come from server hydration
                                },
                              },
                            );
                          }}
                          style={{
                            padding: '4px 10px', borderRadius: 6,
                            background: `${t.violet}15`, border: `1px solid ${t.violet}30`,
                            fontFamily: t.mono, fontSize: 9, fontWeight: 700,
                            color: t.violet, cursor: 'pointer', flexShrink: 0,
                          }}
                        >
                          Equip
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
