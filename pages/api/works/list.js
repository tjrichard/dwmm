import { getPublishedPostsPage, getCareerEntries } from '../../../lib/notion';
import { getNotionThumbnail } from '../../../utils/notion';

const cache = new Map();
const CACHE_TTL = 1000 * 60 * 5;

const transformNotionData = (notionPosts) => {
  return notionPosts.map((post) => {
    const properties = post.properties || {};
    return {
      id: post.id,
      _id: post.id,
      title: properties.title?.title?.[0]?.plain_text || '제목 없음',
      slug: properties.slug?.rich_text?.[0]?.plain_text,
      excerpt: properties.summary?.rich_text?.[0]?.plain_text || '',
      thumbnail: getNotionThumbnail(post),
      category: properties.category?.select?.name || '미분류',
      tags: properties.tags?.multi_select?.map((tag) => tag.name) || [],
      created_at: properties.publishedAt?.date?.start || post.created_time,
    };
  });
};

const parseCursor = (cursor) => {
  if (!cursor) return null;
  if (Array.isArray(cursor)) return cursor[0] || null;
  return cursor;
};

const parsePageSize = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return 5;
  return Math.min(Math.max(parsed, 1), 20);
};

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const cursor = parseCursor(req.query.cursor);
  const pageSize = parsePageSize(req.query.page_size);
  const cacheKey = `works:list:${cursor || 'start'}:${pageSize}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return res.status(200).json(cached.data);
  }

  try {
    const response = await getPublishedPostsPage({ cursor, pageSize });
    const works = transformNotionData(response.results || []);
    const careerTimeline = !cursor ? await getCareerEntries() : [];
    const payload = {
      works,
      careerTimeline,
      nextCursor: response.next_cursor || null,
      hasMore: Boolean(response.has_more),
    };
    cache.set(cacheKey, { timestamp: Date.now(), data: payload });
    return res.status(200).json(payload);
  } catch (error) {
    console.error('Failed to load works list', error);
    return res.status(500).json({ error: 'Failed to load works list' });
  }
}
