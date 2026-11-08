#!/usr/bin/env node
// SEO/GEO-сборка лендинга «Архитектура»: node scripts/build-seo.mjs
//
// Источник правды — index.html (русская разметка) и словарь `dict` в нём. Скрипт:
//  1. пишет SEO-блок <head> русской версии (title, description, canonical, hreflang,
//     Open Graph, JSON-LD: курс, школа, спикер, FAQ, хлебные крошки) и META для ?lang=;
//  2. собирает узбекскую версию uz/index.html — отдельный URL, который индексируют Google,
//     Яндекс и LLM (текст, переключаемый скриптом на одной странице, поисковики не видят);
//  3. пишет sitemap.xml, robots.txt и llms.txt.
// Запускать после любой правки текстов в index.html. Зависимостей нет — только Node 18+.
// uz/index.html не редактируйте вручную — он перезаписывается.

import {readFileSync, writeFileSync, mkdirSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://architecture.internoedu.uz';
const SCHOOL = 'https://internoedu.uz';
const TODAY = new Date().toISOString().slice(0, 10);

const PHONE = '+998781131808';
const PHONE_HUMAN = '+998 78 113 18 08';
const SAME_AS = ['https://t.me/interno_school', 'https://instagram.com/interno.school'];
const CDN = 'https://d8j0ntlcm91z4.cloudfront.net/user_3CLCviMVubl8pteTJQ9R4nBs27N/';
// Уже используемые на странице изображения (новые ассеты не создаём)
const OG_IMAGE = {url: CDN + 'hf_20260815_093319_a188b5d9-b4cf-4c1e-bd6f-57374f48c514.png', width: 1024, height: 1024};
const MENTOR_IMAGE = CDN + 'hf_20260815_135305_795ec63d-33e5-4c8c-9c3e-2e12d44593a7_min.webp';
const FAQ_COUNT = 8;

// Соседние курсы школы (ключи — ftr.c.* в словаре)
const SIBLINGS = [
  ['interior', 'https://interior.internoedu.uz/'],
  ['graphic', 'https://graphic.internoedu.uz/'],
  ['video', 'https://videomontaj.internoedu.uz/'],
  ['data', 'https://data.internoedu.uz/'],
  ['ai', 'https://ai.internoedu.uz/'],
  ['acc', 'https://buxgalteriya.internoedu.uz/'],
];
const CITY_KEYS = ['tsh', 'smr', 'frg'];
const CITIES_EN = ['Tashkent', 'Samarkand', 'Fergana'];

// Мета по языкам. Title ≤ ~65 символов, description ≤ ~160: главный запрос — в начале.
// Все факты — только со страницы (FAQ: 4 месяца, 2 раза в неделю по 2 часа; сертификат; Revit и Lumion).
const LANGS = {
  ru: {
    path: '/', locale: 'ru_RU',
    title: 'Курс архитектуры в Ташкенте — бесплатный открытый урок | INTERNO',
    description: 'Офлайн-курс архитектуры в Ташкенте, Самарканде и Фергане: 4 месяца, Revit и Lumion, сертификат. Начните с бесплатного урока — первый проект за 1 час.',
    courseName: 'Курс «Архитектура» — INTERNO School',
    courseDescription: 'Офлайн-курс архитектуры INTERNO School в Ташкенте, Самарканде и Фергане: проектирование частных домов и интерьерных объектов в Revit и Lumion. 4 месяца, 2 раза в неделю по 2 часа, плюс практика на реальных объектах. Выдаётся сертификат с QR-кодом. Начать можно с бесплатного открытого урока (60 минут): концепция дома в Revit с нуля под руководством архитектора.',
    credential: 'Сертификат с QR-кодом',
    jobTitle: 'Архитектор-концептуалист',
    cities: ['Ташкент', 'Самарканд', 'Фергана'],
    crumbSchool: 'INTERNO School', crumbCourse: 'Архитектура',
    schoolPath: '/',
  },
  uz: {
    path: '/uz/', locale: 'uz_UZ',
    title: 'Toshkentda arxitektura kursi — bepul ochiq dars | INTERNO',
    description: 'Toshkent, Samarqand va Farg‘onada oflayn arxitektura kursi: 4 oy, Revit va Lumion, sertifikat. Bepul ochiq darsdan boshlang — 1 soatda birinchi loyiha.',
    courseName: '«Arxitektura» kursi — INTERNO School',
    courseDescription: 'INTERNO School’ning Toshkent, Samarqand va Farg‘onadagi oflayn arxitektura kursi: Revit va Lumion’da xususiy uylar va interyer obyektlarini loyihalash. 4 oy, haftada 2 marta, 2 soatdan, qo‘shimcha — real obyektlarda amaliyot. QR-kodli sertifikat beriladi. Bepul ochiq darsdan (60 daqiqa) boshlash mumkin: arxitektor rahbarligida Revit’da noldan uy konsepsiyasi.',
    credential: 'QR-kodli sertifikat',
    jobTitle: 'Kontseptualist-arxitektor',
    cities: ['Toshkent', 'Samarqand', 'Farg‘ona'],
    crumbSchool: 'INTERNO School', crumbCourse: 'Arxitektura',
    schoolPath: '/uz/',
  },
};

// ---------- словарь из index.html ----------
const srcPath = join(ROOT, 'index.html');
const src = readFileSync(srcPath, 'utf8');
const dictMatch = src.match(/const dict = (\{[\s\S]*?\n\});/);
if (!dictMatch) throw new Error('dict не найден в index.html');
const dict = new Function(`return (${dictMatch[1]})`)();
for (const l of Object.keys(LANGS)) {
  const miss = Object.keys(dict.ru).filter(k => !(k in dict[l]));
  if (miss.length) throw new Error(`В словаре ${l} нет ключей: ${miss.join(', ')}`);
}

// ---------- утилиты ----------
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const plain = html => String(html).replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
const abs = path => SITE + path;

// Границы содержимого элемента, открывающий тег которого начинается в позиции `start`
// (с учётом вложенности одноимённых тегов).
function elementBounds(html, start) {
  const open = html.slice(start).match(/^<([a-zA-Z0-9]+)\b[^>]*>/);
  const tag = open[1].toLowerCase();
  const innerStart = start + open[0].length;
  const re = new RegExp(`<(/?)${tag}\\b[^>]*>`, 'gi');
  re.lastIndex = innerStart;
  let depth = 1, m;
  while ((m = re.exec(html))) {
    depth += m[1] ? -1 : 1;
    if (!depth) return {innerStart, innerEnd: m.index};
  }
  throw new Error(`Не закрыт <${tag}> на позиции ${start}`);
}
const setAttr = (tag, name, value) => {
  const re = new RegExp(`\\s${name}="[^"]*"`);
  return re.test(tag) ? tag.replace(re, ` ${name}="${esc(value)}"`) : tag.replace(/\s*\/?>$/, m => ` ${name}="${esc(value)}"${m}`);
};

// Переводит <body> словарём t так же, как applyLang() в браузере
function translateBody(html, t) {
  const bodyStart = html.indexOf('<body');
  const bodyEnd = html.indexOf('</body>');
  let body = html.slice(bodyStart, bodyEnd);
  const get = k => { if (!(k in t)) throw new Error(`Нет ключа ${k}`); return t[k]; };

  body = body.replace(/<[a-zA-Z][^>]*\sdata-i18n-(alt|aria|href)="[^"]+"[^>]*>/g, tag => {
    for (const [, kind, key] of tag.matchAll(/data-i18n-(alt|aria|href)="([^"]+)"/g)) {
      const v = kind === 'href' ? get(key) : plain(get(key));
      tag = setAttr(tag, {alt: 'alt', aria: 'aria-label', href: 'href'}[kind], v);
    }
    return tag;
  });
  // содержимое (innerHTML, как в applyLang): с конца, чтобы не сбивать позиции
  const hits = [...body.matchAll(/<[a-zA-Z][^>]*\sdata-i18n="([^"]+)"[^>]*>/g)].reverse();
  for (const h of hits) {
    const {innerStart, innerEnd} = elementBounds(body, h.index);
    body = body.slice(0, innerStart) + get(h[1]) + body.slice(innerEnd);
  }
  return html.slice(0, bodyStart) + body + html.slice(bodyEnd);
}

// ---------- JSON-LD ----------
function jsonLd(lang) {
  const L = LANGS[lang], t = dict[lang], url = abs(L.path);
  const orgId = `${SCHOOL}/#org`, courseId = `${SITE}/#course`, personId = `${SITE}/#vladislav-danilov`;
  const places = CITY_KEYS.map((k, i) => ({
    '@type': 'Place',
    name: `INTERNO School — ${L.cities[i]}`,
    address: {
      '@type': 'PostalAddress',
      streetAddress: plain(t[`ftr.addr.${k}`]).split(' · ').slice(1).join(' · '),
      addressLocality: CITIES_EN[i],
      addressCountry: 'UZ',
    },
  }));
  const graph = [
    {
      '@type': 'EducationalOrganization', '@id': orgId, name: 'INTERNO School',
      url: `${SCHOOL}${L.schoolPath}`, telephone: PHONE, sameAs: SAME_AS,
    },
    {
      '@type': 'Course', '@id': courseId, name: L.courseName, description: L.courseDescription,
      url, inLanguage: ['ru', 'uz'], provider: {'@id': orgId}, image: OG_IMAGE.url,
      timeRequired: 'P4M', teaches: ['Revit', 'Lumion'],
      educationalCredentialAwarded: L.credential,
      hasCourseInstance: {
        '@type': 'CourseInstance', courseMode: 'Onsite', location: places, instructor: {'@id': personId},
      },
    },
    {
      '@type': 'Person', '@id': personId, name: plain(t['m.name']), jobTitle: L.jobTitle,
      description: [t['m.role'], t['m.l1'], t['m.l2'], t['m.l3']].map(plain).join('. '),
      image: MENTOR_IMAGE, worksFor: {'@id': orgId}, knowsAbout: ['Revit', 'Lumion', L.crumbCourse],
      award: [plain(t['m.l2']), plain(t['m.l3'])],
    },
    {
      '@type': 'WebPage', '@id': `${url}#webpage`, url, name: L.title, description: L.description,
      inLanguage: lang, about: {'@id': courseId}, breadcrumb: {'@id': `${url}#breadcrumb`},
      primaryImageOfPage: OG_IMAGE.url, dateModified: TODAY,
    },
    {
      '@type': 'BreadcrumbList', '@id': `${url}#breadcrumb`,
      itemListElement: [
        {'@type': 'ListItem', position: 1, name: L.crumbSchool, item: `${SCHOOL}${L.schoolPath}`},
        {'@type': 'ListItem', position: 2, name: L.crumbCourse, item: url},
      ],
    },
    {
      '@type': 'FAQPage', '@id': `${url}#faq`, inLanguage: lang,
      mainEntity: Array.from({length: FAQ_COUNT}, (_, i) => ({
        '@type': 'Question', name: plain(t[`faq.q${i + 1}`]),
        acceptedAnswer: {'@type': 'Answer', text: plain(t[`faq.a${i + 1}`])},
      })),
    },
  ];
  return JSON.stringify({'@context': 'https://schema.org', '@graph': graph}, null, 1)
    .replace(/</g, '\\u003c');
}

// ---------- <head> ----------
function seoHead(lang) {
  const L = LANGS[lang], url = abs(L.path);
  const alt = Object.entries(LANGS).map(([l, x]) => `<link rel="alternate" hreflang="${l}" href="${abs(x.path)}" />`);
  const ogAlt = Object.entries(LANGS).filter(([l]) => l !== lang).map(([, x]) => `<meta property="og:locale:alternate" content="${x.locale}" />`);
  return `<!-- seo:start — блок генерирует scripts/build-seo.mjs, правки вносите там -->
<title>${esc(L.title)}</title>
<meta name="description" content="${esc(L.description)}" />
<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
<link rel="canonical" href="${url}" />
${alt.join('\n')}
<link rel="alternate" hreflang="x-default" href="${abs('/')}" />
<meta name="theme-color" content="#0B0B0D" />
<link rel="icon" href="/favicon.ico" sizes="48x48" />
<link rel="icon" href="/assets/icon.svg" type="image/svg+xml" />
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="INTERNO School" />
<meta property="og:url" content="${url}" />
<meta property="og:title" content="${esc(L.title)}" />
<meta property="og:description" content="${esc(L.description)}" />
<meta property="og:image" content="${OG_IMAGE.url}" />
<meta property="og:image:width" content="${OG_IMAGE.width}" />
<meta property="og:image:height" content="${OG_IMAGE.height}" />
<meta property="og:image:alt" content="${esc(L.courseName)}" />
<meta property="og:locale" content="${L.locale}" />
${ogAlt.join('\n')}
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${esc(L.title)}" />
<meta name="twitter:description" content="${esc(L.description)}" />
<meta name="twitter:image" content="${OG_IMAGE.url}" />
<script type="application/ld+json">
${jsonLd(lang)}
</script>
<!-- seo:end -->`;
}
const withHead = (html, lang) =>
  html.replace(/<!-- seo:start[\s\S]*?<!-- seo:end -->/, () => seoHead(lang));

// title/description для ?lang= (язык, отличный от языка URL, включается скриптом)
const META = Object.fromEntries(Object.entries(LANGS).map(([l, x]) => [l, {title: x.title, desc: x.description}]));
const withMeta = html => html.replace(/(\/\/ seo:meta[^\n]*\n\s*var META = )[^\n]*;/, (_, p) => `${p}${JSON.stringify(META)};`);

// ---------- страницы ----------
if (!/<!-- seo:start[\s\S]*?<!-- seo:end -->/.test(src) || !/\/\/ seo:meta/.test(src)) throw new Error('Нет маркеров seo:start/seo:end или seo:meta в index.html');
const ru = withMeta(withHead(src, 'ru'));
writeFileSync(srcPath, ru);

const CITY_UZ = {'Ташкент': 'Toshkent', 'Самарканд': 'Samarqand', 'Фергана': 'Farg‘ona'};
let uz = withHead(translateBody(ru, dict.uz), 'uz')
  .replace('<html lang="ru">', '<html lang="uz">')
  // статичные названия городов (в браузере их выставляет applyLang)
  .replace(/(<span class="city-name">)([^<]*)(<\/span>)/g, (m, a, c, b) => a + (CITY_UZ[c] || c) + b)
  .replace(/(<option value="(?:tsh|smr|frg)">)([^<]*)(<\/option>)/g, (m, a, c, b) => a + (CITY_UZ[c] || c) + b)
  // переключатель языка — активный UZ
  .replace('<a class="lang__btn is-active" href="/" hreflang="ru" lang="ru" data-lang="ru" aria-current="page">', '<a class="lang__btn" href="/" hreflang="ru" lang="ru" data-lang="ru">')
  .replace('<a class="lang__btn" href="/uz/" hreflang="uz" lang="uz" data-lang="uz">', '<a class="lang__btn is-active" href="/uz/" hreflang="uz" lang="uz" data-lang="uz" aria-current="page">')
  // относительные пути к файлам → от корня сайта (страница лежит в /uz/)
  .replace(/\s(src|href)="(?![a-z]+:|\/|#)([^"]+)"/g, ' $1="/$2"');
if (!uz.includes('class="lang__btn is-active" href="/uz/"')) throw new Error('Переключатель языка не найден');
uz = uz.replace('<!-- seo:start', '<!-- СГЕНЕРИРОВАНО scripts/build-seo.mjs из index.html — не редактируйте вручную -->\n<!-- seo:start');
mkdirSync(join(ROOT, 'uz'), {recursive: true});
writeFileSync(join(ROOT, 'uz/index.html'), uz);

// ---------- sitemap.xml ----------
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${Object.values(LANGS).map(L => `  <url>
    <loc>${abs(L.path)}</loc>
    <lastmod>${TODAY}</lastmod>
${Object.entries(LANGS).map(([l, x]) => `    <xhtml:link rel="alternate" hreflang="${l}" href="${abs(x.path)}"/>`).join('\n')}
    <xhtml:link rel="alternate" hreflang="x-default" href="${abs('/')}"/>
  </url>`).join('\n')}
</urlset>
`;
writeFileSync(join(ROOT, 'sitemap.xml'), sitemap);

// ---------- robots.txt ----------
// Поисковые и AI-краулеры пускаем явно: ответы ChatGPT, Claude, Perplexity, Gemini, Алисы
// строятся на том, что эти боты смогли прочитать.
const AI_BOTS = [
  'GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-User', 'Claude-SearchBot',
  'PerplexityBot', 'Perplexity-User', 'Google-Extended', 'Applebot-Extended', 'Applebot',
  'Bingbot', 'YandexBot', 'YandexAdditional', 'YandexAdditionalBot', 'DuckAssistBot',
  'meta-externalagent', 'Amazonbot', 'MistralAI-User', 'CCBot',
];
const robots = `# INTERNO School — курс «Архитектура» — ${SITE}
User-agent: *
Allow: /
Disallow: /api/

${AI_BOTS.map(b => `User-agent: ${b}`).join('\n')}
Allow: /
Disallow: /api/

# Яндекс: UTM, клик-ID и параметры лендинга (язык/город) не создают дублей страниц
Clean-param: utm_source&utm_medium&utm_campaign&utm_content&utm_term&fbclid&gclid&yclid&lang&city

Sitemap: ${SITE}/sitemap.xml
`;
writeFileSync(join(ROOT, 'robots.txt'), robots);

// ---------- llms.txt (https://llmstxt.org) ----------
function llmsBlock(lang) {
  const t = dict[lang], L = LANGS[lang], p = k => plain(t[k]);
  const ru = lang === 'ru';
  const h = ru
    ? {course: 'О курсе', lesson: 'Бесплатный открытый урок (60 минут)', mentor: 'Спикер и ментор', faq: 'Частые вопросы',
       addr: 'Адреса', contacts: 'Контакты', school: 'Школа и другие курсы'}
    : {course: 'Kurs haqida', lesson: 'Bepul ochiq dars (60 daqiqa)', mentor: 'Spiker va mentor', faq: "Ko‘p so‘raladigan savollar",
       addr: 'Manzillar', contacts: 'Aloqa', school: 'Maktab va boshqa kurslar'};
  const facts = ru
    ? ['Формат: офлайн; города: ' + L.cities.join(', '),
       'Длительность основного курса: 4 месяца, 2 раза в неделю по 2 часа, плюс практика на реальных объектах',
       'Чему учат: проектировать частные дома и интерьерные объекты; инструменты — Revit и Lumion',
       'Итог: проекты в портфолио и сертификат с QR-кодом, который проверяется на сайте школы',
       'Опыт не нужен: урок построен с нуля; диплом вуза не нужен, чтобы брать первые коммерческие заказы',
       'Рассрочка до 6 месяцев без переплат (условия школы INTERNO School)',
       'Языки обучения: русский и узбекский']
    : ['Format: oflayn; shaharlar: ' + L.cities.join(', '),
       'Asosiy kurs davomiyligi: 4 oy, haftada 2 marta, 2 soatdan, qo‘shimcha — real obyektlarda amaliyot',
       'Nimani o‘rgatadi: xususiy uylar va interyer obyektlarini loyihalash; vositalar — Revit va Lumion',
       'Natija: portfolio loyihalari va maktab saytida tekshiriladigan QR-kodli sertifikat',
       'Tajriba shart emas: dars noldan qurilgan; birinchi tijorat buyurtmalari uchun diplom shart emas',
       '6 oygacha ustama to‘lovsiz bo‘lib to‘lash (INTERNO School shartlari)',
       'O‘qitish tillari: rus va o‘zbek'];
  const lesson = [1, 2, 3, 4, 5].map(i => `- ${p(`t${i}.t`)}: ${p(`t${i}.d`)}`);
  lesson.push(`- ${p('gift.title')}: ${p('gift.t1')}; ${p('gift.t2')}; ${p('gift.t3')} (${p('gift.d3')})`);
  return [
    `## ${h.course}`, '', ...facts.map(x => `- ${x}`), '',
    `## ${h.lesson}`, '', `${p('hero.subtitle')}`, '', ...lesson, '',
    `## ${h.mentor}`, '', `- ${p('m.name')} — ${p('m.role')}`, ...['m.l1', 'm.l2', 'm.l3', 'm.l4'].map(k => `- ${p(k)}`), '',
    `## ${h.faq}`, '', ...Array.from({length: FAQ_COUNT}, (_, i) => `### ${p(`faq.q${i + 1}`)}\n\n${p(`faq.a${i + 1}`)}\n`),
    `## ${h.addr}`, '', ...CITY_KEYS.map(k => `- ${p(`ftr.addr.${k}`)}`), '',
    `## ${h.contacts}`, '', `- ${PHONE_HUMAN}`, ...SAME_AS.map(u => `- ${u}`), `- ${abs(L.path)}`, '',
    `## ${h.school}`, '', `- [${p('ftr.all')}](${t['ftr.allHref']})`,
    ...SIBLINGS.map(([k, href]) => `- [${p(`ftr.c.${k}`)}](${href})`), '',
  ].join('\n');
}
const llms = `# INTERNO School — курс «Архитектура»

> ${LANGS.ru.courseDescription}

> ${LANGS.uz.courseDescription}

- [Страница курса (русский)](${abs('/')})
- [Kurs sahifasi (o‘zbekcha)](${abs('/uz/')})
- [INTERNO School — все курсы](${SCHOOL}/)

${llmsBlock('ru')}
---

# INTERNO School — «Arxitektura» kursi (o‘zbekcha)

${llmsBlock('uz')}`;
writeFileSync(join(ROOT, 'llms.txt'), llms);

console.log(`Готово: index.html, uz/index.html, sitemap.xml, robots.txt, llms.txt (${TODAY})`);
