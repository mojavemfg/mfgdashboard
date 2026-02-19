import { useState } from 'react';
import {
  Tag, Sparkles, Copy, Check, Link2, PenLine,
  Key, AlertCircle, RefreshCw, ChevronDown, ChevronUp, ExternalLink,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface TagResult {
  tag: string;
  charCount: number;
  valid: boolean;
}

interface AnalysisResult {
  tags: TagResult[];
  strategy: string;
}

type InputMode = 'url' | 'manual';
type Status = 'idle' | 'fetching' | 'analyzing' | 'done' | 'error';

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_CHARS = 20;
const TAG_COUNT = 13;
type ProviderId = 'claude' | 'gemini' | 'openai';

interface ProviderConfig {
  id: ProviderId;
  label: string;
  storageKey: string;
  model: string;
}

const PROVIDERS: ProviderConfig[] = [
  { id: 'claude',  label: 'Claude',  storageKey: 'anthropic_api_key', model: 'claude-haiku-4-5-20251001' },
  { id: 'gemini',  label: 'Gemini',  storageKey: 'google_api_key',    model: 'gemini-3-flash-preview' },
  { id: 'openai',  label: 'OpenAI',  storageKey: 'openai_api_key',    model: 'gpt-4o-mini' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildPrompt(title: string, description: string, category: string): string {
  return `You are a world-class Etsy SEO strategist. Generate exactly ${TAG_COUNT} optimized search tags for this Etsy listing.

LISTING:
Title: ${title}
${description ? `Description: ${description}` : ''}
${category ? `Category: ${category}` : ''}

HARD RULES:
- Exactly ${TAG_COUNT} tags
- Each tag MUST be ${MAX_CHARS} characters or fewer INCLUDING spaces (count carefully)
- All lowercase
- No punctuation except hyphens if needed

SEO STRATEGY — apply all dimensions:
1. What it IS: material, technique, finish (e.g. "sterling silver", "hand stamped")
2. What it LOOKS LIKE: style, aesthetic (e.g. "boho", "minimalist", "cottagecore")
3. Who it's FOR: recipient (e.g. "gift for her", "mom gift", "bridesmaid")
4. When it's given: occasion (e.g. "birthday gift", "anniversary")
5. How it's used: function or placement (e.g. "wall decor", "desk accessory")
6. Synonyms: alternative words buyers might type
7. Long-tail phrases (2-3 words) convert better than single words

Count EVERY character including spaces before including a tag. "personalized gift" = 17 chars ✓. "personalized jewelry" = 20 chars ✓. "custom personalized" = 19 chars ✓.

Respond ONLY with valid JSON, no other text:
{"tags":["tag one","tag two","tag three","tag four","tag five","tag six","tag seven","tag eight","tag nine","tag ten","tag eleven","tag twelve","tag thirteen"],"strategy":"One sentence describing the multi-angle tag strategy used."}`;
}

/** Extract listing ID and title slug directly from the URL — works 100% of the time */
function parseEtsyUrl(listingUrl: string): { listingId: string; title: string } | null {
  const match = listingUrl.match(/etsy\.com\/listing\/(\d+)\/([a-z0-9-]+)/i);
  if (!match) return null;
  const listingId = match[1];
  const title = match[2]
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
  return { listingId, title };
}

const PROXY_BUILDERS: ((url: string) => string)[] = [
  (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url) => `https://corsproxy.io/?url=${encodeURIComponent(url)}`,
  (url) => `https://thingproxy.freeboard.io/fetch/${url}`,
];

function extractMetaFromHtml(html: string): { title: string; description: string } | null {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const ogTitle = doc.querySelector('meta[property="og:title"]')?.getAttribute('content') ?? '';
  const ogDesc =
    doc.querySelector('meta[property="og:description"]')?.getAttribute('content') ??
    doc.querySelector('meta[name="description"]')?.getAttribute('content') ??
    '';
  const title = ogTitle.replace(/\s*[|–\-].*$/, '').trim();
  return title ? { title, description: ogDesc } : null;
}

/** Try each proxy in sequence; fall back to URL slug extraction if all fail */
async function fetchListingMeta(
  listingUrl: string,
): Promise<{ title: string; description: string; source: 'proxy' | 'slug' }> {
  for (const buildProxy of PROXY_BUILDERS) {
    try {
      const res = await fetch(buildProxy(listingUrl), { signal: AbortSignal.timeout(8000) });
      if (!res.ok) continue;
      const html = await res.text();
      const meta = extractMetaFromHtml(html);
      if (meta) return { ...meta, source: 'proxy' };
    } catch {
      // try next proxy
    }
  }

  // All proxies failed — extract title from the URL slug itself
  const parsed = parseEtsyUrl(listingUrl);
  if (parsed) return { title: parsed.title, description: '', source: 'slug' };

  throw new Error('Could not parse listing URL. Make sure it\'s a full etsy.com/listing/... link.');
}

async function callClaude(
  title: string,
  description: string,
  category: string,
  apiKey: string,
): Promise<AnalysisResult> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: PROVIDERS[0].model,
      max_tokens: 1024,
      messages: [{ role: 'user', content: buildPrompt(title, description, category) }],
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: { message?: string } };
    throw new Error(err.error?.message ?? `Claude API error ${res.status}`);
  }

  const data = await res.json() as { content: { text: string }[] };
  const text = data.content[0]?.text ?? '';

  // Extract JSON even if Claude wraps it in markdown
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Could not parse response from Claude.');

  const parsed = JSON.parse(jsonMatch[0]) as { tags: string[]; strategy: string };

  const tags: TagResult[] = parsed.tags.slice(0, TAG_COUNT).map((t: string) => {
    const tag = t.toLowerCase().trim();
    return { tag, charCount: tag.length, valid: tag.length <= MAX_CHARS };
  });

  return { tags, strategy: parsed.strategy ?? '' };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function CharBar({ count }: { count: number }) {
  const pct = Math.min(100, (count / MAX_CHARS) * 100);
  const color = count > MAX_CHARS ? 'bg-red-500' : count >= 17 ? 'bg-yellow-500' : 'bg-emerald-500';
  return (
    <div className="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mt-1.5">
      <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function TagCard({ result, index, onCopy, copied }: {
  result: TagResult;
  index: number;
  onCopy: (i: number) => void;
  copied: boolean;
}) {
  const borderColor = result.valid
    ? result.charCount >= 17
      ? 'border-yellow-300 dark:border-yellow-600/50'
      : 'border-emerald-300 dark:border-emerald-700/50'
    : 'border-red-300 dark:border-red-600/50';

  const bg = result.valid
    ? 'bg-white dark:bg-slate-800/60'
    : 'bg-red-50 dark:bg-red-950/20';

  return (
    <div className={`rounded-xl border ${borderColor} ${bg} p-3 flex flex-col gap-1.5 group shadow-sm dark:shadow-none`}>
      <div className="flex items-start justify-between gap-2">
        <span className="text-slate-800 dark:text-slate-100 text-sm font-medium leading-snug break-words flex-1">
          {result.tag}
        </span>
        <button
          onClick={() => onCopy(index)}
          className="shrink-0 p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer border-none bg-transparent"
          aria-label="Copy tag"
        >
          {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
        </button>
      </div>
      <div className="flex items-center justify-between">
        <span className={`text-[10px] font-mono ${result.charCount > MAX_CHARS ? 'text-red-500' : 'text-slate-400'}`}>
          {result.charCount}/{MAX_CHARS}
        </span>
        {!result.valid && (
          <span className="text-[9px] text-red-500 font-semibold">TOO LONG</span>
        )}
      </div>
      <CharBar count={result.charCount} />
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function EtsySeoTool() {
  const [mode, setMode] = useState<InputMode>('url');
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('anthropic_api_key') ?? '');
  const [keyDraft, setKeyDraft] = useState('');
  const [showKeyPanel, setShowKeyPanel] = useState(false);
  const [status, setStatus] = useState<Status>('idle');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [fetchNote, setFetchNote] = useState('');
  const [error, setError] = useState('');
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  const hasKey = apiKey.trim().length > 0;
  const canAnalyze =
    hasKey &&
    status !== 'fetching' &&
    status !== 'analyzing' &&
    (mode === 'url' ? url.trim().length > 0 : title.trim().length > 0);

  function saveKey() {
    const k = keyDraft.trim();
    if (!k) return;
    localStorage.setItem('anthropic_api_key', k);
    setApiKey(k);
    setKeyDraft('');
    setShowKeyPanel(false);
  }

  function clearKey() {
    localStorage.removeItem('anthropic_api_key');
    setApiKey('');
    setKeyDraft('');
  }

  async function copyTag(idx: number) {
    await navigator.clipboard.writeText(result!.tags[idx].tag);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1500);
  }

  async function copyAll() {
    if (!result) return;
    const text = result.tags.map((t) => t.tag).join(', ');
    await navigator.clipboard.writeText(text);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  }

  async function analyze() {
    if (!canAnalyze) return;
    setError('');
    setResult(null);
    setFetchNote('');

    try {
      let listingTitle = title;
      let listingDesc = description;

      if (mode === 'url') {
        if (!url.includes('etsy.com')) {
          throw new Error('Please enter a valid Etsy listing URL (etsy.com/listing/...)');
        }
        setStatus('fetching');
        const meta = await fetchListingMeta(url);
        listingTitle = meta.title;
        listingDesc = meta.description;
        // Pre-fill manual fields so user can see / edit what we found
        setTitle(meta.title);
        setDescription(meta.description);
        if (meta.source === 'slug') {
          setFetchNote('Etsy blocked direct fetch — title extracted from URL. For richer tags, switch to Manual Entry and paste your full description.');
        }
      }

      if (!listingTitle.trim()) throw new Error('Could not find a listing title. Try Manual Entry mode.');

      setStatus('analyzing');
      const analysisResult = await callClaude(listingTitle, listingDesc, category, apiKey);
      setResult(analysisResult);
      setStatus('done');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
      setStatus('error');
    }
  }

  const isLoading = status === 'fetching' || status === 'analyzing';
  const validCount = result?.tags.filter((t) => t.valid).length ?? 0;

  const inputCls =
    'w-full bg-white dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700/60 text-slate-900 dark:text-slate-200 text-sm rounded-xl px-3.5 py-2.5 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-blue-500 dark:focus:border-blue-500/60 transition-colors';

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-orange-500/15 dark:bg-orange-500/20 p-2.5 rounded-xl">
          <Tag className="text-orange-600 dark:text-orange-400" size={22} />
        </div>
        <div>
          <h1 className="text-slate-900 dark:text-white text-xl font-bold leading-tight">Etsy SEO Tag Generator</h1>
          <p className="text-slate-500 text-sm mt-0.5">AI-powered tag optimization · 13 tags · 20 char limit</p>
        </div>
      </div>

      {/* API Key Panel */}
      <div className="mb-4 bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-sm dark:shadow-none overflow-hidden">
        <button
          onClick={() => setShowKeyPanel((p) => !p)}
          className="w-full flex items-center justify-between px-4 py-3 cursor-pointer border-none bg-transparent text-left"
        >
          <div className="flex items-center gap-2.5">
            <Key size={15} className={hasKey ? 'text-emerald-500' : 'text-slate-400'} />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {hasKey ? 'Claude API Key connected' : 'Connect Claude API Key'}
            </span>
            {hasKey && (
              <span className="text-[10px] bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-600/30 px-2 py-0.5 rounded-full font-medium">
                ACTIVE
              </span>
            )}
          </div>
          {showKeyPanel ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
        </button>

        {showKeyPanel && (
          <div className="px-4 pb-4 border-t border-slate-100 dark:border-slate-700/40 pt-3 space-y-3">
            <p className="text-slate-500 text-xs leading-relaxed">
              Your API key is stored locally in your browser and never sent anywhere except Anthropic's API.
              Get one at{' '}
              <a href="https://console.anthropic.com" target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-0.5">
                console.anthropic.com <ExternalLink size={10} />
              </a>
            </p>
            <div className="flex gap-2">
              <input
                type="password"
                placeholder="sk-ant-..."
                value={keyDraft}
                onChange={(e) => setKeyDraft(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && saveKey()}
                className={`flex-1 ${inputCls}`}
              />
              <button
                onClick={saveKey}
                disabled={!keyDraft.trim()}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-sm font-medium rounded-xl transition-colors cursor-pointer border-none shrink-0"
              >
                Save
              </button>
            </div>
            {hasKey && (
              <button onClick={clearKey} className="text-xs text-red-500 hover:text-red-600 cursor-pointer border-none bg-transparent p-0 transition-colors">
                Remove saved key
              </button>
            )}
          </div>
        )}
      </div>

      {/* Input Card */}
      <div className="bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-sm dark:shadow-none p-4 sm:p-5 mb-4">
        {/* Mode Tabs */}
        <div className="flex gap-1 bg-slate-100 dark:bg-slate-900/50 rounded-xl p-1 mb-4">
          {([['url', Link2, 'From URL'], ['manual', PenLine, 'Manual Entry']] as const).map(([m, Icon, label]) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-all cursor-pointer border-none ${
                mode === m
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 bg-transparent'
              }`}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>

        {mode === 'url' ? (
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Etsy Listing URL
            </label>
            <input
              type="url"
              placeholder="https://www.etsy.com/listing/1234567890/product-name"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className={inputCls}
            />
            <p className="text-slate-400 text-xs">
              We'll auto-fetch the listing title and description, then Claude will generate tags.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Listing Title <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                placeholder="Handmade sterling silver minimalist ring…"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Description <span className="text-slate-400 font-normal">(optional but improves quality)</span>
              </label>
              <textarea
                rows={4}
                placeholder="Paste your listing description here…"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={`${inputCls} resize-none`}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Category <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Jewelry, Home Decor, Clothing…"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={inputCls}
              />
            </div>
          </div>
        )}

        {/* Analyze Button */}
        <button
          onClick={analyze}
          disabled={!canAnalyze || isLoading}
          className="mt-4 w-full flex items-center justify-center gap-2.5 py-3 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors cursor-pointer border-none text-sm shadow-sm"
        >
          {isLoading ? (
            <>
              <RefreshCw size={16} className="animate-spin" />
              {status === 'fetching' ? 'Reading listing…' : 'Generating tags with Claude…'}
            </>
          ) : (
            <>
              <Sparkles size={16} />
              {result ? 'Regenerate Tags' : 'Generate SEO Tags'}
            </>
          )}
        </button>

        {!hasKey && (
          <p className="mt-2.5 text-center text-xs text-slate-400">
            Add your Claude API key above to get started.
          </p>
        )}
      </div>

      {/* Fetch fallback note */}
      {fetchNote && status !== 'error' && (
        <div className="mb-4 flex items-start gap-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-700/50 rounded-xl px-4 py-3">
          <AlertCircle size={15} className="text-amber-500 shrink-0 mt-0.5" />
          <p className="text-amber-700 dark:text-amber-400 text-xs leading-relaxed">{fetchNote}</p>
        </div>
      )}

      {/* Error */}
      {status === 'error' && error && (
        <div className="mb-4 flex items-start gap-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/50 rounded-xl px-4 py-3.5">
          <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-red-700 dark:text-red-400 text-sm font-medium">Analysis failed</p>
            <p className="text-red-600 dark:text-red-500 text-xs mt-0.5">{error}</p>
            {error.includes('fetch') || error.includes('Proxy') ? (
              <p className="text-slate-500 text-xs mt-1">
                Tip: Switch to <strong>Manual Entry</strong> mode and paste the listing details directly.
              </p>
            ) : null}
          </div>
        </div>
      )}

      {/* Results */}
      {result && status === 'done' && (
        <div className="space-y-4">
          {/* Stats row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-slate-700 dark:text-slate-300 text-sm font-semibold">
                {result.tags.length} tags generated
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${
                validCount === TAG_COUNT
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-600/40'
                  : 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-500/15 dark:text-yellow-400 dark:border-yellow-600/40'
              }`}>
                {validCount}/{TAG_COUNT} valid
              </span>
            </div>
            <button
              onClick={copyAll}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium rounded-lg transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
            >
              {copiedAll ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
              {copiedAll ? 'Copied!' : 'Copy all tags'}
            </button>
          </div>

          {/* Tag grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
            {result.tags.map((tag, i) => (
              <TagCard
                key={i}
                result={tag}
                index={i}
                onCopy={copyTag}
                copied={copiedIdx === i}
              />
            ))}
          </div>

          {/* Strategy note */}
          {result.strategy && (
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/40 rounded-xl px-4 py-3 flex items-start gap-2.5">
              <Sparkles size={14} className="text-blue-500 shrink-0 mt-0.5" />
              <p className="text-blue-700 dark:text-blue-300 text-xs leading-relaxed">
                <span className="font-semibold">Strategy: </span>{result.strategy}
              </p>
            </div>
          )}

          {/* Color legend */}
          <div className="flex items-center gap-4 pt-1">
            {[
              ['bg-emerald-500', '≤16 chars'],
              ['bg-yellow-500', '17–20 chars'],
              ['bg-red-500', '>20 chars'],
            ].map(([color, label]) => (
              <span key={label} className="flex items-center gap-1.5 text-[10px] text-slate-400">
                <span className={`w-2 h-2 rounded-full ${color} inline-block`} />
                {label}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
