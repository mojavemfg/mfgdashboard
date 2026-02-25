import { Fragment, useState } from 'react';
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
    if (sortKey === 'title') {
      return sortDir === 'asc'
        ? a.title.localeCompare(b.title)
        : b.title.localeCompare(a.title);
    }
    const av =
      sortKey === 'overall' ? a.overall :
      sortKey === 'price'   ? a.price :
      sortKey === 'images'  ? a.images.length :
                              a.tags.length;
    const bv =
      sortKey === 'overall' ? b.overall :
      sortKey === 'price'   ? b.price :
      sortKey === 'images'  ? b.images.length :
                              b.tags.length;
    return sortDir === 'asc' ? av - bv : bv - av;
  });

  const sortIcon = (k: SortKey) => {
    if (sortKey !== k) return <ChevronDown size={12} className="opacity-30" />;
    return sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />;
  };

  const thCls = 'px-3 py-2.5 text-left text-[10px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider cursor-pointer select-none hover:text-[var(--color-text-primary)] transition-colors';

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
                ? 'bg-[var(--color-brand)] text-white'
                : 'bg-[var(--color-bg-muted)] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            {f === 'all' ? `All (${listings.length})` : `Needs Work (<75)`}
          </button>
        ))}
      </div>

      {/* Mobile card list — phones only (< 768px) */}
      <div className="md:hidden flex flex-col gap-2">
        {sorted.map((listing) => {
          const isExpanded = expandedIdx === listing.index;
          return (
            <div
              key={listing.index}
              className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-[var(--radius-lg)] overflow-hidden"
            >
              <button
                onClick={() => setExpandedIdx(isExpanded ? null : listing.index)}
                className="w-full p-4 text-left active:bg-[var(--color-bg-subtle)] transition-colors"
              >
                <div className="flex items-start gap-3">
                  <ScoreBadge score={listing.overall} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--color-text-primary)] line-clamp-2 leading-snug">
                      {listing.title}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-[var(--color-text-tertiary)]">
                      <span>Tags <SubScoreChip score={listing.subScores.tags} /></span>
                      <span>Title <SubScoreChip score={listing.subScores.title} /></span>
                      <span>Imgs <SubScoreChip score={listing.subScores.images} /></span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-sm font-medium text-[var(--color-text-secondary)]">${listing.price.toFixed(2)}</span>
                    <ChevronRight
                      size={14}
                      className={`text-[var(--color-text-tertiary)] transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                    />
                  </div>
                </div>
              </button>
              {isExpanded && (
                <div className="border-t border-[var(--color-border)]">
                  <ListingRowExpanded
                    listing={listing}
                    onRetryAI={() => onRetryAI(listing.index)}
                  />
                </div>
              )}
            </div>
          );
        })}
        {sorted.length === 0 && (
          <p className="text-center py-8 text-sm text-[var(--color-text-tertiary)]">
            No listings match the current filter.
          </p>
        )}
      </div>

      {/* Tablet + desktop table */}
      <div className="hidden md:block bg-[var(--color-bg)] rounded-[var(--radius-lg)] border border-[var(--color-border)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-[var(--color-border)]">
              <tr>
                <th className={thCls} onClick={() => toggleSort('overall')}>
                  <div className="flex items-center gap-1">Score {sortIcon('overall')}</div>
                </th>
                <th className={`${thCls} min-w-48`} onClick={() => toggleSort('title')}>
                  <div className="flex items-center gap-1">Title {sortIcon('title')}</div>
                </th>
                <th className={thCls} onClick={() => toggleSort('tags')}>
                  <div className="flex items-center gap-1">Tags {sortIcon('tags')}</div>
                </th>
                <th className={thCls}>Title</th>
                <th className={thCls} onClick={() => toggleSort('images')}>
                  <div className="flex items-center gap-1">Imgs {sortIcon('images')}</div>
                </th>
                <th className={thCls}>Desc</th>
                <th className={thCls} onClick={() => toggleSort('price')}>
                  <div className="flex items-center gap-1">Price {sortIcon('price')}</div>
                </th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {sorted.map((listing) => {
                const isExpanded = expandedIdx === listing.index;
                return (
                  <Fragment key={listing.index}>
                    <tr
                      className="hover:bg-[var(--color-bg-subtle)] transition-colors cursor-pointer"
                      onClick={() => setExpandedIdx(isExpanded ? null : listing.index)}
                    >
                      <td className="px-3 py-3">
                        <ScoreBadge score={listing.overall} />
                      </td>
                      <td className="px-3 py-3">
                        <span className="text-sm text-[var(--color-text-primary)] line-clamp-1 max-w-xs block">
                          {listing.title}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <SubScoreChip score={listing.subScores.tags} />
                        <span className="text-[10px] text-[var(--color-text-tertiary)] ml-1">({listing.tags.length}/13)</span>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <SubScoreChip score={listing.subScores.title} />
                      </td>
                      <td className="px-3 py-3 text-center">
                        <SubScoreChip score={listing.subScores.images} />
                        <span className="text-[10px] text-[var(--color-text-tertiary)] ml-1">({listing.images.length}/10)</span>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <SubScoreChip score={listing.subScores.description} />
                      </td>
                      <td className="px-3 py-3">
                        <span className="text-sm text-[var(--color-text-secondary)]">${listing.price.toFixed(2)}</span>
                      </td>
                      <td className="px-2 py-3">
                        <ChevronRight
                          size={15}
                          className={`text-[var(--color-text-tertiary)] transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                        />
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan={8} className="p-0">
                          <ListingRowExpanded
                            listing={listing}
                            onRetryAI={() => onRetryAI(listing.index)}
                          />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
              {sorted.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-[var(--color-text-tertiary)] text-sm">
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
