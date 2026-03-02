'use client';

import React, { useState } from 'react';
import { useMachine } from '@xstate/react';
import { useProgressionStore } from '@plan2skill/store';
import { trpc } from '@plan2skill/api-client';
import { shopPurchaseMachine } from '../home/_machines/shop-purchase.machine';
import { NeonIcon } from '../../(onboarding)/_components/NeonIcon';
import { t } from '../../(onboarding)/_components/tokens';

// ═══════════════════════════════════════════
// COSMETICS SHOP — "Visit the Merchant"
// Grid of purchasable items with coin prices
// Driven by shopPurchaseMachine (XState v5)
// RPG vocabulary: "Acquire this artifact"
// DEC-5F-04: Cosmetics only, no P2W
// ═══════════════════════════════════════════

const RARITY_CONFIG: Record<string, { color: string; icon: string; label: string }> = {
  common:    { color: '#71717A', icon: '●',  label: 'Common' },
  uncommon:  { color: '#6EE7B7', icon: '◆',  label: 'Uncommon' },
  rare:      { color: '#3B82F6', icon: '⬡',  label: 'Rare' },
  epic:      { color: '#9D7AFF', icon: '◈',  label: 'Epic' },
  legendary: { color: '#FFD166', icon: '★',  label: 'Legendary' },
};

export default function ShopPage() {
  const { coins } = useProgressionStore();
  const [state, send] = useMachine(shopPurchaseMachine);
  const { data: catalog, isLoading } = trpc.shop.catalog.useQuery();
  const purchaseMutation = trpc.shop.purchase.useMutation();

  const isBrowsing = state.matches('browsing');
  const isConfirming = state.matches('confirming');
  const isPurchasing = state.matches('purchasing');
  const isSuccess = state.matches('success');
  const isInsufficient = state.matches('insufficientFunds');

  const handlePurchase = () => {
    if (!state.context.selectedItemId) return;
    send({ type: 'CONFIRM' });

    purchaseMutation.mutate(
      { shopItemId: state.context.selectedItemId },
      {
        onSuccess: (result) => {
          send({ type: 'SUCCESS' });
          // Update local coins
          useProgressionStore.setState({ coins: result.coinsRemaining });
        },
        onError: (err) => {
          if (err.message.includes('Not enough coins')) {
            send({ type: 'INSUFFICIENT', error: err.message });
          } else {
            send({ type: 'ERROR', error: err.message });
          }
        },
      },
    );
  };

  return (
    <div style={{ animation: 'fadeUp 0.5s ease-out' }}>
      {/* Page Title */}
      <h1 style={{
        display: 'flex', alignItems: 'center', gap: 10,
        fontFamily: t.display, fontSize: 26, fontWeight: 900,
        color: t.text, marginBottom: 8,
      }}>
        <NeonIcon type="gem" size={24} color="gold" />
        The Merchant
      </h1>
      <p style={{
        fontFamily: t.body, fontSize: 13, color: t.textSecondary,
        marginBottom: 8, lineHeight: 1.4,
      }}>
        Spend your hard-earned coins on cosmetics and utilities. All items are earned through quests — no shortcuts, hero.
      </p>

      {/* Coin balance */}
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        padding: '8px 16px', borderRadius: 12, marginBottom: 24,
        background: `${t.gold}10`, border: `1px solid ${t.gold}20`,
      }}>
        <NeonIcon type="star" size={16} color="gold" />
        <span style={{ fontFamily: t.mono, fontSize: 16, fontWeight: 800, color: t.gold }}>
          {coins}
        </span>
        <span style={{ fontFamily: t.body, fontSize: 11, color: t.textMuted }}>
          coins
        </span>
      </div>

      {/* Confirmation/Success overlay */}
      {(isConfirming || isPurchasing || isSuccess || isInsufficient) && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 200,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)',
          animation: 'fadeUp 0.2s ease-out',
        }}>
          <div style={{
            width: 320, padding: 28, borderRadius: 20, textAlign: 'center',
            background: t.bgCard, border: `1px solid ${t.border}`,
            animation: 'bounceIn 0.3s ease-out',
          }}>
            {isConfirming && (
              <>
                <NeonIcon type="gem" size={32} color="gold" style={{ marginBottom: 12 }} />
                <h3 style={{ fontFamily: t.display, fontSize: 16, fontWeight: 800, color: t.text, marginBottom: 4 }}>
                  Acquire {state.context.selectedItemName}?
                </h3>
                <p style={{ fontFamily: t.mono, fontSize: 13, color: t.gold, marginBottom: 16 }}>
                  {state.context.selectedItemCost} coins
                </p>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                  <button
                    onClick={handlePurchase}
                    style={{
                      padding: '10px 24px', borderRadius: 12, border: 'none',
                      background: t.gradient, fontFamily: t.display, fontSize: 13,
                      fontWeight: 800, color: '#FFF', cursor: 'pointer',
                    }}
                  >
                    Acquire
                  </button>
                  <button
                    onClick={() => send({ type: 'RESET' })}
                    style={{
                      padding: '10px 24px', borderRadius: 12, border: 'none',
                      background: t.bgElevated, fontFamily: t.body, fontSize: 13,
                      color: t.textSecondary, cursor: 'pointer',
                    }}
                  >
                    Not now
                  </button>
                </div>
              </>
            )}
            {isPurchasing && (
              <>
                <div style={{ animation: 'shimmer 1s ease-in-out infinite', marginBottom: 12 }}>
                  <NeonIcon type="gem" size={32} color="gold" />
                </div>
                <p style={{ fontFamily: t.display, fontSize: 14, fontWeight: 700, color: t.text }}>
                  Acquiring artifact...
                </p>
              </>
            )}
            {isSuccess && (
              <>
                <div style={{ animation: 'celebratePop 0.7s ease-out' }}>
                  <NeonIcon type="trophy" size={40} color="gold" style={{ marginBottom: 12 }} />
                </div>
                <h3 style={{ fontFamily: t.display, fontSize: 16, fontWeight: 800, color: t.gold }}>
                  Artifact Acquired!
                </h3>
                <p style={{ fontFamily: t.body, fontSize: 12, color: t.textMuted, marginTop: 4 }}>
                  Check your inventory to see it.
                </p>
              </>
            )}
            {isInsufficient && (
              <>
                <NeonIcon type="close" size={32} color="rose" style={{ marginBottom: 12 }} />
                <h3 style={{ fontFamily: t.display, fontSize: 16, fontWeight: 800, color: t.rose }}>
                  Not enough coins, hero!
                </h3>
                <p style={{ fontFamily: t.body, fontSize: 12, color: t.textMuted, marginTop: 4, marginBottom: 16 }}>
                  Complete more quests to earn gold.
                </p>
                <button
                  onClick={() => send({ type: 'RESET' })}
                  style={{
                    padding: '8px 20px', borderRadius: 10, border: 'none',
                    background: t.bgElevated, fontFamily: t.body, fontSize: 12,
                    color: t.textSecondary, cursor: 'pointer',
                  }}
                >
                  Back to shop
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ animation: 'shimmer 1.5s ease-in-out infinite' }}>
            <NeonIcon type="gem" size={32} color="gold" />
          </div>
          <p style={{ fontFamily: t.display, fontSize: 14, fontWeight: 700, color: t.textSecondary, marginTop: 12 }}>
            Loading wares...
          </p>
        </div>
      )}

      {/* Shop Grid */}
      {catalog && (
        <div className="grid grid-cols-2 md:grid-cols-3" style={{ gap: 12 }}>
          {catalog.map((item) => {
            const rc = RARITY_CONFIG[item.rarity] ?? RARITY_CONFIG.common!;
            const canAfford = coins >= item.cost;

            return (
              <button
                key={item.id}
                onClick={() => {
                  send({
                    type: 'SELECT',
                    itemId: item.id,
                    name: item.name,
                    cost: item.cost,
                    coins,
                  });
                }}
                disabled={!isBrowsing}
                style={{
                  padding: 16, borderRadius: 16, textAlign: 'center',
                  background: t.bgCard, border: `1px solid ${rc.color}20`,
                  cursor: isBrowsing ? 'pointer' : 'default',
                  transition: 'all 0.2s ease',
                  opacity: canAfford ? 1 : 0.5,
                }}
              >
                {/* Rarity badge */}
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  padding: '2px 8px', borderRadius: 8, marginBottom: 8,
                  background: `${rc.color}12`,
                }}>
                  <span style={{ fontSize: 10, color: rc.color }}>{rc.icon}</span>
                  <span style={{
                    fontFamily: t.mono, fontSize: 8, fontWeight: 700,
                    color: rc.color, textTransform: 'uppercase',
                  }}>
                    {rc.label}
                  </span>
                </div>

                {/* Item icon */}
                <div style={{
                  width: 48, height: 48, margin: '0 auto 8px', borderRadius: 12,
                  background: `${rc.color}10`, border: `1px solid ${rc.color}20`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <NeonIcon
                    type={item.type === 'streak_freeze' ? 'shield' : item.type === 'loot_reroll' ? 'refresh' : 'gem'}
                    size={24}
                    color={rc.color}
                  />
                </div>

                {/* Name */}
                <div style={{
                  fontFamily: t.display, fontSize: 12, fontWeight: 700,
                  color: t.text, marginBottom: 4,
                }}>
                  {item.name}
                </div>

                {/* Description */}
                <div style={{
                  fontFamily: t.body, fontSize: 10, color: t.textMuted,
                  lineHeight: 1.3, marginBottom: 8, minHeight: 26,
                }}>
                  {item.description}
                </div>

                {/* Price */}
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  padding: '4px 12px', borderRadius: 8,
                  background: canAfford ? `${t.gold}12` : `${t.rose}08`,
                }}>
                  <NeonIcon type="star" size={10} color={canAfford ? 'gold' : 'rose'} />
                  <span style={{
                    fontFamily: t.mono, fontSize: 11, fontWeight: 800,
                    color: canAfford ? t.gold : t.rose,
                  }}>
                    {item.cost}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
