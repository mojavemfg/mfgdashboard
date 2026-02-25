import type { VercelRequest, VercelResponse } from '@vercel/node';

const BROWSER_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Cache-Control': 'no-cache',
};

function extractMeta(html: string): { title: string; description: string } | null {
  // Match both attribute orderings: property="..." content="..." and content="..." property="..."
  const titleMatch =
    html.match(/<meta[^>]+property="og:title"[^>]+content="([^"]+)"/i) ??
    html.match(/<meta[^>]+content="([^"]+)"[^>]+property="og:title"/i);

  const descMatch =
    html.match(/<meta[^>]+property="og:description"[^>]+content="([^"]+)"/i) ??
    html.match(/<meta[^>]+content="([^"]+)"[^>]+property="og:description"/i) ??
    html.match(/<meta[^>]+name="description"[^>]+content="([^"]+)"/i) ??
    html.match(/<meta[^>]+content="([^"]+)"[^>]+name="description"/i);

  const raw = titleMatch?.[1] ?? '';
  const title = raw.replace(/\s*[|–-].*$/, '').trim();
  const description = descMatch?.[1] ?? '';

  return title ? { title, description } : null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { url } = req.query;

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'url parameter required' });
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return res.status(400).json({ error: 'Invalid URL' });
  }

  if (parsed.hostname !== 'www.etsy.com' && parsed.hostname !== 'etsy.com') {
    return res.status(400).json({ error: 'Only etsy.com URLs are supported' });
  }

  if (parsed.protocol !== 'https:') {
    return res.status(400).json({ error: 'Only HTTPS URLs are supported' });
  }

  try {
    const response = await fetch(url, {
      headers: BROWSER_HEADERS,
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: `Fetch failed: ${response.status}` });
    }

    const html = await response.text();
    const meta = extractMeta(html);

    if (!meta) {
      return res.status(422).json({ error: 'Could not extract title from page' });
    }

    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).json(meta);
  } catch (e) {
    return res.status(500).json({ error: e instanceof Error ? e.message : 'Internal error' });
  }
}
