type ProviderId = 'claude' | 'gemini' | 'openai';

const PROVIDERS = {
  claude:  { model: 'claude-haiku-4-5-20251001', storageKey: 'anthropic_api_key' },
  gemini:  { model: 'gemini-3-flash-preview',    storageKey: 'google_api_key' },
  openai:  { model: 'gpt-4o-mini',               storageKey: 'openai_api_key' },
} as const;

const MAX_CHARS = 20;
const TAG_COUNT = 13;

function buildTagPrompt(title: string, description: string): string {
  return `You are a world-class Etsy SEO strategist. Generate exactly ${TAG_COUNT} optimized search tags.

LISTING:
Title: ${title}
${description ? `Description: ${description.slice(0, 400)}` : ''}

HARD RULES:
- Exactly ${TAG_COUNT} tags
- Each tag MUST be ${MAX_CHARS} characters or fewer INCLUDING spaces
- All lowercase
- No punctuation except hyphens

STRATEGY: cover what it IS, looks like, who it's FOR, occasion, function, synonyms, long-tail phrases.

Respond ONLY with valid JSON:
{"tags":["tag one","tag two","tag three","tag four","tag five","tag six","tag seven","tag eight","tag nine","tag ten","tag eleven","tag twelve","tag thirteen"]}`;
}

function extractTags(text: string): string[] {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return [];
  const parsed = JSON.parse(match[0]) as { tags: string[] };
  return parsed.tags
    .slice(0, TAG_COUNT)
    .map((t) => t.toLowerCase().trim())
    .filter((t) => t.length > 0 && t.length <= MAX_CHARS);
}

export function getActiveProvider(): ProviderId {
  return (localStorage.getItem('active_seo_provider') as ProviderId) ?? 'claude';
}

export function getApiKey(provider: ProviderId): string {
  return localStorage.getItem(PROVIDERS[provider].storageKey) ?? '';
}

export async function fetchAITags(
  title: string,
  description: string,
  provider: ProviderId,
  apiKey: string,
): Promise<string[]> {
  const { model } = PROVIDERS[provider];
  const prompt = buildTagPrompt(title, description);

  if (provider === 'claude') {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model,
        max_tokens: 512,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    if (!res.ok) throw new Error(`Claude API error ${res.status}`);
    const data = await res.json() as { content: { text: string }[] };
    return extractTags(data.content[0]?.text ?? '');
  }

  if (provider === 'gemini') {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    });
    if (!res.ok) throw new Error(`Gemini API error ${res.status}`);
    const data = await res.json() as { candidates: { content: { parts: { text: string }[] } }[] };
    return extractTags(data.candidates[0]?.content?.parts[0]?.text ?? '');
  }

  if (provider === 'openai') {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        max_tokens: 512,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    if (!res.ok) throw new Error(`OpenAI API error ${res.status}`);
    const data = await res.json() as { choices: { message: { content: string } }[] };
    return extractTags(data.choices[0]?.message?.content ?? '');
  }

  throw new Error(`Unknown provider: ${provider}`);
}
