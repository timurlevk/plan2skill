'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useMachine } from '@xstate/react';
import { useProgressionStore, useI18nStore } from '@plan2skill/store';
import { trpc } from '@plan2skill/api-client';
import { shopPurchaseMachine } from '../home/_machines/shop-purchase.machine';
import { NeonIcon } from '../../(onboarding)/_components/NeonIcon';
import { t, rarity } from '../../(onboarding)/_components/tokens';

// ═══════════════════════════════════════════
// COSMETICS SHOP — "Visit the Merchant"
// Grid of purchasable items with coin prices
// Driven by shopPurchaseMachine (XState v5)
// RPG vocabulary: "Acquire this artifact"
// DEC-5F-04: Cosmetics only, no P2W
// ═══════════════════════════════════════════

export default function ShopPage() {
  // Reduced-motion check — §N MICRO_ANIMATION_GUIDELINES §10 (BLOCKER)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const tr = useI18nStore((s) => s.t);
  const { coins } = useProgressionStore();
  const [state, send] = useMachine(shopPurchaseMachine);
  const { data: catalog, isLoading, isError: catalogError } = trpc.shop.catalog.useQuery();
  const purchaseMutation = trpc.shop.purchase.useMutation();

  const isBrowsing = state.matches('browsing');
  const isConfirming = state.matches('confirming');
  const isPurchasing = state.matches('purchasing');
  const isSuccess = state.matches('success');
  const isInsufficient = state.matches('insufficientFunds');

  // Item card hover/press micro-interactions — §N Tier Micro (100–400ms)
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [pressedItem, setPressedItem] = useState<string | null>(null);

  // Modal button press states
  const [pressedAcquire, setPressedAcquire] = useState(false);
  const [pressedNotNow, setPressedNotNow] = useState(false);

  // Coin counter bounce — §N §4 feedback
  const [coinBounce, setCoinBounce] = useState(false);
  const prevCoinsRef = useRef(coins);
  useEffect(() => {
    if (prevCoinsRef.current !== coins) {
      setCoinBounce(true);
      const timer = setTimeout(() => setCoinBounce(false), 150);
      prevCoinsRef.current = coins;
      return () => clearTimeout(timer);
    }
  }, [coins]);

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
    <div style={{ animation: prefersReducedMotion ? 'none' : 'fadeUp 0.4s ease-out' }}>
      {/* Shake animation for insufficient funds — §N §4 feedback */}
      <style>{`
        @keyframes coinShake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(4px); }
          75% { transform: translateX(-4px); }
        }
      `}</style>
      {/* Page Title */}
      <h1 style={{
        display: 'flex', alignItems: 'center', gap: 10,
        fontFamily: t.display, fontSize: 26, fontWeight: 900,
        color: t.text, marginBottom: 8,
      }}>
        <NeonIcon type="pricetag" size={24} color="gold" />
        {tr('shop.title')}
      </h1>
      <p style={{
        fontFamily: t.body, fontSize: 13, color: t.textSecondary,
        marginBottom: 8, lineHeight: 1.4,
      }}>
        {tr('shop.subtitle')}
      </p>

      {/* Coin balance */}
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        padding: '8px 16px', borderRadius: 12, marginBottom: 24,
        background: `${t.gold}10`, border: `1px solid ${t.gold}20`,
      }}>
        <NeonIcon type="star" size={16} color="gold" />
        <span style={{
          fontFamily: t.mono, fontSize: 16, fontWeight: 800, color: t.gold,
          transform: coinBounce && !prefersReducedMotion ? 'scale(1.2)' : 'scale(1)',
          transition: 'transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)',
          display: 'inline-block',
        }}>
          {coins}
        </span>
        <span style={{ fontFamily: t.body, fontSize: 11, color: t.textMuted }}>
          {tr('shop.cost', '{cost} coins').replace('{cost} ', '')}
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
            animation: prefersReducedMotion ? 'none' : 'bounceIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}>
            {isConfirming && (
              <>
                <NeonIcon type="gem" size={32} color="gold" style={{ marginBottom: 12 }} />
                <h3 style={{ fontFamily: t.display, fontSize: 16, fontWeight: 800, color: t.text, marginBottom: 4 }}>
                  {tr('shop.confirm', 'Acquire {item}?').replace('{item}', state.context.selectedItemName ?? '')}
                </h3>
                <p style={{ fontFamily: t.mono, fontSize: 13, color: t.gold, marginBottom: 16 }}>
                  {tr('shop.cost', '{cost} coins').replace('{cost}', String(state.context.selectedItemCost ?? 0))}
                </p>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                  <button
                    onClick={handlePurchase}
                    onMouseDown={() => setPressedAcquire(true)}
                    onMouseUp={() => setPressedAcquire(false)}
                    onMouseLeave={() => setPressedAcquire(false)}
                    style={{
                      padding: '10px 24px', borderRadius: 12, border: 'none',
                      background: t.gradient, fontFamily: t.display, fontSize: 13,
                      fontWeight: 800, color: '#FFF', cursor: 'pointer',
                      transform: pressedAcquire ? 'scale(0.98) translateY(1px)' : 'none',
                      transition: 'transform 0.15s ease',
                    }}
                  >
                    {tr('shop.acquire')}
                  </button>
                  <button
                    onClick={() => send({ type: 'RESET' })}
                    onMouseDown={() => setPressedNotNow(true)}
                    onMouseUp={() => setPressedNotNow(false)}
                    onMouseLeave={() => setPressedNotNow(false)}
                    style={{
                      padding: '10px 24px', borderRadius: 12, border: 'none',
                      background: t.bgElevated, fontFamily: t.body, fontSize: 13,
                      color: t.textSecondary, cursor: 'pointer',
                      transform: pressedNotNow ? 'scale(0.98) translateY(1px)' : 'none',
                      transition: 'transform 0.15s ease',
                    }}
                  >
                    {tr('shop.not_now')}
                  </button>
                </div>
              </>
            )}
            {isPurchasing && (
              <>
                <div style={{ animation: prefersReducedMotion ? 'none' : 'shimmer 1.5s linear infinite', marginBottom: 12 }}>
                  <NeonIcon type="gem" size={32} color="gold" />
                </div>
                <p style={{ fontFamily: t.display, fontSize: 14, fontWeight: 700, color: t.text }}>
                  {tr('shop.acquiring', 'Acquiring artifact...')}
                </p>
              </>
            )}
            {isSuccess && (
              <>
                <div style={{ animation: prefersReducedMotion ? 'none' : 'celebratePop 0.7s ease-out' }}>
                  <NeonIcon type="trophy" size={40} color="gold" style={{ marginBottom: 12 }} />
                </div>
                <h3 style={{ fontFamily: t.display, fontSize: 16, fontWeight: 800, color: t.gold }}>
                  {tr('shop.success', 'Artifact Acquired!')}
                </h3>
                <p style={{ fontFamily: t.body, fontSize: 12, color: t.textMuted, marginTop: 4 }}>
                  {tr('shop.success_desc', 'Check your inventory.')}
                </p>
              </>
            )}
            {isInsufficient && (
              <>
                <div style={{
                  display: 'inline-block', marginBottom: 12,
                  animation: prefersReducedMotion ? 'none' : 'coinShake 0.3s ease',
                }}>
                  <NeonIcon type="lock" size={32} color="muted" />
                </div>
                <h3 style={{ fontFamily: t.display, fontSize: 16, fontWeight: 800, color: t.rose }}>
                  {tr('shop.insufficient', 'Not enough coins, hero!')}
                </h3>
                <p style={{ fontFamily: t.body, fontSize: 12, color: t.textMuted, marginTop: 4, marginBottom: 16 }}>
                  {tr('shop.insufficient_desc', 'Complete more quests to earn gold.')}
                </p>
                <button
                  onClick={() => send({ type: 'RESET' })}
                  style={{
                    padding: '8px 20px', borderRadius: 10, border: 'none',
                    background: t.bgElevated, fontFamily: t.body, fontSize: 12,
                    color: t.textSecondary, cursor: 'pointer',
                  }}
                >
                  {tr('shop.back', 'Back')}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Error state */}
      {catalogError && (
        <div style={{
          textAlign: 'center', padding: 40,
          borderRadius: 14, background: t.bgCard, border: `1px solid ${t.border}`,
        }}>
          <div style={{ fontFamily: t.body, fontSize: 14, color: t.rose, marginBottom: 8 }}>
            {tr('shop.error', 'The merchant is unavailable')}
          </div>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '8px 20px', borderRadius: 10,
              background: t.bgElevated, border: `1px solid ${t.border}`,
              fontFamily: t.body, fontSize: 13, color: t.textSecondary,
              cursor: 'pointer',
            }}
          >
            {tr('shop.retry', 'Try again')}
          </button>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ animation: prefersReducedMotion ? 'none' : 'shimmer 1.5s linear infinite' }}>
            <NeonIcon type="gem" size={32} color="gold" />
          </div>
          <p style={{ fontFamily: t.display, fontSize: 14, fontWeight: 700, color: t.textSecondary, marginTop: 12 }}>
            {tr('common.loading')}
          </p>
        </div>
      )}

      {/* Shop Grid */}
      {catalog && (
        <div className="grid grid-cols-2 md:grid-cols-3" style={{ gap: 12 }}>
          {catalog.map((item, index) => {
            const rc = rarity[item.rarity as keyof typeof rarity] ?? rarity.common;
            const canAfford = coins >= item.cost;
            const isHovered = hoveredItem === item.id;
            const isPressed = pressedItem === item.id;

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
                onMouseEnter={() => setHoveredItem(item.id)}
                onMouseLeave={() => { setHoveredItem(null); setPressedItem(null); }}
                onMouseDown={() => setPressedItem(item.id)}
                onMouseUp={() => setPressedItem(null)}
                style={{
                  padding: 16, borderRadius: 16, textAlign: 'center',
                  background: t.bgCard,
                  border: `1px solid ${isHovered ? `${rc.color}40` : `${rc.color}20`}`,
                  cursor: isBrowsing ? 'pointer' : 'default',
                  transition: 'transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease',
                  opacity: canAfford ? 1 : 0.5,
                  transform: isPressed ? 'scale(0.98)' : isHovered ? 'translateY(-2px)' : 'none',
                  boxShadow: isHovered ? `0 0 12px ${rc.color}20` : 'none',
                  animation: prefersReducedMotion ? 'none' : `fadeUp 0.4s ease-out ${Math.min(index, 14) * 0.06}s both`,
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
