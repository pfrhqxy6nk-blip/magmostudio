const sendJson = (res, status, data) => {
  res.statusCode = status;
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(data));
};

const readJsonBody = async (req) => {
  if (req?.body && typeof req.body === 'object') return req.body;
  if (typeof req?.body === 'string') return JSON.parse(req.body);

  const chunks = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  const raw = Buffer.concat(chunks).toString('utf8').trim();
  if (!raw) return {};
  return JSON.parse(raw);
};

const getBaseUrl = (req) => {
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  if (!host) return '';
  return `${proto}://${host}`;
};

const clampString = (value, maxLen) => {
  if (typeof value !== 'string') return '';
  const s = value.trim();
  return s.length > maxLen ? `${s.slice(0, maxLen - 1)}…` : s;
};

const escapeHtml = (value) =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');

const pickRecord = (payload) => {
  // Supabase DB webhooks vary by configuration/version. Support common shapes.
  if (payload && typeof payload === 'object') {
    if (payload.record && typeof payload.record === 'object') return payload.record;
    if (payload.new && typeof payload.new === 'object') return payload.new;
    if (payload.data && typeof payload.data === 'object') {
      if (payload.data.record && typeof payload.data.record === 'object') return payload.data.record;
      if (payload.data.new && typeof payload.data.new === 'object') return payload.data.new;
    }
  }
  return null;
};

const sendTelegramMessage = async ({ token, chatId, text }) => {
  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    }),
  });

  const bodyText = await resp.text();
  if (!resp.ok) {
    throw new Error(`Telegram API error ${resp.status}: ${bodyText.slice(0, 600)}`);
  }

  return bodyText;
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('allow', 'POST');
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  const hookSecret = process.env.SUPABASE_WEBHOOK_SECRET;
  if (hookSecret) {
    const got = req.headers['x-webhook-secret'];
    if (got !== hookSecret) {
      return sendJson(res, 401, { error: 'Unauthorized' });
    }
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token) return sendJson(res, 500, { error: 'Missing TELEGRAM_BOT_TOKEN' });
  if (!chatId) return sendJson(res, 500, { error: 'Missing TELEGRAM_CHAT_ID' });

  let payload;
  try {
    payload = await readJsonBody(req);
  } catch {
    return sendJson(res, 400, { error: 'Invalid JSON body' });
  }

  const record = pickRecord(payload) || {};

  const name = clampString(record.name || record.owner_name || '', 120);
  const email = clampString(record.email || record.owner_email || '', 160);
  const category = clampString(record.category || '', 80);
  const budget = clampString(record.budget || '', 80);
  const telegram = clampString(record.telegram || '', 80);
  const details = clampString(record.details || record.description || record.message || '', 900);
  const createdAt = clampString(record.created_at || payload?.created_at || '', 80);

  const baseUrl = getBaseUrl(req);
  const profileUrl = baseUrl ? `${baseUrl}/profile` : '';

  const lines = [
    `<b>Нова заявка</b>`,
    name ? `👤 ${escapeHtml(name)}` : null,
    email ? `✉️ ${escapeHtml(email)}` : null,
    telegram ? `💬 ${escapeHtml(telegram)}` : null,
    category ? `🧩 ${escapeHtml(category)}` : null,
    budget ? `💰 ${escapeHtml(budget)}` : null,
    createdAt ? `🕒 ${escapeHtml(createdAt)}` : null,
    details ? `\n<b>Деталі:</b>\n${escapeHtml(details)}` : null,
    profileUrl ? `\n<a href="${escapeHtml(profileUrl)}">Відкрити адмінку</a>` : null,
  ].filter(Boolean);

  try {
    await sendTelegramMessage({ token, chatId, text: lines.join('\n') });
  } catch (e) {
    return sendJson(res, 502, { error: 'Failed to send Telegram message', detail: String(e?.message || e) });
  }

  return sendJson(res, 200, { ok: true });
}

