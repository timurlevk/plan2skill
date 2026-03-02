'use client';

import React, { useMemo } from 'react';
import { NeonIcon, type NeonIconType } from '../../../(onboarding)/_components/NeonIcon';
import { t } from '../../../(onboarding)/_components/tokens';
import type { WhatsNextOption, TrendingDomain } from '@plan2skill/types';

// ═══════════════════════════════════════════
// WHAT'S NEXT SCREEN — BL-008
// 5 equal-weight option cards, adaptive ordering
// ═══════════════════════════════════════════

interface WhatsNextScreenProps {
  overdueReviewCount: number;
  trending: TrendingDomain[];
  onSelectOption: (option: WhatsNextOption) => void;
}

interface OptionCard {
  option: WhatsNextOption;
  icon: NeonIconType;
  title: string;
  description: string;
  borderColor: string;
  badge?: string;
}

export function WhatsNextScreen({
  overdueReviewCount,
  trending,
  onSelectOption,
}: WhatsNextScreenProps) {
  const topTrending = trending.slice(0, 2).map((d) => d.skillDomain).join(', ');

  const cards: OptionCard[] = useMemo(() => {
    const base: OptionCard[] = [
      {
        option: 'ai_generated',
        icon: 'sparkle',
        title: 'New Quest Line',
        description: 'Let AI forge a new adventure based on your growth',
        borderColor: t.violet,
      },
      {
        option: 'custom_goals',
        icon: 'target',
        title: 'Chart Your Own Path',
        description: 'Set your own goals and build a custom quest line',
        borderColor: t.cyan,
      },
      {
        option: 'alternative_skills',
        icon: 'compass',
        title: 'Explore New Domains',
        description: 'Discover skill domains you haven\'t tried yet',
        borderColor: t.mint,
        badge: 'Unlocks: Domain Explorer Set',
      },
      {
        option: 'trending_paths',
        icon: 'fire',
        title: 'See What Heroes Are Learning',
        description: topTrending
          ? `Trending: ${topTrending}`
          : 'Discover the most popular skill domains',
        borderColor: t.gold,
      },
      {
        option: 'continue_reviews',
        icon: 'book',
        title: 'Sharpen Your Skills',
        description: 'Review and strengthen what you\'ve learned',
        borderColor: t.indigo,
        badge: overdueReviewCount > 0 ? `${overdueReviewCount} due` : undefined,
      },
    ];

    // Adaptive ordering: reviews first if overdue, else AI first
    if (overdueReviewCount > 0) {
      const reviewCard = base.find((c) => c.option === 'continue_reviews')!;
      const rest = base.filter((c) => c.option !== 'continue_reviews');
      return [reviewCard, ...rest];
    }

    return base;
  }, [overdueReviewCount, topTrending]);

  return (
    <div
      role="dialog"
      aria-label="What's next on your journey?"
      aria-modal="true"
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: `${t.bg}F5`,
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        padding: 24,
        overflow: 'auto',
      }}
    >
      {/* Title */}
      <h2 style={{
        fontFamily: t.display, fontSize: 24, fontWeight: 900,
        color: t.text, textAlign: 'center',
        marginBottom: 8,
        animation: 'fadeUp 0.4s ease-out both',
      }}>
        Your journey continues, Hero!
      </h2>
      <p style={{
        fontFamily: t.body, fontSize: 14, color: t.textSecondary,
        textAlign: 'center', marginBottom: 24,
        animation: 'fadeUp 0.4s ease-out 0.1s both',
      }}>
        Choose your next adventure
      </p>

      {/* Option cards — vertical stack */}
      <div style={{
        display: 'flex', flexDirection: 'column',
        gap: 12, width: '100%', maxWidth: 420,
      }}>
        {cards.map((card, i) => (
          <button
            key={card.option}
            onClick={() => onSelectOption(card.option)}
            role="button"
            aria-label={`${card.title}: ${card.description}`}
            style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '16px 18px', borderRadius: 14,
              background: t.bgCard,
              border: `1px solid ${card.borderColor}30`,
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.2s ease',
              animation: `fadeUp 0.4s ease-out ${0.15 + i * 0.08}s both`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = card.borderColor;
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = `0 0 12px ${card.borderColor}20`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = `${card.borderColor}30`;
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            {/* Icon */}
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: `${card.borderColor}12`,
              flexShrink: 0,
            }}>
              <NeonIcon type={card.icon} size={20} color={card.borderColor} />
            </div>

            {/* Text */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  fontFamily: t.display, fontSize: 14, fontWeight: 700,
                  color: t.text,
                }}>
                  {card.title}
                </span>
                {card.badge && (
                  <span style={{
                    fontFamily: t.mono, fontSize: 9, fontWeight: 700,
                    padding: '2px 8px', borderRadius: 8,
                    background: `${card.borderColor}15`,
                    color: card.borderColor,
                  }}>
                    {card.badge}
                  </span>
                )}
              </div>
              <p style={{
                fontFamily: t.body, fontSize: 12, color: t.textSecondary,
                margin: '2px 0 0', lineHeight: 1.4,
              }}>
                {card.description}
              </p>
            </div>

            {/* Arrow */}
            <span style={{ fontSize: 12, color: t.textMuted }}>→</span>
          </button>
        ))}
      </div>
    </div>
  );
}
