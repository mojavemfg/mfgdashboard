# Settings Menu Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a full two-panel Settings view with 6 subsections, all persisted to localStorage.

**Architecture:** `useSettings` hook owns a single `'mfg_settings'` localStorage key. `App.tsx` instantiates it and passes `settings` + `updateSettings` down to `Dashboard`, which forwards them to `SettingsView` and `MarginCalculatorView`. `SettingsView` owns `activeSectionId` state for panel navigation. Mobile collapses to drill-down (list → detail).

**Tech Stack:** React 18, TypeScript, Tailwind CSS, Lucide React icons, localStorage

---

### Task 1: Create `useSettings` hook

**Files:**
- Create: `src/hooks/useSettings.ts`

**Step 1: Create the file**

```ts
// src/hooks/useSettings.ts
import { useState } from 'react';

export interface AppSettings {
  shopName: string;
  etsyShopName: string;
  printing: {
    defaultWatts: number;
    defaultKwhRate: number;
  };
  etsyFees: {
    listingFee: number;
    transactionRate: number;
    processingRate: number;
    processingFixed: number;
  };
  inventory: {
    criticalMultiplier: number;
    warningMultiplier: number;
  };
}

export const DEFAULT_SETTINGS: AppSettings = {
  shopName: '',
  etsyShopName: '',
  printing: {
    defaultWatts: 250,
    defaultKwhRate: 0.13,
  },
  etsyFees: {
    listingFee: 0.20,
    transactionRate: 0.065,
    processingRate: 0.03,
    processingFixed: 0.25,
  },
  inventory: {
    criticalMultiplier: 1.0,
    warningMultiplier: 1.5,
  },
};

const LS_KEY = 'mfg_settings';

function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<AppSettings>;
      return {
        ...DEFAULT_SETTINGS,
        ...parsed,
        printing:   { ...DEFAULT_SETTINGS.printing,   ...(parsed.printing   ?? {}) },
        etsyFees:   { ...DEFAULT_SETTINGS.etsyFees,   ...(parsed.etsyFees   ?? {}) },
        inventory:  { ...DEFAULT_SETTINGS.inventory,  ...(parsed.inventory  ?? {}) },
      };
    }
  } catch { /* ignore */ }
  return DEFAULT_SETTINGS;
}

type SettingsUpdate = Partial<Omit<AppSettings, 'printing' | 'etsyFees' | 'inventory'>> & {
  printing?:  Partial<AppSettings['printing']>;
  etsyFees?:  Partial<AppSettings['etsyFees']>;
  inventory?: Partial<AppSettings['inventory']>;
};

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(loadSettings);

  function update(partial: SettingsUpdate) {
    setSettings((prev) => {
      const next: AppSettings = {
        ...prev,
        ...partial,
        printing:  { ...prev.printing,  ...(partial.printing  ?? {}) },
        etsyFees:  { ...prev.etsyFees,  ...(partial.etsyFees  ?? {}) },
        inventory: { ...prev.inventory, ...(partial.inventory  ?? {}) },
      };
      try { localStorage.setItem(LS_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }

  return { settings, update };
}
```

**Step 2: Verify manually**
Open browser console, run `localStorage.getItem('mfg_settings')` — should be `null` before first save.

**Step 3: Commit**
```bash
git add src/hooks/useSettings.ts
git commit -m "feat(settings): add useSettings hook with localStorage persistence"
```

---

### Task 2: Wire `'settings'` into navigation

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/layout/Sidebar.tsx`
- Modify: `src/components/layout/BottomNav.tsx`
- Modify: `src/pages/Dashboard.tsx`

**Step 1: Add `'settings'` to View type in `App.tsx`**

In `src/App.tsx`, line 11:
```ts
// Before:
export type View = 'dashboard' | 'inventory' | 'orders' | 'listings' | 'seo' | 'salesmap' | 'margin';

// After:
export type View = 'dashboard' | 'inventory' | 'orders' | 'listings' | 'seo' | 'salesmap' | 'margin' | 'settings';
```

**Step 2: Instantiate `useSettings` in `App.tsx` and pass down**

Add import at top of `src/App.tsx`:
```ts
import { useSettings } from '@/hooks/useSettings';
```

Inside `App()`, after `usePrintInventory`:
```ts
const { settings, update: updateSettings } = useSettings();
```

Add `settings`, `updateSettings`, and `onThemeToggle` to the `<Dashboard />` JSX:
```tsx
<Dashboard
  activeView={activeView}
  isDark={isDark}
  onThemeToggle={toggle}          // ADD THIS
  settings={settings}             // ADD THIS
  updateSettings={updateSettings} // ADD THIS
  salesOrders={salesOrders}
  onMergeSalesOrders={mergeSalesOrders}
  onClearSalesOrders={clearSalesOrders}
  onNavigate={setActiveView}
  printKpis={printKpis}
  printEnriched={printEnriched}
  onUpsertPrintItem={upsertPrintItem}
  onRemovePrintItem={removePrintItem}
/>
```

**Step 3: Add Settings nav item to `Sidebar.tsx`**

The Settings item is pinned to the bottom, separated from main nav. Replace the entire `Sidebar` component:

```tsx
import { LayoutDashboard, PackageSearch, ShoppingCart, LayoutList, Tag, Map, Calculator, Settings } from 'lucide-react';
import type { View } from '@/App';

interface SidebarProps {
  activeView: View;
  onViewChange: (view: View) => void;
}

const mainNavItems: { id: View; label: string; Icon: React.ComponentType<{ size?: number; className?: string }>; accent?: string }[] = [
  { id: 'dashboard', label: 'Dashboard',    Icon: LayoutDashboard },
  { id: 'inventory', label: 'Inventory',    Icon: PackageSearch },
  { id: 'orders',    label: 'Order History', Icon: ShoppingCart },
  { id: 'listings',  label: 'Listings',     Icon: LayoutList },
  { id: 'seo',       label: 'Etsy SEO',     Icon: Tag,        accent: 'orange' },
  { id: 'salesmap',  label: 'Sales Map',    Icon: Map },
  { id: 'margin',    label: 'Margin Calc',  Icon: Calculator, accent: 'emerald' },
];

function NavButton({ id, label, Icon, accent, active, onClick }: {
  id: View; label: string; Icon: React.ComponentType<{ size?: number; className?: string }>;
  accent?: string; active: boolean; onClick: () => void;
}) {
  const activeBg =
    accent === 'orange'  ? 'bg-orange-500 text-white shadow-lg shadow-orange-900/20' :
    accent === 'emerald' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20' :
                           'bg-blue-600 text-white shadow-lg shadow-blue-900/20';
  const activeIconCls =
    accent === 'orange'  ? 'text-orange-100' :
    accent === 'emerald' ? 'text-emerald-100' :
                           'text-blue-100';
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all text-left w-full cursor-pointer border-none rounded-lg ${
        active
          ? activeBg
          : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
      }`}
    >
      <Icon size={17} className={active ? activeIconCls : ''} />
      {label}
    </button>
  );
}

export function Sidebar({ activeView, onViewChange }: SidebarProps) {
  return (
    <nav className="hidden md:flex w-52 bg-white dark:bg-slate-900/60 border-r border-slate-200 dark:border-slate-700/60 flex-col pt-3 pb-4 shrink-0 px-2">
      <div className="flex-1 flex flex-col gap-0.5">
        {mainNavItems.map(({ id, label, Icon, accent }) => (
          <NavButton key={id} id={id} label={label} Icon={Icon} accent={accent}
            active={activeView === id} onClick={() => onViewChange(id)} />
        ))}
      </div>
      <div className="border-t border-slate-200 dark:border-slate-700/60 pt-2 mt-2">
        <NavButton id="settings" label="Settings" Icon={Settings}
          active={activeView === 'settings'} onClick={() => onViewChange('settings')} />
      </div>
    </nav>
  );
}
```

**Step 4: Add Settings to `BottomNav.tsx`**

Add `Settings` to the import line and append to `navItems`:
```ts
import { LayoutDashboard, PackageSearch, ShoppingCart, LayoutList, Tag, Map, Calculator, Settings } from 'lucide-react';

const navItems = [
  { id: 'dashboard', label: 'Dashboard',  Icon: LayoutDashboard },
  { id: 'inventory', label: 'Inventory',  Icon: PackageSearch },
  { id: 'orders',    label: 'Orders',     Icon: ShoppingCart },
  { id: 'listings',  label: 'Listings',   Icon: LayoutList },
  { id: 'seo',       label: 'Etsy SEO',   Icon: Tag,        accent: 'orange' },
  { id: 'salesmap',  label: 'Sales Map',  Icon: Map },
  { id: 'margin',    label: 'Margin',     Icon: Calculator, accent: 'emerald' },
  { id: 'settings',  label: 'Settings',   Icon: Settings },
];
```

**Step 5: Update `Dashboard.tsx` to accept new props**

Update `DashboardProps` interface:
```ts
interface DashboardProps {
  activeView: View;
  isDark: boolean;
  onThemeToggle: () => void;       // ADD
  settings: AppSettings;           // ADD (import from '@/hooks/useSettings')
  updateSettings: (p: SettingsUpdate) => void; // ADD (import SettingsUpdate type too)
  // ...rest unchanged
}
```

Update the function signature to destructure the new props. Add a stub `{activeView === 'settings' && <div>Settings coming soon</div>}` inside the `<div>` so the view navigates without crashing. You'll replace this stub in Task 3.

**Step 6: Verify manually**
Run `npm run dev`. Click Settings in the sidebar — should show "Settings coming soon". TypeScript should compile without errors.

**Step 7: Commit**
```bash
git add src/App.tsx src/components/layout/Sidebar.tsx src/components/layout/BottomNav.tsx src/pages/Dashboard.tsx
git commit -m "feat(settings): wire settings view into navigation and app shell"
```

---

### Task 3: Build `SettingsView` + `SettingsNav` shell

**Files:**
- Create: `src/components/settings/SettingsView.tsx`
- Create: `src/components/settings/SettingsNav.tsx`

**Step 1: Create `SettingsNav.tsx`**

```tsx
// src/components/settings/SettingsNav.tsx
import { Store, Printer, BadgeDollarSign, Bell, Palette, Database } from 'lucide-react';

export interface SettingsSection {
  id: string;
  label: string;
  Icon: React.ComponentType<{ size?: number; className?: string }>;
}

export const SETTINGS_SECTIONS: SettingsSection[] = [
  { id: 'shop-profile',       label: 'Shop Profile',       Icon: Store },
  { id: 'printing',           label: 'Printing Defaults',  Icon: Printer },
  { id: 'etsy-fees',          label: 'Etsy Fees',          Icon: BadgeDollarSign },
  { id: 'inventory-alerts',   label: 'Inventory Alerts',   Icon: Bell },
  { id: 'appearance',         label: 'Appearance',         Icon: Palette },
  { id: 'data-management',    label: 'Data Management',    Icon: Database },
];

interface SettingsNavProps {
  activeSectionId: string;
  onSelect: (id: string) => void;
}

export function SettingsNav({ activeSectionId, onSelect }: SettingsNavProps) {
  return (
    <nav className="flex flex-col gap-0.5">
      {SETTINGS_SECTIONS.map(({ id, label, Icon }) => {
        const active = activeSectionId === id;
        return (
          <button
            key={id}
            onClick={() => onSelect(id)}
            className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all text-left w-full cursor-pointer border-none rounded-xl ${
              active
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Icon size={17} className={active ? 'text-blue-100' : ''} />
            {label}
          </button>
        );
      })}
    </nav>
  );
}
```

**Step 2: Create `SettingsView.tsx` shell**

```tsx
// src/components/settings/SettingsView.tsx
import { useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { SettingsNav, SETTINGS_SECTIONS } from './SettingsNav';
import type { AppSettings } from '@/hooks/useSettings';
import type { SettingsUpdate } from '@/hooks/useSettings';

// Section components — will be filled in Tasks 4-9
// Import them as you build each one. For now, stub:
function PlaceholderSection({ label }: { label: string }) {
  return (
    <div className="bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/50 p-6">
      <p className="text-slate-400 dark:text-slate-500 text-sm">{label} — coming soon</p>
    </div>
  );
}

interface SettingsViewProps {
  settings: AppSettings;
  update: (partial: SettingsUpdate) => void;
  isDark: boolean;
  onThemeToggle: () => void;
}

export function SettingsView({ settings, update, isDark, onThemeToggle }: SettingsViewProps) {
  const [activeSectionId, setActiveSectionId] = useState('shop-profile');

  const activeSection = SETTINGS_SECTIONS.find((s) => s.id === activeSectionId);

  function renderSection() {
    // Replace each PlaceholderSection with real components as you build them:
    switch (activeSectionId) {
      case 'shop-profile':       return <PlaceholderSection label="Shop Profile" />;
      case 'printing':           return <PlaceholderSection label="Printing Defaults" />;
      case 'etsy-fees':          return <PlaceholderSection label="Etsy Fees" />;
      case 'inventory-alerts':   return <PlaceholderSection label="Inventory Alerts" />;
      case 'appearance':         return <PlaceholderSection label="Appearance" />;
      case 'data-management':    return <PlaceholderSection label="Data Management" />;
      default:                   return null;
    }
  }

  // On mobile: no active section → show nav list. Has active section → show detail.
  // On desktop: always show both panels.
  const showNav    = true;           // desktop always
  const showDetail = true;           // desktop always

  return (
    <div className="max-w-4xl mx-auto pb-24 md:pb-8">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6">Settings</h1>

      <div className="flex gap-6">
        {/* Left nav panel — hidden on mobile when viewing a section */}
        <div className={`shrink-0 w-52 ${activeSectionId ? 'hidden md:block' : 'block'}`}>
          <SettingsNav activeSectionId={activeSectionId} onSelect={setActiveSectionId} />
        </div>

        {/* Right content panel — hidden on mobile when no section selected */}
        <div className={`flex-1 min-w-0 ${!activeSectionId ? 'hidden md:block' : 'block'}`}>
          {/* Mobile back button */}
          <button
            onClick={() => setActiveSectionId('')}
            className="md:hidden flex items-center gap-1.5 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 mb-4 transition-colors border-none bg-transparent cursor-pointer"
          >
            <ChevronLeft size={16} />
            Settings
          </button>

          {activeSection && (
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                {activeSection.label}
              </h2>
            </div>
          )}

          {renderSection()}
        </div>
      </div>
    </div>
  );
}
```

Note: On mobile the nav shows when `activeSectionId === ''`. Clicking a nav item sets it. The back button resets to `''`. On desktop, both panels always show (CSS-handled).

**Step 3: Replace stub in `Dashboard.tsx`**

Replace `<div>Settings coming soon</div>` with:
```tsx
{activeView === 'settings' && (
  <SettingsView
    settings={settings}
    update={updateSettings}
    isDark={isDark}
    onThemeToggle={onThemeToggle}
  />
)}
```

Add the import: `import { SettingsView } from '@/components/settings/SettingsView';`

**Step 4: Verify manually**
Run `npm run dev`. Navigate to Settings. Left nav should show all 6 sections. Clicking each shows the placeholder. On narrow viewport, list → drill-down → back works.

**Step 5: Commit**
```bash
git add src/components/settings/
git commit -m "feat(settings): add SettingsView two-panel shell and nav"
```

---

### Task 4: `ShopProfileSection`

**Files:**
- Create: `src/components/settings/sections/ShopProfileSection.tsx`
- Modify: `src/components/settings/SettingsView.tsx` (swap placeholder)

**Step 1: Create the section**

```tsx
// src/components/settings/sections/ShopProfileSection.tsx
import type { AppSettings } from '@/hooks/useSettings';
import type { SettingsUpdate } from '@/hooks/useSettings';

const cardCls  = 'bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-sm dark:shadow-none p-5';
const labelCls = 'block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5';
const inputCls = 'w-full bg-white dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700/60 text-slate-900 dark:text-slate-200 text-sm rounded-xl px-3.5 py-2.5 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-blue-500 dark:focus:border-blue-500/60 transition-colors';

interface Props {
  settings: AppSettings;
  update: (p: SettingsUpdate) => void;
}

export function ShopProfileSection({ settings, update }: Props) {
  return (
    <div className={cardCls}>
      <div className="space-y-4">
        <div>
          <label className={labelCls}>Business Name</label>
          <input
            type="text"
            className={inputCls}
            value={settings.shopName}
            placeholder="Mojave MFG"
            onChange={(e) => update({ shopName: e.target.value })}
          />
        </div>
        <div>
          <label className={labelCls}>Etsy Shop Name</label>
          <input
            type="text"
            className={inputCls}
            value={settings.etsyShopName}
            placeholder="YourEtsyShop"
            onChange={(e) => update({ etsyShopName: e.target.value })}
          />
          {settings.etsyShopName && (
            <p className="mt-1.5 text-xs text-slate-400 dark:text-slate-500">
              etsy.com/shop/{settings.etsyShopName}
            </p>
          )}
        </div>
        <div>
          <label className={labelCls}>Currency</label>
          <div className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-100 dark:bg-slate-700/50 rounded-xl text-sm text-slate-500 dark:text-slate-400">
            USD — US Dollar
          </div>
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Swap placeholder in `SettingsView.tsx`**

Replace the `case 'shop-profile'` line:
```tsx
// Before:
case 'shop-profile': return <PlaceholderSection label="Shop Profile" />;
// After:
case 'shop-profile': return <ShopProfileSection settings={settings} update={update} />;
```

Add import: `import { ShopProfileSection } from './sections/ShopProfileSection';`

**Step 3: Verify manually**
Navigate to Settings → Shop Profile. Type in Business Name — changes should persist through page refresh (check `localStorage.getItem('mfg_settings')` in console).

**Step 4: Commit**
```bash
git add src/components/settings/sections/ShopProfileSection.tsx src/components/settings/SettingsView.tsx
git commit -m "feat(settings): add ShopProfile section"
```

---

### Task 5: `PrintingDefaultsSection`

**Files:**
- Create: `src/components/settings/sections/PrintingDefaultsSection.tsx`
- Modify: `src/components/settings/SettingsView.tsx` (swap placeholder)

**Step 1: Create the section**

```tsx
// src/components/settings/sections/PrintingDefaultsSection.tsx
import type { AppSettings } from '@/hooks/useSettings';
import type { SettingsUpdate } from '@/hooks/useSettings';

const cardCls  = 'bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-sm dark:shadow-none p-5';
const labelCls = 'block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5';
const numCls   = 'w-full bg-white dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700/60 text-slate-900 dark:text-slate-200 text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-blue-500 dark:focus:border-blue-500/60 transition-colors tabular-nums';
const hintCls  = 'mt-1.5 text-xs text-slate-400 dark:text-slate-500';

interface Props {
  settings: AppSettings;
  update: (p: SettingsUpdate) => void;
}

export function PrintingDefaultsSection({ settings, update }: Props) {
  return (
    <div className={cardCls}>
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
        These values pre-fill the Margin Calculator for new calculations.
      </p>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Printer Wattage (W)</label>
          <input
            type="number"
            className={numCls}
            value={settings.printing.defaultWatts}
            min={0}
            step={10}
            onChange={(e) => update({ printing: { defaultWatts: parseFloat(e.target.value) || 0 } })}
          />
          <p className={hintCls}>Typical range: 100–500W</p>
        </div>
        <div>
          <label className={labelCls}>Electricity Rate ($/kWh)</label>
          <input
            type="number"
            className={numCls}
            value={settings.printing.defaultKwhRate}
            min={0}
            step={0.01}
            onChange={(e) => update({ printing: { defaultKwhRate: parseFloat(e.target.value) || 0 } })}
          />
          <p className={hintCls}>US average ~$0.13</p>
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Swap placeholder in `SettingsView.tsx`**
```tsx
case 'printing': return <PrintingDefaultsSection settings={settings} update={update} />;
```

**Step 3: Verify manually**
Change printer wattage. Reload page. Navigate to Margin Calculator — new calculation should use updated default (after Task 6 integration).

**Step 4: Commit**
```bash
git add src/components/settings/sections/PrintingDefaultsSection.tsx src/components/settings/SettingsView.tsx
git commit -m "feat(settings): add PrintingDefaults section"
```

---

### Task 6: `EtsyFeesSection` + integrate `MarginCalculatorView`

**Files:**
- Create: `src/components/settings/sections/EtsyFeesSection.tsx`
- Modify: `src/components/settings/SettingsView.tsx` (swap placeholder)
- Modify: `src/components/margin/MarginCalculatorView.tsx`
- Modify: `src/pages/Dashboard.tsx` (pass settings to MarginCalculatorView)

**Step 1: Create `EtsyFeesSection.tsx`**

```tsx
// src/components/settings/sections/EtsyFeesSection.tsx
import type { AppSettings } from '@/hooks/useSettings';
import type { SettingsUpdate } from '@/hooks/useSettings';

const cardCls  = 'bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-sm dark:shadow-none p-5';
const labelCls = 'block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5';
const numCls   = 'w-full bg-white dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700/60 text-slate-900 dark:text-slate-200 text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-blue-500 dark:focus:border-blue-500/60 transition-colors tabular-nums';
const hintCls  = 'mt-1.5 text-xs text-slate-400 dark:text-slate-500';

interface Props {
  settings: AppSettings;
  update: (p: SettingsUpdate) => void;
}

export function EtsyFeesSection({ settings, update }: Props) {
  const f = settings.etsyFees;
  return (
    <div className="space-y-4">
      <div className={cardCls}>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          These rates feed directly into the Margin Calculator. Update them if Etsy changes their fee structure.
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Listing Fee ($)</label>
            <input type="number" className={numCls} value={f.listingFee} min={0} step={0.01}
              onChange={(e) => update({ etsyFees: { listingFee: parseFloat(e.target.value) || 0 } })} />
            <p className={hintCls}>Per-sale listing renewal</p>
          </div>
          <div>
            <label className={labelCls}>Transaction Rate (%)</label>
            <input type="number" className={numCls} value={(f.transactionRate * 100).toFixed(1)} min={0} max={100} step={0.1}
              onChange={(e) => update({ etsyFees: { transactionRate: (parseFloat(e.target.value) || 0) / 100 } })} />
            <p className={hintCls}>Currently 6.5%</p>
          </div>
          <div>
            <label className={labelCls}>Processing Rate (%)</label>
            <input type="number" className={numCls} value={(f.processingRate * 100).toFixed(1)} min={0} max={100} step={0.1}
              onChange={(e) => update({ etsyFees: { processingRate: (parseFloat(e.target.value) || 0) / 100 } })} />
            <p className={hintCls}>Etsy Payments %</p>
          </div>
          <div>
            <label className={labelCls}>Processing Fixed ($)</label>
            <input type="number" className={numCls} value={f.processingFixed} min={0} step={0.01}
              onChange={(e) => update({ etsyFees: { processingFixed: parseFloat(e.target.value) || 0 } })} />
            <p className={hintCls}>Flat fee per transaction</p>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/40 rounded-2xl p-4">
        <p className="text-xs text-blue-700 dark:text-blue-400">
          Verify current rates at <span className="font-semibold">etsy.com/seller-handbook</span> — Etsy occasionally adjusts fees.
        </p>
      </div>
    </div>
  );
}
```

**Step 2: Swap placeholder in `SettingsView.tsx`**
```tsx
case 'etsy-fees': return <EtsyFeesSection settings={settings} update={update} />;
```

**Step 3: Update `MarginCalculatorView.tsx` to accept and use settings**

Add `settings` prop. The key changes:

Add to the import at the top:
```ts
import type { AppSettings } from '@/hooks/useSettings';
```

Update `MarginCalculatorView` function signature:
```tsx
export function MarginCalculatorView({ settings }: { settings?: AppSettings }) {
```

Replace the hardcoded values in `BLANK_STATE` with a function that reads from settings:
```ts
// Replace static BLANK_STATE object with a function:
function getBlankState(settings?: AppSettings) {
  return {
    filamentId: 'pla',
    filamentGrams: 100,
    printHours: 4,
    printerWatts: settings?.printing.defaultWatts ?? 250,
    kwHRate: settings?.printing.defaultKwhRate ?? 0.13,
    packagingItems: [{ id: 'pkg-default', name: 'Box / Mailer', cost: 0.75 }] as PackagingItem[],
    hardwareItems: [] as HardwareItem[],
  };
}
```

Update `useState` calls to use `getBlankState(settings)` instead of `BLANK_STATE`:
```ts
const [printerWatts, setPrinterWatts] = useState(() => settings?.printing.defaultWatts ?? 250);
const [kwHRate, setKwHRate]           = useState(() => settings?.printing.defaultKwhRate ?? 0.13);
```

Update the `resetState` function:
```ts
function resetState() {
  const blank = getBlankState(settings);
  setFilamentId(blank.filamentId);
  setFilamentGrams(blank.filamentGrams);
  setPrintHours(blank.printHours);
  setPrinterWatts(blank.printerWatts);
  setKwHRate(blank.kwHRate);
  setPackagingItems(blank.packagingItems);
  setHardwareItems([]);
}
```

Replace the four hardcoded fee constants at lines 39-42 with reads from settings (keeping the exports as fallbacks for any imports):
```ts
// Keep these as named constants (they're exported and used in ResultsPanel directly)
// In MarginCalculatorView, derive live values from settings:
const liveFees = {
  listingFee:      settings?.etsyFees.listingFee      ?? LISTING_FEE,
  transactionRate: settings?.etsyFees.transactionRate ?? TRANSACTION_RATE,
  processingRate:  settings?.etsyFees.processingRate  ?? PROCESSING_RATE,
  processingFixed: settings?.etsyFees.processingFixed ?? PROCESSING_FIXED,
};
```

Pass `liveFees` into `calcCosts`, `marginFromPrice`, `priceFromMargin`, and `ResultsPanel` where those constants are used. This requires updating function signatures — see the existing code to identify each usage of `LISTING_FEE`, `TRANSACTION_RATE`, `PROCESSING_RATE`, `PROCESSING_FIXED` and replace with the `liveFees.*` equivalents.

**Step 4: Pass `settings` to `MarginCalculatorView` in `Dashboard.tsx`**
```tsx
{activeView === 'margin' && <MarginCalculatorView settings={settings} />}
```

**Step 5: Verify manually**
Go to Settings → Etsy Fees, change transaction rate to 7%. Open Margin Calculator, run a calculation. The displayed fee breakdown should reflect 7%.

**Step 6: Commit**
```bash
git add src/components/settings/sections/EtsyFeesSection.tsx \
        src/components/settings/SettingsView.tsx \
        src/components/margin/MarginCalculatorView.tsx \
        src/pages/Dashboard.tsx
git commit -m "feat(settings): add EtsyFees section and integrate with MarginCalculator"
```

---

### Task 7: `InventoryAlertsSection`

**Files:**
- Create: `src/components/settings/sections/InventoryAlertsSection.tsx`
- Modify: `src/components/settings/SettingsView.tsx` (swap placeholder)
- Modify: `src/hooks/usePrintInventory.ts` (read multipliers from settings)

**Step 1: Create the section**

```tsx
// src/components/settings/sections/InventoryAlertsSection.tsx
import type { AppSettings } from '@/hooks/useSettings';
import type { SettingsUpdate } from '@/hooks/useSettings';

const cardCls  = 'bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-sm dark:shadow-none p-5';
const labelCls = 'block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5';
const numCls   = 'w-full bg-white dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700/60 text-slate-900 dark:text-slate-200 text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-blue-500 dark:focus:border-blue-500/60 transition-colors tabular-nums';

interface Props {
  settings: AppSettings;
  update: (p: SettingsUpdate) => void;
}

export function InventoryAlertsSection({ settings, update }: Props) {
  const inv = settings.inventory;
  return (
    <div className="space-y-4">
      <div className={cardCls}>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Alert thresholds are calculated as a multiple of each item's safety stock level.
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Critical Threshold (×)</label>
            <input
              type="number"
              className={numCls}
              value={inv.criticalMultiplier}
              min={0.1}
              max={inv.warningMultiplier - 0.1}
              step={0.1}
              onChange={(e) => update({ inventory: { criticalMultiplier: parseFloat(e.target.value) || 1 } })}
            />
            <p className="mt-1.5 text-xs text-red-500 dark:text-red-400">
              Stock &lt; {inv.criticalMultiplier}× safety stock → Critical
            </p>
          </div>
          <div>
            <label className={labelCls}>Warning Threshold (×)</label>
            <input
              type="number"
              className={numCls}
              value={inv.warningMultiplier}
              min={inv.criticalMultiplier + 0.1}
              step={0.1}
              onChange={(e) => update({ inventory: { warningMultiplier: parseFloat(e.target.value) || 1.5 } })}
            />
            <p className="mt-1.5 text-xs text-amber-500 dark:text-amber-400">
              Stock &lt; {inv.warningMultiplier}× safety stock → Warning
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Swap placeholder in `SettingsView.tsx`**
```tsx
case 'inventory-alerts': return <InventoryAlertsSection settings={settings} update={update} />;
```

**Step 3: Thread multipliers into `usePrintInventory.ts`**

`deriveStatus` is currently a module-level function using hardcoded `1.5`. Change it to accept multipliers:

```ts
// src/hooks/usePrintInventory.ts
// Change the hook signature:
export function usePrintInventory(criticalMultiplier = 1.0, warningMultiplier = 1.5) {
  // ...existing code...
}

// Update deriveStatus to use the params:
function deriveStatus(item: PrintItem, critMulti: number, warnMulti: number): PrintStatus {
  if (item.currentStock < item.safetyStock * critMulti) return 'Critical';
  if (item.currentStock < item.safetyStock * warnMulti) return 'Warning';
  return 'OK';
}
// Call it: deriveStatus(item, criticalMultiplier, warningMultiplier)
```

In `App.tsx`, pass multipliers from settings:
```ts
const { enriched, upsert, remove, kpis } = usePrintInventory(
  settings.inventory.criticalMultiplier,
  settings.inventory.warningMultiplier,
);
```

**Step 4: Verify manually**
Set warning multiplier to 3. Items that were "Warning" should now show as warning at a higher stock level.

**Step 5: Commit**
```bash
git add src/components/settings/sections/InventoryAlertsSection.tsx \
        src/components/settings/SettingsView.tsx \
        src/hooks/usePrintInventory.ts \
        src/App.tsx
git commit -m "feat(settings): add InventoryAlerts section and wire multipliers into usePrintInventory"
```

---

### Task 8: `AppearanceSection`

**Files:**
- Create: `src/components/settings/sections/AppearanceSection.tsx`
- Modify: `src/components/settings/SettingsView.tsx` (swap placeholder)

**Step 1: Create the section**

```tsx
// src/components/settings/sections/AppearanceSection.tsx
import { Sun, Moon } from 'lucide-react';

interface Props {
  isDark: boolean;
  onThemeToggle: () => void;
}

const cardCls = 'bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-sm dark:shadow-none p-5';

export function AppearanceSection({ isDark, onThemeToggle }: Props) {
  return (
    <div className={cardCls}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isDark
            ? <Moon size={18} className="text-slate-400" />
            : <Sun size={18} className="text-amber-500" />
          }
          <div>
            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
              {isDark ? 'Dark Mode' : 'Light Mode'}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isDark ? 'Easy on the eyes at night' : 'Better for bright environments'}
            </p>
          </div>
        </div>
        <button
          onClick={onThemeToggle}
          aria-label="Toggle theme"
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
            isDark ? 'bg-blue-600' : 'bg-slate-300'
          }`}
        >
          <span
            className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
              isDark ? 'translate-x-5.5' : 'translate-x-0.5'
            }`}
          />
        </button>
      </div>
    </div>
  );
}
```

**Step 2: Swap placeholder in `SettingsView.tsx`**
```tsx
case 'appearance': return <AppearanceSection isDark={isDark} onThemeToggle={onThemeToggle} />;
```

**Step 3: Verify manually**
Toggle in Appearance section changes theme live. Reload — persists.

**Step 4: Commit**
```bash
git add src/components/settings/sections/AppearanceSection.tsx src/components/settings/SettingsView.tsx
git commit -m "feat(settings): add Appearance section with theme toggle"
```

---

### Task 9: `DataManagementSection`

**Files:**
- Create: `src/components/settings/sections/DataManagementSection.tsx`
- Modify: `src/components/settings/SettingsView.tsx` (swap placeholder)

**Step 1: Create the section**

```tsx
// src/components/settings/sections/DataManagementSection.tsx
import { useState } from 'react';
import { Download, Trash2 } from 'lucide-react';

const cardCls   = 'bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-sm dark:shadow-none p-5';
const labelCls  = 'text-sm font-medium text-slate-800 dark:text-slate-200';
const hintCls   = 'text-xs text-slate-500 dark:text-slate-400';
const dangerCls = 'flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-700/50 last:border-0';

const DATA_STORES = [
  { key: 'mfg_settings',           label: 'App Settings' },
  { key: 'margin_filament_library', label: 'Filament Library' },
  { key: 'margin_presets',          label: 'Margin Presets' },
  { key: 'print_inventory',         label: 'Print Inventory' },
  { key: 'theme',                   label: 'Theme Preference' },
];

export function DataManagementSection() {
  const [cleared, setCleared] = useState<string | null>(null);

  function exportAll() {
    const data: Record<string, unknown> = {};
    DATA_STORES.forEach(({ key }) => {
      try {
        const raw = localStorage.getItem(key);
        if (raw) data[key] = JSON.parse(raw);
      } catch { data[key] = localStorage.getItem(key); }
    });
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `mfg-ops-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function clearStore(key: string) {
    localStorage.removeItem(key);
    setCleared(key);
    setTimeout(() => setCleared(null), 2000);
  }

  return (
    <div className="space-y-4">
      {/* Export */}
      <div className={cardCls}>
        <div className="flex items-center justify-between">
          <div>
            <p className={labelCls}>Export All Data</p>
            <p className={hintCls}>Download a JSON backup of all stored app data</p>
          </div>
          <button
            onClick={exportAll}
            className="flex items-center gap-2 px-3 py-2 text-xs font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors border-none cursor-pointer"
          >
            <Download size={13} />
            Export
          </button>
        </div>
      </div>

      {/* Clear individual stores */}
      <div className={cardCls}>
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
          Clear Data
        </p>
        <div>
          {DATA_STORES.map(({ key, label }) => (
            <div key={key} className={dangerCls}>
              <div>
                <p className={labelCls}>{label}</p>
                <p className={hintCls}>{key}</p>
              </div>
              <button
                onClick={() => clearStore(key)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/50 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer bg-transparent"
              >
                {cleared === key ? 'Cleared' : <><Trash2 size={12} /> Clear</>}
              </button>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">
          Clearing data is immediate and cannot be undone. Export first if you want a backup.
        </p>
      </div>
    </div>
  );
}
```

**Step 2: Swap placeholder in `SettingsView.tsx`**
```tsx
case 'data-management': return <DataManagementSection />;
```

**Step 3: Verify manually**
Click Export — a `.json` file downloads with all localStorage keys. Click Clear on "App Settings" — `localStorage.getItem('mfg_settings')` returns `null` in console. Reload — settings reset to defaults.

**Step 4: Commit**
```bash
git add src/components/settings/sections/DataManagementSection.tsx src/components/settings/SettingsView.tsx
git commit -m "feat(settings): add DataManagement section with export and per-store clear"
```

---

### Task 10: Final polish + remove `PlaceholderSection`

**Files:**
- Modify: `src/components/settings/SettingsView.tsx`
- Modify: `src/App.tsx` (export `SettingsUpdate` type if needed)

**Step 1: Remove `PlaceholderSection` from `SettingsView.tsx`**

Delete the `PlaceholderSection` function. Verify `renderSection()` has no remaining placeholder cases.

**Step 2: Fix mobile initial state**

On mobile, `activeSectionId` should default to `''` (empty = show nav list). On desktop, default to `'shop-profile'`.

Use a media query to pick the right default:
```ts
const [activeSectionId, setActiveSectionId] = useState(() =>
  window.matchMedia('(min-width: 768px)').matches ? 'shop-profile' : ''
);
```

**Step 3: Verify the full flow**
- Desktop: sidebar shows all 6 sections, right panel shows content, switching sections works
- Mobile: initial state shows nav list, tapping a section navigates to detail, back button returns to list
- All 6 sections save to localStorage on change
- Reload preserves all values
- MarginCalculator uses settings for fee rates and printer defaults
- Inventory thresholds affect alert counts on dashboard

**Step 4: Commit**
```bash
git add src/components/settings/SettingsView.tsx
git commit -m "feat(settings): finalize settings view, remove placeholder stubs"
```
