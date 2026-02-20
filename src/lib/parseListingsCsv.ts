import type { EtsyListing } from '@/types';

/**
 * Split full CSV text into individual record strings.
 * Handles multi-line fields enclosed in double-quotes.
 */
function splitIntoRecords(text: string): string[] {
  const records: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (ch === '"') {
      // Escaped quote inside a quoted field ("" → ")
      if (inQuotes && next === '"') {
        current += '""'  // preserve raw; splitFields will decode
        i++; // skip next quote
      } else {
        inQuotes = !inQuotes;
        current += ch;
      }
    } else if (ch === '\n' && !inQuotes) {
      if (current.trim()) records.push(current.trim());
      current = '';
    } else if (ch === '\r') {
      // skip carriage returns
    } else {
      current += ch;
    }
  }
  if (current.trim()) records.push(current.trim());
  return records;
}

/**
 * Split a single-line record into fields, respecting quoted values.
 * After splitIntoRecords(), each record is guaranteed to be one row.
 */
function splitFields(record: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < record.length; i++) {
    const ch = record[i];
    const next = record[i + 1];

    if (ch === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
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

// Column indices from Etsy listings CSV header:
// TITLE,DESCRIPTION,PRICE,CURRENCY_CODE,QUANTITY,TAGS,MATERIALS,
// IMAGE1..IMAGE10,VARIATION 1 TYPE,...,SKU
const COL = {
  title: 0,
  description: 1,
  price: 2,
  quantity: 4,
  tags: 5,
  materials: 6,
  image1: 7,   // IMAGE1 through IMAGE10 = indices 7–16
  sku: 23,
} as const;

function parseListingRow(fields: string[]): EtsyListing | null {
  const title = fields[COL.title]?.trim() ?? '';
  if (!title) return null;

  const images = Array.from({ length: 10 }, (_, i) => fields[COL.image1 + i]?.trim() ?? '')
    .filter(Boolean);

  const rawTags = fields[COL.tags]?.trim() ?? '';
  const tags = rawTags
    ? rawTags.split(',').map((t) => t.trim()).filter(Boolean)
    : [];

  return {
    title,
    description: fields[COL.description]?.trim() ?? '',
    price: parseFloat(fields[COL.price] ?? '0') || 0,
    quantity: parseInt(fields[COL.quantity] ?? '0', 10) || 0,
    tags,
    materials: fields[COL.materials]?.trim() ?? '',
    images,
    sku: fields[COL.sku]?.trim() ?? '',
  };
}

export interface ListingsParseResult {
  listings: EtsyListing[];
  parseErrors: number;
}

export function parseListingsCsv(text: string): ListingsParseResult {
  const records = splitIntoRecords(text);
  const [, ...dataRecords] = records; // skip header row
  let parseErrors = 0;
  const listings: EtsyListing[] = [];

  for (const record of dataRecords) {
    const fields = splitFields(record);
    const listing = parseListingRow(fields);
    if (listing) {
      listings.push(listing);
    } else {
      parseErrors++;
    }
  }

  return { listings, parseErrors };
}
