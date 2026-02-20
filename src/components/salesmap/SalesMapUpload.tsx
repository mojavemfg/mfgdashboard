import { useRef, useState } from 'react';
import { Upload, Trash2 } from 'lucide-react';
import { parseSalesCsv } from '@/lib/parseSalesCsv';
import type { EtsyOrderItem } from '@/types';
import type { MergeResult } from '@/hooks/useSalesOrders';

interface SalesMapUploadProps {
  onMerge: (records: EtsyOrderItem[]) => MergeResult;
  onClear: () => void;
  totalItems: number;
}

export function SalesMapUpload({ onMerge, onClear, totalItems }: SalesMapUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [lastResult, setLastResult] = useState<MergeResult | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  async function processFile(file: File) {
    const text = await file.text();
    const { records } = parseSalesCsv(text);
    const result = onMerge(records);
    setLastResult(result);
  }

  function handleFiles(files: FileList | null) {
    if (!files?.[0]) return;
    void processFile(files[0]);
  }

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
      <div
        className={`flex-1 flex items-center gap-3 border-2 border-dashed rounded-xl px-4 py-3 cursor-pointer transition-colors ${
          dragging
            ? 'border-blue-400 bg-blue-50 dark:bg-blue-500/10'
            : 'border-slate-300 dark:border-slate-600 hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-500/5'
        }`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
      >
        <Upload size={16} className="text-slate-400 shrink-0" />
        <span className="text-slate-500 dark:text-slate-400 text-sm">
          {totalItems > 0
            ? `${totalItems.toLocaleString()} items loaded — drop another CSV to merge`
            : 'Drop Etsy sold-orders CSV here, or click to browse'}
        </span>
        {lastResult && (
          <span className="ml-auto text-xs font-medium text-green-600 dark:text-green-400 shrink-0">
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

      {totalItems > 0 &&
        (confirmClear ? (
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-sm text-slate-500 dark:text-slate-400">Clear all data?</span>
            <button
              onClick={() => {
                onClear();
                setLastResult(null);
                setConfirmClear(false);
              }}
              className="text-xs px-2 py-1 bg-red-500 hover:bg-red-600 text-white rounded-lg cursor-pointer border-none transition-colors"
            >
              Yes
            </button>
            <button
              onClick={() => setConfirmClear(false)}
              className="text-xs px-2 py-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg cursor-pointer border-none transition-colors"
            >
              No
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmClear(true)}
            className="flex items-center gap-1.5 text-xs px-3 py-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors cursor-pointer border-none bg-transparent shrink-0"
          >
            <Trash2 size={14} />
            Clear All
          </button>
        ))}
    </div>
  );
}
