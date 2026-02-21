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

  const inputCls = [
    'w-full bg-[var(--color-bg)] border border-[var(--color-border)]',
    'text-[var(--color-text-primary)] text-sm rounded-[var(--radius-md)] px-3.5 py-2.5',
    'placeholder:text-[var(--color-text-tertiary)] focus:outline-none',
    'focus:border-[var(--color-brand)] focus:shadow-[0_0_0_3px_var(--color-brand-subtle)] transition-colors',
  ].join(' ');
  const activeProviderConfig = PROVIDERS.find((p) => p.id === activeProvider)!;

  return (
    <div className="max-w-5xl mx-auto pb-24 sm:pb-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight text-[var(--color-text-primary)]">Listing Analysis</h1>
        <p className="text-sm text-[var(--color-text-tertiary)] mt-1">Upload your Etsy listings CSV to score SEO quality across all listings</p>
      </div>

      {/* API Key Panel */}
      <div className="mb-4 bg-[var(--color-bg)] rounded-[var(--radius-lg)] border border-[var(--color-border)] overflow-hidden">
        <button
          onClick={() => setShowKeyPanel((p) => !p)}
          className="w-full flex items-center justify-between px-4 py-3 cursor-pointer border-none bg-transparent text-left"
        >
          <div className="flex items-center gap-2.5">
            <Key size={15} className={hasKey ? 'text-[var(--color-success)]' : 'text-[var(--color-text-tertiary)]'} />
            <span className="text-sm font-medium text-[var(--color-text-secondary)]">
              {hasKey ? `${activeProviderConfig.label} API Key connected` : 'Connect AI API Key for tag suggestions'}
            </span>
            {hasKey && (
              <span className="text-[10px] bg-[var(--color-success-subtle)] text-[var(--color-success)] border border-[var(--color-success-border)] px-2 py-0.5 rounded-[var(--radius-full)] font-medium">
                ACTIVE
              </span>
            )}
          </div>
          {showKeyPanel ? <ChevronUp size={16} className="text-[var(--color-text-tertiary)]" /> : <ChevronDown size={16} className="text-[var(--color-text-tertiary)]" />}
        </button>

        {showKeyPanel && (
          <div className="border-t border-[var(--color-border)]">
            <div role="tablist" className="flex gap-1 p-3 pb-0">
              {PROVIDERS.map((p) => (
                <button
                  key={p.id}
                  role="tab"
                  aria-selected={activeProvider === p.id}
                  onClick={() => switchProvider(p.id)}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-[var(--radius-md)] transition-all cursor-pointer border-none ${
                    activeProvider === p.id
                      ? 'bg-[var(--color-brand)] text-white'
                      : 'bg-[var(--color-bg-subtle)] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]'
                  }`}
                >
                  {p.label}
                  {keys[p.id] && <span className="ml-1 inline-block w-1.5 h-1.5 rounded-[var(--radius-full)] bg-[var(--color-success)] align-middle" />}
                </button>
              ))}
            </div>
            <div className="px-4 pb-4 pt-3 space-y-3">
              <p className="text-[var(--color-text-tertiary)] text-xs leading-relaxed">
                Stored locally, only sent to {activeProviderConfig.label}'s API. Get one at{' '}
                <a href={activeProviderConfig.console} target="_blank" rel="noreferrer" className="text-[var(--color-brand)] hover:underline inline-flex items-center gap-0.5">
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
                  className="px-4 py-2.5 bg-[var(--color-brand)] hover:bg-[var(--color-brand-hover)] disabled:opacity-40 text-white text-sm font-medium rounded-[var(--radius-lg)] transition-colors cursor-pointer border-none shrink-0"
                >
                  Save
                </button>
              </div>
              {keys[activeProvider] && (
                <button onClick={clearKey} className="text-xs text-[var(--color-danger)] hover:opacity-80 cursor-pointer border-none bg-transparent p-0 transition-colors">
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
          className={[
            'flex items-center gap-3 border-2 border-dashed rounded-[var(--radius-lg)] px-4 py-4 cursor-pointer transition-colors duration-150',
            dragging
              ? 'border-[var(--color-brand)] bg-[var(--color-brand-subtle)]'
              : 'border-[var(--color-border)] hover:border-[var(--color-brand)] hover:bg-[var(--color-brand-subtle)]',
          ].join(' ')}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
        >
          <Upload size={18} className="text-[var(--color-text-tertiary)] shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-[var(--color-text-secondary)] font-medium">
              {listings.length > 0
                ? `${listings.length} listings loaded — drop another CSV to replace`
                : 'Drop your Etsy Listings CSV here, or click to browse'}
            </p>
            <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">
              Export from Etsy › Shop Manager › Listings › Download CSV
            </p>
          </div>
          {listings.length > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); setListings([]); }}
              className="flex items-center gap-1.5 text-xs px-3 py-2 text-[var(--color-danger)] hover:bg-[var(--color-danger-subtle)] rounded-[var(--radius-md)] transition-colors cursor-pointer border-none bg-transparent shrink-0"
            >
              <Trash2 size={13} />
              Clear
            </button>
          )}
          <input ref={inputRef} type="file" accept=".csv" className="hidden" onChange={(e) => handleFiles(e.target.files)} />
        </div>
        {parseError && (
          <p className="mt-2 text-sm text-[var(--color-danger)]">{parseError}</p>
        )}
      </div>

      {/* AI loading banner */}
      {listings.some((l) => l.aiStatus === 'loading') && (
        <div className="mb-4 flex items-center gap-2.5 bg-[var(--color-brand-subtle)] border border-[var(--color-brand-border)] rounded-[var(--radius-lg)] px-4 py-3">
          <RefreshCw size={14} className="text-[var(--color-brand)] animate-spin shrink-0" />
          <p className="text-[var(--color-brand)] text-sm">
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
        <div className="text-center py-16 text-[var(--color-text-tertiary)]">
          <Upload size={32} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">Upload a CSV to start analyzing your listings</p>
        </div>
      )}
    </div>
  );
}
