'use client';

import React, { useState } from 'react';
import { useOnboardingStore } from '@plan2skill/store';
import { NeonIcon } from '../../(onboarding)/_components/NeonIcon';
import { t, rarity } from '../../(onboarding)/_components/tokens';
import { CHARACTERS, charArtStrings, charPalettes } from '../../(onboarding)/_components/characters';
import { parseArt, PixelCanvas } from '../../(onboarding)/_components/PixelEngine';

// ═══════════════════════════════════════════
// GUILD ARENA — Leagues + Friends + Party Quests
// Duolingo-model: opt-in, weekly reset, promotion/demotion
// ═══════════════════════════════════════════

// ─── League tiers (Duolingo model) ───
const LEAGUE_TIERS = [
  { id: 'bronze',  label: 'Bronze',  color: '#CD7F32', icon: '●', nextAt: 0 },
  { id: 'silver',  label: 'Silver',  color: '#C0C0C0', icon: '◆', nextAt: 500 },
  { id: 'gold',    label: 'Gold',    color: '#FFD700', icon: '⬡', nextAt: 1500 },
  { id: 'diamond', label: 'Diamond', color: '#4ECDC4', icon: '★', nextAt: 3000 },
] as const;

// ─── Mock league members (30 per league) ───
const MOCK_MEMBERS = [
  { name: 'Aria', xp: 320, charId: 'aria', rank: 1 },
  { name: 'Kofi', xp: 285, charId: 'kofi', rank: 2 },
  { name: 'Mei', xp: 260, charId: 'mei', rank: 3 },
  { name: 'Diego', xp: 230, charId: 'diego', rank: 4 },
  { name: 'Zara', xp: 210, charId: 'zara', rank: 5 },
  { name: 'Alex', xp: 195, charId: 'alex', rank: 6 },
  { name: 'Priya', xp: 180, charId: 'priya', rank: 7 },
  { name: 'Liam', xp: 165, charId: 'liam', rank: 8 },
  { name: 'NovaStar', xp: 140, charId: 'aria', rank: 9 },
  { name: 'ByteKnight', xp: 130, charId: 'kofi', rank: 10 },
  { name: 'PixelWiz', xp: 115, charId: 'mei', rank: 11 },
  { name: 'CodeFox', xp: 100, charId: 'diego', rank: 12 },
  { name: 'QuestRunner', xp: 90, charId: 'zara', rank: 13 },
  { name: 'SkyLearner', xp: 80, charId: 'alex', rank: 14 },
  { name: 'DataDruid', xp: 70, charId: 'priya', rank: 15 },
  // ... more would come from API
];

// ─── Mock friends ───
const MOCK_FRIENDS = [
  { name: 'Mei', xp: 260, charId: 'mei', streak: 12, level: 4 },
  { name: 'Kofi', xp: 285, charId: 'kofi', streak: 8, level: 5 },
  { name: 'Zara', xp: 210, charId: 'zara', streak: 3, level: 3 },
];

// ─── Mock party boss ───
const PARTY_BOSS = {
  name: 'Procrastination Dragon',
  rarity: 'epic' as const,
  hp: 847,
  maxHp: 1200,
  reward: { xp: 200, crystals: 5 },
  members: [
    { name: 'Aria', charId: 'aria', dmg: 120 },
    { name: 'Kofi', charId: 'kofi', dmg: 95 },
    { name: 'Mei', charId: 'mei', dmg: 80 },
  ],
};

// ─── Tabs ───
type TabId = 'league' | 'friends' | 'party';
const TABS: { id: TabId; label: string; icon: 'trophy' | 'users' | 'lightning' }[] = [
  { id: 'league',  label: 'League',       icon: 'trophy' },
  { id: 'friends', label: 'Friends',      icon: 'users' },
  { id: 'party',   label: 'Party Quest',  icon: 'lightning' },
];

function getCharArt(charId: string) {
  if (!charArtStrings[charId] || !charPalettes[charId]) return null;
  return parseArt(charArtStrings[charId]!, charPalettes[charId]!);
}

export default function LeaguePage() {
  const { characterId, xpTotal, level } = useOnboardingStore();
  const [activeTab, setActiveTab] = useState<TabId>('league');
  const [joined, setJoined] = useState(false);

  const charMeta = CHARACTERS.find(c => c.id === characterId);
  const currentTier = LEAGUE_TIERS[0]; // Bronze — placeholder

  return (
    <div style={{ animation: 'fadeUp 0.5s ease-out' }}>
      {/* ─── Title ─── */}
      <h1 style={{
        display: 'flex', alignItems: 'center', gap: 10,
        fontFamily: t.display, fontSize: 26, fontWeight: 900,
        color: t.text, marginBottom: 8,
      }}>
        <NeonIcon type="trophy" size={24} color="gold" />
        Guild Arena
      </h1>
      <p style={{
        fontFamily: t.body, fontSize: 14, color: t.textSecondary,
        marginBottom: 24,
      }}>
        Compete, cooperate, and climb the ranks
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
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                padding: '10px 0', borderRadius: 10,
                background: active ? t.bgCard : 'transparent',
                border: active ? `1px solid ${t.border}` : '1px solid transparent',
                boxShadow: active ? `0 2px 8px rgba(0,0,0,0.2)` : 'none',
                cursor: 'pointer', transition: 'all 0.2s ease',
              }}
            >
              <NeonIcon type={tab.icon} size={14} color={active ? 'gold' : 'muted'} />
              <span style={{
                fontFamily: t.display, fontSize: 12, fontWeight: active ? 700 : 500,
                color: active ? t.text : t.textMuted,
              }}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* ═══════════════════════════════════════════ */}
      {/* TAB: LEAGUE — Opt-in weekly competition    */}
      {/* ═══════════════════════════════════════════ */}
      {activeTab === 'league' && (
        <div style={{ animation: 'fadeUp 0.3s ease-out' }}>
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
                  <span style={{ fontSize: 18, color: currentTier.color }}>{currentTier.icon}</span>
                </div>
                <div>
                  <div style={{
                    fontFamily: t.display, fontSize: 18, fontWeight: 800, color: t.text,
                  }}>
                    {currentTier.label} League
                  </div>
                  <div style={{ fontFamily: t.body, fontSize: 12, color: t.textMuted }}>
                    Week 1 • 6 days remaining
                  </div>
                </div>
              </div>
              <span style={{
                fontFamily: t.mono, fontSize: 10, fontWeight: 700,
                color: t.textMuted, padding: '4px 10px', borderRadius: 8,
                background: t.bgElevated,
              }}>
                30 heroes
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
              {LEAGUE_TIERS.map((tier, i) => (
                <div key={tier.id} style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                  position: 'relative', zIndex: 1,
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: i === 0 ? `${tier.color}25` : t.bgElevated,
                    border: `2px solid ${i === 0 ? tier.color : t.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: i === 0 ? `0 0 10px ${tier.color}40` : 'none',
                    transition: 'all 0.3s ease',
                  }}>
                    <span style={{
                      fontSize: 14, color: i === 0 ? tier.color : t.textMuted,
                    }}>
                      {tier.icon}
                    </span>
                  </div>
                  <span style={{
                    fontFamily: t.mono, fontSize: 9, fontWeight: 700,
                    color: i === 0 ? tier.color : t.textMuted,
                  }}>
                    {tier.label}
                  </span>
                </div>
              ))}
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
                  Top 10 → promote
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
                  Bottom 5 → demote
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
                Join the Arena?
              </div>
              <p style={{
                fontFamily: t.body, fontSize: 13, color: t.textSecondary,
                marginBottom: 20, lineHeight: 1.5,
              }}>
                Compete with 30 heroes in weekly XP challenges. Earn your way from Bronze to Diamond!
              </p>
              <button
                onClick={() => setJoined(true)}
                style={{
                  padding: '14px 40px', borderRadius: 14,
                  border: 'none', background: t.gradient,
                  cursor: 'pointer',
                  fontFamily: t.display, fontSize: 15, fontWeight: 800,
                  color: '#FFF', transition: 'all 0.2s ease',
                  borderBottom: '4px solid #6A50CC',
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                }}
              >
                <NeonIcon type="trophy" size={16} color="text" />
                Join Weekly League
              </button>
              <p style={{
                fontFamily: t.body, fontSize: 11, color: t.textMuted,
                marginTop: 12,
              }}>
                Opt-in only • Resets every Monday • Leave anytime
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
                  Weekly Standings
                </span>
                <span style={{
                  fontFamily: t.mono, fontSize: 10, fontWeight: 700,
                  color: t.textMuted,
                }}>
                  6d 12h left
                </span>
              </div>

              {/* Your position highlight */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 20px',
                background: `${t.violet}08`,
                borderBottom: `1px solid ${t.violet}20`,
              }}>
                <span style={{
                  fontFamily: t.mono, fontSize: 14, fontWeight: 800, color: t.textMuted,
                  width: 28, textAlign: 'center',
                }}>
                  —
                </span>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: `${charMeta?.color || t.violet}15`,
                  border: `1.5px solid ${charMeta?.color || t.violet}40`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  {characterId && getCharArt(characterId) ? (
                    <PixelCanvas data={getCharArt(characterId)!} size={2} />
                  ) : (
                    <NeonIcon type="shield" size={12} color="violet" />
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <span style={{ fontFamily: t.body, fontSize: 13, fontWeight: 700, color: t.violet }}>
                    You ({charMeta?.name || 'Hero'})
                  </span>
                </div>
                <span style={{ fontFamily: t.mono, fontSize: 13, fontWeight: 800, color: t.violet }}>
                  {xpTotal} XP
                </span>
              </div>

              {/* Members list */}
              {MOCK_MEMBERS.map((member, i) => {
                const isPromoZone = member.rank <= 10;
                const isDemoteZone = member.rank > 25;
                const art = getCharArt(member.charId);
                const mc = CHARACTERS.find(c => c.id === member.charId);
                return (
                  <div
                    key={member.rank}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '10px 20px',
                      borderBottom: i < MOCK_MEMBERS.length - 1 ? `1px solid ${t.border}` : 'none',
                      background: isDemoteZone ? `${t.rose}04` : 'transparent',
                      animation: `fadeUp 0.3s ease-out ${i * 0.03}s both`,
                    }}
                  >
                    {/* Rank */}
                    <span style={{
                      fontFamily: t.mono, fontSize: 13, fontWeight: 800,
                      color: member.rank <= 3
                        ? [t.gold, '#C0C0C0', '#CD7F32'][member.rank - 1]
                        : t.textMuted,
                      width: 28, textAlign: 'center',
                    }}>
                      {member.rank <= 3 ? ['🥇', '🥈', '🥉'][member.rank - 1] : `#${member.rank}`}
                    </span>
                    {/* Avatar */}
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%',
                      background: `${mc?.color || t.violet}15`,
                      border: `1.5px solid ${mc?.color || t.violet}30`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      {art ? <PixelCanvas data={art} size={2} /> : <NeonIcon type="shield" size={12} color="muted" />}
                    </div>
                    {/* Name */}
                    <span style={{
                      fontFamily: t.body, fontSize: 13, fontWeight: 500,
                      color: t.text, flex: 1,
                    }}>
                      {member.name}
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
                  Showing top 15 of 30
                </span>
                <button
                  onClick={() => setJoined(false)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontFamily: t.body, fontSize: 11, fontWeight: 500,
                    color: t.textMuted, transition: 'color 0.2s ease',
                  }}
                >
                  Leave league
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════ */}
      {/* TAB: FRIENDS — Private comparison boards   */}
      {/* ═══════════════════════════════════════════ */}
      {activeTab === 'friends' && (
        <div style={{ animation: 'fadeUp 0.3s ease-out' }}>
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
                {charMeta?.name || 'Hero'} (You)
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontFamily: t.mono, fontSize: 11, fontWeight: 700, color: t.violet }}>
                  Lv.{level}
                </span>
                <span style={{ fontFamily: t.mono, fontSize: 11, color: t.textMuted }}>
                  {xpTotal} XP
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
                0
              </span>
            </div>
          </div>

          {/* Friends list */}
          {MOCK_FRIENDS.length > 0 ? (
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
                  Friends ({MOCK_FRIENDS.length})
                </span>
              </div>
              {MOCK_FRIENDS.map((friend, i) => {
                const art = getCharArt(friend.charId);
                const fc = CHARACTERS.find(c => c.id === friend.charId);
                return (
                  <div
                    key={friend.name}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 14,
                      padding: '14px 20px',
                      borderBottom: i < MOCK_FRIENDS.length - 1 ? `1px solid ${t.border}` : 'none',
                      animation: `fadeUp 0.3s ease-out ${i * 0.06}s both`,
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
                          Lv.{friend.level}
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
                        this week
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
            <NeonIcon type="users" size={28} color="muted" />
            <p style={{
              fontFamily: t.body, fontSize: 13, color: t.textMuted,
              marginTop: 8, marginBottom: 12,
            }}>
              Invite friends to compare progress privately
            </p>
            <button style={{
              padding: '10px 24px', borderRadius: 12,
              background: `${t.violet}12`, border: `1px solid ${t.violet}25`,
              cursor: 'pointer',
              fontFamily: t.display, fontSize: 13, fontWeight: 700,
              color: t.violet, transition: 'all 0.2s ease',
              display: 'inline-flex', alignItems: 'center', gap: 6,
            }}>
              <NeonIcon type="users" size={14} color="violet" />
              Invite a Friend
            </button>
            <p style={{
              fontFamily: t.body, fontSize: 10, color: t.textMuted,
              marginTop: 8,
            }}>
              Friends-only • No public profiles • Your progress, your circle
            </p>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════ */}
      {/* TAB: PARTY QUEST — Cooperative Boss Fight  */}
      {/* ═══════════════════════════════════════════ */}
      {activeTab === 'party' && (
        <div style={{ animation: 'fadeUp 0.3s ease-out' }}>
          {/* Boss card */}
          <div style={{
            padding: 24, borderRadius: 16,
            background: t.bgCard,
            border: `1px solid ${rarity.epic.color}30`,
            boxShadow: rarity.epic.glow,
            marginBottom: 16,
            position: 'relative', overflow: 'hidden',
          }}>
            {/* Rarity accent */}
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: 3,
              background: `linear-gradient(90deg, ${rarity.epic.color}, ${t.rose})`,
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
                  {PARTY_BOSS.name}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 3,
                    fontFamily: t.mono, fontSize: 10, fontWeight: 700,
                    padding: '2px 8px', borderRadius: 8,
                    color: rarity.epic.color,
                    background: rarity.epic.bg,
                    textTransform: 'uppercase',
                  }}>
                    {rarity.epic.icon} Epic Boss
                  </span>
                  <span style={{ fontFamily: t.body, fontSize: 11, color: t.textMuted }}>
                    Weekly Challenge
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
                  Boss HP
                </span>
                <span style={{ fontFamily: t.mono, fontSize: 11, fontWeight: 700, color: t.textMuted }}>
                  {PARTY_BOSS.hp} / {PARTY_BOSS.maxHp}
                </span>
              </div>
              <div style={{
                height: 10, borderRadius: 5, background: '#252530', overflow: 'hidden',
              }}>
                <div style={{
                  width: `${(PARTY_BOSS.hp / PARTY_BOSS.maxHp) * 100}%`,
                  height: '100%', borderRadius: 5,
                  background: `linear-gradient(90deg, ${t.rose}, #FF8FA3)`,
                  transition: 'width 0.6s ease-out',
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
                    +{PARTY_BOSS.reward.xp} XP
                  </div>
                  <div style={{ fontFamily: t.body, fontSize: 9, color: t.textMuted }}>
                    Victory Bounty
                  </div>
                </div>
              </div>
              <div style={{ width: 1, background: t.border }} />
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
                <NeonIcon type="gem" size={16} color="cyan" />
                <div>
                  <div style={{ fontFamily: t.mono, fontSize: 14, fontWeight: 800, color: t.cyan }}>
                    +{PARTY_BOSS.reward.crystals}
                  </div>
                  <div style={{ fontFamily: t.body, fontSize: 9, color: t.textMuted }}>
                    Energy Crystals
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
              💡 <strong style={{ color: t.text }}>How it works:</strong> Complete daily quests to deal damage. Each quest = damage points. Your party fights together — when the boss reaches 0 HP, everyone gets rewards!
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
                Party Members ({PARTY_BOSS.members.length + 1})
              </span>
              <span style={{
                fontFamily: t.mono, fontSize: 10, fontWeight: 700,
                color: t.cyan,
              }}>
                Total DMG: {PARTY_BOSS.members.reduce((s, m) => s + m.dmg, 0)}
              </span>
            </div>

            {/* You */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '12px 20px',
              background: `${t.violet}06`,
              borderBottom: `1px solid ${t.border}`,
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: `${charMeta?.color || t.violet}15`,
                border: `1.5px solid ${charMeta?.color || t.violet}40`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {characterId && getCharArt(characterId) ? (
                  <PixelCanvas data={getCharArt(characterId)!} size={2} />
                ) : (
                  <NeonIcon type="shield" size={12} color="violet" />
                )}
              </div>
              <div style={{ flex: 1 }}>
                <span style={{ fontFamily: t.body, fontSize: 13, fontWeight: 700, color: t.violet }}>
                  {charMeta?.name || 'Hero'} (You)
                </span>
              </div>
              <div style={{
                fontFamily: t.mono, fontSize: 13, fontWeight: 800, color: t.violet,
              }}>
                0 DMG
              </div>
            </div>

            {/* Other members */}
            {PARTY_BOSS.members.map((member, i) => {
              const art = getCharArt(member.charId);
              const mc = CHARACTERS.find(c => c.id === member.charId);
              return (
                <div
                  key={member.name}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '12px 20px',
                    borderBottom: i < PARTY_BOSS.members.length - 1 ? `1px solid ${t.border}` : 'none',
                    animation: `fadeUp 0.3s ease-out ${i * 0.06}s both`,
                  }}
                >
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: `${mc?.color || t.violet}15`,
                    border: `1.5px solid ${mc?.color || t.violet}30`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {art ? <PixelCanvas data={art} size={2} /> : <NeonIcon type="shield" size={12} color="muted" />}
                  </div>
                  <span style={{ fontFamily: t.body, fontSize: 13, fontWeight: 500, color: t.text, flex: 1 }}>
                    {member.name}
                  </span>
                  <span style={{ fontFamily: t.mono, fontSize: 13, fontWeight: 700, color: t.cyan }}>
                    {member.dmg} DMG
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
              Complete quests to deal damage to the boss!
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
              Go to Command Center
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
