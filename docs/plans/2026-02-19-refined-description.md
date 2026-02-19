# Refined Description Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a "Generate Description" button to the Etsy SEO Tool that uses AI to produce a conversion-optimized Etsy listing description (hook + bullets + CTA), editable inline before copying.

**Architecture:** All changes are contained in `src/components/seo/EtsySeoTool.tsx`. A new `buildDescriptionPrompt()` helper and a new `generateDescription()` async function are added alongside their tag-generation counterparts. Description state is independent of tag state — neither operation blocks the other. The existing `callAI()` dispatcher is reused; only the response extraction differs (plain text, not JSON).

**Tech Stack:** React 19, TypeScript, Tailwind CSS v4, Vite. No test framework — verify via `npm run lint` + `npm run build` + visual browser check.

---

### Task 1: Add `buildDescriptionPrompt()` helper

**Files:**
- Modify: `src/components/seo/EtsySeoTool.tsx` (after `buildPrompt()`, ~line 83)

**Step 1: Add the function**

Insert immediately after the closing backtick of `buildPrompt()`:

```ts
function buildDescriptionPrompt(title: string, description: string, category: string): string {
  return `You are a world-class Etsy copywriter who specializes in high-converting listing descriptions.

Write a listing description for this Etsy product that maximizes conversion.

LISTING:
Title: ${title}
${description ? `Existing description: ${description}` : ''}
${category ? `Category: ${category}` : ''}

FORMAT — output exactly this structure, plain text only (no markdown, no bold, no headers):

[Hook paragraph — 2-3 sentences. Address the buyer directly. Lead with the single most compelling benefit or use case. This is the ONLY text buyers see before "Show full description" so it must hook immediately.]

• [Key feature, material, or spec]
• [Key feature, material, or spec]
• [Key feature, material, or spec]
• [Key feature, material, or spec]

[One closing sentence CTA — e.g. "Order today and it ships within 2-3 business days."]

RULES:
- Plain text only — no asterisks, no markdown bold/italic, no headers
- Hook must be conversational and specific, not generic ("beautiful" and "perfect" are banned)
- Bullets cover: what it's made of, dimensions if known, use case, gifting angle
- Tone: warm, confident, direct`;
}
```

**Step 2: Lint check**

```bash
npm run lint
```

Expected: no errors.

**Step 3: Commit**

```bash
git add src/components/seo/EtsySeoTool.tsx
git commit -m "feat(seo): add buildDescriptionPrompt helper"
```

---

### Task 2: Add `generateDescriptionText()` API function

**Files:**
- Modify: `src/components/seo/EtsySeoTool.tsx` (after `callAI()`, ~line 282)

**Context:** The existing `callAI()` dispatcher returns `AnalysisResult` (JSON-parsed tags). For description generation we need plain text back. Rather than complicate `callAI()`, add a parallel thin wrapper that calls each provider and extracts the plain-text string directly.

**Step 1: Add the function**

Insert immediately after the closing brace of `callAI()`:

```ts
async function generateDescriptionText(
  title: string,
  description: string,
  category: string,
  provider: ProviderId,
  apiKey: string,
): Promise<string> {
  const { model } = PROVIDERS.find((p) => p.id === provider)!;
  const prompt = buildDescriptionPrompt(title, description, category);

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
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as { error?: { message?: string } };
      throw new Error(err.error?.message ?? `Claude API error ${res.status}`);
    }
    const data = await res.json() as { content: { text: string }[] };
    return data.content[0]?.text?.trim() ?? '';
  }

  if (provider === 'gemini') {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as { error?: { message?: string } };
      throw new Error(err.error?.message ?? `Gemini API error ${res.status}`);
    }
    const data = await res.json() as { candidates: { content: { parts: { text: string }[] } }[] };
    return data.candidates[0]?.content?.parts[0]?.text?.trim() ?? '';
  }

  if (provider === 'openai') {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as { error?: { message?: string } };
      throw new Error(err.error?.message ?? `OpenAI API error ${res.status}`);
    }
    const data = await res.json() as { choices: { message: { content: string } }[] };
    return data.choices[0]?.message?.content?.trim() ?? '';
  }

  throw new Error(`Unknown provider: ${provider}`);
}
```

**Step 2: Lint check**

```bash
npm run lint
```

Expected: no errors.

**Step 3: Commit**

```bash
git add src/components/seo/EtsySeoTool.tsx
git commit -m "feat(seo): add generateDescriptionText API function"
```

---

### Task 3: Add description state to `EtsySeoTool` component

**Files:**
- Modify: `src/components/seo/EtsySeoTool.tsx` (inside `EtsySeoTool()`, after existing `useState` declarations, ~line 362)

**Step 1: Add four state variables**

After the `const [copiedAll, setCopiedAll] = useState(false);` line, add:

```ts
const [descStatus, setDescStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
const [refinedDescription, setRefinedDescription] = useState('');
const [descError, setDescError] = useState('');
const [copiedDesc, setCopiedDesc] = useState(false);
```

**Step 2: Add `generateDescription()` handler**

After the `analyze()` function closing brace (~line 444), add:

```ts
async function generateDescription() {
  if (!canAnalyze) return;
  setDescError('');
  setDescStatus('loading');

  try {
    let listingTitle = title;
    let listingDesc = description;

    if (mode === 'url') {
      if (!url.includes('etsy.com')) {
        throw new Error('Please enter a valid Etsy listing URL (etsy.com/listing/...)');
      }
      // Re-use already-fetched title/description if available; otherwise fetch
      if (!listingTitle.trim()) {
        setDescStatus('loading');
        const meta = await fetchListingMeta(url);
        listingTitle = meta.title;
        listingDesc = meta.description;
        setTitle(meta.title);
        setDescription(meta.description);
      }
    }

    if (!listingTitle.trim()) throw new Error('Could not find a listing title. Try Manual Entry mode.');

    const text = await generateDescriptionText(listingTitle, listingDesc, category, activeProvider, keys[activeProvider]);
    setRefinedDescription(text);
    setDescStatus('done');
  } catch (e) {
    setDescError(e instanceof Error ? e.message : 'Something went wrong.');
    setDescStatus('error');
  }
}
```

**Step 3: Add `copyDescription()` handler**

After `copyAll()`, add:

```ts
async function copyDescription() {
  await navigator.clipboard.writeText(refinedDescription);
  setCopiedDesc(true);
  setTimeout(() => setCopiedDesc(false), 2000);
}
```

**Step 4: Lint check**

```bash
npm run lint
```

Expected: no errors.

**Step 5: Commit**

```bash
git add src/components/seo/EtsySeoTool.tsx
git commit -m "feat(seo): add description state and generateDescription handler"
```

---

### Task 4: Add "Generate Description" button to input card

**Files:**
- Modify: `src/components/seo/EtsySeoTool.tsx` (inside the input card JSX, after the existing analyze button, ~line 651)

**Step 1: Locate the existing analyze button**

Find this block (after the `isLoading` ternary closes):
```tsx
        {!hasKey && (
          <p className="mt-2.5 text-center text-xs text-slate-400">
```

**Step 2: Insert the Generate Description button between the analyze button and that `!hasKey` paragraph**

```tsx
        <button
          onClick={() => { void generateDescription(); }}
          disabled={!canAnalyze || descStatus === 'loading'}
          className="mt-2 w-full flex items-center justify-center gap-2.5 py-3 bg-slate-700 hover:bg-slate-800 dark:bg-slate-700/80 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors cursor-pointer border-none text-sm shadow-sm"
        >
          {descStatus === 'loading' ? (
            <>
              <RefreshCw size={16} className="animate-spin" />
              {`Writing description with ${PROVIDERS.find((p) => p.id === activeProvider)!.label}…`}
            </>
          ) : (
            <>
              <PenLine size={16} />
              {refinedDescription ? 'Regenerate Description' : 'Generate Description'}
            </>
          )}
        </button>
```

Note: `PenLine` and `RefreshCw` are already imported at the top of the file.

**Step 3: Build check**

```bash
npm run build
```

Expected: no TypeScript or build errors.

**Step 4: Visual check in browser**

```bash
npm run dev
```

Navigate to the Etsy SEO tool. Confirm:
- "Generate Description" button appears below "Generate SEO Tags"
- Button is disabled when no key is set or no URL/title entered
- Button shows spinner and "Writing description with [Provider]…" while loading

**Step 5: Commit**

```bash
git add src/components/seo/EtsySeoTool.tsx
git commit -m "feat(seo): add Generate Description button to input card"
```

---

### Task 5: Add Refined Description result card

**Files:**
- Modify: `src/components/seo/EtsySeoTool.tsx` (after the tags results `</div>` block, ~line 755, before the component's closing `</div>`)

**Step 1: Add description error banner**

After the existing `{status === 'error' && error && ...}` error block and before the results block, add:

```tsx
      {/* Description error */}
      {descStatus === 'error' && descError && (
        <div className="mb-4 flex items-start gap-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/50 rounded-xl px-4 py-3.5">
          <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-red-700 dark:text-red-400 text-sm font-medium">Description generation failed</p>
            <p className="text-red-600 dark:text-red-500 text-xs mt-0.5">{descError}</p>
          </div>
        </div>
      )}
```

**Step 2: Add the Refined Description result card**

After the closing `</div>` of the `{result && status === 'done' && (...)}` block (the tags results section), add:

```tsx
      {/* Refined Description result */}
      {descStatus === 'done' && refinedDescription && (
        <div className="mt-4 bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-sm dark:shadow-none p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <PenLine size={15} className="text-purple-500" />
              <span className="text-slate-700 dark:text-slate-300 text-sm font-semibold">Refined Description</span>
            </div>
            <button
              onClick={() => { void copyDescription(); }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium rounded-lg transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
            >
              {copiedDesc ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
              {copiedDesc ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <textarea
            rows={8}
            value={refinedDescription}
            onChange={(e) => setRefinedDescription(e.target.value)}
            className={`${inputCls} resize-y`}
          />
          <div className="flex items-center gap-2 mt-2.5">
            <Sparkles size={12} className="text-purple-400 shrink-0" />
            <p className="text-slate-400 text-[11px]">
              Optimized for Etsy's above-the-fold hook — edit freely before copying to your listing.
            </p>
          </div>
        </div>
      )}
```

**Step 3: Build check**

```bash
npm run build
```

Expected: exits cleanly.

**Step 4: Visual check in browser**

With `npm run dev` running:
1. Enter a listing URL or manual title
2. Click "Generate Description"
3. Confirm the card appears below with editable textarea pre-filled
4. Edit text in the textarea — confirm changes persist in state
5. Click "Copy" — confirm clipboard contains the current textarea content (including any edits)
6. Click "Regenerate Description" — confirm the textarea is overwritten with a fresh result
7. Confirm tags and description can each be generated independently (in either order)

**Step 5: Commit**

```bash
git add src/components/seo/EtsySeoTool.tsx
git commit -m "feat(seo): add Refined Description result card with editable textarea"
```

---

## Done

At completion the Etsy SEO Tool has:
- An independent "Generate Description" secondary button in the input card
- A "Refined Description" result card with an editable textarea and copy button
- Description generation that reuses the active AI provider and key with no new state coupling to tags
