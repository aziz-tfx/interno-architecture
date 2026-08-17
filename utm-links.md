# UTM-ссылки для запуска таргета · Открытый урок «Архитектура»

База: `https://interno-architecture.vercel.app/`
(после привязки домена замените на `https://architecture.interno.school/` — параметры те же)

Параметры лендинга:
- `lang=ru|uz` — язык страницы применяется до первой отрисовки;
- `city=tsh|smr|frg` — город: бейдж в hero, заголовок финального CTA,
  адрес в футере, предвыбор в формах (для Ферганы работает и алиас `fer`);
- `utm_*` — сохраняются на весь визит и передаются в amoCRM
  (заметка + отдельные поля + теги) и в Telegram-уведомление.

Схема именования: `utm_campaign = arch_ol_{город}_{язык}`.

## Meta (Instagram / Facebook) · основной набор

### Ташкент
- RU: `https://interno-architecture.vercel.app/?lang=ru&city=tsh&utm_source=meta&utm_medium=cpc&utm_campaign=arch_ol_tsh_ru&utm_content={{ad.name}}`
- UZ: `https://interno-architecture.vercel.app/?lang=uz&city=tsh&utm_source=meta&utm_medium=cpc&utm_campaign=arch_ol_tsh_uz&utm_content={{ad.name}}`

### Самарканд
- RU: `https://interno-architecture.vercel.app/?lang=ru&city=smr&utm_source=meta&utm_medium=cpc&utm_campaign=arch_ol_smr_ru&utm_content={{ad.name}}`
- UZ: `https://interno-architecture.vercel.app/?lang=uz&city=smr&utm_source=meta&utm_medium=cpc&utm_campaign=arch_ol_smr_uz&utm_content={{ad.name}}`

### Фергана
- RU: `https://interno-architecture.vercel.app/?lang=ru&city=frg&utm_source=meta&utm_medium=cpc&utm_campaign=arch_ol_frg_ru&utm_content={{ad.name}}`
- UZ: `https://interno-architecture.vercel.app/?lang=uz&city=frg&utm_source=meta&utm_medium=cpc&utm_campaign=arch_ol_frg_uz&utm_content={{ad.name}}`

`{{ad.name}}` — динамический макрос Meta: подставит название объявления,
в отчётах будет видно, какой креатив привёл лид. Работают также
`{{adset.name}}` и `{{campaign.name}}`. Если макросы не нужны — просто
удалите `&utm_content=...`.

## Telegram Ads

- RU: `https://interno-architecture.vercel.app/?lang=ru&city=tsh&utm_source=telegram&utm_medium=cpm&utm_campaign=arch_ol_tsh_ru`
- UZ: `https://interno-architecture.vercel.app/?lang=uz&city=tsh&utm_source=telegram&utm_medium=cpm&utm_campaign=arch_ol_tsh_uz`
(для других городов меняйте `city=` и суффикс кампании)

## Блогеры / посевы

Шаблон: `...?lang={lang}&city={city}&utm_source=influencer&utm_medium=post&utm_campaign=arch_ol_{город}_{язык}&utm_content={ник_блогера}`

Пример: `https://interno-architecture.vercel.app/?lang=uz&city=tsh&utm_source=influencer&utm_medium=post&utm_campaign=arch_ol_tsh_uz&utm_content=arch_blogger_01`

## Органика (сторис школы, шапка профиля, Telegram-канал)

- Instagram bio: `https://interno-architecture.vercel.app/?utm_source=instagram&utm_medium=bio&utm_campaign=arch_ol_organic`
- Сторис: `https://interno-architecture.vercel.app/?utm_source=instagram&utm_medium=stories&utm_campaign=arch_ol_organic`
- Telegram-канал: `https://interno-architecture.vercel.app/?utm_source=telegram&utm_medium=channel&utm_campaign=arch_ol_organic`

## События для оптимизации кампаний (Meta Pixel 4251277901808457)

| Событие | Когда срабатывает | Рекомендация |
| --- | --- | --- |
| `Lead` | Успешная отправка любой формы | Основное событие оптимизации |
| `CompleteRegistration` | Страница «Спасибо» (дедуп по eventID) | Дубль-контроль Lead |
| `LeadStep1` (custom) | Введён телефон, открыт шаг 2 | Аудитория «начал заполнять» для ретаргета |
| `Contact` | Клик Telegram/WhatsApp | Второе конверсионное событие |
| `InitiateCheckout` | Открытие модалки записи | Верх воронки |
| `QuizStart` / `QuizComplete` | Квиз | Ретаргет-аудитории |
| `ViewContent`, `ScrollDepth`, `EngagedSession` | Вовлечённость | Look-alike базы |

Ретаргет-связка: показывались `LeadStep1`/`QuizComplete`, но нет `Lead`
за 7 дней → креатив «вы не успели записаться, места на этой неделе ещё есть».

## Чек-лист перед запуском

- [ ] `TG_BOT_TOKEN` и `TG_CHAT_ID` в Vercel (иначе частичные заявки шага 1 теряются)
- [ ] Telegram-кнопка на лендинге: заменить канал на юзернейм менеджера/бота
- [ ] Кастомный домен (для доверия модерации Meta)
- [ ] Тестовый лид с каждого языка: проверить, что заявка дошла до amoCRM с тегами
