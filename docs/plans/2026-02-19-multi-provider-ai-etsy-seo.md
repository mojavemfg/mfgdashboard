# Multi-Provider AI Support — Etsy SEO Tag Generator

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the Claude-only AI backend with a 3-provider selector (Claude, Gemini, OpenAI), each with independently saved API keys and curated default models.

**Architecture:** All changes are contained in `src/components/seo/EtsySeoTool.tsx`. A typed `PROVIDERS` config array drives the UI and API routing. A `callAI()` dispatcher replaces the existing `callClaude()` call in `analyze()`. Provider tabs inside the existing collapsible key panel handle both key management and active-provider selection.

**Tech Stack:** React 19, TypeScript, Tailwind CSS v4, Vite. No new dependencies. All three AI APIs support direct browser CORS calls.

**Verification:** No test framework present. Verify with `npm run build` (TypeScript + Vite) and `npm run lint` after each task. Final verification is manual browser testing.

---

## Provider Config Reference

| Provider | Model | localStorage key | API endpoint |
|---|---|---|---|
| Claude | `claude-haiku-4-5-20251001` | `anthropic_api_key` | `https://api.anthropic.com/v1/messages` |
| Gemini | `gemini-3-flash-preview` | `google_api_key` | `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key={KEY}` |
| OpenAI | `gpt-4o-mini` | `openai_api_key` | `https://api.openai.com/v1/chat/completions` |

---

### Task 1: Add Provider Config and Types

**Files:**
- Modify: `src/components/seo/EtsySeoTool.tsx` (Constants section, lines ~23–27)

**Step 1: Add `ProviderId` type and `PROVIDERS` config below the existing constants**

Replace the existing `const MODEL = 'claude-haiku-4-5-20251001';` line with:

```typescript
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
```

**Step 2: Verify TypeScript compiles**

Run: `npm run build`
Expected: Build succeeds (no TypeScript errors)

**Step 3: Commit**

```bash
git add src/components/seo/EtsySeoTool.tsx
git commit -m "feat(seo): add multi-provider config types and constants"
```

---

### Task 2: Add Multi-Provider State

**Files:**
- Modify: `src/components/seo/EtsySeoTool.tsx` (EtsySeoTool component state section, lines ~212–228)

**Step 1: Replace single-key state with per-provider key state**

In the `EtsySeoTool` component, replace:
```typescript
const [apiKey, setApiKey] = useState(() => localStorage.getItem('anthropic_api_key') ?? '');
const [keyDraft, setKeyDraft] = useState('');
const [showKeyPanel, setShowKeyPanel] = useState(false);
```

With:
```typescript
const [activeProvider, setActiveProvider] = useState<ProviderId>(
  () => (localStorage.getItem('active_seo_provider') as ProviderId) ?? 'claude'
);
const [keys, setKeys] = useState<Record<ProviderId, string>>(() => ({
  claude: localStorage.getItem('anthropic_api_key') ?? '',
  gemini: localStorage.getItem('google_api_key') ?? '',
  openai: localStorage.getItem('openai_api_key') ?? '',
}));
const [keyDraft, setKeyDraft] = useState('');
const [showKeyPanel, setShowKeyPanel] = useState(false);
```

**Step 2: Update derived values and key management functions**

Replace:
```typescript
const hasKey = apiKey.trim().length > 0;
```
With:
```typescript
const hasKey = keys[activeProvider].trim().length > 0;
```

Replace the `saveKey()` function:
```typescript
function saveKey() {
  const k = keyDraft.trim();
  if (!k) return;
  const provider = PROVIDERS.find((p) => p.id === activeProvider)!;
  localStorage.setItem(provider.storageKey, k);
  setKeys((prev) => ({ ...prev, [activeProvider]: k }));
  setKeyDraft('');
  setShowKeyPanel(false);
}
```

Replace the `clearKey()` function:
```typescript
function clearKey() {
  const provider = PROVIDERS.find((p) => p.id === activeProvider)!;
  localStorage.removeItem(provider.storageKey);
  setKeys((prev) => ({ ...prev, [activeProvider]: '' }));
  setKeyDraft('');
}
```

Add a `switchProvider()` helper after `clearKey`:
```typescript
function switchProvider(id: ProviderId) {
  setActiveProvider(id);
  localStorage.setItem('active_seo_provider', id);
  setKeyDraft('');
}
```

**Step 3: Update `canAnalyze` to use new `hasKey`**

The `canAnalyze` expression already uses `hasKey`, so no change needed there.

**Step 4: Verify TypeScript compiles**

Run: `npm run build`
Expected: Build succeeds

**Step 5: Commit**

```bash
git add src/components/seo/EtsySeoTool.tsx
git commit -m "feat(seo): add per-provider key state with localStorage persistence"
```

---

### Task 3: Implement Gemini and OpenAI API Callers

**Files:**
- Modify: `src/components/seo/EtsySeoTool.tsx` (API Helpers section, after `callClaude()`, ~line 112)

**Step 1: Add `callGemini()` after the existing `callClaude()` function**

```typescript
async function callGemini(
  title: string,
  description: string,
  category: string,
  apiKey: string,
): Promise<AnalysisResult> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: buildPrompt(title, description, category) }] }],
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: { message?: string } };
    throw new Error(err.error?.message ?? `Gemini API error ${res.status}`);
  }

  const data = await res.json() as { candidates: { content: { parts: { text: string }[] } }[] };
  const text = data.candidates[0]?.content?.parts[0]?.text ?? '';

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Could not parse response from Gemini.');

  const parsed = JSON.parse(jsonMatch[0]) as { tags: string[]; strategy: string };
  const tags: TagResult[] = parsed.tags.slice(0, TAG_COUNT).map((t: string) => {
    const tag = t.toLowerCase().trim();
    return { tag, charCount: tag.length, valid: tag.length <= MAX_CHARS };
  });
  return { tags, strategy: parsed.strategy ?? '' };
}
```

**Step 2: Add `callOpenAI()` after `callGemini()`**

```typescript
async function callOpenAI(
  title: string,
  description: string,
  category: string,
  apiKey: string,
): Promise<AnalysisResult> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      max_tokens: 1024,
      messages: [{ role: 'user', content: buildPrompt(title, description, category) }],
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: { message?: string } };
    throw new Error(err.error?.message ?? `OpenAI API error ${res.status}`);
  }

  const data = await res.json() as { choices: { message: { content: string } }[] };
  const text = data.choices[0]?.message?.content ?? '';

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Could not parse response from OpenAI.');

  const parsed = JSON.parse(jsonMatch[0]) as { tags: string[]; strategy: string };
  const tags: TagResult[] = parsed.tags.slice(0, TAG_COUNT).map((t: string) => {
    const tag = t.toLowerCase().trim();
    return { tag, charCount: tag.length, valid: tag.length <= MAX_CHARS };
  });
  return { tags, strategy: parsed.strategy ?? '' };
}
```

**Step 3: Add `callAI()` dispatcher after `callOpenAI()`**

```typescript
async function callAI(
  title: string,
  description: string,
  category: string,
  provider: ProviderId,
  apiKey: string,
): Promise<AnalysisResult> {
  if (provider === 'gemini') return callGemini(title, description, category, apiKey);
  if (provider === 'openai') return callOpenAI(title, description, category, apiKey);
  return callClaude(title, description, category, apiKey);
}
```

**Step 4: Verify TypeScript compiles**

Run: `npm run build`
Expected: Build succeeds

**Step 5: Commit**

```bash
git add src/components/seo/EtsySeoTool.tsx
git commit -m "feat(seo): add Gemini and OpenAI API callers with dispatcher"
```

---

### Task 4: Update Key Panel UI with Provider Tabs

**Files:**
- Modify: `src/components/seo/EtsySeoTool.tsx` (Key Panel JSX, lines ~322–374)

**Step 1: Replace the Key Panel JSX**

Replace the entire `{/* API Key Panel */}` block with:

```tsx
{/* API Key Panel */}
<div className="mb-4 bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-sm dark:shadow-none overflow-hidden">
  <button
    onClick={() => setShowKeyPanel((p) => !p)}
    className="w-full flex items-center justify-between px-4 py-3 cursor-pointer border-none bg-transparent text-left"
  >
    <div className="flex items-center gap-2.5">
      <Key size={15} className={hasKey ? 'text-emerald-500' : 'text-slate-400'} />
      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
        {hasKey
          ? `${PROVIDERS.find((p) => p.id === activeProvider)!.label} API Key connected`
          : 'Connect AI API Key'}
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
    <div className="border-t border-slate-100 dark:border-slate-700/40">
      {/* Provider tabs */}
      <div className="flex gap-1 p-3 pb-0">
        {PROVIDERS.map((p) => (
          <button
            key={p.id}
            onClick={() => switchProvider(p.id)}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer border-none ${
              activeProvider === p.id
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 dark:bg-slate-900/50 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            {p.label}
            {keys[p.id] && (
              <span className="ml-1 inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 align-middle" />
            )}
          </button>
        ))}
      </div>

      {/* Key input for active provider */}
      <div className="px-4 pb-4 pt-3 space-y-3">
        {(() => {
          const provider = PROVIDERS.find((p) => p.id === activeProvider)!;
          const consoleUrls: Record<ProviderId, { href: string; label: string }> = {
            claude: { href: 'https://console.anthropic.com', label: 'console.anthropic.com' },
            gemini: { href: 'https://aistudio.google.com/app/apikey', label: 'aistudio.google.com' },
            openai: { href: 'https://platform.openai.com/api-keys', label: 'platform.openai.com' },
          };
          const placeholders: Record<ProviderId, string> = {
            claude: 'sk-ant-...',
            gemini: 'AIza...',
            openai: 'sk-...',
          };
          const { href, label } = consoleUrls[activeProvider];
          return (
            <>
              <p className="text-slate-500 text-xs leading-relaxed">
                Your {provider.label} API key is stored locally and never sent anywhere except {provider.label}'s API.
                Get one at{' '}
                <a href={href} target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-0.5">
                  {label} <ExternalLink size={10} />
                </a>
              </p>
              <div className="flex gap-2">
                <input
                  type="password"
                  placeholder={placeholders[activeProvider]}
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
              {keys[activeProvider] && (
                <button onClick={clearKey} className="text-xs text-red-500 hover:text-red-600 cursor-pointer border-none bg-transparent p-0 transition-colors">
                  Remove saved key
                </button>
              )}
            </>
          );
        })()}
      </div>
    </div>
  )}
</div>
```

**Note:** `inputCls` is defined later in the component. Move its definition above the `return` statement if it isn't already there. In the current code it is defined at line ~305 — verify it's accessible in JSX (it is, since it's in the same function scope).

**Step 2: Verify TypeScript compiles and lint passes**

Run: `npm run build && npm run lint`
Expected: No errors

**Step 3: Commit**

```bash
git add src/components/seo/EtsySeoTool.tsx
git commit -m "feat(seo): add provider tabs to API key panel with per-provider key management"
```

---

### Task 5: Wire analyze() to callAI() and Update Loading Text

**Files:**
- Modify: `src/components/seo/EtsySeoTool.tsx` (analyze function + button JSX)

**Step 1: Replace the `callClaude()` call inside `analyze()` with `callAI()`**

Find this line inside `analyze()`:
```typescript
const analysisResult = await callClaude(listingTitle, listingDesc, category, apiKey);
```

Replace with:
```typescript
const analysisResult = await callAI(listingTitle, listingDesc, category, activeProvider, keys[activeProvider]);
```

**Step 2: Update the loading button text to be provider-aware**

Find:
```tsx
{status === 'fetching' ? 'Reading listing…' : 'Generating tags with Claude…'}
```

Replace with:
```tsx
{status === 'fetching'
  ? 'Reading listing…'
  : `Generating tags with ${PROVIDERS.find((p) => p.id === activeProvider)!.label}…`}
```

**Step 3: Update the "no key" hint text below the button**

Find:
```tsx
<p className="mt-2.5 text-center text-xs text-slate-400">
  Add your Claude API key above to get started.
</p>
```

Replace with:
```tsx
<p className="mt-2.5 text-center text-xs text-slate-400">
  Add your {PROVIDERS.find((p) => p.id === activeProvider)!.label} API key above to get started.
</p>
```

**Step 4: Update the URL mode helper text (optional cosmetic)**

Find:
```tsx
<p className="text-slate-400 text-xs">
  We'll auto-fetch the listing title and description, then Claude will generate tags.
</p>
```

Replace with:
```tsx
<p className="text-slate-400 text-xs">
  We'll auto-fetch the listing title and description, then AI will generate tags.
</p>
```

**Step 5: Verify TypeScript + lint**

Run: `npm run build && npm run lint`
Expected: No errors

**Step 6: Commit**

```bash
git add src/components/seo/EtsySeoTool.tsx
git commit -m "feat(seo): wire multi-provider dispatcher into analyze flow"
```

---

### Task 6: Manual Browser Verification

**Step 1: Start dev server**

Run: `npm run dev`

**Step 2: Navigate to the Etsy SEO Tool**

Open the app, navigate to the SEO tool page.

**Step 3: Verify provider tabs**

- Open the API Key panel
- Confirm 3 tabs appear: Claude / Gemini / OpenAI
- Switch tabs — confirm placeholder text changes (`sk-ant-...` / `AIza...` / `sk-...`)
- Confirm console link changes per provider

**Step 4: Verify per-provider key saving**

- Save a real (or dummy) key for each provider
- Confirm the green dot appears on each tab that has a key saved
- Reload the page — confirm all keys persist
- Confirm "Remove saved key" works per provider

**Step 5: Verify generation with at least one provider**

- With a real API key, enter a listing URL or manual title
- Click "Generate SEO Tags"
- Confirm loading text shows the active provider name
- Confirm tags appear

**Step 6: Final commit if any fixups were needed**

```bash
git add -p
git commit -m "fix(seo): address issues found during manual verification"
```
