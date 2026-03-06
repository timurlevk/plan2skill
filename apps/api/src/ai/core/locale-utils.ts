/** Map locale code to full language name for prompts */
export function localeToLanguage(locale: string): string {
  const map: Record<string, string> = {
    en: 'English',
    uk: 'Ukrainian',
    pl: 'Polish',
    de: 'German',
    fr: 'French',
    es: 'Spanish',
    pt: 'Portuguese',
    it: 'Italian',
    ja: 'Japanese',
    ko: 'Korean',
    zh: 'Chinese (Simplified)',
    ar: 'Arabic',
    hi: 'Hindi',
    tr: 'Turkish',
    nl: 'Dutch',
    sv: 'Swedish',
    cs: 'Czech',
    ro: 'Romanian',
  };
  return map[locale] ?? 'English';
}

/** Build locale instruction for system prompts */
export function buildLocaleInstruction(locale: string): string {
  if (locale === 'en') return '';
  const lang = localeToLanguage(locale);
  return `\n\nIMPORTANT: Generate ALL content in ${lang}. Every field value (titles, descriptions, questions, explanations, narrative text) must be in ${lang}. Do NOT mix languages. Technical terms (e.g. "JavaScript", "API", "CSS") should remain in their original form.`;
}
