import type { EtsyOrderItem } from '@/types';

// Column indices for the Etsy "EtsySoldOrderItems" CSV export
const COL = {
  saleDate: 0,         // "Sale Date"     e.g. "12/30/25"
  itemName: 1,         // "Item Name"
  buyer: 2,            // "Buyer"         username, may be empty
  quantity: 3,         // "Quantity"
  price: 4,            // "Price"         per unit
  discountAmount: 7,   // "Discount Amount"
  shipping: 9,         // "Order Shipping"
  itemTotal: 11,       // "Item Total"
  transactionId: 13,   // "Transaction ID" unique per row
  dateShipped: 16,     // "Date Shipped"  may be empty
  shipName: 17,        // "Ship Name"
  shipCity: 20,        // "Ship City"
  shipState: 21,       // "Ship State"
  shipCountry: 23,     // "Ship Country"
  orderId: 24,         // "Order ID"
} as const;

/** Splits a single CSV line respecting double-quoted values. */
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

function parseRow(fields: string[]): EtsyOrderItem | null {
  const transactionId = fields[COL.transactionId]?.trim();
  if (!transactionId) return null;
  return {
    transactionId,
    orderId: fields[COL.orderId]?.trim() ?? '',
    saleDate: fields[COL.saleDate]?.trim() ?? '',
    itemName: fields[COL.itemName]?.trim() ?? '',
    shipName: fields[COL.shipName]?.trim() ?? fields[COL.buyer]?.trim() ?? '',
    quantity: parseInt(fields[COL.quantity] ?? '1', 10) || 1,
    price: parseFloat(fields[COL.price] ?? '0') || 0,
    discountAmount: parseFloat(fields[COL.discountAmount] ?? '0') || 0,
    shipping: parseFloat(fields[COL.shipping] ?? '0') || 0,
    itemTotal: parseFloat(fields[COL.itemTotal] ?? '0') || 0,
    dateShipped: fields[COL.dateShipped]?.trim() ?? '',
    shipCity: fields[COL.shipCity]?.trim() ?? '',
    shipState: fields[COL.shipState]?.trim() ?? '',
    shipCountry: fields[COL.shipCountry]?.trim() ?? '',
  };
}

export interface ParseResult {
  records: EtsyOrderItem[];
  parseErrors: number;
}

export function parseSalesCsv(text: string): ParseResult {
  const lines = text.split('\n').filter(Boolean);
  const [, ...dataLines] = lines; // skip header row
  let parseErrors = 0;
  const records: EtsyOrderItem[] = [];
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
