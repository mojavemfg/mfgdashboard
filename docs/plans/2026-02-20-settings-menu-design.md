# Settings Menu Design

**Date:** 2026-02-20
**Status:** Approved

## Overview

Add a full Settings view to the MFG Ops dashboard. Two-panel layout (left: subsection nav, right: active section form). Mobile drill-down (list → detail). All data persists to localStorage only.

## Architecture

Add `'settings'` to the `View` type in `App.tsx`. `SettingsView` renders the two-panel shell. No router needed — `activeSection` state drives which section is visible.

### New Files

```
src/hooks/useSettings.ts
src/components/settings/SettingsView.tsx
src/components/settings/SettingsNav.tsx
src/components/settings/sections/ShopProfileSection.tsx
src/components/settings/sections/PrintingDefaultsSection.tsx
src/components/settings/sections/EtsyFeesSection.tsx
src/components/settings/sections/InventoryAlertsSection.tsx
src/components/settings/sections/AppearanceSection.tsx
src/components/settings/sections/DataManagementSection.tsx
```

### Modified Files

- `src/App.tsx` — add `'settings'` to `View` type, pass `settings` + `updateSettings` down
- `src/components/layout/Sidebar.tsx` — add Settings nav item (bottom-pinned, `Settings` icon)
- `src/components/layout/BottomNav.tsx` — add Settings nav item
- `src/pages/Dashboard.tsx` — render `SettingsView` for `activeView === 'settings'`
- `src/components/margin/MarginCalculatorView.tsx` — read printing defaults + Etsy fees from settings instead of hardcoded constants

## Settings Sections

| Section | Icon | Configures |
|---|---|---|
| Shop Profile | `Store` | Business name, Etsy shop name, currency |
| Printing Defaults | `Printer` | Default printer watts, kWh rate |
| Etsy Fees | `BadgeDollarSign` | Listing fee, transaction %, processing % + fixed |
| Inventory Alerts | `Bell` | Critical/warning stock multipliers |
| Appearance | `Palette` | Dark/light theme toggle |
| Data Management | `Database` | Export all data as JSON, clear individual stores |

## Data Model

Single `'mfg_settings'` key in localStorage.

```ts
interface AppSettings {
  shopName: string;
  etsyShopName: string;
  currency: 'USD';
  printing: {
    defaultWatts: number;      // was hardcoded 250
    defaultKwhRate: number;    // was hardcoded 0.13
  };
  etsyFees: {
    listingFee: number;        // was hardcoded 0.20
    transactionRate: number;   // was hardcoded 0.065
    processingRate: number;    // was hardcoded 0.03
    processingFixed: number;   // was hardcoded 0.25
  };
  inventory: {
    criticalMultiplier: number;
    warningMultiplier: number;
  };
}
```

`useSettings` returns `{ settings, update }` where `update` accepts a partial and deep-merges.

## Integration Points

- `MarginCalculatorView` reads `settings.printing` for BLANK_STATE and `settings.etsyFees` for fee constants
- `useTheme` stays unchanged; Appearance section calls the same `toggle`
- Settings nav item is pinned to the bottom of the sidebar, separated from main nav items

## Mobile Behavior

- List view: shows all 6 sections as tappable rows
- Tap a section → slides to detail with a back button
- Controlled by `activeSectionId` state (null = list, string = detail)
