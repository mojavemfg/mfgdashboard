import type { ScoredListing } from '@/types';

interface Props {
  listings: ScoredListing[];
}

export function ListingsSummaryStrip({ listings }: Props) {
  if (listings.length === 0) return null;

  const avgScore = Math.round(listings.reduce((s, l) => s + l.overall, 0) / listings.length);
  const tagGaps = listings.filter((l) => l.tags.length < 13).length;
  const lowImages = listings.filter((l) => l.images.length < 5).length;
  const aiDone = listings.filter((l) => l.aiStatus === 'done').length;

  const scoreColor =
    avgScore >= 75 ? 'text-emerald-600 dark:text-emerald-400' :
    avgScore >= 50 ? 'text-yellow-600 dark:text-yellow-400' :
                    'text-red-600 dark:text-red-400';

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
      {[
        { label: 'Avg Score', value: `${avgScore}`, valueClass: scoreColor },
        { label: 'Tag Gaps', value: `${tagGaps}`, valueClass: tagGaps > 0 ? 'text-yellow-600 dark:text-yellow-400' : 'text-emerald-600 dark:text-emerald-400' },
        { label: 'Low Images (<5)', value: `${lowImages}`, valueClass: lowImages > 0 ? 'text-yellow-600 dark:text-yellow-400' : 'text-emerald-600 dark:text-emerald-400' },
        { label: 'AI Tags Ready', value: `${aiDone}/${listings.length}`, valueClass: 'text-[var(--color-text-secondary)]' },
      ].map(({ label, value, valueClass }) => (
        <div key={label} className="bg-[var(--color-bg)] rounded-[var(--radius-lg)] border border-[var(--color-border)] px-4 py-3">
          <p className="text-[11px] text-[var(--color-text-tertiary)] uppercase tracking-wider font-semibold mb-1">{label}</p>
          <p className={`text-2xl font-bold ${valueClass}`}>{value}</p>
        </div>
      ))}
    </div>
  );
}
