# Listing Analysis Tool — Design Doc
**Date:** 2026-02-20
**Status:** Approved

## Overview

Replace the "Analytics" tab (currently `id: 'charts'`, showing inventory/consumption charts) with a Listing Analysis tool. The tool ingests an Etsy CSV export (~50 listings), scores each listing across multiple quality dimensions, and fires batch AI requests on upload to generate suggested replacement tags for every listing.

## Goals

- Batch-analyze all Etsy listings from a CSV export in one upload
- Surface SEO quality issues (tag gaps, low char utilization, missing slots)
- Score title quality, image fill, description length/structure, and price positioning
- Provide AI-generated tag suggestions for every listing simultaneously
- Reuse existing API key infrastructure from EtsySeoTool

## Non-Goals

- Persisting listing data across sessions (ephemeral, like Sales Map)
- Writing changes back to Etsy
- Analyzing more than one CSV at a time

---

## Architecture

### Data Flow

```
Upload CSV → parseListingsCsv() → EtsyListing[]
                                        ↓
                               scoreListing() × N   (instant, rule-based)
                                        ↓
                               callAI() × N in parallel  (batch, on upload)
                                        ↓
                               ScoredListing[] → useState → render
```

### State

All state lives in the `ListingsView` component — no new hooks or global state. Data is not persisted (cleared on page refresh).

### File Structure

```
src/
  lib/
    parseListingsCsv.ts      — CSV → EtsyListing[]
    scoreListings.ts         — EtsyListing → ScoredListing (rule-based)
  components/
    listings/
      ListingsView.tsx       — top-level view, manages state + AI calls
      ListingsSummaryStrip.tsx — store-health KPI row
      ListingsTable.tsx      — sortable/filterable table
      ListingRowExpanded.tsx — per-listing detail panel
  types/index.ts             — add EtsyListing, ScoredListing types
```

---

## Scoring Algorithm

Overall score = weighted sum of sub-scores (0–100 each).

| Dimension | Weight | Calculation |
|---|---|---|
| **SEO / Tags** | 40% | Slot fill (13 tags = 100%) + avg char length toward 20-char limit + long-tail ratio (multi-word tags) |
| **Title** | 20% | 40–140 chars = full marks; penalty below 20 or above 140 |
| **Images** | 15% | images filled / 10 × 100 |
| **Description** | 15% | >200 chars = full marks; presence of newlines/bullets adds bonus |
| **Price** | 10% | Z-score vs catalog median; outliers (>2σ) lose points |

**Score badge colors:**
- ≥75 → green
- 50–74 → yellow
- <50 → red

---

## UI Layout

### Summary Strip (top)
Three KPI chips: Avg Score, Listings with Tag Gaps, Listings with <5 Images.

### Toolbar
- Upload CSV button (drag-drop or file picker)
- Sort dropdown (by score, title, price, image count)
- Filter toggle: All / Needs Work (score <75)
- API Key settings (collapsible, reuses existing localStorage keys + provider selection from EtsySeoTool)

### Listings Table
Columns: #, Title (truncated), Overall Score badge, Tags chip, Title chip, Images chip, expand chevron.

### Expanded Row
- Tag Analysis: `12/13 filled · 3 tags under 15 chars · 2 single-word tags`
- AI Suggested Tags: chips with char counts + Copy All button (same TagCard style as EtsySeoTool)
- Description: char count + quality note
- Images: `N/10 filled`
- Price: value + catalog position note

---

## AI Integration

- Reuses `callAI()` logic from `EtsySeoTool` (Claude/Gemini/OpenAI, same localStorage keys)
- On CSV upload: fire all N requests in parallel via `Promise.allSettled()`
- Failed AI calls show a "retry" button per listing; other listings are unaffected
- AI status shown per-listing: loading spinner → tags / error state

---

## Navigation Changes

- `App.tsx`: change `View` type — replace `'charts'` with `'listings'`
- `Sidebar.tsx`: change label "Analytics" → "Listings", icon `BarChart2` → `LayoutList`
- `BottomNav.tsx`: same label/icon change
- `Dashboard.tsx`: replace `activeView === 'charts'` branch with `activeView === 'listings'`
