# Listing Analysis Tool Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the "Analytics" tab with a Listing Analysis tool that parses an Etsy listings CSV, scores all 50 listings across 5 dimensions, and batch-generates AI tag suggestions on upload.

**Architecture:** Parse CSV → rule-based score all listings instantly → fire all AI calls in parallel via `Promise.allSettled()` → render sortable table with expandable rows. State lives entirely in `ListingsView`. No persistence.

**Tech Stack:** React, TypeScript, Tailwind CSS, Lucide icons, existing AI provider infrastructure (Claude/Gemini/OpenAI via localStorage keys)

---

## Task 1: Add Types to `src/types/index.ts`

**Files:**
- Modify: `src/types/index.ts`

**Step 1: Add EtsyListing and ScoredListing types**

Append to the bottom of `src/types/index.ts`:

```ts
// ─── Etsy Listing Analysis ─────────────────────────────────────────────────

export interface EtsyListing {
  title: string;
  description: string;
  price: number;
  quantity: number;
  tags: string[];          // already split on comma, trimmed
  materials: string;
  images: string[];        // only non-empty image URLs
  sku: string;
}

export interface ListingSubScores {
  tags: number;     // 0–100
  title: number;    // 0–100
  images: number;   // 0–100
  description: number; // 0–100
  price: number;    // 0–100
}

export interface ScoredListing extends EtsyListing {
  index: number;              // original row position
  overall: number;            // weighted 0–100
  subScores: ListingSubScores;
  aiTags: string[] | null;    // null = not yet fetched; [] = fetch attempted, no result
  aiStatus: 'pending' | 'loading' | 'done' | 'error';
  aiError?: string;
}
```

**Step 2: Commit**

```bash
git add src/types/index.ts
git commit -m "feat(listings): add EtsyListing and ScoredListing types"
```

---

## Task 2: CSV Parser — `src/lib/parseListingsCsv.ts`

**Files:**
- Create: `src/lib/parseListingsCsv.ts`

**Context:** The Etsy listings CSV has multi-line description fields wrapped in double-quotes. A simple `split('\n')` will break mid-record. We need a character-by-character parser that collects complete records before splitting into fields.

**Step 1: Write the parser**

Create `src/lib/parseListingsCsv.ts`:

```ts
import type { EtsyListing } from '@/types';

/**
 * Split full CSV text into individual record strings.
 * Handles multi-line fields enclosed in double-quotes.
 */
function splitIntoRecords(text: string): string[] {
  const records: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (ch === '"') {
      // Escaped quote inside a quoted field ("" → ")
      if (inQuotes && next === '"') {
        current += '"';
        i++; // skip next quote
      } else {
        inQuotes = !inQuotes;
        current += ch;
      }
    } else if (ch === '\n' && !inQuotes) {
      if (current.trim()) records.push(current.trim());
      current = '';
    } else if (ch === '\r') {
      // skip carriage returns
    } else {
      current += ch;
    }
  }
  if (current.trim()) records.push(current.trim());
  return records;
}

/**
 * Split a single-line record into fields, respecting quoted values.
 * After splitIntoRecords(), each record is guaranteed to be one row.
 */
function splitFields(record: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < record.length; i++) {
    const ch = record[i];
    const next = record[i + 1];

    if (ch === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      fields.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  fields.push(current);
  return fields;
}

// Column indices from Etsy listings CSV header:
// TITLE,DESCRIPTION,PRICE,CURRENCY_CODE,QUANTITY,TAGS,MATERIALS,
// IMAGE1..IMAGE10,VARIATION 1 TYPE,...,SKU
const COL = {
  title: 0,
  description: 1,
  price: 2,
  quantity: 4,
  tags: 5,
  materials: 6,
  image1: 7,   // IMAGE1 through IMAGE10 = indices 7–16
  sku: 23,
} as const;

function parseListingRow(fields: string[]): EtsyListing | null {
  const title = fields[COL.title]?.trim() ?? '';
  if (!title) return null;

  const images = Array.from({ length: 10 }, (_, i) => fields[COL.image1 + i]?.trim() ?? '')
    .filter(Boolean);

  const rawTags = fields[COL.tags]?.trim() ?? '';
  const tags = rawTags
    ? rawTags.split(',').map((t) => t.trim()).filter(Boolean)
    : [];

  return {
    title,
    description: fields[COL.description]?.trim() ?? '',
    price: parseFloat(fields[COL.price] ?? '0') || 0,
    quantity: parseInt(fields[COL.quantity] ?? '0', 10) || 0,
    tags,
    materials: fields[COL.materials]?.trim() ?? '',
    images,
    sku: fields[COL.sku]?.trim() ?? '',
  };
}

export interface ListingsParseResult {
  listings: EtsyListing[];
  parseErrors: number;
}

export function parseListingsCsv(text: string): ListingsParseResult {
  const records = splitIntoRecords(text);
  const [, ...dataRecords] = records; // skip header row
  let parseErrors = 0;
  const listings: EtsyListing[] = [];

  for (const record of dataRecords) {
    const fields = splitFields(record);
    const listing = parseListingRow(fields);
    if (listing) {
      listings.push(listing);
    } else {
      parseErrors++;
    }
  }

  return { listings, parseErrors };
}
```

**Step 2: Smoke-test manually**
Open the app in dev mode and verify the CSV parses correctly in the browser console (you'll wire it up in Task 5, but you can test the function in isolation with a quick `console.log` if needed).

**Step 3: Commit**

```bash
git add src/lib/parseListingsCsv.ts
git commit -m "feat(listings): add multi-line CSV parser for Etsy listings export"
```

---

## Task 3: Scoring — `src/lib/scoreListings.ts`

**Files:**
- Create: `src/lib/scoreListings.ts`

**Step 1: Write the scorer**

Create `src/lib/scoreListings.ts`:

```ts
import type { EtsyListing, ScoredListing, ListingSubScores } from '@/types';

const WEIGHTS = {
  tags: 0.40,
  title: 0.20,
  images: 0.15,
  description: 0.15,
  price: 0.10,
} as const;

const MAX_TAGS = 13;
const MAX_TAG_CHARS = 20;
const IDEAL_TITLE_MIN = 40;
const IDEAL_TITLE_MAX = 140;
const MAX_IMAGES = 10;
const MIN_DESC_CHARS = 200;

function scoreTags(tags: string[]): number {
  if (tags.length === 0) return 0;

  // Slot fill: how many of 13 slots are used
  const slotScore = (tags.length / MAX_TAGS) * 100;

  // Avg char utilization toward 20-char limit
  const avgChars = tags.reduce((sum, t) => sum + t.length, 0) / tags.length;
  const charScore = Math.min(100, (avgChars / MAX_TAG_CHARS) * 100);

  // Long-tail ratio: tags with a space (multi-word) are better
  const longTailRatio = tags.filter((t) => t.includes(' ')).length / tags.length;
  const longTailScore = longTailRatio * 100;

  return Math.round((slotScore * 0.5) + (charScore * 0.25) + (longTailScore * 0.25));
}

function scoreTitle(title: string): number {
  const len = title.length;
  if (len < 20) return 20;
  if (len < IDEAL_TITLE_MIN) return 20 + ((len - 20) / (IDEAL_TITLE_MIN - 20)) * 50;
  if (len <= IDEAL_TITLE_MAX) return 100;
  // Over 140: penalty
  return Math.max(40, 100 - ((len - IDEAL_TITLE_MAX) / 20) * 15);
}

function scoreImages(images: string[]): number {
  return Math.round((images.length / MAX_IMAGES) * 100);
}

function scoreDescription(description: string): number {
  const len = description.length;
  if (len === 0) return 0;
  const lengthScore = Math.min(100, (len / MIN_DESC_CHARS) * 70);
  // Bonus for structure (newlines/bullets suggest formatted content)
  const hasStructure = description.includes('\n') || description.includes('•') || description.includes('-');
  const structureBonus = hasStructure ? 30 : 0;
  return Math.min(100, Math.round(lengthScore + structureBonus));
}

function scorePrice(price: number, catalogMedian: number): number {
  if (catalogMedian === 0) return 100;
  const zScore = Math.abs(price - catalogMedian) / catalogMedian;
  if (zScore <= 0.5) return 100;
  if (zScore <= 1.0) return 80;
  if (zScore <= 1.5) return 60;
  if (zScore <= 2.0) return 40;
  return 20;
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function scoreListings(listings: EtsyListing[]): ScoredListing[] {
  const catalogMedian = median(listings.map((l) => l.price));

  return listings.map((listing, index) => {
    const subScores: ListingSubScores = {
      tags: scoreTags(listing.tags),
      title: Math.round(scoreTitle(listing.title)),
      images: scoreImages(listing.images),
      description: scoreDescription(listing.description),
      price: scorePrice(listing.price, catalogMedian),
    };

    const overall = Math.round(
      subScores.tags        * WEIGHTS.tags +
      subScores.title       * WEIGHTS.title +
      subScores.images      * WEIGHTS.images +
      subScores.description * WEIGHTS.description +
      subScores.price       * WEIGHTS.price
    );

    return {
      ...listing,
      index,
      overall,
      subScores,
      aiTags: null,
      aiStatus: 'pending',
    };
  });
}
```

**Step 2: Commit**

```bash
git add src/lib/scoreListings.ts
git commit -m "feat(listings): add rule-based listing scorer (5 dimensions)"
```

---

## Task 4: Extract Shared AI Caller — `src/lib/callListingAI.ts`

**Files:**
- Create: `src/lib/callListingAI.ts`

**Context:** `EtsySeoTool.tsx` has inline `callClaude`, `callGemini`, `callOpenAI` functions. Rather than duplicating them, extract a shared module. The existing SEO tool will continue to work unchanged (its inline functions are still there); this new file provides the same capability for the listings batch caller.

**Step 1: Create the shared AI caller**

Create `src/lib/callListingAI.ts`:

```ts
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
```

**Step 2: Commit**

```bash
git add src/lib/callListingAI.ts
git commit -m "feat(listings): add shared AI tag caller for batch listing analysis"
```

---

## Task 5: Navigation — Update App, Sidebar, BottomNav, Dashboard

**Files:**
- Modify: `src/App.tsx:10`
- Modify: `src/components/layout/Sidebar.tsx`
- Modify: `src/components/layout/BottomNav.tsx`
- Modify: `src/pages/Dashboard.tsx`

**Step 1: Update View type in `src/App.tsx`**

Change line 10:
```ts
// Before:
export type View = 'dashboard' | 'inventory' | 'orders' | 'charts' | 'seo' | 'salesmap' | 'margin';

// After:
export type View = 'dashboard' | 'inventory' | 'orders' | 'listings' | 'seo' | 'salesmap' | 'margin';
```

**Step 2: Update Sidebar nav items**

In `src/components/layout/Sidebar.tsx`:

Change the import line at the top — replace `BarChart2` with `LayoutList`:
```ts
import { LayoutDashboard, PackageSearch, ShoppingCart, LayoutList, Tag, Map, Calculator } from 'lucide-react';
```

Change the charts nav item:
```ts
// Before:
{ id: 'charts', label: 'Analytics', Icon: BarChart2 },

// After:
{ id: 'listings', label: 'Listings', Icon: LayoutList },
```

**Step 3: Update BottomNav**

In `src/components/layout/BottomNav.tsx`:

Same import swap (`BarChart2` → `LayoutList`):
```ts
import { LayoutDashboard, PackageSearch, ShoppingCart, LayoutList, Tag, Map, Calculator } from 'lucide-react';
```

Change the nav item:
```ts
// Before:
{ id: 'charts', label: 'Analytics', Icon: BarChart2 },

// After:
{ id: 'listings', label: 'Listings', Icon: LayoutList },
```

**Step 4: Stub the Dashboard branch**

In `src/pages/Dashboard.tsx`, replace the `activeView === 'charts'` block:

Remove:
```tsx
import { ConsumptionTrendChart } from '@/components/charts/ConsumptionTrendChart';
import { InventoryLevelChart } from '@/components/charts/InventoryLevelChart';
import { ChartComponentSelector } from '@/components/charts/ChartComponentSelector';
```

Add at the top with the other imports:
```tsx
import { ListingsView } from '@/components/listings/ListingsView';
```

Replace the `activeView === 'charts'` JSX block with:
```tsx
{activeView === 'listings' && (
  <ListingsView />
)}
```

Also remove the `selectedChartCompId` / `selectedComp` state that was only used for charts:
```ts
// Remove these two lines:
const [selectedChartCompId, setSelectedChartCompId] = useState(enrichedComponents[0]?.id ?? '');
const selectedComp = enrichedComponents.find((c) => c.id === selectedChartCompId);
```

**Step 5: Verify app compiles** — run `npm run dev` and confirm Listings nav item appears and clicking it doesn't crash (ListingsView doesn't exist yet, so add a temporary stub file at `src/components/listings/ListingsView.tsx` with just `export function ListingsView() { return <div>Coming soon</div>; }`)

**Step 6: Commit**

```bash
git add src/App.tsx src/components/layout/Sidebar.tsx src/components/layout/BottomNav.tsx src/pages/Dashboard.tsx
git commit -m "feat(listings): wire Listings nav tab, replace Analytics view"
```

---

## Task 6: `ListingsSummaryStrip` Component

**Files:**
- Create: `src/components/listings/ListingsSummaryStrip.tsx`

**Step 1: Create the component**

```tsx
import type { ScoredListing } from '@/types';

interface Props {
  listings: ScoredListing[];
}

export function ListingsSummaryStrip({ listings }: Props) {
  if (listings.length === 0) return null;

  const avgScore = Math.round(listings.reduce((s, l) => s + l.overall, 0) / listings.length);
  const tagGaps = listings.filter((l) => l.tags.length < 13).length;
  const lowImages = listings.filter((l) => l.images.length < 5).length;
  const aiDone = listings.filter((l) => l.aiStatus === 'done').length;

  const scoreColor =
    avgScore >= 75 ? 'text-emerald-600 dark:text-emerald-400' :
    avgScore >= 50 ? 'text-yellow-600 dark:text-yellow-400' :
                    'text-red-600 dark:text-red-400';

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
      {[
        { label: 'Avg Score', value: `${avgScore}`, valueClass: scoreColor },
        { label: 'Tag Gaps', value: `${tagGaps}`, valueClass: tagGaps > 0 ? 'text-yellow-600 dark:text-yellow-400' : 'text-emerald-600 dark:text-emerald-400' },
        { label: 'Low Images (<5)', value: `${lowImages}`, valueClass: lowImages > 0 ? 'text-yellow-600 dark:text-yellow-400' : 'text-emerald-600 dark:text-emerald-400' },
        { label: 'AI Tags Ready', value: `${aiDone}/${listings.length}`, valueClass: 'text-slate-700 dark:text-slate-300' },
      ].map(({ label, value, valueClass }) => (
        <div key={label} className="bg-white dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/50 px-4 py-3 shadow-sm dark:shadow-none">
          <p className="text-[11px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold mb-1">{label}</p>
          <p className={`text-2xl font-bold ${valueClass}`}>{value}</p>
        </div>
      ))}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/listings/ListingsSummaryStrip.tsx
git commit -m "feat(listings): add ListingsSummaryStrip KPI component"
```

---

## Task 7: `ListingRowExpanded` Component

**Files:**
- Create: `src/components/listings/ListingRowExpanded.tsx`

**Step 1: Create the expanded row detail panel**

```tsx
import { Copy, Check, RefreshCw, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import type { ScoredListing } from '@/types';

interface Props {
  listing: ScoredListing;
  onRetryAI: () => void;
}

const MAX_TAG_CHARS = 20;

function TagChip({ tag }: { tag: string }) {
  const valid = tag.length <= MAX_TAG_CHARS;
  const color = !valid
    ? 'border-red-300 dark:border-red-600/50 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400'
    : tag.length >= 17
    ? 'border-yellow-300 dark:border-yellow-600/50 bg-yellow-50 dark:bg-yellow-950/20 text-yellow-700 dark:text-yellow-400'
    : 'border-emerald-300 dark:border-emerald-700/50 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200';

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-xs font-medium ${color}`}>
      {tag}
      <span className="text-[9px] opacity-60 font-mono">{tag.length}</span>
    </span>
  );
}

export function ListingRowExpanded({ listing, onRetryAI }: Props) {
  const [copiedAI, setCopiedAI] = useState(false);
  const [copiedCurrent, setCopiedCurrent] = useState(false);

  async function copyTags(tags: string[]) {
    await navigator.clipboard.writeText(tags.join(', '));
  }

  const tagGaps = 13 - listing.tags.length;
  const shortTags = listing.tags.filter((t) => t.length < 15);
  const singleWordTags = listing.tags.filter((t) => !t.includes(' '));

  return (
    <div className="px-4 pb-4 pt-2 border-t border-slate-100 dark:border-slate-700/40 space-y-4">
      {/* Current Tags */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Current Tags ({listing.tags.length}/13)
          </p>
          {listing.tags.length > 0 && (
            <button
              onClick={async () => { await copyTags(listing.tags); setCopiedCurrent(true); setTimeout(() => setCopiedCurrent(false), 1500); }}
              className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-600 cursor-pointer border-none bg-transparent"
            >
              {copiedCurrent ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
              Copy
            </button>
          )}
        </div>
        {listing.tags.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {listing.tags.map((tag, i) => <TagChip key={i} tag={tag} />)}
          </div>
        ) : (
          <p className="text-sm text-slate-400 italic">No tags</p>
        )}
        {(tagGaps > 0 || shortTags.length > 0 || singleWordTags.length > 0) && (
          <div className="mt-2 flex flex-wrap gap-2">
            {tagGaps > 0 && (
              <span className="text-[11px] text-red-500 font-medium">{tagGaps} empty slot{tagGaps > 1 ? 's' : ''}</span>
            )}
            {shortTags.length > 0 && (
              <span className="text-[11px] text-yellow-600 dark:text-yellow-400 font-medium">{shortTags.length} tag{shortTags.length > 1 ? 's' : ''} under 15 chars</span>
            )}
            {singleWordTags.length > 0 && (
              <span className="text-[11px] text-slate-400 font-medium">{singleWordTags.length} single-word tag{singleWordTags.length > 1 ? 's' : ''}</span>
            )}
          </div>
        )}
      </div>

      {/* AI Suggested Tags */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            AI Suggested Tags
          </p>
          {listing.aiStatus === 'done' && listing.aiTags && listing.aiTags.length > 0 && (
            <button
              onClick={async () => { await copyTags(listing.aiTags!); setCopiedAI(true); setTimeout(() => setCopiedAI(false), 1500); }}
              className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-600 cursor-pointer border-none bg-transparent"
            >
              {copiedAI ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
              Copy all
            </button>
          )}
        </div>

        {listing.aiStatus === 'loading' && (
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <RefreshCw size={13} className="animate-spin" />
            Generating…
          </div>
        )}
        {listing.aiStatus === 'error' && (
          <div className="flex items-center gap-2">
            <AlertCircle size={13} className="text-red-400" />
            <span className="text-xs text-red-500">{listing.aiError ?? 'AI call failed'}</span>
            <button
              onClick={onRetryAI}
              className="text-xs text-blue-500 hover:underline cursor-pointer border-none bg-transparent"
            >
              Retry
            </button>
          </div>
        )}
        {listing.aiStatus === 'done' && listing.aiTags && (
          <div className="flex flex-wrap gap-1.5">
            {listing.aiTags.map((tag, i) => <TagChip key={i} tag={tag} />)}
          </div>
        )}
        {listing.aiStatus === 'pending' && (
          <p className="text-xs text-slate-400 italic">Waiting for API key…</p>
        )}
      </div>

      {/* Description + Images row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-slate-50 dark:bg-slate-900/40 rounded-xl p-3">
          <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-1">Description</p>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{listing.description.length} chars</p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {listing.description.length < 200 ? 'Too short — aim for 200+' : 'Good length'}
          </p>
        </div>
        <div className="bg-slate-50 dark:bg-slate-900/40 rounded-xl p-3">
          <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-1">Images</p>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{listing.images.length}/10 filled</p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {listing.images.length < 10 ? `${10 - listing.images.length} slot${10 - listing.images.length > 1 ? 's' : ''} unused` : 'Fully filled'}
          </p>
        </div>
        <div className="bg-slate-50 dark:bg-slate-900/40 rounded-xl p-3">
          <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-1">Price</p>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">${listing.price.toFixed(2)}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {listing.subScores.price >= 80 ? 'Within normal range' : 'Price outlier'}
          </p>
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/listings/ListingRowExpanded.tsx
git commit -m "feat(listings): add ListingRowExpanded detail panel component"
```

---

## Task 8: `ListingsTable` Component

**Files:**
- Create: `src/components/listings/ListingsTable.tsx`

**Step 1: Create the sortable/filterable table**

```tsx
import { useState } from 'react';
import { ChevronDown, ChevronUp, ChevronRight } from 'lucide-react';
import type { ScoredListing } from '@/types';
import { ListingRowExpanded } from './ListingRowExpanded';

type SortKey = 'overall' | 'title' | 'price' | 'images' | 'tags';
type SortDir = 'asc' | 'desc';

interface Props {
  listings: ScoredListing[];
  onRetryAI: (index: number) => void;
}

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 75 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400 border-emerald-200 dark:border-emerald-600/30' :
    score >= 50 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-400 border-yellow-200 dark:border-yellow-600/30' :
                  'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400 border-red-200 dark:border-red-600/30';
  return (
    <span className={`inline-flex items-center justify-center w-10 text-xs font-bold rounded-lg border px-1.5 py-0.5 ${color}`}>
      {score}
    </span>
  );
}

function SubScoreChip({ score }: { score: number }) {
  const color =
    score >= 75 ? 'text-emerald-500' :
    score >= 50 ? 'text-yellow-500' :
                  'text-red-500';
  return <span className={`text-xs font-semibold tabular-nums ${color}`}>{score}</span>;
}

export function ListingsTable({ listings, onRetryAI }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('overall');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [filter, setFilter] = useState<'all' | 'needs-work'>('all');
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }

  const filtered = listings.filter((l) => filter === 'all' || l.overall < 75);

  const sorted = [...filtered].sort((a, b) => {
    let av: number, bv: number;
    if (sortKey === 'title') {
      return sortDir === 'asc'
        ? a.title.localeCompare(b.title)
        : b.title.localeCompare(a.title);
    }
    av = sortKey === 'overall' ? a.overall :
         sortKey === 'price'   ? a.price :
         sortKey === 'images'  ? a.images.length :
                                 a.tags.length;
    bv = sortKey === 'overall' ? b.overall :
         sortKey === 'price'   ? b.price :
         sortKey === 'images'  ? b.images.length :
                                 b.tags.length;
    return sortDir === 'asc' ? av - bv : bv - av;
  });

  function SortIcon({ k }: { k: SortKey }) {
    if (sortKey !== k) return <ChevronDown size={12} className="opacity-30" />;
    return sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />;
  }

  const thCls = 'px-3 py-2.5 text-left text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer select-none hover:text-slate-700 dark:hover:text-slate-200 transition-colors';

  return (
    <div>
      {/* Filter bar */}
      <div className="flex gap-1 mb-3">
        {(['all', 'needs-work'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer border-none ${
              filter === f
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            {f === 'all' ? `All (${listings.length})` : `Needs Work (<75)`}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-sm dark:shadow-none overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-slate-100 dark:border-slate-700/40">
              <tr>
                <th className={thCls} onClick={() => toggleSort('overall')}>
                  <div className="flex items-center gap-1">Score <SortIcon k="overall" /></div>
                </th>
                <th className={`${thCls} min-w-48`} onClick={() => toggleSort('title')}>
                  <div className="flex items-center gap-1">Title <SortIcon k="title" /></div>
                </th>
                <th className={thCls} onClick={() => toggleSort('tags')}>
                  <div className="flex items-center gap-1">Tags <SortIcon k="tags" /></div>
                </th>
                <th className={thCls}>Title</th>
                <th className={thCls} onClick={() => toggleSort('images')}>
                  <div className="flex items-center gap-1">Imgs <SortIcon k="images" /></div>
                </th>
                <th className={thCls}>Desc</th>
                <th className={thCls} onClick={() => toggleSort('price')}>
                  <div className="flex items-center gap-1">Price <SortIcon k="price" /></div>
                </th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/30">
              {sorted.map((listing) => {
                const isExpanded = expandedIdx === listing.index;
                return (
                  <>
                    <tr
                      key={listing.index}
                      className="hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors cursor-pointer"
                      onClick={() => setExpandedIdx(isExpanded ? null : listing.index)}
                    >
                      <td className="px-3 py-3">
                        <ScoreBadge score={listing.overall} />
                      </td>
                      <td className="px-3 py-3">
                        <span className="text-sm text-slate-800 dark:text-slate-200 line-clamp-1 max-w-xs block">
                          {listing.title}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <SubScoreChip score={listing.subScores.tags} />
                        <span className="text-[10px] text-slate-400 ml-1">({listing.tags.length}/13)</span>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <SubScoreChip score={listing.subScores.title} />
                      </td>
                      <td className="px-3 py-3 text-center">
                        <SubScoreChip score={listing.subScores.images} />
                        <span className="text-[10px] text-slate-400 ml-1">({listing.images.length}/10)</span>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <SubScoreChip score={listing.subScores.description} />
                      </td>
                      <td className="px-3 py-3">
                        <span className="text-sm text-slate-700 dark:text-slate-300">${listing.price.toFixed(2)}</span>
                      </td>
                      <td className="px-2 py-3">
                        <ChevronRight
                          size={15}
                          className={`text-slate-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                        />
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr key={`expanded-${listing.index}`}>
                        <td colSpan={8} className="p-0">
                          <ListingRowExpanded
                            listing={listing}
                            onRetryAI={() => onRetryAI(listing.index)}
                          />
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
              {sorted.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-400 text-sm">
                    No listings match the current filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/listings/ListingsTable.tsx
git commit -m "feat(listings): add sortable/filterable ListingsTable component"
```

---

## Task 9: `ListingsView` — Main Orchestrator

**Files:**
- Create: `src/components/listings/ListingsView.tsx`

**Context:** This is the top-level view that owns all state. It handles CSV upload, triggers scoring, fires all AI calls in parallel via `Promise.allSettled`, and updates individual listing AI results as they resolve.

**Step 1: Create the view**

```tsx
import { useState, useRef } from 'react';
import { Upload, Trash2, Key, ChevronDown, ChevronUp, ExternalLink, RefreshCw } from 'lucide-react';
import { parseListingsCsv } from '@/lib/parseListingsCsv';
import { scoreListings } from '@/lib/scoreListings';
import { fetchAITags, getActiveProvider, getApiKey } from '@/lib/callListingAI';
import { ListingsSummaryStrip } from './ListingsSummaryStrip';
import { ListingsTable } from './ListingsTable';
import type { ScoredListing } from '@/types';

type ProviderId = 'claude' | 'gemini' | 'openai';

const PROVIDERS: { id: ProviderId; label: string; storageKey: string; placeholder: string; console: string; consoleLabel: string }[] = [
  { id: 'claude',  label: 'Claude',  storageKey: 'anthropic_api_key', placeholder: 'sk-ant-...', console: 'https://console.anthropic.com', consoleLabel: 'console.anthropic.com' },
  { id: 'gemini',  label: 'Gemini',  storageKey: 'google_api_key',    placeholder: 'AIza...',    console: 'https://aistudio.google.com/app/apikey', consoleLabel: 'aistudio.google.com' },
  { id: 'openai',  label: 'OpenAI',  storageKey: 'openai_api_key',    placeholder: 'sk-...',     console: 'https://platform.openai.com/api-keys', consoleLabel: 'platform.openai.com' },
];

export function ListingsView() {
  const [listings, setListings] = useState<ScoredListing[]>([]);
  const [parseError, setParseError] = useState('');
  const [dragging, setDragging] = useState(false);
  const [showKeyPanel, setShowKeyPanel] = useState(false);
  const [activeProvider, setActiveProvider] = useState<ProviderId>(
    () => (localStorage.getItem('active_seo_provider') as ProviderId) ?? 'claude'
  );
  const [keys, setKeys] = useState<Record<ProviderId, string>>(() => ({
    claude: localStorage.getItem('anthropic_api_key') ?? '',
    gemini: localStorage.getItem('google_api_key') ?? '',
    openai: localStorage.getItem('openai_api_key') ?? '',
  }));
  const [keyDraft, setKeyDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const hasKey = keys[activeProvider].trim().length > 0;

  function saveKey() {
    const k = keyDraft.trim();
    if (!k) return;
    const p = PROVIDERS.find((p) => p.id === activeProvider)!;
    localStorage.setItem(p.storageKey, k);
    setKeys((prev) => ({ ...prev, [activeProvider]: k }));
    setKeyDraft('');
    setShowKeyPanel(false);
  }

  function clearKey() {
    const p = PROVIDERS.find((p) => p.id === activeProvider)!;
    localStorage.removeItem(p.storageKey);
    setKeys((prev) => ({ ...prev, [activeProvider]: '' }));
    setKeyDraft('');
  }

  function switchProvider(id: ProviderId) {
    setActiveProvider(id);
    localStorage.setItem('active_seo_provider', id);
    setKeyDraft('');
  }

  async function runAIForListing(index: number, provider: ProviderId, apiKey: string) {
    const listing = listings[index];
    if (!listing) return;

    setListings((prev) =>
      prev.map((l) => l.index === index ? { ...l, aiStatus: 'loading' } : l)
    );

    try {
      const tags = await fetchAITags(listing.title, listing.description, provider, apiKey);
      setListings((prev) =>
        prev.map((l) => l.index === index ? { ...l, aiTags: tags, aiStatus: 'done' } : l)
      );
    } catch (e) {
      setListings((prev) =>
        prev.map((l) =>
          l.index === index
            ? { ...l, aiStatus: 'error', aiError: e instanceof Error ? e.message : 'Failed' }
            : l
        )
      );
    }
  }

  async function processFile(file: File) {
    setParseError('');
    const text = await file.text();
    const { listings: parsed, parseErrors } = parseListingsCsv(text);

    if (parsed.length === 0) {
      setParseError('No listings found. Make sure this is an Etsy Listings CSV export.');
      return;
    }

    const scored = scoreListings(parsed);
    setListings(scored);

    // Kick off AI batch if key is available
    const provider = getActiveProvider() as ProviderId;
    const apiKey = getApiKey(provider);
    if (!apiKey) return;

    // Mark all as loading
    setListings((prev) => prev.map((l) => ({ ...l, aiStatus: 'loading' })));

    // Fire all in parallel — update each as it resolves
    await Promise.allSettled(
      scored.map((l) => runAIForListing(l.index, provider, apiKey))
    );
  }

  function handleFiles(files: FileList | null) {
    if (!files?.[0]) return;
    void processFile(files[0]);
  }

  const inputCls = 'w-full bg-white dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700/60 text-slate-900 dark:text-slate-200 text-sm rounded-xl px-3.5 py-2.5 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors';
  const activeProviderConfig = PROVIDERS.find((p) => p.id === activeProvider)!;

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div>
          <h1 className="text-slate-900 dark:text-white text-xl font-bold leading-tight">Listing Analysis</h1>
          <p className="text-slate-500 text-sm mt-0.5">Upload your Etsy listings CSV to score SEO quality across all listings</p>
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
              {hasKey ? `${activeProviderConfig.label} API Key connected` : 'Connect AI API Key for tag suggestions'}
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
            <div role="tablist" className="flex gap-1 p-3 pb-0">
              {PROVIDERS.map((p) => (
                <button
                  key={p.id}
                  role="tab"
                  aria-selected={activeProvider === p.id}
                  onClick={() => switchProvider(p.id)}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer border-none ${
                    activeProvider === p.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-900/50 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  {p.label}
                  {keys[p.id] && <span className="ml-1 inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 align-middle" />}
                </button>
              ))}
            </div>
            <div className="px-4 pb-4 pt-3 space-y-3">
              <p className="text-slate-500 text-xs leading-relaxed">
                Stored locally, only sent to {activeProviderConfig.label}'s API. Get one at{' '}
                <a href={activeProviderConfig.console} target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-0.5">
                  {activeProviderConfig.consoleLabel} <ExternalLink size={10} />
                </a>
              </p>
              <div className="flex gap-2">
                <input
                  type="password"
                  placeholder={activeProviderConfig.placeholder}
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
            </div>
          </div>
        )}
      </div>

      {/* Upload */}
      <div className="mb-5">
        <div
          className={`flex items-center gap-3 border-2 border-dashed rounded-xl px-4 py-4 cursor-pointer transition-colors ${
            dragging
              ? 'border-blue-400 bg-blue-50 dark:bg-blue-500/10'
              : 'border-slate-300 dark:border-slate-600 hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-500/5'
          }`}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
        >
          <Upload size={18} className="text-slate-400 shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">
              {listings.length > 0
                ? `${listings.length} listings loaded — drop another CSV to replace`
                : 'Drop your Etsy Listings CSV here, or click to browse'}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              Export from Etsy › Shop Manager › Listings › Download CSV
            </p>
          </div>
          {listings.length > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); setListings([]); }}
              className="flex items-center gap-1.5 text-xs px-3 py-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors cursor-pointer border-none bg-transparent shrink-0"
            >
              <Trash2 size={13} />
              Clear
            </button>
          )}
          <input ref={inputRef} type="file" accept=".csv" className="hidden" onChange={(e) => handleFiles(e.target.files)} />
        </div>
        {parseError && (
          <p className="mt-2 text-sm text-red-500">{parseError}</p>
        )}
      </div>

      {/* AI loading banner */}
      {listings.some((l) => l.aiStatus === 'loading') && (
        <div className="mb-4 flex items-center gap-2.5 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/40 rounded-xl px-4 py-3">
          <RefreshCw size={14} className="text-blue-500 animate-spin shrink-0" />
          <p className="text-blue-700 dark:text-blue-300 text-sm">
            Generating AI tag suggestions for all listings…{' '}
            {listings.filter((l) => l.aiStatus === 'done').length}/{listings.length} done
          </p>
        </div>
      )}

      {/* Results */}
      {listings.length > 0 && (
        <>
          <ListingsSummaryStrip listings={listings} />
          <ListingsTable
            listings={listings}
            onRetryAI={(index) => {
              void runAIForListing(index, activeProvider, keys[activeProvider]);
            }}
          />
        </>
      )}

      {/* Empty state */}
      {listings.length === 0 && !parseError && (
        <div className="text-center py-16 text-slate-400">
          <Upload size={32} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">Upload a CSV to start analyzing your listings</p>
        </div>
      )}
    </div>
  );
}
```

**Step 2: Remove the stub file** from Task 5 if you created one (the real `ListingsView.tsx` now exists).

**Step 3: Commit**

```bash
git add src/components/listings/ListingsView.tsx
git commit -m "feat(listings): add ListingsView with upload, batch AI, and state orchestration"
```

---

## Task 10: End-to-End Verification

**Step 1: Start dev server**
```bash
npm run dev
```

**Step 2: Verify navigation**
- Sidebar shows "Listings" with a list icon (not "Analytics")
- Mobile bottom nav shows "Listings"
- Clicking it renders the empty upload state

**Step 3: Upload the CSV**
- Upload `/Users/alecgiljohann/Downloads/EtsyListingsDownload.csv`
- Verify ~50 listings appear in the table (not 1,029 — multi-line parsing should work)
- Summary strip shows Avg Score, Tag Gaps, Low Images, AI Tags Ready

**Step 4: Verify scoring**
- Scores should vary across listings (some red/yellow/green)
- Click a row to expand — verify current tags, sub-score detail cards

**Step 5: Verify AI batch (with key)**
- If API key is present, blue loading banner should appear immediately after upload
- Expanded row "AI Suggested Tags" section shows chips once done
- Copy All button works

**Step 6: Verify AI retry (with no key)**
- Clear the key, upload CSV
- Tags show "Waiting for API key…"
- Add key, click Retry on one listing

**Step 7: Final commit**
```bash
git add -A
git commit -m "feat(listings): complete listing analysis tool — all 50 listings scored + batch AI tags"
```
