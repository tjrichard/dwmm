import { getFavoriteEntries } from '../../lib/notion';
import { withTimeout } from '../../lib/with-timeout';

const cache = new Map();
const CACHE_TTL = 1000 * 60 * 5;

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const cacheKey = 'favorites:list';
  const cached = cache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return res.status(200).json(cached.data);
  }

  res.setHeader('Cache-Control', 'public, s-maxage=120, stale-while-revalidate=600');

  try {
    const items = await withTimeout(getFavoriteEntries(), 12000, 'Favorites API query');
    const payload = {
      items,
      updatedAt: new Date().toISOString(),
    };

    cache.set(cacheKey, { timestamp: Date.now(), data: payload });
    return res.status(200).json(payload);
  } catch (error) {
    console.error('Failed to load favorites list', error);

    return res.status(503).json({
      items: [],
      error:
        error?.message ||
        'Favorites sync unavailable. Check NOTION_API_KEY and favorites datasource access.',
    });
  }
}
