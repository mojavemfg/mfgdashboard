import type { EtsyListing, ScoredListing, ListingSubScores } from '@/types';

const WEIGHTS = {
  tags: 0.40,
  title: 0.20,
  images: 0.15,
  description: 0.15,
  price: 0.10,
} as const;

const MAX_TAGS = 13;
const MAX_TAG_CHARS = 20;
const IDEAL_TITLE_MIN = 40;
const IDEAL_TITLE_MAX = 140;
const MAX_IMAGES = 10;
const MIN_DESC_CHARS = 200;

function scoreTags(tags: string[]): number {
  if (tags.length === 0) return 0;

  // Slot fill: how many of 13 slots are used
  const slotScore = Math.min(100, (tags.length / MAX_TAGS) * 100);

  // Avg char utilization toward 20-char limit
  const avgChars = tags.reduce((sum, t) => sum + t.length, 0) / tags.length;
  const charScore = Math.min(100, (avgChars / MAX_TAG_CHARS) * 100);

  // Long-tail ratio: tags with a space (multi-word) are better
  const longTailRatio = tags.filter((t) => t.includes(' ')).length / tags.length;
  const longTailScore = longTailRatio * 100;

  return Math.round((slotScore * 0.5) + (charScore * 0.25) + (longTailScore * 0.25));
}

function scoreTitle(title: string): number {
  const len = title.length;
  if (len < 20) return 20;
  if (len < IDEAL_TITLE_MIN) return 20 + ((len - 20) / (IDEAL_TITLE_MIN - 20)) * 80;
  if (len <= IDEAL_TITLE_MAX) return 100;
  // Over 140: penalty
  return Math.max(40, 100 - ((len - IDEAL_TITLE_MAX) / 20) * 15);
}

function scoreImages(images: string[]): number {
  return Math.round((images.length / MAX_IMAGES) * 100);
}

function scoreDescription(description: string): number {
  const len = description.length;
  if (len === 0) return 0;
  const lengthScore = Math.min(100, (len / MIN_DESC_CHARS) * 70);
  // Bonus for structure (newlines/bullets suggest formatted content)
  const hasStructure = description.includes('\n') || description.includes('•') || description.includes('-');
  const structureBonus = hasStructure ? 30 : 0;
  return Math.min(100, Math.round(lengthScore + structureBonus));
}

function scorePrice(price: number, catalogMedian: number): number {
  if (catalogMedian === 0) return 100;
  const zScore = Math.abs(price - catalogMedian) / catalogMedian;
  if (zScore <= 0.5) return 100;
  if (zScore <= 1.0) return 80;
  if (zScore <= 1.5) return 60;
  if (zScore <= 2.0) return 40;
  return 20;
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function scoreListings(listings: EtsyListing[]): ScoredListing[] {
  const catalogMedian = median(listings.map((l) => l.price));

  return listings.map((listing, index) => {
    const subScores: ListingSubScores = {
      tags: scoreTags(listing.tags),
      title: Math.round(scoreTitle(listing.title)),
      images: scoreImages(listing.images),
      description: scoreDescription(listing.description),
      price: scorePrice(listing.price, catalogMedian),
    };

    const overall = Math.round(
      subScores.tags        * WEIGHTS.tags +
      subScores.title       * WEIGHTS.title +
      subScores.images      * WEIGHTS.images +
      subScores.description * WEIGHTS.description +
      subScores.price       * WEIGHTS.price
    );

    return {
      ...listing,
      index,
      overall,
      subScores,
      aiTags: null,
      aiStatus: 'pending',
    };
  });
}
