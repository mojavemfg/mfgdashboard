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

      {/* Description + Images + Price row */}
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
