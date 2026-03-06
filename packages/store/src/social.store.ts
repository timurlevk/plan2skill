import { create } from 'zustand';

export interface LeagueMember {
  name: string;
  xp: number;
  charId: string;
  rank: number;
  isYou: boolean;
  isBot: boolean;
}

export interface Friend {
  publicId: string;
  name: string;
  xp: number;
  charId: string;
  streak: number;
  level: number;
}

export interface FriendRequest {
  friendshipId: string;
  name: string;
  publicId: string;
  charId: string;
  createdAt: string;
}

export interface PartyQuestMember {
  name: string;
  charId: string;
  dmg: number;
  isYou: boolean;
}

export interface PartyQuest {
  id: string;
  name: string;
  rarity: string;
  hp: number;
  maxHp: number;
  reward: { xp: number; crystals: number };
  members: PartyQuestMember[];
}

interface SocialState {
  // User identity (from DB)
  displayName: string;

  // League
  leagueTier: string;
  leagueRank: number;
  weeklyXp: number;
  leaderboard: LeagueMember[];

  // Friends
  friends: Friend[];
  pendingRequests: FriendRequest[];

  // Party
  activePartyQuest: PartyQuest | null;

  // Actions
  setDisplayName: (name: string) => void;
  setLeagueData: (data: { tier: string; leaderboard: LeagueMember[] }) => void;
  setLeagueInfo: (data: { tier: string; rank: number; weeklyXp: number }) => void;
  setFriends: (friends: Friend[]) => void;
  setPendingRequests: (requests: FriendRequest[]) => void;
  setPartyQuest: (quest: PartyQuest | null) => void;
  reset: () => void;
}

const initialState = {
  displayName: '',
  leagueTier: 'bronze',
  leagueRank: 0,
  weeklyXp: 0,
  leaderboard: [] as LeagueMember[],
  friends: [] as Friend[],
  pendingRequests: [] as FriendRequest[],
  activePartyQuest: null as PartyQuest | null,
};

export const useSocialStore = create<SocialState>((set) => ({
  ...initialState,

  setDisplayName: (name) => set({ displayName: name }),

  setLeagueData: (data) => {
    const me = data.leaderboard.find((m) => m.isYou);
    set({
      leagueTier: data.tier,
      leaderboard: data.leaderboard,
      ...(me ? { leagueRank: me.rank, weeklyXp: me.xp } : {}),
    });
  },

  setLeagueInfo: (data) => set({
    leagueTier: data.tier,
    leagueRank: data.rank,
    weeklyXp: data.weeklyXp,
  }),

  setFriends: (friends) => set({ friends }),

  setPendingRequests: (requests) => set({ pendingRequests: requests }),

  setPartyQuest: (quest) => set({ activePartyQuest: quest }),

  reset: () => set(initialState),
}));
