import type { SaleRecord } from '@/types';

// Column indices in the Etsy sold-orders CSV export
const COL = {
  saleDate: 0,
  orderId: 1,
  fullName: 3,
  numItems: 6,
  shipCity: 11,
  shipState: 12,
  shipCountry: 14,
  orderValue: 16,
} as const;

/** Splits a single CSV line into fields, respecting double-quoted values. */
function splitCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      fields.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  fields.push(current);
  return fields;
}

function parseRow(fields: string[]): SaleRecord | null {
  const orderId = fields[COL.orderId]?.trim();
  if (!orderId) return null;
  return {
    orderId,
    saleDate: fields[COL.saleDate]?.trim() ?? '',
    fullName: fields[COL.fullName]?.trim() ?? '',
    shipCity: fields[COL.shipCity]?.trim() ?? '',
    shipState: fields[COL.shipState]?.trim() ?? '',
    shipCountry: fields[COL.shipCountry]?.trim() ?? '',
    orderValue: parseFloat(fields[COL.orderValue] ?? '0') || 0,
    numItems: parseInt(fields[COL.numItems] ?? '0', 10) || 0,
  };
}

export interface ParseResult {
  records: SaleRecord[];
  parseErrors: number;
}

export function parseSalesCsv(text: string): ParseResult {
  const lines = text.split('\n').filter(Boolean);
  const [, ...dataLines] = lines; // skip header row
  let parseErrors = 0;
  const records: SaleRecord[] = [];
  for (const line of dataLines) {
    const fields = splitCsvLine(line.trim());
    const record = parseRow(fields);
    if (record) {
      records.push(record);
    } else {
      parseErrors++;
    }
  }
  return { records, parseErrors };
}
