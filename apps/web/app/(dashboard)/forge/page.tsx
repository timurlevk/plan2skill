'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useMachine } from '@xstate/react';
import { useCharacterStore, useProgressionStore, useI18nStore } from '@plan2skill/store';
import { trpc } from '@plan2skill/api-client';
import { forgeMachine } from '../home/_machines/forge.machine';
import { NeonIcon } from '../../(onboarding)/_components/NeonIcon';
import { t, rarity } from '../../(onboarding)/_components/tokens';
import type { Rarity } from '@plan2skill/types';

// ═══════════════════════════════════════════
// FORGE PAGE — 3 input slots + anvil + output
// Driven by forgeMachine (XState v5)
// RPG vocabulary, hammerStrike + sparkBurst animations
// ═══════════════════════════════════════════

// Forge-specific: maps rarity → next tier label (not in canonical tokens)
const RARITY_NEXT: Record<string, string> = {
  common: 'Uncommon', uncommon: 'Rare', rare: 'Epic', epic: 'Legendary', legendary: '',
};

const RARITY_ORDER: Rarity[] = ['legendary', 'epic', 'rare', 'uncommon', 'common'];

export default function ForgePage() {
  // Reduced-motion check — §N MICRO_ANIMATION_GUIDELINES §10 (BLOCKER) — SSR-safe
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const tr = useI18nStore((s) => s.t);
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

  // Forge button & item selection press states — §N Tier Micro
  const [pressedForge, setPressedForge] = useState(false);
  const [pressedItemId, setPressedItemId] = useState<string | null>(null);

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
    <div style={{ animation: prefersReducedMotion ? 'none' : 'fadeUp 0.4s ease-out' }}>
      {/* Spark particle keyframes for forging state — §N §3 Reward sequence */}
      <style>{`
        @keyframes sparkUp { 0% { transform: translate(0,0) scale(1); opacity: 1; } 100% { transform: translate(-8px,-20px) scale(0); opacity: 0; } }
        @keyframes sparkRight { 0% { transform: translate(0,0) scale(1); opacity: 1; } 100% { transform: translate(16px,-12px) scale(0); opacity: 0; } }
        @keyframes sparkLeft { 0% { transform: translate(0,0) scale(1); opacity: 1; } 100% { transform: translate(-16px,-10px) scale(0); opacity: 0; } }
        @keyframes sparkDown { 0% { transform: translate(0,0) scale(1); opacity: 1; } 100% { transform: translate(6px,16px) scale(0); opacity: 0; } }
      `}</style>

      {/* Background glow orbs — §N §6 Ambient, aria-hidden */}
      {!prefersReducedMotion && (
        <>
          <div aria-hidden="true" style={{
            position: 'fixed', top: '20%', left: '15%',
            width: 200, height: 200, borderRadius: '50%',
            background: `radial-gradient(circle, ${t.gold}08 0%, transparent 70%)`,
            pointerEvents: 'none', zIndex: 0,
            filter: 'blur(40px)',
          }} />
          <div aria-hidden="true" style={{
            position: 'fixed', bottom: '25%', right: '10%',
            width: 160, height: 160, borderRadius: '50%',
            background: `radial-gradient(circle, ${t.violet}08 0%, transparent 70%)`,
            pointerEvents: 'none', zIndex: 0,
            filter: 'blur(40px)',
          }} />
        </>
      )}

      {/* Page Title */}
      <h1 style={{
        display: 'flex', alignItems: 'center', gap: 10,
        fontFamily: t.display, fontSize: 26, fontWeight: 900,
        color: t.text, marginBottom: 8,
      }}>
        <NeonIcon type="hammer" size={24} color="gold" />
        {tr('forge.title')}
      </h1>
      <p style={{
        fontFamily: t.body, fontSize: 13, color: t.textSecondary,
        marginBottom: 24, lineHeight: 1.4,
      }}>
        {tr('forge.subtitle')}
      </p>

      {/* ─── Input Slots ─── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: 12, marginBottom: 24,
      }}>
        {[0, 1, 2].map((slotIdx) => {
          const itemId = selectedItems[slotIdx];
          const item = itemId ? inventory.find((i) => i.itemId === itemId) : null;
          const rc = item ? (rarity[item.rarity as keyof typeof rarity] ?? rarity.common) : null;

          return (
            <div
              key={slotIdx}
              style={{
                width: 90, height: 110, borderRadius: 16, textAlign: 'center',
                background: item ? `${rc!.color}08` : t.bgElevated,
                border: `2px dashed ${item ? `${rc!.color}40` : t.border}`,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 6,
                transition: 'border-color 0.3s ease, background 0.3s ease',
                animation: item && !prefersReducedMotion ? 'bounceIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)' : 'none',
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
                    {tr('forge.remove')}
                  </button>
                </>
              ) : (
                <>
                  <NeonIcon type="gem" size={24} color="muted" />
                  <span style={{ fontFamily: t.mono, fontSize: 9, color: t.textMuted }}>
                    {tr('forge.slot').replace('{n}', String(slotIdx + 1))}
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
            position: 'relative',
          }}>
            <div style={{ fontSize: 48, animation: prefersReducedMotion ? 'none' : 'hammerStrike 0.5s ease-out infinite', position: 'relative' }}>
              🔨
              {/* Spark particles — §N §3 reward sequence, 4 sparks staggered */}
              {!prefersReducedMotion && (
                <>
                  <div style={{ position: 'absolute', top: '30%', left: '50%', width: 4, height: 4, borderRadius: '50%', background: '#FFD166', animation: 'sparkUp 0.6s ease-out infinite', animationDelay: '0s' }} />
                  <div style={{ position: 'absolute', top: '40%', left: '60%', width: 4, height: 4, borderRadius: '50%', background: '#FFD166', animation: 'sparkRight 0.6s ease-out infinite', animationDelay: '0.15s' }} />
                  <div style={{ position: 'absolute', top: '40%', left: '40%', width: 4, height: 4, borderRadius: '50%', background: '#FFD166', animation: 'sparkLeft 0.6s ease-out infinite', animationDelay: '0.3s' }} />
                  <div style={{ position: 'absolute', top: '60%', left: '55%', width: 4, height: 4, borderRadius: '50%', background: '#FFD166', animation: 'sparkDown 0.6s ease-out infinite', animationDelay: '0.45s' }} />
                </>
              )}
            </div>
            <span style={{
              fontFamily: t.display, fontSize: 14, fontWeight: 700,
              ...(prefersReducedMotion
                ? { color: t.gold }
                : {
                    background: 'linear-gradient(90deg, #FFD166, #FFF5D6, #FFD166)',
                    backgroundSize: '200% 100%',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    animation: 'shimmer 1.5s linear infinite',
                  }
              ),
            }}>
              {tr('forge.forging')}
            </span>
            <button
              onClick={() => send({ type: 'SKIP' })}
              style={{
                padding: '4px 12px', borderRadius: 6, border: 'none',
                background: 'none', fontFamily: t.body, fontSize: 10,
                color: t.textMuted, cursor: 'pointer',
              }}
            >
              {tr('forge.skip')}
            </button>
          </div>
        ) : isSuccess && state.context.outputItem ? (
          <div style={{ animation: prefersReducedMotion ? 'none' : 'celebratePop 0.7s ease-out' }}>
            <div style={{
              padding: 20, borderRadius: 16, display: 'inline-block',
              background: `${rarity[state.context.outputItem.rarity as keyof typeof rarity]?.color ?? t.violet}10`,
              border: `1px solid ${rarity[state.context.outputItem.rarity as keyof typeof rarity]?.color ?? t.violet}30`,
            }}>
              <span style={{
                fontSize: 24,
                color: rarity[state.context.outputItem.rarity as keyof typeof rarity]?.color ?? t.violet,
              }}>
                {rarity[state.context.outputItem.rarity as keyof typeof rarity]?.icon ?? '◈'}
              </span>
              <h3 style={{
                fontFamily: t.display, fontSize: 16, fontWeight: 900,
                color: t.text, margin: '8px 0 4px',
              }}>
                {state.context.outputItem.name}
              </h3>
              <span style={{
                fontFamily: t.mono, fontSize: 10, fontWeight: 700,
                color: rarity[state.context.outputItem.rarity as keyof typeof rarity]?.color ?? t.violet,
                textTransform: 'uppercase',
              }}>
                {rarity[state.context.outputItem.rarity as keyof typeof rarity]?.label ?? state.context.outputItem.rarity}
              </span>
              <p style={{ fontFamily: t.body, fontSize: 11, color: t.textSecondary, marginTop: 8 }}>
                {tr('forge.coins')}
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
                {tr('forge.again')}
              </button>
            </div>
          </div>
        ) : isError ? (
          <div>
            <p style={{ fontFamily: t.display, fontSize: 14, fontWeight: 700, color: t.rose, marginBottom: 8 }}>
              {tr('error.quest_title')}
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
              {tr('common.btn_retry')}
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
            onMouseDown={() => setPressedForge(true)}
            onMouseUp={() => setPressedForge(false)}
            onMouseLeave={() => setPressedForge(false)}
            style={{
              padding: '14px 40px', borderRadius: 14, border: 'none',
              background: selectedItems.length === 3
                ? `linear-gradient(135deg, ${t.gold}, ${t.violet})`
                : t.bgElevated,
              fontFamily: t.display, fontSize: 15, fontWeight: 800,
              color: selectedItems.length === 3 ? '#FFF' : t.textMuted,
              cursor: selectedItems.length === 3 ? 'pointer' : 'not-allowed',
              boxShadow: selectedItems.length === 3 ? `0 4px 20px ${t.gold}30` : 'none',
              transition: 'background 0.3s ease, color 0.3s ease, box-shadow 0.3s ease, transform 0.15s ease',
              transform: pressedForge && selectedItems.length === 3 ? 'scale(0.98) translateY(1px)' : 'none',
            }}
          >
            {selectedItems.length === 3
              ? `Forge → ${selectedRarity ? (RARITY_NEXT[selectedRarity] ?? '???') : '???'}`
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
            {tr('forge.artifacts')}
          </h3>

          {forgeableItems.length === 0 ? (
            <p style={{ fontFamily: t.body, fontSize: 12, color: t.textMuted, textAlign: 'center', padding: 20 }}>
              {tr('forge.no_artifacts')}
            </p>
          ) : (
            Object.entries(itemsByRarity).map(([rar, items]) => {
              const rc = rarity[rar as keyof typeof rarity] ?? rarity.common;
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
                          onMouseDown={() => setPressedItemId(item.itemId)}
                          onMouseUp={() => setPressedItemId(null)}
                          onMouseLeave={() => setPressedItemId(null)}
                          style={{
                            padding: 10, borderRadius: 10, textAlign: 'left',
                            background: alreadySelected ? `${rc.color}12` : t.bgElevated,
                            border: `1px solid ${alreadySelected ? `${rc.color}30` : t.border}`,
                            cursor: canAdd && selectedItems.length < 3 ? 'pointer' : 'not-allowed',
                            opacity: canAdd && selectedItems.length < 3 ? 1 : 0.4,
                            transition: 'border-color 0.15s ease, background 0.15s ease, opacity 0.15s ease, transform 0.15s ease',
                            transform: pressedItemId === item.itemId ? 'scale(0.98)' : 'none',
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
