import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SupportedLocale } from './onboarding-v2.store';

// ═══════════════════════════════════════════
// I18N STORE — Translation messages + t() helper
// Persists locale + messages to localStorage
// Consumed by useLoadTranslations hook + components
// ═══════════════════════════════════════════

interface I18nState {
  locale: SupportedLocale;
  messages: Record<string, string>;
  isLoaded: boolean;

  setLocale: (locale: SupportedLocale) => void;
  setMessages: (messages: Record<string, string>) => void;
  t: (key: string, fallback?: string) => string;
}

export const useI18nStore = create<I18nState>()(
  persist(
    (set, get) => ({
      locale: 'en',
      messages: {},
      isLoaded: false,

      setLocale: (locale) => set({ locale }),

      setMessages: (messages) => set({ messages, isLoaded: true }),

      t: (key: string, fallback?: string) => {
        const { messages } = get();
        return messages[key] ?? fallback ?? key;
      },
    }),
    {
      name: 'plan2skill-i18n',
      partialize: (state) => ({
        locale: state.locale,
        messages: state.messages,
      }),
    },
  ),
);
