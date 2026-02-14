const DEFAULT_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini-2024-07-18';

const json = (data, init = {}) =>
  new Response(JSON.stringify(data), {
    ...init,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      ...(init.headers || {}),
    },
  });

const clampString = (value, maxLen) => {
  if (typeof value !== 'string') return '';
  const s = value.trim();
  return s.length > maxLen ? s.slice(0, maxLen) : s;
};

export async function POST(request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return json({ error: 'Missing server env OPENAI_API_KEY' }, { status: 500 });

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const category = clampString(body?.category, 80);
  const budget = clampString(body?.budget, 40);
  const details = clampString(body?.details, 2500);

  if (!category) return json({ error: 'Missing category' }, { status: 400 });
  if (!details) return json({ error: 'Missing details' }, { status: 400 });

  const schema = {
    name: 'website_cost_estimate',
    strict: true,
    schema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        estimated_total_usd: { type: 'number', minimum: 0 },
        range_usd: {
          type: 'object',
          additionalProperties: false,
          properties: {
            min: { type: 'number', minimum: 0 },
            max: { type: 'number', minimum: 0 },
          },
          required: ['min', 'max'],
        },
        timeline_days: { type: 'number', minimum: 1 },
        breakdown: {
          type: 'array',
          items: {
            type: 'object',
            additionalProperties: false,
            properties: {
              item: { type: 'string', minLength: 1 },
              usd: { type: 'number', minimum: 0 },
              notes: { type: 'string' },
            },
            required: ['item', 'usd', 'notes'],
          },
        },
        assumptions: { type: 'array', items: { type: 'string' } },
        questions: { type: 'array', items: { type: 'string' } },
        confidence: { type: 'number', minimum: 0, maximum: 1 },
      },
      required: [
        'estimated_total_usd',
        'range_usd',
        'timeline_days',
        'breakdown',
        'assumptions',
        'questions',
        'confidence',
      ],
    },
  };

  const system = [
    'You are a senior web studio PM.',
    'Goal: produce an approximate cost estimate in USD for a client request.',
    'Return ONLY JSON that matches the provided schema.',
    'Use these reference packages as anchors (but adjust based on scope):',
    '- Start: $300 (1 page, responsive, form, basic SEO).',
    '- Business: $600 (up to 5 pages, integrations, UX).',
    '- Pro: $900 (up to 10 pages, more logic, priority).',
    'If the request is a SaaS/Web App, costs are typically higher than simple landing pages.',
    'Be conservative: give a realistic range and list assumptions/questions.',
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
    return json({ error: 'Failed to reach OpenAI API', detail: String(e?.message || e) }, { status: 502 });
  }

  const text = await upstream.text();
  if (!upstream.ok) {
    return json({ error: 'OpenAI API error', status: upstream.status, body: text.slice(0, 2000) }, { status: 502 });
  }

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    return json({ error: 'Bad JSON from OpenAI', body: text.slice(0, 2000) }, { status: 502 });
  }

  const content = data?.choices?.[0]?.message?.content;
  if (!content) return json({ error: 'Empty model response', raw: data }, { status: 502 });

  let estimate;
  try {
    estimate = JSON.parse(content);
  } catch {
    // If the model returned a stringified JSON with extra whitespace/newlines, try to recover.
    try {
      estimate = JSON.parse(String(content).trim());
    } catch {
      return json({ error: 'Failed to parse model JSON', content: String(content).slice(0, 2000) }, { status: 502 });
    }
  }

  return json({ estimate });
}

