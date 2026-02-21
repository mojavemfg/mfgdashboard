import { useRef, useState } from 'react';
import { Upload, Trash2 } from 'lucide-react';
import { parseSalesCsv } from '@/lib/parseSalesCsv';
import type { EtsyOrderItem } from '@/types';
import type { MergeResult } from '@/hooks/useSalesOrders';
import { Button } from '@/components/ui/Button';

interface SalesMapUploadProps {
  onMerge: (records: EtsyOrderItem[]) => MergeResult;
  onClear: () => void;
  totalItems: number;
}

export function SalesMapUpload({ onMerge, onClear, totalItems }: SalesMapUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging]       = useState(false);
  const [lastResult, setLastResult]   = useState<MergeResult | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  async function processFile(file: File) {
    const text    = await file.text();
    const { records } = parseSalesCsv(text);
    const result  = onMerge(records);
    setLastResult(result);
  }

  function handleFiles(files: FileList | null) {
    if (!files?.[0]) return;
    void processFile(files[0]);
  }

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
      <div
        className={[
          'flex-1 flex items-center gap-3 border-2 border-dashed rounded-[var(--radius-lg)] px-4 py-3 cursor-pointer transition-colors duration-150',
          dragging
            ? 'border-[var(--color-brand)] bg-[var(--color-brand-subtle)]'
            : 'border-[var(--color-border)] hover:border-[var(--color-brand)] hover:bg-[var(--color-brand-subtle)]',
        ].join(' ')}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
      >
        <Upload size={16} className="text-[var(--color-text-tertiary)] shrink-0" />
        <span className="text-sm text-[var(--color-text-secondary)]">
          {totalItems > 0
            ? `${totalItems.toLocaleString()} items loaded — drop another CSV to merge`
            : 'Drop Etsy sold-orders CSV here, or click to browse'}
        </span>
        {lastResult && (
          <span className="ml-auto text-xs font-medium text-[var(--color-success)] shrink-0">
            +{lastResult.added} new · {lastResult.duplicates} skipped
          </span>
        )}
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {totalItems > 0 && (
        confirmClear ? (
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-sm text-[var(--color-text-secondary)]">Clear all data?</span>
            <Button
              variant="danger"
              size="sm"
              onClick={() => { onClear(); setLastResult(null); setConfirmClear(false); }}
            >
              Yes, clear
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setConfirmClear(false)}
            >
              Cancel
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            iconLeft={<Trash2 size={13} />}
            onClick={() => setConfirmClear(true)}
            className="text-[var(--color-danger)] hover:text-[var(--color-danger)] shrink-0"
          >
            Clear All
          </Button>
        )
      )}
    </div>
  );
}
