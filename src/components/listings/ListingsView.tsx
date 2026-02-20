import { useState, useRef } from 'react';
import { Upload, Trash2, Key, ChevronDown, ChevronUp, ExternalLink, RefreshCw } from 'lucide-react';
import { parseListingsCsv } from '@/lib/parseListingsCsv';
import { scoreListings } from '@/lib/scoreListings';
import { fetchAITags, getActiveProvider, getApiKey } from '@/lib/callListingAI';
import { ListingsSummaryStrip } from './ListingsSummaryStrip';
import { ListingsTable } from './ListingsTable';
import type { ScoredListing } from '@/types';

type ProviderId = 'claude' | 'gemini' | 'openai';

const PROVIDERS: {
  id: ProviderId;
  label: string;
  storageKey: string;
  placeholder: string;
  console: string;
  consoleLabel: string;
}[] = [
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

  // Pass title/description directly to avoid stale-closure issues with listings state
  async function runAIForListing(
    index: number,
    title: string,
    description: string,
    provider: ProviderId,
    apiKey: string,
  ) {
    setListings((prev) =>
      prev.map((l) => l.index === index ? { ...l, aiStatus: 'loading' } : l)
    );
    try {
      const tags = await fetchAITags(title, description, provider, apiKey);
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
    const { listings: parsed } = parseListingsCsv(text);

    if (parsed.length === 0) {
      setParseError('No listings found. Make sure this is an Etsy Listings CSV export.');
      return;
    }

    const scored = scoreListings(parsed);
    setListings(scored);

    const provider = getActiveProvider() as ProviderId;
    const apiKey = getApiKey(provider);
    if (!apiKey) return;

    // Fire all AI calls in parallel — each updates its own listing as it resolves
    await Promise.allSettled(
      scored.map((l) => runAIForListing(l.index, l.title, l.description, provider, apiKey))
    );
  }

  function handleFiles(files: FileList | null) {
    if (!files?.[0]) return;
    void processFile(files[0]);
  }

  const inputCls = 'w-full bg-white dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700/60 text-slate-900 dark:text-slate-200 text-sm rounded-xl px-3.5 py-2.5 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors';
  const activeProviderConfig = PROVIDERS.find((p) => p.id === activeProvider)!;

  return (
    <div className="max-w-5xl mx-auto pb-24 sm:pb-8">
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

      {/* Upload drop zone */}
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
              const l = listings.find((x) => x.index === index);
              if (l) void runAIForListing(index, l.title, l.description, activeProvider, keys[activeProvider]);
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
