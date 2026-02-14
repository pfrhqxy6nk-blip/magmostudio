const DEFAULT_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini-2024-07-18';

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

const clampString = (value, maxLen) => {
  if (typeof value !== 'string') return '';
  const s = value.trim();
  return s.length > maxLen ? s.slice(0, maxLen) : s;
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('allow', 'POST');
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return sendJson(res, 500, { error: 'Missing server env OPENAI_API_KEY' });

  let body;
  try {
    body = await readJsonBody(req);
  } catch {
    return sendJson(res, 400, { error: 'Invalid JSON body' });
  }

  const category = clampString(body?.category, 80);
  const budget = clampString(body?.budget, 40);
  const details = clampString(body?.details, 2500);

  if (!category) return sendJson(res, 400, { error: 'Missing category' });
  if (!details) return sendJson(res, 400, { error: 'Missing details' });

  const schema = {
    name: 'ua_website_cost_estimate',
    strict: true,
    schema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        recommended_package: { type: 'string', enum: ['START', 'GROW', 'SCALE', 'CUSTOM'] },
        package_base_uah: { type: 'number', minimum: 0 },
        estimated_total_uah: { type: 'number', minimum: 0 },
        range_uah: {
          type: 'object',
          additionalProperties: false,
          properties: {
            min: { type: 'number', minimum: 0 },
            max: { type: 'number', minimum: 0 },
          },
          required: ['min', 'max'],
        },
        timeline_days: {
          type: 'object',
          additionalProperties: false,
          properties: {
            min: { type: 'number', minimum: 1 },
            max: { type: 'number', minimum: 1 },
          },
          required: ['min', 'max'],
        },
        included: { type: 'array', items: { type: 'string' }, maxItems: 16 },
        additional_costs: {
          type: 'array',
          maxItems: 12,
          items: {
            type: 'object',
            additionalProperties: false,
            properties: {
              item: { type: 'string', minLength: 1 },
              uah: { type: 'number', minimum: 0 },
              notes: { type: 'string' },
            },
            required: ['item', 'uah', 'notes'],
          },
        },
        why_this_package: { type: 'string' },
        assumptions: { type: 'array', items: { type: 'string' }, maxItems: 10 },
        questions: { type: 'array', items: { type: 'string' }, maxItems: 5 },
        confidence: { type: 'number', minimum: 0, maximum: 1 },
      },
      required: [
        'recommended_package',
        'package_base_uah',
        'estimated_total_uah',
        'range_uah',
        'timeline_days',
        'included',
        'additional_costs',
        'why_this_package',
        'assumptions',
        'questions',
        'confidence',
      ],
    },
  };

  const system = [
    'Ти — AI-консультант платформи швидкого запуску сайтів для українського ринку.',
    'Твоя задача — зрозуміло, прозоро і без складних термінів визначити орієнтовну вартість сайту на основі потреб клієнта.',
    'Ти працюєш строго в межах цієї моделі цін. Не знижуй ціни. Не використовуй слова "дешево". Не тисни на клієнта.',
    '',
    '========================================',
    'БАЗОВІ ПАКЕТИ',
    '========================================',
    '1) START — 9 000 грн',
    'Термін: 5–7 днів',
    'Включає: 1–3 сторінки, адаптив, підключення домену, підключення хостингу, форма заявки, базова SEO-настройка, підключення аналітики, 1 раунд правок.',
    '',
    '2) GROW — 19 000 грн',
    'Термін: 10–14 днів',
    'Включає: до 10 сторінок, індивідуалізація дизайну, прототип перед стартом, інтеграції (CRM, аналітика), структура під рекламу, 2 раунди правок.',
    '',
    '3) SCALE — 35 000 грн',
    'Термін: 14–21 день',
    'Включає: інтернет-магазин, до 100 товарів, онлайн-оплати, налаштування доставки, каталог + фільтри, CRM інтеграція, аналітика e-commerce, 2 раунди правок.',
    '',
    '========================================',
    'ДОДАТКОВІ ВИТРАТИ (ПРОЗОРО)',
    '========================================',
    '- Додаткова сторінка понад ліміт: +1 000 грн',
    '- Понад 100 товарів: індивідуальний розрахунок',
    '- Копірайтинг: оплачується окремо',
    '- Логотип / брендинг: окремо',
    '- Терміновість (швидше мінімального строку): +20%',
    '',
    '========================================',
    'АЛГОРИТМ',
    '========================================',
    '1) Якщо інформації мало — задай до 5 простих уточнюючих питань (поверни їх у полі questions).',
    '2) Визнач пакет:',
    '- До 3 сторінок без складних функцій → START',
    '- Більше сторінок або інтеграції → GROW',
    '- Продаж товарів / онлайн-оплати → SCALE',
    '3) Додай додаткові витрати (additional_costs) тільки коли вони логічно випливають з опису. Якщо даних бракує — не вигадуй, краще постав питання.',
    '4) Розрахуй фінальну орієнтовну суму: base + додаткові опції + терміновість (якщо є).',
    '5) Завжди поясни, що входить та чому обрано пакет (included + why_this_package).',
    '',
    'Відповідь: поверни ТІЛЬКИ JSON за схемою.',
  ].join('\n');

  const user = [
    `Category: ${category}`,
    budget ? `Budget hint: ${budget}` : 'Budget hint: (not provided)',
    'Details (verbatim):',
    details,
  ].join('\n');

  const payload = {
    model: DEFAULT_MODEL,
    temperature: 0.2,
    max_tokens: 700,
    response_format: {
      type: 'json_schema',
      json_schema: schema,
    },
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
  };

  let upstream;
  try {
    upstream = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${apiKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  } catch (e) {
    return sendJson(res, 502, { error: 'Failed to reach OpenAI API', detail: String(e?.message || e) });
  }

  const text = await upstream.text();
  if (!upstream.ok) {
    return sendJson(res, 502, { error: 'OpenAI API error', status: upstream.status, body: text.slice(0, 2000) });
  }

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    return sendJson(res, 502, { error: 'Bad JSON from OpenAI', body: text.slice(0, 2000) });
  }

  const content = data?.choices?.[0]?.message?.content;
  if (!content) return sendJson(res, 502, { error: 'Empty model response', raw: data });

  let estimate;
  try {
    estimate = JSON.parse(content);
  } catch {
    // If the model returned a stringified JSON with extra whitespace/newlines, try to recover.
    try {
      estimate = JSON.parse(String(content).trim());
    } catch {
      return sendJson(res, 502, { error: 'Failed to parse model JSON', content: String(content).slice(0, 2000) });
    }
  }

  return sendJson(res, 200, { estimate });
}
