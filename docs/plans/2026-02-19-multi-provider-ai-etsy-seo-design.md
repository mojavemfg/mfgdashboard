# Multi-Provider AI Support — Etsy SEO Tag Generator

**Date:** 2026-02-19
**Scope:** `src/components/seo/EtsySeoTool.tsx` (single file)

---

## Goal

Allow users to choose between Claude, Gemini, and OpenAI to power the Etsy SEO tag generator, each with independently stored API keys.

---

## Providers & Models

| Provider  | Model                      | localStorage key      |
|-----------|----------------------------|-----------------------|
| Claude    | `claude-haiku-4-5-20251001`| `anthropic_api_key`   |
| Gemini    | `gemini-3-flash-preview`   | `google_api_key`      |
| OpenAI    | `gpt-4o-mini`              | `openai_api_key`      |

---

## UI Design

**Key Panel** — the existing collapsible panel gains provider tabs (Claude / Gemini / OpenAI). Each tab:
- Shows that provider's key status (connected / not set)
- Provides its own key input + Save / Remove controls
- The active tab determines which provider is used for generation

**Analyze button status text** reflects active provider:
- "Generating tags with Claude…"
- "Generating tags with Gemini…"
- "Generating tags with OpenAI…"

---

## API Layer

Replace `callClaude()` with a `callAI()` dispatcher:

```
callAI(title, description, category, provider, apiKey)
  → callClaude()   POST https://api.anthropic.com/v1/messages
  → callGemini()   POST https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent
  → callOpenAI()   POST https://api.openai.com/v1/chat/completions
```

All three functions:
- Accept the same `buildPrompt()` output
- Return `AnalysisResult` (`{ tags: TagResult[], strategy: string }`)
- Parse the same JSON schema from the response

---

## State Changes

- Add `activeProvider: 'claude' | 'gemini' | 'openai'` state (persisted to localStorage)
- Add `geminiKey`, `openAiKey` state alongside existing `apiKey` (Claude)
- `hasKey` becomes true if the active provider's key is set
- Loading text is provider-aware

---

## Constraints

- No backend — all three APIs support direct browser CORS calls
- No model selector — curated defaults only
- No new files — all changes in `EtsySeoTool.tsx`
