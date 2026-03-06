'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useI18nStore, useSocialStore, useProgressionStore, useCharacterStore } from '@plan2skill/store';
import { trpc } from '@plan2skill/api-client';
import { NeonIcon } from '../../(onboarding)/_components/NeonIcon';
import type { NeonIconType } from '../../(onboarding)/_components/NeonIcon';
import { t, rarity, LEAGUE_TIERS as LEAGUE_TOKEN_TIERS } from '../../(onboarding)/_components/tokens';
import { CHARACTERS, charArtStrings, charPalettes } from '../../(onboarding)/_components/characters';
import { parseArt, PixelCanvas } from '../../(onboarding)/_components/PixelEngine';
import { useWeeklyChallenges } from '../home/_hooks/useWeeklyChallenges';

// ═══════════════════════════════════════════
// GUILD ARENA — Leagues + Friends + Party Quests
// Duolingo-model: opt-in, weekly reset, promotion/demotion
// ═══════════════════════════════════════════

// ─── League tiers (Duolingo model) ───
const LEAGUE_TIERS = [
  { id: 'bronze',  label: 'Bronze',  labelKey: 'league.bronze',  color: LEAGUE_TOKEN_TIERS.bronze.color, icon: 'tierBronze'  as const, nextAt: 0 },
  { id: 'silver',  label: 'Silver',  labelKey: 'league.silver',  color: LEAGUE_TOKEN_TIERS.silver.color, icon: 'tierSilver'  as const, nextAt: 500 },
  { id: 'gold',    label: 'Gold',    labelKey: 'league.gold',    color: LEAGUE_TOKEN_TIERS.gold.color,   icon: 'tierGold'    as const, nextAt: 1500 },
  { id: 'diamond', label: 'Diamond', labelKey: 'league.diamond', color: LEAGUE_TOKEN_TIERS.diamond.color, icon: 'tierDiamond' as const, nextAt: 3000 },
] as const;

// ─── Rarity config for party quest bosses ───
const BOSS_RARITY_CONFIG: Record<string, { color: string; bg: string; icon: string; label: string }> = {
  common:    { color: rarity.common?.color ?? '#9CA3AF', bg: rarity.common?.bg ?? '#9CA3AF12', icon: '', label: 'Common Boss' },
  rare:      { color: rarity.rare?.color ?? '#60A5FA', bg: rarity.rare?.bg ?? '#60A5FA12', icon: rarity.rare?.icon ?? '💎', label: 'Rare Boss' },
  epic:      { color: rarity.epic?.color ?? '#A78BFA', bg: rarity.epic?.bg ?? '#A78BFA12', icon: rarity.epic?.icon ?? '🔮', label: 'Epic Boss' },
  legendary: { color: rarity.legendary?.color ?? '#FBBF24', bg: rarity.legendary?.bg ?? '#FBBF2412', icon: rarity.legendary?.icon ?? '⭐', label: 'Legendary Boss' },
};

// ─── Challenge descriptions + hints (shared with WeeklyChallenges widget) ───
function getChallengeDescriptionI18n(type: string, target: number, tr: (k: string, fb: string) => string, domain?: string): string {
  switch (type) {
    case 'quest_count':
    case 'quest_volume':
      return tr('league.ch_quest_count', 'Complete {n} quests').replace('{n}', String(target));
    case 'xp_earn':
    case 'xp_target':
      return tr('league.ch_xp_earn', 'Earn {n} XP').replace('{n}', String(target));
    case 'review_count':
    case 'review_sprint':
      return tr('league.ch_review', 'Review {n} skills').replace('{n}', String(target));
    case 'streak_maintain':
    case 'streak_guard':
      return tr('league.ch_streak', 'Keep your streak all week');
    case 'accuracy':
      return tr('league.ch_accuracy', 'Score {n}%+ accuracy').replace('{n}', String(target));
    case 'domain_variety':
      return tr('league.ch_domain_variety', 'Quest in {n} domains').replace('{n}', String(target));
    case 'domain_focus':
      return tr('league.ch_domain_focus', 'Complete {n} {domain} quests').replace('{n}', String(target)).replace('{domain}', domain ?? '');
    case 'time_spent':
      return tr('league.ch_time_spent', 'Train for {n} minutes').replace('{n}', String(target));
    case 'perfect_day':
      return tr('league.ch_perfect_day', 'Have {n} Perfect Day(s)').replace('{n}', String(target));
    case 'mastery_push':
      return tr('league.ch_mastery_push', 'Level up {n} skill(s)').replace('{n}', String(target));
    default:
      return tr('league.ch_default', 'Complete {n} tasks').replace('{n}', String(target));
  }
}

function getChallengeHintI18n(type: string, tr: (k: string, fb: string) => string): string {
  switch (type) {
    case 'quest_count':
    case 'quest_volume':
      return tr('league.hint_quest', 'Complete any quests — daily or roadmap');
    case 'xp_earn':
    case 'xp_target':
      return tr('league.hint_xp', 'Every quest, review, and challenge earns XP');
    case 'review_count':
    case 'review_sprint':
      return tr('league.hint_review', 'Practice your skills in the Mastery Hub');
    case 'streak_maintain':
    case 'streak_guard':
      return tr('league.hint_streak', 'Visit each day to keep your streak alive');
    case 'accuracy':
      return tr('league.hint_accuracy', 'Aim for high scores on quest answers');
    case 'domain_variety':
      return tr('league.hint_variety', 'Try quests from different skill domains');
    case 'domain_focus':
      return tr('league.hint_focus', 'Focus on your target domain this week');
    case 'time_spent':
      return tr('league.hint_time', 'Every minute of training counts');
    case 'perfect_day':
      return tr('league.hint_perfect', 'Complete all 5 daily quests in one day');
    case 'mastery_push':
      return tr('league.hint_mastery', 'Review skills to push them to the next level');
    default:
      return '';
  }
}

const CHALLENGE_ICONS: Record<string, NeonIconType> = {
  quest_count: 'lightning', quest_volume: 'lightning',
  xp_earn: 'star', xp_target: 'star',
  review_count: 'book', review_sprint: 'book',
  streak_maintain: 'fire', streak_guard: 'fire',
  accuracy: 'target', domain_variety: 'atom', domain_focus: 'atom',
  time_spent: 'clock', perfect_day: 'star', mastery_push: 'shield',
};

interface DifficultyToken { color: string; numeral: string; borderStyle: string }
const DEFAULT_DIFF: DifficultyToken = { color: '#4ECDC4', numeral: 'Ⅰ', borderStyle: 'solid' };
const DIFFICULTY_MAP: Record<string, DifficultyToken> = {
  easy:   { color: t.mint,   numeral: 'Ⅰ', borderStyle: 'solid' },
  medium: { color: t.indigo, numeral: 'Ⅱ', borderStyle: 'dashed' },
  hard:   { color: t.violet, numeral: 'Ⅲ', borderStyle: 'double' },
};

function getChallengeStatus(completed: boolean, currentValue: number, tr: (k: string, fb: string) => string): { label: string; color: string } {
  if (completed) return { label: tr('league.status_complete', '✓ Complete — Claimed'), color: t.cyan };
  if (currentValue > 0) return { label: tr('league.status_progress', 'In progress'), color: t.gold };
  return { label: tr('league.status_not_started', 'Not started'), color: t.textMuted };
}

// ─── Tabs ───
type TabId = 'league' | 'weekly' | 'friends' | 'party';
const TABS: { id: TabId; label: string; labelKey: string; icon: NeonIconType }[] = [
  { id: 'league',  label: 'League',        labelKey: 'league.tab_league',  icon: 'trophy' },
  { id: 'weekly',  label: 'Weekly Quests',  labelKey: 'league.tab_weekly',  icon: 'target' },
  { id: 'friends', label: 'Friends',       labelKey: 'league.tab_friends', icon: 'users' },
  { id: 'party',   label: 'Party Quest',   labelKey: 'league.tab_party',   icon: 'lightning' },
];

function getCharArt(charId: string) {
  if (!charArtStrings[charId] || !charPalettes[charId]) return null;
  return parseArt(charArtStrings[charId]!, charPalettes[charId]!);
}

export default function LeaguePage() {
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

  const searchParams = useSearchParams();
  const characterId = useCharacterStore((s) => s.characterId);
  const weekly = useWeeklyChallenges();
  const { leaderboard, friends, activePartyQuest, leagueTier, weeklyXp, displayName } = useSocialStore();
  const { level, currentStreak } = useProgressionStore();

  // tRPC mutations for social actions
  const sendFriendRequest = trpc.social.sendFriendRequest.useMutation();
  const joinPartyQuest = trpc.social.joinPartyQuest.useMutation();
  const trpcUtils = trpc.useUtils();

  // Add friend modal state
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [friendPublicId, setFriendPublicId] = useState('');
  const [friendError, setFriendError] = useState('');

  // Read initial tab from URL ?tab=weekly (deep link from dashboard widget)
  const initialTab = searchParams.get('tab') as TabId | null;
  const [activeTab, setActiveTab] = useState<TabId>(
    initialTab && TABS.some(tab => tab.id === initialTab) ? initialTab : 'league',
  );
  const [joined, setJoined] = useState(false);

  // Button press states — §N Tier Micro (100–400ms)
  const [pressedJoin, setPressedJoin] = useState(false);
  const [pressedInvite, setPressedInvite] = useState(false);

  // Tab exit animation state
  const [tabExiting, setTabExiting] = useState(false);
  const [pendingTab, setPendingTab] = useState<TabId | null>(null);

  const handleTabSwitch = (newTab: TabId) => {
    if (newTab === activeTab || tabExiting) return;
    if (prefersReducedMotion) {
      setActiveTab(newTab);
      return;
    }
    setTabExiting(true);
    setPendingTab(newTab);
    setTimeout(() => {
      setActiveTab(newTab);
      setTabExiting(false);
      setPendingTab(null);
    }, 200);
  };

  // Friend card hover state
  const [hoveredFriend, setHoveredFriend] = useState<string | null>(null);

  const charMeta = CHARACTERS.find(c => c.id === characterId);
  const currentTier = LEAGUE_TIERS.find(lt => lt.id === leagueTier) ?? LEAGUE_TIERS[0];

  return (
    <div style={{ animation: prefersReducedMotion ? 'none' : 'fadeUp 0.4s ease-out' }}>
      {/* Background glow orbs — gold-tinted, §N §6 Ambient */}
      {!prefersReducedMotion && (
        <>
          <div aria-hidden="true" style={{
            position: 'fixed', top: '18%', right: '12%',
            width: 200, height: 200, borderRadius: '50%',
            background: `radial-gradient(circle, ${t.gold}08 0%, transparent 70%)`,
            pointerEvents: 'none', zIndex: 0,
            filter: 'blur(40px)',
          }} />
          <div aria-hidden="true" style={{
            position: 'fixed', bottom: '22%', left: '8%',
            width: 160, height: 160, borderRadius: '50%',
            background: `radial-gradient(circle, ${t.gold}06 0%, transparent 70%)`,
            pointerEvents: 'none', zIndex: 0,
            filter: 'blur(40px)',
          }} />
        </>
      )}

      {/* ─── Title ─── */}
      <h1 style={{
        display: 'flex', alignItems: 'center', gap: 10,
        fontFamily: t.display, fontSize: 26, fontWeight: 900,
        color: t.text, marginBottom: 8,
      }}>
        <NeonIcon type="trophy" size={24} color="gold" />
        {tr('dashboard.guild_arena', 'GUILD ARENA')}
      </h1>
      <p style={{
        fontFamily: t.body, fontSize: 14, color: t.textSecondary,
        marginBottom: 24,
      }}>
        {tr('dashboard.guild_subtitle', 'Leagues, Friends, Party Quests')}
      </p>

      {/* ─── Tab bar ─── */}
      <div style={{
        display: 'flex', gap: 4,
        padding: 4, borderRadius: 14,
        background: t.bgElevated, border: `1px solid ${t.border}`,
        marginBottom: 24,
      }}>
        {TABS.map(tab => {
          const active = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabSwitch(tab.id)}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                padding: '10px 0', borderRadius: 10,
                background: active ? t.bgCard : 'transparent',
                border: active ? `1px solid ${t.border}` : '1px solid transparent',
                boxShadow: active ? `0 2px 8px rgba(0,0,0,0.2)` : 'none',
                cursor: 'pointer', transition: 'background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease',
              }}
            >
              <NeonIcon type={tab.icon} size={14} color={active ? 'gold' : 'muted'} />
              <span style={{
                fontFamily: t.display, fontSize: 12, fontWeight: active ? 700 : 500,
                color: active ? t.text : t.textMuted,
              }}>
                {tr(tab.labelKey, tab.label)}
              </span>
            </button>
          );
        })}
      </div>

      {/* ═══════════════════════════════════════════ */}
      {/* TAB: LEAGUE — Opt-in weekly competition    */}
      {/* ═══════════════════════════════════════════ */}
      {activeTab === 'league' && (
        <div style={{
          animation: tabExiting ? 'fadeUp 0.2s ease-in reverse forwards' : 'fadeUp 0.3s ease-out',
        }}>
          {/* League tier progression */}
          <div style={{
            padding: 20, borderRadius: 16,
            background: t.bgCard, border: `1px solid ${t.border}`,
            marginBottom: 16,
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: 16,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: '50%',
                  background: `${currentTier.color}20`,
                  border: `2px solid ${currentTier.color}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: `0 0 12px ${currentTier.color}40`,
                  animation: 'pulse 2s ease-in-out infinite',
                }}>
                  <NeonIcon type={currentTier.icon} size={18} color={currentTier.color} />
                </div>
                <div>
                  <div style={{
                    fontFamily: t.display, fontSize: 18, fontWeight: 800, color: t.text,
                  }}>
                    {tr('league.league_label', '{tier} League').replace('{tier}', tr(currentTier.labelKey, currentTier.label))}
                  </div>
                  <div style={{ fontFamily: t.body, fontSize: 12, color: t.textMuted }}>
                    {tr('league.week_remaining', 'Week {n} • {d} days remaining').replace('{n}', '1').replace('{d}', '6')}
                  </div>
                </div>
              </div>
              <span style={{
                fontFamily: t.mono, fontSize: 10, fontWeight: 700,
                color: t.textMuted, padding: '4px 10px', borderRadius: 8,
                background: t.bgElevated,
              }}>
                {tr('league.heroes_count', '{n} heroes').replace('{n}', String(leaderboard.length))}
              </span>
            </div>

            {/* Tier progression dots */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              position: 'relative', marginBottom: 16, padding: '0 8px',
            }}>
              {/* Connecting line */}
              <div style={{
                position: 'absolute', top: '50%', left: 24, right: 24,
                height: 2, background: t.border, transform: 'translateY(-50%)',
              }} />
              {LEAGUE_TIERS.map((tier) => {
                const isCurrent = tier.id === currentTier.id;
                return (
                  <div key={tier.id} style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                    position: 'relative', zIndex: 1,
                  }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%',
                      background: isCurrent ? `${tier.color}25` : t.bgElevated,
                      border: `2px solid ${isCurrent ? tier.color : t.border}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: isCurrent ? `0 0 10px ${tier.color}40` : 'none',
                      transition: 'border-color 0.3s ease, background 0.3s ease, box-shadow 0.3s ease',
                    }}>
                      <NeonIcon type={tier.icon} size={14} color={isCurrent ? tier.color : t.textMuted} />
                    </div>
                    <span style={{
                      fontFamily: t.mono, fontSize: 9, fontWeight: 700,
                      color: isCurrent ? tier.color : t.textMuted,
                    }}>
                      {tr(tier.labelKey, tier.label)}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Promotion/demotion rules */}
            <div style={{
              display: 'flex', gap: 12,
              padding: '10px 14px', borderRadius: 12,
              background: t.bgElevated, border: `1px solid ${t.border}`,
            }}>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: t.cyan,
                  boxShadow: `0 0 6px ${t.cyan}60`,
                }} />
                <span style={{ fontFamily: t.body, fontSize: 11, color: t.textSecondary }}>
                  {tr('league.promote', 'Top 10 → promote')}
                </span>
              </div>
              <div style={{ width: 1, background: t.border }} />
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: t.rose,
                  boxShadow: `0 0 6px ${t.rose}60`,
                }} />
                <span style={{ fontFamily: t.body, fontSize: 11, color: t.textSecondary }}>
                  {tr('league.demote', 'Bottom 5 → demote')}
                </span>
              </div>
            </div>
          </div>

          {/* Join CTA or Leaderboard */}
          {!joined ? (
            <div style={{
              padding: 32, borderRadius: 16,
              background: t.bgCard, border: `1px solid ${t.border}`,
              textAlign: 'center',
            }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                <NeonIcon type="trophy" size={40} color="gold" />
              </div>
              <div style={{
                fontFamily: t.display, fontSize: 18, fontWeight: 800, color: t.text,
                marginBottom: 8,
              }}>
                {tr('league.join_title', 'Join the Arena?')}
              </div>
              <p style={{
                fontFamily: t.body, fontSize: 13, color: t.textSecondary,
                marginBottom: 20, lineHeight: 1.5,
              }}>
                {tr('league.join_desc', 'Compete with 30 heroes in weekly XP challenges. Earn your way from Bronze to Diamond!')}
              </p>
              <button
                onClick={() => setJoined(true)}
                onMouseDown={() => setPressedJoin(true)}
                onMouseUp={() => setPressedJoin(false)}
                onMouseLeave={() => setPressedJoin(false)}
                style={{
                  padding: '14px 40px', borderRadius: 14,
                  border: 'none', background: t.gradient,
                  cursor: 'pointer',
                  fontFamily: t.display, fontSize: 15, fontWeight: 800,
                  color: '#FFF', transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  borderBottom: '4px solid #6A50CC',
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  transform: pressedJoin ? 'scale(0.98) translateY(1px)' : 'none',
                }}
              >
                <NeonIcon type="trophy" size={16} color="text" />
                {tr('league.join_btn', 'Join Weekly League')}
              </button>
              <p style={{
                fontFamily: t.body, fontSize: 11, color: t.textMuted,
                marginTop: 12,
              }}>
                {tr('league.join_note', 'Opt-in only • Resets every Monday • Leave anytime')}
              </p>
            </div>
          ) : (
            /* ─── Leaderboard ─── */
            <div style={{
              borderRadius: 16,
              background: t.bgCard, border: `1px solid ${t.border}`,
              overflow: 'hidden',
            }}>
              {/* Header */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '14px 20px',
                borderBottom: `1px solid ${t.border}`,
              }}>
                <span style={{
                  fontFamily: t.display, fontSize: 13, fontWeight: 700,
                  color: t.textSecondary, textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}>
                  {tr('league.standings', 'Weekly Standings')}
                </span>
                <span style={{
                  fontFamily: t.mono, fontSize: 10, fontWeight: 700,
                  color: t.textMuted,
                }}>
                  {tr('league.time_left', '{d}d {h}h left').replace('{d}', '6').replace('{h}', '12')}
                </span>
              </div>

              {/* Members list */}
              {leaderboard.map((member, i) => {
                const isPromoZone = member.rank <= 10;
                const isDemoteZone = member.rank > 25;
                const isTop3 = member.rank <= 3;
                const art = getCharArt(member.charId);
                const mc = CHARACTERS.find(c => c.id === member.charId);
                // Top 3 podium glow colors: gold, silver, bronze
                const podiumColor = isTop3
                  ? [t.gold, LEAGUE_TOKEN_TIERS.silver.color, LEAGUE_TOKEN_TIERS.bronze.color][member.rank - 1]
                  : undefined;
                return (
                  <div
                    key={`${member.rank}-${member.name}`}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '10px 20px',
                      borderBottom: i < leaderboard.length - 1 ? `1px solid ${t.border}` : 'none',
                      background: member.isYou ? `${t.violet}08` : (isTop3 && !prefersReducedMotion ? `${podiumColor}06` : 'transparent'),
                      animation: `fadeUp 0.3s ease-out ${i * 0.03}s both`,
                      boxShadow: isTop3 && !prefersReducedMotion ? `inset 0 0 20px ${podiumColor}08` : 'none',
                    }}
                  >
                    {/* Rank */}
                    <span style={{
                      fontFamily: t.mono, fontSize: 13, fontWeight: 800,
                      color: member.rank <= 3
                        ? [t.gold, LEAGUE_TOKEN_TIERS.silver.color, LEAGUE_TOKEN_TIERS.bronze.color][member.rank - 1]
                        : t.textMuted,
                      width: 28, textAlign: 'center',
                    }}>
                      {member.rank <= 3 ? ['🥇', '🥈', '🥉'][member.rank - 1] : `#${member.rank}`}
                    </span>
                    {/* Avatar — top 3 get subtle pulse §N §6 Ambient */}
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%',
                      background: `${mc?.color || t.violet}15`,
                      border: `1.5px solid ${isTop3 ? podiumColor : (mc?.color || t.violet)}30`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                      boxShadow: isTop3 ? `0 0 8px ${podiumColor}30` : 'none',
                      animation: isTop3 && !prefersReducedMotion ? 'pulse 2s ease-in-out infinite' : 'none',
                    }}>
                      {art ? <PixelCanvas data={art} size={2} /> : <NeonIcon type="shield" size={12} color="muted" />}
                    </div>
                    {/* Name */}
                    <span style={{
                      fontFamily: t.body, fontSize: 13, fontWeight: member.isYou ? 700 : (isTop3 ? 700 : 500),
                      color: member.isYou ? t.violet : (isTop3 ? podiumColor : t.text), flex: 1,
                    }}>
                      {member.isYou ? tr('league.you', 'You ({name})').replace('{name}', member.name) : member.name}
                    </span>
                    {/* Zone indicator */}
                    {isPromoZone && (
                      <div style={{
                        width: 6, height: 6, borderRadius: '50%',
                        background: t.cyan,
                        boxShadow: `0 0 4px ${t.cyan}60`,
                      }} />
                    )}
                    {isDemoteZone && (
                      <div style={{
                        width: 6, height: 6, borderRadius: '50%',
                        background: t.rose,
                        boxShadow: `0 0 4px ${t.rose}60`,
                      }} />
                    )}
                    {/* XP */}
                    <span style={{
                      fontFamily: t.mono, fontSize: 12, fontWeight: 700,
                      color: t.textMuted,
                    }}>
                      {member.xp} XP
                    </span>
                  </div>
                );
              })}

              {/* Footer */}
              <div style={{
                padding: '12px 20px',
                borderTop: `1px solid ${t.border}`,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <span style={{ fontFamily: t.body, fontSize: 11, color: t.textMuted }}>
                  {tr('league.showing', 'Showing top {n} of {total}').replace('{n}', String(leaderboard.length)).replace('{total}', String(leaderboard.length))}
                </span>
                <button
                  onClick={() => setJoined(false)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontFamily: t.body, fontSize: 11, fontWeight: 500,
                    color: t.textMuted, transition: 'color 0.2s ease',
                  }}
                >
                  {tr('league.leave', 'Leave league')}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════ */}
      {/* TAB: WEEKLY QUESTS — Expanded detail view  */}
      {/* ═══════════════════════════════════════════ */}
      {activeTab === 'weekly' && (
        <div style={{
          animation: tabExiting ? 'fadeUp 0.2s ease-in reverse forwards' : 'fadeUp 0.3s ease-out',
        }}>
          {/* Timer header — calm, no urgency (UX-R103) */}
          {(() => {
            const endDate = new Date(weekly.weekEnd);
            const now = new Date();
            const hoursLeft = Math.max(0, Math.floor((endDate.getTime() - now.getTime()) / 3600000));
            const daysLeft = Math.floor(hoursLeft / 24);
            const timeLabel = daysLeft > 0 ? tr('league.time_remaining', '{d}d {h}h remaining').replace('{d}', String(daysLeft)).replace('{h}', String(hoursLeft % 24)) : tr('league.hours_remaining', '{h}h remaining').replace('{h}', String(hoursLeft));
            const timerColor = hoursLeft < 24 ? t.rose : (hoursLeft < 72 ? t.gold : t.textMuted);
            const completedCount = weekly.challenges.filter(c => c.completed).length;

            return (
              <>
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '14px 20px', borderRadius: 16,
                  background: t.bgCard, border: `1px solid ${t.border}`,
                  marginBottom: 16,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <NeonIcon type="target" size={18} color="violet" />
                    <div>
                      <div style={{
                        fontFamily: t.display, fontSize: 16, fontWeight: 800, color: t.text,
                      }}>
                        {tr('league.weekly_title', 'Weekly Quests')}
                      </div>
                      <div style={{ fontFamily: t.body, fontSize: 12, color: t.textMuted }}>
                        {tr('league.resets_monday', 'Resets Monday • {n}/{total} completed').replace('{n}', String(completedCount)).replace('{total}', String(weekly.challenges.length))}
                      </div>
                    </div>
                  </div>
                  <span style={{
                    fontFamily: t.mono, fontSize: 11, fontWeight: 700,
                    color: timerColor,
                    padding: '4px 10px', borderRadius: 8,
                    background: t.bgElevated,
                  }}>
                    {timeLabel}
                  </span>
                </div>

                {/* Challenge cards — expanded detail */}
                {weekly.challenges.map((c, idx) => {
                  const diff: DifficultyToken = DIFFICULTY_MAP[c.difficulty] ?? DEFAULT_DIFF;
                  const icon = CHALLENGE_ICONS[c.type] ?? 'target';
                  const desc = getChallengeDescriptionI18n(c.type, c.targetValue, tr);
                  const hint = getChallengeHintI18n(c.type, tr);
                  const pct = Math.min(100, c.progress * 100);
                  const status = getChallengeStatus(c.completed, c.currentValue, tr);
                  const nearComplete = c.progress >= 0.8 && !c.completed;

                  return (
                    <div
                      key={c.id}
                      style={{
                        padding: 20, borderRadius: 16,
                        background: t.bgCard,
                        border: `1px solid ${c.completed ? `${t.cyan}30` : t.border}`,
                        marginBottom: 12,
                        animation: prefersReducedMotion ? 'none' : `fadeUp 0.3s ease-out ${idx * 0.08}s both`,
                      }}
                    >
                      {/* Row 1: Icon + Title + Difficulty badge */}
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8,
                      }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: 10,
                          background: `${diff.color}12`,
                          border: `1.5px ${diff.borderStyle} ${diff.color}30`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0,
                        }}>
                          <NeonIcon
                            type={c.completed ? 'check' : icon}
                            size={18}
                            color={c.completed ? 'cyan' : diff.color}
                          />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{
                            fontFamily: t.display, fontSize: 15, fontWeight: 700,
                            color: c.completed ? t.cyan : t.text,
                          }}>
                            {c.completed ? '✓ ' : ''}{desc}
                          </div>
                          {hint && (
                            <div style={{
                              fontFamily: t.body, fontSize: 12, color: t.textMuted,
                              marginTop: 2,
                            }}>
                              {hint}
                            </div>
                          )}
                        </div>
                        <span
                          aria-label={tr('weekly.aria_difficulty', 'Difficulty: {d}').replace('{d}', c.difficulty)}
                          style={{
                            fontFamily: t.mono, fontSize: 10, fontWeight: 800,
                            color: diff.color,
                            padding: '2px 8px', borderRadius: 8,
                            border: `1.5px ${diff.borderStyle} ${diff.color}50`,
                            background: `${diff.color}08`,
                          }}
                        >
                          {diff.numeral}
                        </span>
                      </div>

                      {/* Row 2: Progress bar (wider, 8px) + fraction + percentage */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                        <div
                          role="progressbar"
                          aria-valuenow={c.currentValue}
                          aria-valuemax={c.targetValue}
                          aria-label={`${desc}: ${c.currentValue} of ${c.targetValue}`}
                          style={{
                            flex: 1, height: 8, borderRadius: 4,
                            background: t.border, overflow: 'hidden',
                          }}
                        >
                          <div style={{
                            width: '100%', height: '100%', borderRadius: 4,
                            background: c.completed
                              ? t.cyan
                              : `linear-gradient(90deg, ${diff.color}, ${diff.color}CC)`,
                            transform: `scaleX(${pct / 100})`,
                            transformOrigin: 'left',
                            transition: 'transform 0.6s ease-out',
                            boxShadow: nearComplete ? `0 0 8px ${diff.color}60` : 'none',
                          }} />
                        </div>
                        <span style={{
                          fontFamily: t.mono, fontSize: 12, fontWeight: 700,
                          color: c.completed ? t.cyan : t.textMuted,
                          minWidth: 80, textAlign: 'right' as const,
                        }}>
                          {c.currentValue}/{c.targetValue} ({Math.round(pct)}%)
                        </span>
                      </div>

                      {/* Row 3: Reward + Status */}
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                      }}>
                        <span style={{
                          fontFamily: t.mono, fontSize: 12, fontWeight: 800,
                          color: c.completed ? t.cyan : t.gold,
                        }}>
                          +{c.xpReward} XP
                        </span>
                        {c.coinReward > 0 && (
                          <span style={{
                            fontFamily: t.mono, fontSize: 12, fontWeight: 700,
                            color: c.completed ? t.cyan : t.gold,
                          }}>
                            🪙 {c.coinReward}
                          </span>
                        )}
                        <span style={{
                          marginLeft: 'auto',
                          fontFamily: t.body, fontSize: 11, fontWeight: 600,
                          color: status.color,
                        }}>
                          {status.label}
                        </span>
                      </div>
                    </div>
                  );
                })}

                {/* Weekly Champion card */}
                <div style={{
                  padding: 20, borderRadius: 16,
                  background: weekly.allCompleted ? `${t.gold}08` : t.bgCard,
                  border: `1px solid ${weekly.allCompleted ? `${t.gold}40` : t.border}`,
                  boxShadow: weekly.allCompleted ? `0 0 20px ${t.gold}15` : 'none',
                }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10,
                  }}>
                    <span style={{ fontSize: 24 }}>🏆</span>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontFamily: t.display, fontSize: 16, fontWeight: 800,
                        color: weekly.allCompleted ? t.gold : t.text,
                      }}>
                        {weekly.allCompleted
                          ? (weekly.bonusClaimed ? tr('league.champion_claimed', 'Weekly Champion! Bonus claimed') : tr('league.champion_title', 'Weekly Champion!'))
                          : tr('league.champion_bonus', 'Weekly Champion Bonus')}
                      </div>
                      <div style={{
                        fontFamily: t.body, fontSize: 12,
                        color: weekly.allCompleted ? t.gold : t.textSecondary,
                      }}>
                        {weekly.allCompleted
                          ? tr('league.champion_awarded', '+150 XP + 🪙 50 awarded')
                          : tr('league.champion_hint', 'Complete all {n} challenges for a bonus reward').replace('{n}', String(weekly.challenges.length))}
                      </div>
                    </div>
                    {weekly.allCompleted && (
                      <NeonIcon type="check" size={20} color="gold" />
                    )}
                  </div>

                  {/* Progress toward champion */}
                  {!weekly.allCompleted && (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10,
                    }}>
                      <div style={{
                        flex: 1, height: 6, borderRadius: 3,
                        background: t.border, overflow: 'hidden',
                      }}>
                        <div style={{
                          width: '100%', height: '100%', borderRadius: 3,
                          background: `linear-gradient(90deg, ${t.gold}, ${t.gold}CC)`,
                          transform: `scaleX(${completedCount / weekly.challenges.length})`,
                          transformOrigin: 'left',
                          transition: 'transform 0.6s ease-out',
                        }} />
                      </div>
                      <span style={{
                        fontFamily: t.mono, fontSize: 11, fontWeight: 700,
                        color: t.textMuted,
                      }}>
                        {tr('league.challenges_count', '{n}/{total} challenges').replace('{n}', String(completedCount)).replace('{total}', String(weekly.challenges.length))}
                      </span>
                    </div>
                  )}

                  {/* Reward breakdown */}
                  <div style={{
                    display: 'flex', gap: 12,
                    padding: '10px 14px', borderRadius: 12,
                    background: weekly.allCompleted ? `${t.gold}06` : t.bgElevated,
                    border: `1px solid ${weekly.allCompleted ? `${t.gold}20` : t.border}`,
                  }}>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <NeonIcon type="xp" size={16} color="gold" />
                      <div>
                        <div style={{
                          fontFamily: t.mono, fontSize: 14, fontWeight: 800,
                          color: t.gold,
                        }}>
                          +150 XP
                        </div>
                        <div style={{ fontFamily: t.body, fontSize: 9, color: t.textMuted }}>
                          {tr('league.champion_xp', 'Champion Bonus')}
                        </div>
                      </div>
                    </div>
                    <div style={{ width: 1, background: t.border }} />
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 16 }}>🪙</span>
                      <div>
                        <div style={{
                          fontFamily: t.mono, fontSize: 14, fontWeight: 800,
                          color: t.gold,
                        }}>
                          +50
                        </div>
                        <div style={{ fontFamily: t.body, fontSize: 9, color: t.textMuted }}>
                          {tr('league.coins_label', 'Coins')}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* History hint */}
                <div style={{
                  marginTop: 12,
                  fontFamily: t.body, fontSize: 11, color: t.textMuted,
                  textAlign: 'center' as const,
                }}>
                  {tr('league.first_attempt', 'This week: 1st attempt')}
                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* ═══════════════════════════════════════════ */}
      {/* TAB: FRIENDS — Private comparison boards   */}
      {/* ═══════════════════════════════════════════ */}
      {activeTab === 'friends' && (
        <div style={{
          animation: tabExiting ? 'fadeUp 0.2s ease-in reverse forwards' : 'fadeUp 0.3s ease-out',
        }}>
          {/* Your card */}
          <div style={{
            padding: 16, borderRadius: 16,
            background: `${t.violet}08`, border: `1px solid ${t.violet}20`,
            marginBottom: 16, display: 'flex', alignItems: 'center', gap: 14,
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: '50%',
              background: `${charMeta?.color || t.violet}15`,
              border: `2px solid ${charMeta?.color || t.violet}40`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {characterId && getCharArt(characterId) ? (
                <PixelCanvas data={getCharArt(characterId)!} size={2} />
              ) : (
                <NeonIcon type="shield" size={18} color="violet" />
              )}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: t.display, fontSize: 15, fontWeight: 700, color: t.text }}>
                {tr('league.you', 'You ({name})').replace('{name}', displayName || charMeta?.name || tr('character.hero_fallback', 'Hero'))}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontFamily: t.mono, fontSize: 11, fontWeight: 700, color: t.violet }}>
                  {tr('sidebar.level_badge', 'Lv.{n}').replace('{n}', String(level))}
                </span>
                <span style={{ fontFamily: t.mono, fontSize: 11, color: t.textMuted }}>
                  {weeklyXp} XP {tr('league.this_week', 'this week')}
                </span>
              </div>
            </div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '4px 10px', borderRadius: 10,
              background: `${t.gold}10`,
            }}>
              <NeonIcon type="fire" size={14} color="gold" />
              <span style={{ fontFamily: t.mono, fontSize: 11, fontWeight: 800, color: t.gold }}>
                {currentStreak}
              </span>
            </div>
          </div>

          {/* Friends list */}
          {friends.length > 0 ? (
            <div style={{
              borderRadius: 16,
              background: t.bgCard, border: `1px solid ${t.border}`,
              overflow: 'hidden', marginBottom: 16,
            }}>
              <div style={{
                padding: '14px 20px',
                borderBottom: `1px solid ${t.border}`,
              }}>
                <span style={{
                  fontFamily: t.display, fontSize: 13, fontWeight: 700,
                  color: t.textSecondary, textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}>
                  {tr('league.friends_header', 'Friends ({n})').replace('{n}', String(friends.length))}
                </span>
              </div>
              {friends.map((friend, i) => {
                const art = getCharArt(friend.charId);
                const fc = CHARACTERS.find(c => c.id === friend.charId);
                const isFriendHovered = hoveredFriend === friend.name;
                return (
                  <div
                    key={friend.publicId || friend.name}
                    onMouseEnter={() => setHoveredFriend(friend.name)}
                    onMouseLeave={() => setHoveredFriend(null)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 14,
                      padding: '14px 20px',
                      borderBottom: i < friends.length - 1 ? `1px solid ${t.border}` : 'none',
                      animation: `fadeUp 0.3s ease-out ${i * 0.06}s both`,
                      background: isFriendHovered ? '#121218' : 'transparent',
                      transition: 'background 0.2s ease',
                    }}
                  >
                    {/* Avatar */}
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%',
                      background: `${fc?.color || t.violet}15`,
                      border: `1.5px solid ${fc?.color || t.violet}30`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      {art ? <PixelCanvas data={art} size={2} /> : <NeonIcon type="shield" size={14} color="muted" />}
                    </div>
                    {/* Info */}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: t.body, fontSize: 14, fontWeight: 600, color: t.text }}>
                        {friend.name}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontFamily: t.mono, fontSize: 10, fontWeight: 700, color: t.violet }}>
                          {tr('sidebar.level_badge', 'Lv.{n}').replace('{n}', String(friend.level))}
                        </span>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 3,
                          fontFamily: t.mono, fontSize: 10, color: t.gold,
                        }}>
                          <NeonIcon type="fire" size={10} color="gold" /> {friend.streak}d
                        </span>
                      </div>
                    </div>
                    {/* XP this week */}
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontFamily: t.mono, fontSize: 14, fontWeight: 800, color: t.cyan }}>
                        {friend.xp} XP
                      </div>
                      <div style={{ fontFamily: t.body, fontSize: 9, color: t.textMuted }}>
                        {tr('league.this_week', 'this week')}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}

          {/* Add friends CTA */}
          <div style={{
            padding: 24, borderRadius: 16,
            background: t.bgCard, border: `1px dashed ${t.border}`,
            textAlign: 'center',
          }}>
            {showAddFriend ? (
              <>
                <div style={{
                  fontFamily: t.display, fontSize: 15, fontWeight: 700, color: t.text,
                  marginBottom: 12,
                }}>
                  {tr('league.add_friend_title', 'Add Friend by Public ID')}
                </div>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 8 }}>
                  <input
                    type="text"
                    value={friendPublicId}
                    onChange={(e) => { setFriendPublicId(e.target.value); setFriendError(''); }}
                    placeholder={tr('league.public_id_placeholder', 'Enter public ID...')}
                    style={{
                      padding: '10px 14px', borderRadius: 10,
                      background: t.bgElevated, border: `1px solid ${t.border}`,
                      color: t.text, fontFamily: t.mono, fontSize: 13,
                      outline: 'none', width: 200,
                    }}
                  />
                  <button
                    onClick={async () => {
                      if (!friendPublicId.trim()) return;
                      try {
                        await sendFriendRequest.mutateAsync({ publicId: friendPublicId.trim() });
                        setFriendPublicId('');
                        setShowAddFriend(false);
                        setFriendError('');
                        trpcUtils.social.getFriends.invalidate();
                      } catch (err: any) {
                        setFriendError(err?.message ?? 'Failed to send request');
                      }
                    }}
                    disabled={sendFriendRequest.isPending}
                    style={{
                      padding: '10px 20px', borderRadius: 10,
                      background: t.gradient, border: 'none',
                      cursor: sendFriendRequest.isPending ? 'not-allowed' : 'pointer',
                      fontFamily: t.display, fontSize: 13, fontWeight: 700,
                      color: '#FFF', opacity: sendFriendRequest.isPending ? 0.6 : 1,
                    }}
                  >
                    {sendFriendRequest.isPending ? '...' : tr('league.send_request', 'Send')}
                  </button>
                </div>
                {friendError && (
                  <p style={{ fontFamily: t.body, fontSize: 11, color: t.rose, marginBottom: 8 }}>
                    {friendError}
                  </p>
                )}
                <button
                  onClick={() => { setShowAddFriend(false); setFriendError(''); }}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontFamily: t.body, fontSize: 11, color: t.textMuted,
                  }}
                >
                  {tr('league.cancel', 'Cancel')}
                </button>
              </>
            ) : (
              <>
                <NeonIcon type="users" size={28} color="muted" />
                <p style={{
                  fontFamily: t.body, fontSize: 13, color: t.textMuted,
                  marginTop: 8, marginBottom: 12,
                }}>
                  {tr('league.invite_desc', 'Invite friends to compare progress privately')}
                </p>
                <button
                  onClick={() => setShowAddFriend(true)}
                  onMouseDown={() => setPressedInvite(true)}
                  onMouseUp={() => setPressedInvite(false)}
                  onMouseLeave={() => setPressedInvite(false)}
                  style={{
                    padding: '10px 24px', borderRadius: 12,
                    background: `${t.violet}12`, border: `1px solid ${t.violet}25`,
                    cursor: 'pointer',
                    fontFamily: t.display, fontSize: 13, fontWeight: 700,
                    color: t.violet, transition: 'border-color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease, transform 0.15s ease',
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    transform: pressedInvite ? 'scale(0.98)' : 'none',
                  }}>
                  <NeonIcon type="users" size={14} color="violet" />
                  {tr('league.invite_btn', 'Invite a Friend')}
                </button>
                <p style={{
                  fontFamily: t.body, fontSize: 10, color: t.textMuted,
                  marginTop: 8,
                }}>
                  {tr('league.invite_note', 'Friends-only • No public profiles • Your progress, your circle')}
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════ */}
      {/* TAB: PARTY QUEST — Cooperative Boss Fight  */}
      {/* ═══════════════════════════════════════════ */}
      {activeTab === 'party' && (
        <div style={{
          animation: tabExiting ? 'fadeUp 0.2s ease-in reverse forwards' : 'fadeUp 0.3s ease-out',
        }}>
          {activePartyQuest ? (() => {
            const bossRarityConfig = BOSS_RARITY_CONFIG[activePartyQuest.rarity] ?? BOSS_RARITY_CONFIG.common!;
            const bossHpPercent = (activePartyQuest.hp / activePartyQuest.maxHp) * 100;
            const isLowHp = bossHpPercent < 20;
            const totalDmg = activePartyQuest.members.reduce((s, m) => s + m.dmg, 0);

            return (
              <>
                {/* Boss card */}
                <div style={{
                  padding: 24, borderRadius: 16,
                  background: t.bgCard,
                  border: `1px solid ${bossRarityConfig.color}30`,
                  marginBottom: 16,
                  position: 'relative', overflow: 'hidden',
                }}>
                  {/* Rarity accent */}
                  <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                    background: `linear-gradient(90deg, ${bossRarityConfig.color}, ${t.rose})`,
                  }} />

                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
                    <div style={{
                      width: 56, height: 56, borderRadius: 16,
                      background: `${t.rose}12`, border: `1px solid ${t.rose}25`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 28,
                    }}>
                      🐉
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontFamily: t.display, fontSize: 20, fontWeight: 800, color: t.text,
                        marginBottom: 4,
                      }}>
                        {activePartyQuest.name}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 3,
                          fontFamily: t.mono, fontSize: 10, fontWeight: 700,
                          padding: '2px 8px', borderRadius: 8,
                          color: bossRarityConfig.color,
                          background: bossRarityConfig.bg,
                          textTransform: 'uppercase',
                        }}>
                          {bossRarityConfig.icon} {tr(`league.${activePartyQuest.rarity}_boss`, `${activePartyQuest.rarity} Boss`)}
                        </span>
                        <span style={{ fontFamily: t.body, fontSize: 11, color: t.textMuted }}>
                          {tr('league.weekly_challenge', 'Weekly Challenge')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Boss HP bar */}
                  <div style={{ marginBottom: 16 }}>
                    <div style={{
                      display: 'flex', justifyContent: 'space-between', marginBottom: 6,
                    }}>
                      <span style={{
                        fontFamily: t.mono, fontSize: 11, fontWeight: 700, color: t.rose,
                        display: 'flex', alignItems: 'center', gap: 4,
                      }}>
                        <NeonIcon type="lightning" size={12} color="rose" />
                        {tr('league.boss_hp', 'Boss HP')}
                      </span>
                      <span style={{ fontFamily: t.mono, fontSize: 11, fontWeight: 700, color: t.textMuted }}>
                        {activePartyQuest.hp} / {activePartyQuest.maxHp}
                      </span>
                    </div>
                    <div style={{
                      height: 10, borderRadius: 5, background: t.border, overflow: 'hidden',
                      boxShadow: isLowHp && !prefersReducedMotion ? `0 0 12px ${t.rose}40` : 'none',
                      animation: isLowHp && !prefersReducedMotion ? 'glowPulse 2s ease-in-out infinite' : 'none',
                    }}>
                      <div style={{
                        width: '100%',
                        height: '100%', borderRadius: 5,
                        background: `linear-gradient(90deg, ${t.rose}, ${t.rose}CC)`,
                        transform: `scaleX(${activePartyQuest.hp / activePartyQuest.maxHp})`,
                        transformOrigin: 'left',
                        transition: 'transform 0.6s ease-out',
                        boxShadow: `0 0 8px ${t.rose}40`,
                      }} />
                    </div>
                  </div>

                  {/* Rewards */}
                  <div style={{
                    display: 'flex', gap: 12,
                    padding: '10px 14px', borderRadius: 12,
                    background: t.bgElevated, border: `1px solid ${t.border}`,
                    marginBottom: 16,
                  }}>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <NeonIcon type="xp" size={16} color="gold" />
                      <div>
                        <div style={{ fontFamily: t.mono, fontSize: 14, fontWeight: 800, color: t.gold }}>
                          +{activePartyQuest.reward.xp} XP
                        </div>
                        <div style={{ fontFamily: t.body, fontSize: 9, color: t.textMuted }}>
                          {tr('league.victory_bounty', 'Victory Bounty')}
                        </div>
                      </div>
                    </div>
                    <div style={{ width: 1, background: t.border }} />
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <NeonIcon type="gem" size={16} color="cyan" />
                      <div>
                        <div style={{ fontFamily: t.mono, fontSize: 14, fontWeight: 800, color: t.cyan }}>
                          +{activePartyQuest.reward.crystals}
                        </div>
                        <div style={{ fontFamily: t.body, fontSize: 9, color: t.textMuted }}>
                          {tr('league.energy_crystals', 'Energy Crystals')}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* How it works */}
                  <div style={{
                    fontFamily: t.body, fontSize: 12, color: t.textSecondary,
                    lineHeight: 1.5, padding: '10px 14px', borderRadius: 12,
                    background: `${t.violet}06`, border: `1px solid ${t.violet}12`,
                  }}>
                    💡 <strong style={{ color: t.text }}>{tr('league.how_it_works', 'How it works:')}</strong> {tr('league.how_it_works_desc', 'Complete daily quests to deal damage. Each quest = damage points. Your party fights together — when the boss reaches 0 HP, everyone gets rewards!')}
                  </div>
                </div>

                {/* Party members */}
                <div style={{
                  borderRadius: 16,
                  background: t.bgCard, border: `1px solid ${t.border}`,
                  overflow: 'hidden', marginBottom: 16,
                }}>
                  <div style={{
                    padding: '14px 20px',
                    borderBottom: `1px solid ${t.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}>
                    <span style={{
                      fontFamily: t.display, fontSize: 13, fontWeight: 700,
                      color: t.textSecondary, textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                    }}>
                      {tr('league.party_members', 'Party Members ({n})').replace('{n}', String(activePartyQuest.members.length))}
                    </span>
                    <span style={{
                      fontFamily: t.mono, fontSize: 10, fontWeight: 700,
                      color: t.cyan,
                    }}>
                      {tr('league.total_dmg', 'Total DMG: {n}').replace('{n}', String(totalDmg))}
                    </span>
                  </div>

                  {activePartyQuest.members.map((member, i) => {
                    const art = getCharArt(member.charId);
                    const mc = CHARACTERS.find(c => c.id === member.charId);
                    return (
                      <div
                        key={`${member.name}-${i}`}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 14,
                          padding: '12px 20px',
                          background: member.isYou ? `${t.violet}06` : 'transparent',
                          borderBottom: i < activePartyQuest.members.length - 1 ? `1px solid ${t.border}` : 'none',
                          animation: `fadeUp 0.3s ease-out ${i * 0.06}s both`,
                        }}
                      >
                        <div style={{
                          width: 32, height: 32, borderRadius: '50%',
                          background: `${mc?.color || t.violet}15`,
                          border: `1.5px solid ${mc?.color || t.violet}${member.isYou ? '40' : '30'}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          {art ? <PixelCanvas data={art} size={2} /> : <NeonIcon type="shield" size={12} color={member.isYou ? 'violet' : 'muted'} />}
                        </div>
                        <span style={{
                          fontFamily: t.body, fontSize: 13,
                          fontWeight: member.isYou ? 700 : 500,
                          color: member.isYou ? t.violet : t.text,
                          flex: 1,
                        }}>
                          {member.isYou ? tr('league.you', 'You ({name})').replace('{name}', member.name) : member.name}
                        </span>
                        <span style={{
                          fontFamily: t.mono, fontSize: 13,
                          fontWeight: member.isYou ? 800 : 700,
                          color: member.isYou ? t.violet : t.cyan,
                        }}>
                          {tr('league.dmg', '{n} DMG').replace('{n}', String(member.dmg))}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* CTA */}
                <div style={{
                  padding: 20, borderRadius: 16,
                  background: t.bgCard, border: `1px solid ${t.border}`,
                  textAlign: 'center',
                }}>
                  <p style={{
                    fontFamily: t.body, fontSize: 13, color: t.textSecondary,
                    marginBottom: 12,
                  }}>
                    {tr('league.deal_damage', 'Complete quests to deal damage to the boss!')}
                  </p>
                  <button style={{
                    padding: '12px 32px', borderRadius: 14,
                    border: 'none', background: t.gradient,
                    cursor: 'pointer',
                    fontFamily: t.display, fontSize: 14, fontWeight: 800,
                    color: '#FFF', borderBottom: '4px solid #6A50CC',
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                  }}>
                    <NeonIcon type="compass" size={16} color="text" />
                    {tr('league.go_home', 'Go to Command Center')}
                  </button>
                </div>
              </>
            );
          })() : (
            /* No active party quest — Join CTA */
            <div style={{
              padding: 32, borderRadius: 16,
              background: t.bgCard, border: `1px solid ${t.border}`,
              textAlign: 'center',
            }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                <NeonIcon type="lightning" size={40} color="rose" />
              </div>
              <div style={{
                fontFamily: t.display, fontSize: 18, fontWeight: 800, color: t.text,
                marginBottom: 8,
              }}>
                {tr('league.join_party_title', 'Join a Party Quest!')}
              </div>
              <p style={{
                fontFamily: t.body, fontSize: 13, color: t.textSecondary,
                marginBottom: 20, lineHeight: 1.5,
              }}>
                {tr('league.join_party_desc', 'Team up with other heroes to defeat a powerful boss. Complete quests to deal damage!')}
              </p>
              <button
                onClick={async () => {
                  try {
                    await joinPartyQuest.mutateAsync();
                    trpcUtils.social.activePartyQuest.invalidate();
                  } catch { /* ignore */ }
                }}
                disabled={joinPartyQuest.isPending}
                style={{
                  padding: '14px 40px', borderRadius: 14,
                  border: 'none', background: t.gradient,
                  cursor: joinPartyQuest.isPending ? 'not-allowed' : 'pointer',
                  fontFamily: t.display, fontSize: 15, fontWeight: 800,
                  color: '#FFF',
                  borderBottom: '4px solid #6A50CC',
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  opacity: joinPartyQuest.isPending ? 0.6 : 1,
                }}
              >
                <NeonIcon type="lightning" size={16} color="text" />
                {joinPartyQuest.isPending ? tr('league.joining', 'Joining...') : tr('league.join_party_btn', 'Join Party Quest')}
              </button>
              <p style={{
                fontFamily: t.body, fontSize: 11, color: t.textMuted,
                marginTop: 12,
              }}>
                {tr('league.how_it_works_desc', 'Complete daily quests to deal damage. Each quest = damage points. Your party fights together — when the boss reaches 0 HP, everyone gets rewards!')}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
