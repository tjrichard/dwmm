import { getPostContentChunk } from '../../../lib/notion';

const cache = new Map();
const CACHE_TTL = 1000 * 60 * 5;

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id, cursor, page_size: pageSizeParam } = req.query;
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Missing page id' });
  }

  const pageSize = Math.min(Number(pageSizeParam) || 20, 50);
  const cacheKey = `${id}:${cursor || 'start'}:${pageSize}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return res.status(200).json(cached.data);
  }

  try {
    const { content, nextCursor, hasMore } = await getPostContentChunk(id, cursor, pageSize);
    const payload = { content, nextCursor, hasMore };
    cache.set(cacheKey, { timestamp: Date.now(), data: payload });
    return res.status(200).json(payload);
  } catch (error) {
    console.error('Failed to load Notion content', error);
    return res.status(500).json({ error: 'Failed to load content' });
  }
}
