'use client';

import { useEffect } from 'react';
import { useI18nStore } from '@plan2skill/store';
import { trpc } from '@plan2skill/api-client';

// ═══════════════════════════════════════════
// useLoadTranslations — loads UI translations from backend
// Reads locale from i18n store, fetches via tRPC, sets messages
// Place in root Providers or onboarding layout
// ═══════════════════════════════════════════

export function useLoadTranslations() {
  const locale = useI18nStore((s) => s.locale);
  const setMessages = useI18nStore((s) => s.setMessages);

  const { data } = trpc.i18n.messages.useQuery(
    { locale },
    { staleTime: 5 * 60 * 1000, retry: 1 },
  );

  useEffect(() => {
    if (data) {
      setMessages(data);
    }
  }, [data, setMessages]);
}
