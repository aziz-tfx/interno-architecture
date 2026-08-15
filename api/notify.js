// Vercel Serverless Function — forwards lead data to a Telegram chat.
// Required env vars (set in Vercel project settings):
//   TG_BOT_TOKEN  — Bot token from @BotFather (e.g. 123456:ABC-...)
//   TG_CHAT_ID    — Target chat ID (user, group, or channel). For groups,
//                   include the leading minus sign (e.g. -1001234567890).
//
// Optional:
//   TG_TOPIC_ID   — Thread/topic ID for forum-style groups.
//
// The client posts JSON:
//   { name, phone, course, city, lang, source, url, referrer, utm }
// We never echo the bot token back. CORS is permissive (same Vercel project).

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST')    return res.status(405).json({ error: 'method_not_allowed' });

  const token = process.env.TG_BOT_TOKEN;
  const chatId = process.env.TG_CHAT_ID;
  const topicId = process.env.TG_TOPIC_ID;
  if (!token || !chatId) {
    console.error('TG env missing');
    return res.status(500).json({ error: 'tg_not_configured' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  body = body || {};

  const esc = s => String(s ?? '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

  const cityFlag = { 'Ташкент':'🟢', 'Самарканд':'🔵', 'Фергана':'🟣' }[body.city] || '⚪';
  const lines = [
    `🔔 <b>Новая заявка · Архитектура</b>`,
    ``,
    `👤 <b>Имя:</b> ${esc(body.name) || '—'}`,
    `📞 <b>Телефон:</b> ${esc(body.phone) || '—'}`,
    `🎓 <b>Курс:</b> ${esc(body.course) || 'Архитектура'}`,
    `${cityFlag} <b>Город:</b> ${esc(body.city) || '—'}`,
    `🗣 <b>Язык:</b> ${esc(body.lang) || '—'}`,
    `📍 <b>Источник:</b> ${esc(body.source) || 'form'}`,
  ];
  if (body.utm && Object.keys(body.utm).length) {
    const utmStr = Object.entries(body.utm)
      .map(([k,v]) => `${k}=${esc(v)}`).join(' · ');
    lines.push(`🎯 <b>UTM:</b> <code>${utmStr}</code>`);
  }
  if (body.referrer) lines.push(`🔗 <b>Referrer:</b> ${esc(body.referrer)}`);
  if (body.url)      lines.push(`🌐 ${esc(body.url)}`);

  const text = lines.join('\n');
  const payload = {
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
    disable_web_page_preview: true,
  };
  if (topicId) payload.message_thread_id = Number(topicId);

  try {
    const tgRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await tgRes.json();
    if (!data.ok) {
      console.error('TG error', data);
      return res.status(502).json({ error: 'tg_failed', description: data.description });
    }
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('TG exception', err);
    return res.status(502).json({ error: 'tg_exception' });
  }
}
