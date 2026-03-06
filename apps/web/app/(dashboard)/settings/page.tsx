'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useAuthStore, useProgressionStore, useOnboardingV2Store, SUPPORTED_LOCALES, LOCALE_ENDONYMS, useI18nStore } from '@plan2skill/store';
import type { SupportedLocale } from '@plan2skill/store';
import { trpc } from '@plan2skill/api-client';
import { t } from '../../(onboarding)/_components/tokens';
import { NeonIcon } from '../../(onboarding)/_components/NeonIcon';

// ═══════════════════════════════════════════
// SETTINGS PAGE — Hero Settings & Preferences
// Phase W3: Wires user.updateDisplayName + user.updatePreferences
// ═══════════════════════════════════════════

/** Common timezone options */
const TIMEZONE_OPTIONS = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Kyiv',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Asia/Kolkata',
  'Australia/Sydney',
] as const;

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      padding: '20px 24px', borderRadius: 14,
      background: t.bgCard, border: `1px solid ${t.border}`,
      marginBottom: 16,
    }}>
      <h2 style={{
        fontFamily: t.display, fontSize: 13, fontWeight: 700,
        color: t.textSecondary, textTransform: 'uppercase' as const,
        letterSpacing: '0.06em', marginBottom: 16,
      }}>
        {title}
      </h2>
      {children}
    </div>
  );
}

function SaveButton({ onClick, isPending, label = 'Save' }: {
  onClick: () => void;
  isPending: boolean;
  label?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={isPending}
      style={{
        padding: '8px 20px', borderRadius: 10,
        background: isPending ? t.border : t.gradient, border: 'none',
        fontFamily: t.body, fontSize: 13, fontWeight: 700, color: '#FFF',
        cursor: isPending ? 'not-allowed' : 'pointer',
        opacity: isPending ? 0.6 : 1,
        transition: 'opacity 0.15s',
      }}
    >
      {isPending ? 'Saving...' : label}
    </button>
  );
}

export default function SettingsPage() {
  const tr = useI18nStore((s) => s.t);
  const { displayName: storedDisplayName, userId } = useAuthStore();
  const { quietMode } = useProgressionStore();
  const { locale: storedLocale } = useOnboardingV2Store();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  // ─── Local form state ───
  const [displayName, setDisplayName] = useState(storedDisplayName || '');
  const [selectedLocale, setSelectedLocale] = useState<SupportedLocale>(storedLocale || 'en');
  const [selectedTimezone, setSelectedTimezone] = useState(
    Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
  );
  const [isQuietMode, setIsQuietMode] = useState(quietMode);

  // Sync from store on mount
  useEffect(() => {
    if (storedDisplayName) setDisplayName(storedDisplayName);
  }, [storedDisplayName]);

  useEffect(() => {
    setIsQuietMode(quietMode);
  }, [quietMode]);

  // ─── Success/error feedback ───
  const [nameSuccess, setNameSuccess] = useState(false);
  const [prefsSuccess, setPrefsSuccess] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [prefsError, setPrefsError] = useState<string | null>(null);

  // ─── tRPC mutations ───
  const updateNameMutation = trpc.user.updateDisplayName.useMutation();
  const updatePrefsMutation = trpc.user.updatePreferences.useMutation();

  // ─── Save display name ───
  const handleSaveName = useCallback(() => {
    const trimmed = displayName.trim();
    if (trimmed.length < 2 || trimmed.length > 50) {
      setNameError('Display name must be 2-50 characters.');
      return;
    }
    setNameError(null);
    setNameSuccess(false);

    updateNameMutation.mutate(
      { displayName: trimmed },
      {
        onSuccess: () => {
          useAuthStore.getState().setUser(userId || '', trimmed);
          setNameSuccess(true);
          setTimeout(() => setNameSuccess(false), 2000);
        },
        onError: (err) => {
          setNameError(err.message || 'Failed to update name.');
        },
      },
    );
  }, [displayName, userId, updateNameMutation]);

  // ─── Save preferences ───
  const handleSavePrefs = useCallback(() => {
    setPrefsError(null);
    setPrefsSuccess(false);

    // Optimistic UI: update local stores
    if (isQuietMode !== quietMode) {
      useProgressionStore.getState().toggleQuietMode();
    }
    if (selectedLocale !== storedLocale) {
      useOnboardingV2Store.getState().setLocale(selectedLocale);
    }

    updatePrefsMutation.mutate(
      {
        quietMode: isQuietMode,
        timezone: selectedTimezone,
        locale: selectedLocale,
      },
      {
        onSuccess: () => {
          setPrefsSuccess(true);
          setTimeout(() => setPrefsSuccess(false), 2000);
        },
        onError: (err) => {
          // Rollback optimistic updates
          if (isQuietMode !== quietMode) {
            useProgressionStore.getState().toggleQuietMode();
          }
          if (selectedLocale !== storedLocale) {
            useOnboardingV2Store.getState().setLocale(storedLocale || 'en');
          }
          setPrefsError(err.message || 'Failed to update preferences.');
        },
      },
    );
  }, [isQuietMode, quietMode, selectedLocale, storedLocale, selectedTimezone, updatePrefsMutation]);

  return (
    <div style={{ animation: 'fadeUp 0.4s ease-out' }}>
      <h1 style={{
        fontFamily: t.display, fontSize: 24, fontWeight: 900,
        color: t.text, marginBottom: 4,
      }}>
        {tr('settings.title')}
      </h1>
      <p style={{
        fontFamily: t.body, fontSize: 13, color: t.textSecondary,
        marginBottom: 24,
      }}>
        {tr('settings.subtitle')}
      </p>

      {/* ═══ IDENTITY ═══ */}
      <SettingsSection title={tr('settings.identity')}>
        <label style={{ display: 'block', marginBottom: 12 }}>
          <span style={{
            fontFamily: t.body, fontSize: 13, fontWeight: 600,
            color: t.text, display: 'block', marginBottom: 6,
          }}>
            {tr('settings.display_name')}
          </span>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={50}
              style={{
                flex: 1, padding: '10px 14px', borderRadius: 10,
                background: t.bgElevated, border: `1px solid ${t.border}`,
                fontFamily: t.body, fontSize: 14, color: t.text,
                outline: 'none', transition: 'border-color 0.2s',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = t.violet)}
              onBlur={(e) => (e.currentTarget.style.borderColor = t.border)}
            />
            <SaveButton onClick={handleSaveName} isPending={updateNameMutation.isPending} />
          </div>
          {nameError && (
            <div style={{
              fontFamily: t.body, fontSize: 12, color: t.rose, marginTop: 6,
            }}>
              {nameError}
            </div>
          )}
          {nameSuccess && (
            <div style={{
              fontFamily: t.body, fontSize: 12, color: t.cyan, marginTop: 6,
              animation: 'fadeUp 0.2s ease-out',
            }}>
              Name updated!
            </div>
          )}
        </label>
      </SettingsSection>

      {/* ═══ PREFERENCES ═══ */}
      <SettingsSection title={tr('settings.preferences')}>
        {/* Quiet Mode */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 20,
        }}>
          <div>
            <div style={{
              fontFamily: t.body, fontSize: 13, fontWeight: 600, color: t.text,
            }}>
              {tr('settings.quiet_mode')}
            </div>
            <div style={{
              fontFamily: t.body, fontSize: 12, color: t.textMuted, marginTop: 2,
            }}>
              {tr('settings.quiet_desc')}
            </div>
          </div>
          <button
            role="switch"
            aria-checked={isQuietMode}
            onClick={() => setIsQuietMode((v) => !v)}
            style={{
              width: 44, height: 24, borderRadius: 12,
              background: isQuietMode ? t.violet : t.border,
              border: 'none', cursor: 'pointer', position: 'relative',
              transition: 'background 0.2s ease',
              flexShrink: 0,
            }}
          >
            <div style={{
              width: 18, height: 18, borderRadius: '50%',
              background: '#FFF', position: 'absolute', top: 3,
              left: 3,
              transform: isQuietMode ? 'translateX(20px)' : 'translateX(0)',
              transition: 'transform 0.2s ease',
            }} />
          </button>
        </div>

        {/* Language */}
        <div style={{ marginBottom: 20 }}>
          <div style={{
            fontFamily: t.body, fontSize: 13, fontWeight: 600, color: t.text,
            marginBottom: 6,
          }}>
            {tr('settings.language')}
          </div>
          <div style={{
            fontFamily: t.body, fontSize: 12, color: t.textMuted, marginBottom: 8,
          }}>
            {tr('settings.language_refresh')}
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {SUPPORTED_LOCALES.map((loc) => (
              <button
                key={loc}
                onClick={() => setSelectedLocale(loc)}
                style={{
                  padding: '8px 14px', borderRadius: 8,
                  background: selectedLocale === loc ? `${t.violet}20` : t.bgElevated,
                  border: `1px solid ${selectedLocale === loc ? t.violet : t.border}`,
                  fontFamily: t.body, fontSize: 13, fontWeight: 600,
                  color: selectedLocale === loc ? t.violet : t.textSecondary,
                  cursor: 'pointer',
                }}
              >
                {LOCALE_ENDONYMS[loc] || loc}
              </button>
            ))}
          </div>
        </div>

        {/* Timezone */}
        <div style={{ marginBottom: 20 }}>
          <div style={{
            fontFamily: t.body, fontSize: 13, fontWeight: 600, color: t.text,
            marginBottom: 6,
          }}>
            {tr('settings.timezone')}
          </div>
          <select
            value={selectedTimezone}
            onChange={(e) => setSelectedTimezone(e.target.value)}
            style={{
              width: '100%', padding: '10px 14px', borderRadius: 10,
              background: t.bgElevated, border: `1px solid ${t.border}`,
              fontFamily: t.body, fontSize: 14, color: t.text,
              outline: 'none',
              appearance: 'none' as const,
              boxSizing: 'border-box',
            }}
          >
            {TIMEZONE_OPTIONS.map((tz) => (
              <option key={tz} value={tz} style={{ background: t.bg, color: t.text }}>
                {tz.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </div>

        {/* Save preferences button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <SaveButton onClick={handleSavePrefs} isPending={updatePrefsMutation.isPending} label={tr('settings.save')} />
          {prefsError && (
            <span style={{ fontFamily: t.body, fontSize: 12, color: t.rose }}>
              {prefsError}
            </span>
          )}
          {prefsSuccess && (
            <span style={{
              fontFamily: t.body, fontSize: 12, color: t.cyan,
              animation: 'fadeUp 0.2s ease-out',
            }}>
              Preferences saved!
            </span>
          )}
        </div>
      </SettingsSection>

      {/* ═══ ACCOUNT INFO ═══ */}
      <SettingsSection title={tr('settings.account')}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: t.body, fontSize: 13, color: t.textMuted }}>
              {tr('settings.user_id')}
            </span>
            <span style={{
              fontFamily: t.mono, fontSize: 12, color: t.textSecondary,
              maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {userId || 'Not available'}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: t.body, fontSize: 13, color: t.textMuted }}>
              {tr('settings.status')}
            </span>
            <span style={{
              fontFamily: t.mono, fontSize: 12, fontWeight: 600,
              color: isAuthenticated ? t.cyan : t.rose,
            }}>
              {isAuthenticated ? 'Authenticated' : 'Not authenticated'}
            </span>
          </div>
        </div>
      </SettingsSection>
    </div>
  );
}
