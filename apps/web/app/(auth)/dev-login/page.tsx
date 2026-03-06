'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  useAuthStore,
  useOnboardingV2Store,
  useProgressionStore,
  useCharacterStore,
  useRoadmapStore,
  useNarrativeStore,
} from '@plan2skill/store';

// ═══════════════════════════════════════════
// DEV LOGIN — Dev-only user picker
// NOT included in production builds
// ═══════════════════════════════════════════

const t = {
  violet: '#9D7AFF',
  cyan: '#4ECDC4',
  rose: '#FF6B8A',
  gold: '#FFD166',
  mint: '#6EE7B7',
  bg: '#0C0C10',
  bgCard: '#18181F',
  bgElevated: '#121218',
  border: '#252530',
  borderHover: '#35354A',
  text: '#FFFFFF',
  textSecondary: '#A1A1AA',
  textMuted: '#71717A',
  gradient: 'linear-gradient(135deg, #9D7AFF 0%, #4ECDC4 100%)',
  display: '"Plus Jakarta Sans", system-ui, sans-serif',
  body: '"Inter", system-ui, sans-serif',
  mono: '"JetBrains Mono", monospace',
};

interface DevUser {
  id: string;
  displayName: string;
  onboardingCompleted: boolean;
  subscriptionTier: string;
  locale: string;
  level: number;
  totalXp: number;
  character: { characterId: string; archetypeId: string } | null;
  roadmaps: { id: string; goal: string; status: string }[];
  createdAt: string;
}

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export default function DevLoginPage() {
  const router = useRouter();
  const { setTokens, setUser } = useAuthStore();
  const resetOnboarding = useOnboardingV2Store((s) => s.reset);
  const resetProgression = useProgressionStore((s) => s.reset);
  const resetCharacter = useCharacterStore((s) => s.reset);
  const resetRoadmap = useRoadmapStore((s) => s.reset);
  const resetNarrative = useNarrativeStore((s) => s.reset);

  const resetAllStores = useCallback(() => {
    resetOnboarding();
    resetProgression();
    resetCharacter();
    resetRoadmap();
    resetNarrative();
  }, [resetOnboarding, resetProgression, resetCharacter, resetRoadmap, resetNarrative]);

  const [users, setUsers] = useState<DevUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [loginLoading, setLoginLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newUserName, setNewUserName] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [isProd, setIsProd] = useState(false);

  // Fetch users on mount
  useEffect(() => {
    fetch(`${API}/auth/dev/users`)
      .then(async (res) => {
        if (res.status === 401) {
          setIsProd(true);
          setLoading(false);
          return;
        }
        const data = await res.json();
        setUsers(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const handleLogin = useCallback(
    async (userId: string) => {
      setLoginLoading(userId);
      setError(null);
      resetAllStores();
      try {
        const res = await fetch(`${API}/auth/dev/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId }),
        });
        if (!res.ok) throw new Error('Login failed');
        const data = await res.json();
        setTokens(data.accessToken, data.refreshToken);
        setUser(data.userId, data.displayName);

        // Route based on onboarding status
        const user = users.find((u) => u.id === userId);
        router.push(user?.onboardingCompleted ? '/home' : '/intent');
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Login failed');
        setLoginLoading(null);
      }
    },
    [users, setTokens, setUser, router, resetAllStores],
  );

  const handleCreateUser = useCallback(async () => {
    setLoginLoading('__create__');
    setError(null);
    resetAllStores();
    try {
      const res = await fetch(`${API}/auth/dev/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName: newUserName || undefined }),
      });
      if (!res.ok) throw new Error('Create failed');
      const data = await res.json();
      setTokens(data.accessToken, data.refreshToken);
      setUser(data.userId, data.displayName);
      router.push('/intent'); // New user → onboarding
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Create failed');
      setLoginLoading(null);
    }
  }, [newUserName, setTokens, setUser, router, resetAllStores]);

  const handleDelete = useCallback(async (userId: string) => {
    try {
      const res = await fetch(`${API}/auth/dev/users/${userId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Delete failed');
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      setDeleteConfirm(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Delete failed');
      setDeleteConfirm(null);
    }
  }, []);

  // Production guard
  if (isProd) {
    return (
      <div style={{ ...styles.container, justifyContent: 'center', alignItems: 'center' }}>
        <div style={styles.prodWarning}>
          <span style={{ fontSize: 32 }}>&#x1F6AB;</span>
          <h2 style={{ fontFamily: t.display, color: t.rose, margin: '12px 0 8px' }}>
            Production Mode
          </h2>
          <p style={{ fontFamily: t.body, color: t.textSecondary, fontSize: 14 }}>
            Dev login is disabled. Use{' '}
            <a href="/login" style={{ color: t.cyan, textDecoration: 'underline' }}>
              /login
            </a>{' '}
            instead.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.devBadge}>DEV</div>
        <h1 style={styles.title}>Test Login</h1>
        <p style={styles.subtitle}>
          Pick an existing user or create a new one
        </p>
      </div>

      {/* Error */}
      {error && (
        <div style={styles.errorBar}>
          {error}
        </div>
      )}

      {/* Create New User */}
      <div style={styles.section}>
        <button
          onClick={() => setShowCreate(!showCreate)}
          style={styles.createToggle}
        >
          <span style={{ fontSize: 18 }}>+</span>
          <span>New Test User</span>
          <span style={{ marginLeft: 'auto', fontSize: 12, color: t.textMuted }}>
            {showCreate ? '▲' : '▼'}
          </span>
        </button>

        {showCreate && (
          <div style={styles.createPanel}>
            <input
              type="text"
              placeholder="Display name (optional)"
              value={newUserName}
              onChange={(e) => setNewUserName(e.target.value)}
              style={styles.input}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateUser()}
            />
            <button
              onClick={handleCreateUser}
              disabled={loginLoading === '__create__'}
              style={{
                ...styles.createBtn,
                opacity: loginLoading === '__create__' ? 0.6 : 1,
              }}
            >
              {loginLoading === '__create__' ? 'Creating...' : 'Create & Login'}
            </button>
            <p style={{ fontSize: 12, color: t.textMuted, margin: '8px 0 0' }}>
              Starts fresh onboarding flow
            </p>
          </div>
        )}
      </div>

      {/* User List */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>
          Existing Users
          <span style={styles.countBadge}>{users.length}</span>
        </h3>

        {loading ? (
          <div style={styles.loadingBox}>Loading users...</div>
        ) : users.length === 0 ? (
          <div style={styles.emptyBox}>
            No users yet. Create one above.
          </div>
        ) : (
          <div style={styles.userList}>
            {users.map((user) => (
              <div
                key={user.id}
                role="button"
                tabIndex={0}
                onClick={() => { if (loginLoading === null && deleteConfirm !== user.id) handleLogin(user.id); }}
                onKeyDown={(e) => { if (e.key === 'Enter' && loginLoading === null && deleteConfirm !== user.id) handleLogin(user.id); }}
                style={{
                  ...styles.userCard,
                  borderColor:
                    loginLoading === user.id ? t.cyan : t.border,
                  opacity: loginLoading && loginLoading !== user.id ? 0.5 : 1,
                }}
              >
                {/* Avatar */}
                <div
                  style={{
                    ...styles.avatar,
                    background: user.character
                      ? t.gradient
                      : t.bgElevated,
                    border: `2px solid ${user.onboardingCompleted ? t.cyan : t.border}`,
                  }}
                >
                  <span style={{ fontSize: 16 }}>
                    {user.character
                      ? user.character.characterId.charAt(0).toUpperCase()
                      : '?'}
                  </span>
                </div>

                {/* Info */}
                <div style={styles.userInfo}>
                  <div style={styles.userName}>
                    {user.displayName}
                    {user.onboardingCompleted && (
                      <span style={styles.checkmark} title="Onboarding complete">
                        &#x2713;
                      </span>
                    )}
                  </div>
                  <div style={styles.userMeta}>
                    Lv.{user.level}
                    {user.character && (
                      <span> &middot; {user.character.archetypeId}</span>
                    )}
                    {user.roadmaps.length > 0 && (
                      <span>
                        {' '}
                        &middot; {user.roadmaps.length} roadmap
                        {user.roadmaps.length > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  {user.roadmaps.length > 0 && (
                    <div style={styles.roadmapPreview}>
                      {user.roadmaps.map((rm) => (
                        <span key={rm.id} style={styles.roadmapTag}>
                          {rm.goal.length > 30
                            ? rm.goal.slice(0, 30) + '...'
                            : rm.goal}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right side */}
                <div style={styles.userRight}>
                  <div style={{
                    ...styles.tierBadge,
                    color: user.subscriptionTier === 'free' ? t.textMuted :
                      user.subscriptionTier === 'pro' ? t.cyan : t.gold,
                    borderColor: user.subscriptionTier === 'free' ? t.border :
                      user.subscriptionTier === 'pro' ? t.cyan : t.gold,
                  }}>
                    {user.subscriptionTier}
                  </div>
                  <div style={{ fontSize: 11, color: t.textMuted }}>
                    {user.locale}
                  </div>
                  {/* Delete button */}
                  {deleteConfirm === user.id ? (
                    <div style={styles.deleteConfirmRow}>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(user.id); }}
                        style={styles.deleteConfirmBtn}
                      >
                        Delete
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setDeleteConfirm(null); }}
                        style={styles.deleteCancelBtn}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeleteConfirm(user.id); }}
                      style={styles.deleteBtn}
                      title="Delete user"
                    >
                      &#x2715;
                    </button>
                  )}
                </div>

                {loginLoading === user.id && (
                  <div style={styles.loginSpinner}>&#x21BB;</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={styles.footer}>
        <a href="/login" style={styles.footerLink}>
          ← Back to OAuth Login
        </a>
      </div>
    </div>
  );
}

// ─── Styles ──────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    background: t.bg,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '40px 16px',
    fontFamily: t.body,
    color: t.text,
  },
  header: {
    textAlign: 'center',
    marginBottom: 32,
  },
  devBadge: {
    display: 'inline-block',
    padding: '4px 14px',
    borderRadius: 20,
    fontSize: 11,
    fontWeight: 700,
    fontFamily: t.mono,
    letterSpacing: 2,
    color: '#000',
    background: t.gold,
    marginBottom: 16,
  },
  title: {
    fontFamily: t.display,
    fontSize: 28,
    fontWeight: 700,
    margin: '0 0 8px',
    background: t.gradient,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  subtitle: {
    fontSize: 14,
    color: t.textSecondary,
    margin: 0,
  },
  errorBar: {
    width: '100%',
    maxWidth: 520,
    padding: '10px 16px',
    borderRadius: 10,
    background: 'rgba(255,107,138,0.12)',
    border: `1px solid ${t.rose}`,
    color: t.rose,
    fontSize: 13,
    marginBottom: 16,
    textAlign: 'center',
  },
  section: {
    width: '100%',
    maxWidth: 520,
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: t.display,
    fontSize: 14,
    fontWeight: 600,
    color: t.textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
    margin: '0 0 12px',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  countBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 22,
    height: 22,
    borderRadius: 11,
    background: t.bgElevated,
    border: `1px solid ${t.border}`,
    fontSize: 11,
    fontFamily: t.mono,
    color: t.textMuted,
  },
  createToggle: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '14px 18px',
    borderRadius: 14,
    border: `1px dashed ${t.borderHover}`,
    background: t.bgCard,
    color: t.cyan,
    fontSize: 14,
    fontWeight: 600,
    fontFamily: t.display,
    cursor: 'pointer',
    transition: 'border-color 0.2s',
  },
  createPanel: {
    marginTop: 12,
    padding: '16px 18px',
    borderRadius: 14,
    background: t.bgCard,
    border: `1px solid ${t.border}`,
  },
  input: {
    width: '100%',
    padding: '10px 14px',
    borderRadius: 10,
    border: `1px solid ${t.border}`,
    background: t.bgElevated,
    color: t.text,
    fontSize: 14,
    fontFamily: t.body,
    outline: 'none',
    boxSizing: 'border-box' as const,
    marginBottom: 10,
  },
  createBtn: {
    width: '100%',
    padding: '10px 0',
    borderRadius: 10,
    border: 'none',
    background: t.gradient,
    color: '#000',
    fontSize: 14,
    fontWeight: 700,
    fontFamily: t.display,
    cursor: 'pointer',
    transition: 'opacity 0.2s',
  },
  userList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 8,
  },
  userCard: {
    position: 'relative' as const,
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    padding: '14px 16px',
    borderRadius: 14,
    border: `1px solid ${t.border}`,
    background: t.bgCard,
    cursor: 'pointer',
    transition: 'border-color 0.2s, background 0.2s',
    textAlign: 'left' as const,
    fontFamily: t.body,
    color: t.text,
  },
  avatar: {
    flexShrink: 0,
    width: 42,
    height: 42,
    borderRadius: 12,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 18,
    fontWeight: 700,
    fontFamily: t.display,
    color: t.text,
  },
  userInfo: {
    flex: 1,
    minWidth: 0,
  },
  userName: {
    fontSize: 15,
    fontWeight: 600,
    fontFamily: t.display,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  checkmark: {
    color: t.cyan,
    fontSize: 13,
    fontWeight: 700,
  },
  userMeta: {
    fontSize: 12,
    color: t.textMuted,
    marginTop: 2,
  },
  roadmapPreview: {
    marginTop: 6,
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: 4,
  },
  roadmapTag: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: 6,
    background: t.bgElevated,
    border: `1px solid ${t.border}`,
    fontSize: 11,
    color: t.textSecondary,
    fontFamily: t.mono,
  },
  userRight: {
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'flex-end',
    gap: 4,
  },
  tierBadge: {
    padding: '2px 8px',
    borderRadius: 6,
    border: '1px solid',
    fontSize: 11,
    fontWeight: 600,
    fontFamily: t.mono,
    textTransform: 'uppercase' as const,
  },
  loginSpinner: {
    position: 'absolute' as const,
    right: 16,
    top: '50%',
    transform: 'translateY(-50%)',
    fontSize: 18,
    color: t.cyan,
    animation: 'spin 0.8s linear infinite',
  },
  loadingBox: {
    padding: '40px 0',
    textAlign: 'center' as const,
    color: t.textMuted,
    fontSize: 14,
  },
  emptyBox: {
    padding: '40px 0',
    textAlign: 'center' as const,
    color: t.textMuted,
    fontSize: 14,
    border: `1px dashed ${t.border}`,
    borderRadius: 14,
  },
  footer: {
    marginTop: 'auto',
    paddingTop: 32,
  },
  footerLink: {
    color: t.textMuted,
    fontSize: 13,
    textDecoration: 'none',
  },
  deleteBtn: {
    padding: '4px 8px',
    borderRadius: 6,
    border: `1px solid ${t.border}`,
    background: 'transparent',
    color: t.textMuted,
    fontSize: 11,
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  deleteConfirmRow: {
    display: 'flex',
    gap: 4,
  },
  deleteConfirmBtn: {
    padding: '3px 10px',
    borderRadius: 6,
    border: `1px solid ${t.rose}`,
    background: `${t.rose}20`,
    color: t.rose,
    fontSize: 11,
    fontWeight: 600,
    fontFamily: t.mono,
    cursor: 'pointer',
  },
  deleteCancelBtn: {
    padding: '3px 10px',
    borderRadius: 6,
    border: `1px solid ${t.border}`,
    background: 'transparent',
    color: t.textMuted,
    fontSize: 11,
    fontFamily: t.mono,
    cursor: 'pointer',
  },
  prodWarning: {
    textAlign: 'center' as const,
    padding: '40px 32px',
    borderRadius: 18,
    background: t.bgCard,
    border: `1px solid ${t.border}`,
    maxWidth: 400,
  },
};
