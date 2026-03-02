'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { useMachine } from '@xstate/react';
import { useCharacterStore, useProgressionStore } from '@plan2skill/store';
import { trpc } from '@plan2skill/api-client';
import { forgeMachine } from '../home/_machines/forge.machine';
import { NeonIcon } from '../../(onboarding)/_components/NeonIcon';
import { t } from '../../(onboarding)/_components/tokens';
import type { Rarity } from '@plan2skill/types';

// ═══════════════════════════════════════════
// FORGE PAGE — 3 input slots + anvil + output
// Driven by forgeMachine (XState v5)
// RPG vocabulary, hammerStrike + sparkBurst animations
// ═══════════════════════════════════════════

const RARITY_CONFIG: Record<string, { color: string; icon: string; label: string; next: string }> = {
  common:    { color: '#71717A', icon: '●',  label: 'Common',    next: 'Uncommon' },
  uncommon:  { color: '#6EE7B7', icon: '◆',  label: 'Uncommon',  next: 'Rare' },
  rare:      { color: '#3B82F6', icon: '⬡',  label: 'Rare',      next: 'Epic' },
  epic:      { color: '#9D7AFF', icon: '◈',  label: 'Epic',      next: 'Legendary' },
  legendary: { color: '#FFD166', icon: '★',  label: 'Legendary', next: '' },
};

const RARITY_ORDER: Rarity[] = ['legendary', 'epic', 'rare', 'uncommon', 'common'];

export default function ForgePage() {
  const { inventory } = useCharacterStore();
  const { coins } = useProgressionStore();
  const [state, send] = useMachine(forgeMachine);
  const forgeMutation = trpc.equipment.forge.useMutation();

  // Filter inventory to items with quantity >= 1, exclude legendary
  const forgeableItems = useMemo(() =>
    inventory
      .filter((i) => i.quantity >= 1 && i.rarity !== 'legendary')
      .sort((a, b) => RARITY_ORDER.indexOf(a.rarity as Rarity) - RARITY_ORDER.indexOf(b.rarity as Rarity)),
    [inventory],
  );

  // Group by rarity for selection
  const itemsByRarity = useMemo(() => {
    const groups: Record<string, typeof forgeableItems> = {};
    for (const item of forgeableItems) {
      if (!groups[item.rarity]) groups[item.rarity] = [];
      groups[item.rarity]!.push(item);
    }
    return groups;
  }, [forgeableItems]);

  const selectedItems = state.context.inputItems;
  const selectedRarity = state.context.inputRarity;
  const isIdle = state.matches('idle');
  const isSelecting = state.matches('selecting') || isIdle;
  const isForging = state.matches('forging');
  const isSuccess = state.matches('success');
  const isError = state.matches('error');

  // Handle forge confirmation — call backend
  const handleForge = useCallback(() => {
    if (selectedItems.length !== 3) return;
    send({ type: 'CONFIRM' });
    send({ type: 'VALID' });

    forgeMutation.mutate(
      { itemIds: selectedItems as [string, string, string] },
      {
        onSuccess: (result) => {
          send({ type: 'SUCCESS', item: result });
        },
        onError: (err) => {
          send({ type: 'ERROR', error: err.message });
        },
      },
    );
  }, [selectedItems, send, forgeMutation]);

  return (
    <div style={{ animation: 'fadeUp 0.5s ease-out' }}>
      {/* Page Title */}
      <h1 style={{
        display: 'flex', alignItems: 'center', gap: 10,
        fontFamily: t.display, fontSize: 26, fontWeight: 900,
        color: t.text, marginBottom: 8,
      }}>
        <NeonIcon type="fire" size={24} color="gold" />
        The Forge
      </h1>
      <p style={{
        fontFamily: t.body, fontSize: 13, color: t.textSecondary,
        marginBottom: 24, lineHeight: 1.4,
      }}>
        Combine 3 artifacts of the same rarity to forge a more powerful one.
        The forge transforms dedication into legend.
      </p>

      {/* ─── Input Slots ─── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: 12, marginBottom: 24,
      }}>
        {[0, 1, 2].map((slotIdx) => {
          const itemId = selectedItems[slotIdx];
          const item = itemId ? inventory.find((i) => i.itemId === itemId) : null;
          const rc = item ? (RARITY_CONFIG[item.rarity] ?? RARITY_CONFIG.common!) : null;

          return (
            <div
              key={slotIdx}
              style={{
                width: 90, height: 110, borderRadius: 16, textAlign: 'center',
                background: item ? `${rc!.color}08` : t.bgElevated,
                border: `2px dashed ${item ? `${rc!.color}40` : t.border}`,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 6,
                transition: 'all 0.3s ease',
                animation: item ? 'bounceIn 0.3s ease-out' : 'none',
              }}
            >
              {item ? (
                <>
                  <span style={{ fontSize: 24, color: rc!.color }}>{rc!.icon}</span>
                  <span style={{
                    fontFamily: t.display, fontSize: 9, fontWeight: 700,
                    color: t.text, maxWidth: 70, overflow: 'hidden',
                    textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {item.name}
                  </span>
                  <button
                    onClick={() => send({ type: 'REMOVE_ITEM', itemId: itemId! })}
                    style={{
                      padding: '2px 8px', borderRadius: 4, border: 'none',
                      background: `${t.rose}15`, fontFamily: t.mono, fontSize: 8,
                      color: t.rose, cursor: 'pointer',
                    }}
                  >
                    Remove
                  </button>
                </>
              ) : (
                <>
                  <NeonIcon type="gem" size={24} color="muted" />
                  <span style={{ fontFamily: t.mono, fontSize: 9, color: t.textMuted }}>
                    Slot {slotIdx + 1}
                  </span>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* ─── Anvil / Forge Button ─── */}
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        {isForging ? (
          <div style={{
            display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 8,
          }}>
            <div style={{ fontSize: 48, animation: 'hammerStrike 0.5s ease-out infinite' }}>
              🔨
            </div>
            <span style={{ fontFamily: t.display, fontSize: 14, fontWeight: 700, color: t.gold }}>
              Forging...
            </span>
            <button
              onClick={() => send({ type: 'SKIP' })}
              style={{
                padding: '4px 12px', borderRadius: 6, border: 'none',
                background: 'none', fontFamily: t.body, fontSize: 10,
                color: t.textMuted, cursor: 'pointer',
              }}
            >
              Tap to skip
            </button>
          </div>
        ) : isSuccess && state.context.outputItem ? (
          <div style={{ animation: 'celebratePop 0.7s ease-out' }}>
            <div style={{
              padding: 20, borderRadius: 16, display: 'inline-block',
              background: `${RARITY_CONFIG[state.context.outputItem.rarity]?.color ?? t.violet}10`,
              border: `1px solid ${RARITY_CONFIG[state.context.outputItem.rarity]?.color ?? t.violet}30`,
            }}>
              <span style={{
                fontSize: 24,
                color: RARITY_CONFIG[state.context.outputItem.rarity]?.color ?? t.violet,
              }}>
                {RARITY_CONFIG[state.context.outputItem.rarity]?.icon ?? '◈'}
              </span>
              <h3 style={{
                fontFamily: t.display, fontSize: 16, fontWeight: 900,
                color: t.text, margin: '8px 0 4px',
              }}>
                {state.context.outputItem.name}
              </h3>
              <span style={{
                fontFamily: t.mono, fontSize: 10, fontWeight: 700,
                color: RARITY_CONFIG[state.context.outputItem.rarity]?.color ?? t.violet,
                textTransform: 'uppercase',
              }}>
                {RARITY_CONFIG[state.context.outputItem.rarity]?.label ?? state.context.outputItem.rarity}
              </span>
              <p style={{ fontFamily: t.body, fontSize: 11, color: t.textSecondary, marginTop: 8 }}>
                +5 coins awarded!
              </p>
            </div>
            <div style={{ marginTop: 12 }}>
              <button
                onClick={() => send({ type: 'RESET' })}
                style={{
                  padding: '10px 24px', borderRadius: 12, border: 'none',
                  background: t.gradient, fontFamily: t.display, fontSize: 13,
                  fontWeight: 800, color: '#FFF', cursor: 'pointer',
                }}
              >
                Forge Again
              </button>
            </div>
          </div>
        ) : isError ? (
          <div>
            <p style={{ fontFamily: t.display, fontSize: 14, fontWeight: 700, color: t.rose, marginBottom: 8 }}>
              The path is blocked
            </p>
            <p style={{ fontFamily: t.body, fontSize: 12, color: t.textMuted, marginBottom: 12 }}>
              {state.context.error || 'Something went wrong at the forge.'}
            </p>
            <button
              onClick={() => send({ type: 'RETRY' })}
              style={{
                padding: '8px 20px', borderRadius: 10, border: 'none',
                background: `${t.violet}15`, fontFamily: t.display, fontSize: 12,
                fontWeight: 700, color: t.violet, cursor: 'pointer', marginRight: 8,
              }}
            >
              Try again, hero
            </button>
            <button
              onClick={() => send({ type: 'RESET' })}
              style={{
                padding: '8px 20px', borderRadius: 10, border: 'none',
                background: 'none', fontFamily: t.body, fontSize: 12,
                color: t.textMuted, cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={handleForge}
            disabled={selectedItems.length !== 3}
            style={{
              padding: '14px 40px', borderRadius: 14, border: 'none',
              background: selectedItems.length === 3
                ? `linear-gradient(135deg, ${t.gold}, ${t.violet})`
                : t.bgElevated,
              fontFamily: t.display, fontSize: 15, fontWeight: 800,
              color: selectedItems.length === 3 ? '#FFF' : t.textMuted,
              cursor: selectedItems.length === 3 ? 'pointer' : 'not-allowed',
              boxShadow: selectedItems.length === 3 ? `0 4px 20px ${t.gold}30` : 'none',
              transition: 'all 0.3s ease',
            }}
          >
            {selectedItems.length === 3
              ? `Forge → ${selectedRarity ? (RARITY_CONFIG[selectedRarity]?.next ?? '???') : '???'}`
              : `Select ${3 - selectedItems.length} more artifact${3 - selectedItems.length > 1 ? 's' : ''}`}
          </button>
        )}
      </div>

      {/* ─── Available Items ─── */}
      {isSelecting && (
        <div style={{
          padding: 20, borderRadius: 16,
          background: t.bgCard, border: `1px solid ${t.border}`,
        }}>
          <h3 style={{
            display: 'flex', alignItems: 'center', gap: 6,
            fontFamily: t.display, fontSize: 13, fontWeight: 700,
            color: t.textSecondary, textTransform: 'uppercase',
            letterSpacing: '0.08em', marginBottom: 16,
          }}>
            <NeonIcon type="gift" size={14} color="gold" />
            Available Artifacts
          </h3>

          {forgeableItems.length === 0 ? (
            <p style={{ fontFamily: t.body, fontSize: 12, color: t.textMuted, textAlign: 'center', padding: 20 }}>
              No artifacts available for forging. Complete quests to earn drops!
            </p>
          ) : (
            Object.entries(itemsByRarity).map(([rar, items]) => {
              const rc = RARITY_CONFIG[rar] ?? RARITY_CONFIG.common!;
              // If a rarity is already selected, only show that rarity
              if (selectedRarity && rar !== selectedRarity) return null;

              return (
                <div key={rar} style={{ marginBottom: 16 }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8,
                  }}>
                    <span style={{ fontSize: 12, color: rc.color }}>{rc.icon}</span>
                    <span style={{
                      fontFamily: t.mono, fontSize: 10, fontWeight: 700,
                      color: rc.color, textTransform: 'uppercase',
                    }}>
                      {rc.label}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3" style={{ gap: 8 }}>
                    {items.map((item) => {
                      const alreadySelected = selectedItems.includes(item.itemId);
                      const canAdd = !alreadySelected || item.quantity > selectedItems.filter((id) => id === item.itemId).length;

                      return (
                        <button
                          key={item.itemId}
                          disabled={!canAdd || selectedItems.length >= 3}
                          onClick={() => {
                            if (canAdd && selectedItems.length < 3) {
                              send({ type: 'ADD_ITEM', itemId: item.itemId, rarity: item.rarity });
                            }
                          }}
                          style={{
                            padding: 10, borderRadius: 10, textAlign: 'left',
                            background: alreadySelected ? `${rc.color}12` : t.bgElevated,
                            border: `1px solid ${alreadySelected ? `${rc.color}30` : t.border}`,
                            cursor: canAdd && selectedItems.length < 3 ? 'pointer' : 'not-allowed',
                            opacity: canAdd && selectedItems.length < 3 ? 1 : 0.4,
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <div style={{
                            fontFamily: t.display, fontSize: 11, fontWeight: 700,
                            color: t.text, marginBottom: 2,
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                          }}>
                            {item.name}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span style={{
                              fontFamily: t.mono, fontSize: 8, color: rc.color,
                            }}>
                              {rc.icon} {item.slot}
                            </span>
                            <span style={{
                              fontFamily: t.mono, fontSize: 8, color: t.textMuted, marginLeft: 'auto',
                            }}>
                              ×{item.quantity}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
