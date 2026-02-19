# Refined Description — Etsy SEO Tool

**Date:** 2026-02-19
**Scope:** `src/components/seo/EtsySeoTool.tsx` (single file, no new files)

---

## Goal

Add a "Refined Description" section to the Etsy SEO Tool. A separate AI call generates a conversion-optimized listing description in the format Etsy displays above the fold, editable inline before copying.

---

## Trigger

A second independent button — "Generate Description" — placed below the existing "Generate SEO Tags" button in the input card. Both buttons are independently enabled/disabled via `canAnalyze`. Users can run either or both in any order.

---

## State

Two new state variables added to `EtsySeoTool`:

```ts
const [descStatus, setDescStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
const [refinedDescription, setRefinedDescription] = useState('');
const [descError, setDescError] = useState('');
const [copiedDesc, setCopiedDesc] = useState(false);
```

No changes to existing tag state (`status`, `result`, etc.).

---

## AI Prompt

New `buildDescriptionPrompt(title, description, category)` function returning plain text instructions:

**Output format (plain text, no JSON, no markdown):**
```
[Hook paragraph — 2-3 sentences, conversational, buyer-focused,
 front-loads the most compelling benefit. Must hook on sentence 1
 since Etsy shows only the first ~3 lines before "Show full description".]

• [Feature/spec/benefit bullet]
• [Feature/spec/benefit bullet]
• [Feature/spec/benefit bullet]
• [Feature/spec/benefit bullet]

[One-sentence CTA — e.g. "Order yours today and it ships within 2-3 business days."]
```

**Prompt instructions to AI:**
- Hook must address the buyer directly and lead with the primary benefit
- Bullets cover: materials, dimensions/size, use case, gifting angle, care/shipping note
- No markdown bold/italic — plain text only for direct Etsy paste
- Tone: warm, confident, specific (no filler words like "beautiful" or "perfect")

---

## API Layer

New `buildDescriptionPrompt()` alongside existing `buildPrompt()`. The `callAI()` dispatcher is reused — a new `generateDescription()` async function calls `callAI()` with the description prompt and expects a plain-text string response instead of JSON.

Each provider extracts the plain-text response:
- Claude: `data.content[0].text`
- Gemini: `data.candidates[0].content.parts[0].text`
- OpenAI: `data.choices[0].message.content`

---

## UI Changes

### Input card — second button below existing CTA
```
[ ✦ Generate SEO Tags        ]   ← existing orange button (unchanged)
[ ✦ Generate Description     ]   ← new slate-colored secondary button
```

- Same disabled logic as tags button (`canAnalyze`)
- Loading text: "Writing description with [Provider]…"
- Does not affect tag button state or vice versa

### New result card — below tags results
```
┌─────────────────────────────────────────┐
│ ✦ Refined Description          [Copy]   │
│─────────────────────────────────────────│
│ [editable textarea — pre-filled with    │
│  generated text, rows=8, resizable]     │
│                                         │
│ ✦ Optimized for Etsy's above-the-fold  │
│   hook visibility                       │
└─────────────────────────────────────────┘
```

- Textarea uses existing `inputCls` styling
- Copy button mirrors "Copy all tags" button style; shows checkmark for 2s after copy
- Card appears when `descStatus === 'done'`, even if tags haven't been run
- Error state shows inline below the button (same pattern as tag error)

---

## Constraints

- No new files — all changes in `EtsySeoTool.tsx`
- Reuses existing `callAI()` dispatcher, `activeProvider`, `keys` state
- No new imports needed beyond what's already imported
