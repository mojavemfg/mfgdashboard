import { useState } from 'react';

export interface AppSettings {
  shopName: string;
  etsyShopName: string;
  branding: {
    companyName: string;
    logoUrl: string;       // data-URL from file upload
  };
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
  branding: {
    companyName: '',
    logoUrl: '',
  },
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

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (!isPlainObject(parsed)) return DEFAULT_SETTINGS;
      return {
        ...DEFAULT_SETTINGS,
        ...parsed,
        branding:  isPlainObject(parsed.branding)  ? { ...DEFAULT_SETTINGS.branding,  ...parsed.branding  } : DEFAULT_SETTINGS.branding,
        printing:  isPlainObject(parsed.printing)  ? { ...DEFAULT_SETTINGS.printing,  ...parsed.printing  } : DEFAULT_SETTINGS.printing,
        etsyFees:  isPlainObject(parsed.etsyFees)  ? { ...DEFAULT_SETTINGS.etsyFees,  ...parsed.etsyFees  } : DEFAULT_SETTINGS.etsyFees,
        inventory: isPlainObject(parsed.inventory) ? { ...DEFAULT_SETTINGS.inventory, ...parsed.inventory } : DEFAULT_SETTINGS.inventory,
      } as AppSettings;
    }
  } catch (e) {
    if (import.meta.env.DEV) {
      console.warn('[useSettings] Failed to parse localStorage settings:', e);
    }
  }
  return DEFAULT_SETTINGS;
}

export type SettingsUpdate = Partial<Omit<AppSettings, 'branding' | 'printing' | 'etsyFees' | 'inventory'>> & {
  branding?:  Partial<AppSettings['branding']>;
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
        branding:  { ...prev.branding,  ...(partial.branding  ?? {}) },
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
