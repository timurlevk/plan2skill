import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const UI_TRANSLATIONS = [
  // Navigation
  { entityId: 'nav.home', en: 'Home', uk: 'Головна', pl: 'Strona główna' },
  { entityId: 'nav.quests', en: 'Quests', uk: 'Квести', pl: 'Zadania' },
  { entityId: 'nav.roadmap', en: 'Roadmap', uk: 'Дорожня карта', pl: 'Plan nauki' },
  { entityId: 'nav.narrative', en: 'Story', uk: 'Історія', pl: 'Historia' },
  { entityId: 'nav.inventory', en: 'Inventory', uk: 'Інвентар', pl: 'Ekwipunek' },
  { entityId: 'nav.forge', en: 'Forge', uk: 'Кузня', pl: 'Kuźnia' },
  { entityId: 'nav.shop', en: 'Shop', uk: 'Крамниця', pl: 'Sklep' },
  { entityId: 'nav.profile', en: 'Profile', uk: 'Профіль', pl: 'Profil' },
  // Common actions
  { entityId: 'action.start', en: 'Start', uk: 'Почати', pl: 'Rozpocznij' },
  { entityId: 'action.continue', en: 'Continue', uk: 'Продовжити', pl: 'Kontynuuj' },
  { entityId: 'action.complete', en: 'Complete', uk: 'Завершити', pl: 'Ukończ' },
  { entityId: 'action.cancel', en: 'Cancel', uk: 'Скасувати', pl: 'Anuluj' },
  { entityId: 'action.save', en: 'Save', uk: 'Зберегти', pl: 'Zapisz' },
  { entityId: 'action.back', en: 'Back', uk: 'Назад', pl: 'Wstecz' },
  { entityId: 'action.next', en: 'Next', uk: 'Далі', pl: 'Dalej' },
  // Dashboard
  { entityId: 'dashboard.welcome', en: 'Welcome back!', uk: 'З поверненням!', pl: 'Witaj ponownie!' },
  { entityId: 'dashboard.daily_quests', en: 'Daily Quests', uk: 'Щоденні квести', pl: 'Codzienne zadania' },
  { entityId: 'dashboard.streak', en: 'Day Streak', uk: 'Серія днів', pl: 'Seria dni' },
  { entityId: 'dashboard.level', en: 'Level', uk: 'Рівень', pl: 'Poziom' },
  { entityId: 'dashboard.xp', en: 'Experience', uk: 'Досвід', pl: 'Doświadczenie' },
  { entityId: 'dashboard.coins', en: 'Coins', uk: 'Монети', pl: 'Monety' },
  { entityId: 'dashboard.energy', en: 'Energy', uk: 'Енергія', pl: 'Energia' },
  // Onboarding
  { entityId: 'onboarding.welcome_title', en: 'Welcome to Plan2Skill', uk: 'Ласкаво просимо до Plan2Skill', pl: 'Witamy w Plan2Skill' },
  { entityId: 'onboarding.choose_goal', en: 'What do you want to learn?', uk: 'Що ви хочете вивчити?', pl: 'Czego chcesz się nauczyć?' },
  { entityId: 'onboarding.choose_pace', en: 'How much time per day?', uk: 'Скільки часу на день?', pl: 'Ile czasu dziennie?' },
  { entityId: 'onboarding.choose_character', en: 'Choose your character', uk: 'Оберіть свого персонажа', pl: 'Wybierz swoją postać' },
  // Quest types
  { entityId: 'quest.knowledge', en: 'Knowledge', uk: 'Знання', pl: 'Wiedza' },
  { entityId: 'quest.practice', en: 'Practice', uk: 'Практика', pl: 'Praktyka' },
  { entityId: 'quest.creative', en: 'Creative', uk: 'Творчість', pl: 'Kreatywność' },
  { entityId: 'quest.boss', en: 'Boss Challenge', uk: 'Бос-виклик', pl: 'Wyzwanie bossa' },
  // Narrative
  { entityId: 'narrative.new_episode', en: 'New Episode', uk: 'Новий епізод', pl: 'Nowy odcinek' },
  { entityId: 'narrative.continue_reading', en: 'Continue Reading', uk: 'Продовжити читання', pl: 'Kontynuuj czytanie' },
  // Errors
  { entityId: 'error.generic', en: 'Something went wrong', uk: 'Щось пішло не так', pl: 'Coś poszło nie tak' },
  { entityId: 'error.network', en: 'Check your connection', uk: 'Перевірте підключення', pl: 'Sprawdź połączenie' },
  { entityId: 'error.rate_limit', en: 'Too many requests, try later', uk: 'Забагато запитів, спробуйте пізніше', pl: 'Za dużo żądań, spróbuj później' },
];

async function seedTranslations() {
  console.log('Seeding UI translations...');
  let count = 0;
  for (const item of UI_TRANSLATIONS) {
    for (const [locale, value] of Object.entries(item)) {
      if (locale === 'entityId') continue;
      await prisma.refTranslation.upsert({
        where: {
          uq_translation: {
            entityType: 'ui',
            entityId: item.entityId,
            field: 'label',
            locale,
          },
        },
        update: { value },
        create: {
          entityType: 'ui',
          entityId: item.entityId,
          field: 'label',
          locale,
          value,
        },
      });
      count++;
    }
  }
  console.log(`Seeded ${count} UI translations`);
}

seedTranslations()
  .then(() => prisma.$disconnect())
  .catch((e) => { console.error(e); prisma.$disconnect(); process.exit(1); });
