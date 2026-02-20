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

  function SortIcon({ k }: { k: SortKey }) {
    if (sortKey !== k) return <ChevronDown size={12} className="opacity-30" />;
    return sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />;
  }

  const thCls = 'px-3 py-2.5 text-left text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer select-none hover:text-slate-700 dark:hover:text-slate-200 transition-colors';

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
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            {f === 'all' ? `All (${listings.length})` : `Needs Work (<75)`}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-sm dark:shadow-none overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-slate-100 dark:border-slate-700/40">
              <tr>
                <th className={thCls} onClick={() => toggleSort('overall')}>
                  <div className="flex items-center gap-1">Score <SortIcon k="overall" /></div>
                </th>
                <th className={`${thCls} min-w-48`} onClick={() => toggleSort('title')}>
                  <div className="flex items-center gap-1">Title <SortIcon k="title" /></div>
                </th>
                <th className={thCls} onClick={() => toggleSort('tags')}>
                  <div className="flex items-center gap-1">Tags <SortIcon k="tags" /></div>
                </th>
                <th className={thCls}>Title</th>
                <th className={thCls} onClick={() => toggleSort('images')}>
                  <div className="flex items-center gap-1">Imgs <SortIcon k="images" /></div>
                </th>
                <th className={thCls}>Desc</th>
                <th className={thCls} onClick={() => toggleSort('price')}>
                  <div className="flex items-center gap-1">Price <SortIcon k="price" /></div>
                </th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/30">
              {sorted.map((listing) => {
                const isExpanded = expandedIdx === listing.index;
                return (
                  <Fragment key={listing.index}>
                    <tr
                      className="hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors cursor-pointer"
                      onClick={() => setExpandedIdx(isExpanded ? null : listing.index)}
                    >
                      <td className="px-3 py-3">
                        <ScoreBadge score={listing.overall} />
                      </td>
                      <td className="px-3 py-3">
                        <span className="text-sm text-slate-800 dark:text-slate-200 line-clamp-1 max-w-xs block">
                          {listing.title}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <SubScoreChip score={listing.subScores.tags} />
                        <span className="text-[10px] text-slate-400 ml-1">({listing.tags.length}/13)</span>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <SubScoreChip score={listing.subScores.title} />
                      </td>
                      <td className="px-3 py-3 text-center">
                        <SubScoreChip score={listing.subScores.images} />
                        <span className="text-[10px] text-slate-400 ml-1">({listing.images.length}/10)</span>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <SubScoreChip score={listing.subScores.description} />
                      </td>
                      <td className="px-3 py-3">
                        <span className="text-sm text-slate-700 dark:text-slate-300">${listing.price.toFixed(2)}</span>
                      </td>
                      <td className="px-2 py-3">
                        <ChevronRight
                          size={15}
                          className={`text-slate-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
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
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-400 text-sm">
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
