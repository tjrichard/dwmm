import { getPostBySlug } from '../../../lib/notion';
import {
  findProperty,
  getNotionThumbnail,
  getPropertyDateRange,
  getPropertyMultiSelect,
  getPropertyText,
} from '../../../utils/notion';

const cache = new Map();
const CACHE_TTL = 1000 * 60 * 5;

const extractWorkMeta = (properties = {}) => {
  const roleProperty = findProperty(properties, ['role', 'position', '직무', '직책']);
  const teamProperty = findProperty(properties, ['team', 'teams', 'collaborators', 'members', '팀', '협업']);
  const timelineProperty = findProperty(properties, [
    'timeline',
    '기간',
    'period',
    'duration',
    'range',
    'date',
  ]);
  const skillsProperty = findProperty(properties, ['skills', 'skill', 'stack', 'tools', '기술', '스킬']);

  const role = getPropertyText(roleProperty);
  const team = getPropertyText(teamProperty);
  const { start: timelineStart, end: timelineEnd } = getPropertyDateRange(timelineProperty);
  const timelineText = !timelineStart && !timelineEnd ? getPropertyText(timelineProperty) : '';

  let skills = getPropertyMultiSelect(skillsProperty);
  if (!skills.length && properties.tags) {
    skills = getPropertyMultiSelect(properties.tags);
  }

  return {
    role,
    team,
    timelineStart,
    timelineEnd,
    timelineText,
    skills,
  };
};

const transformPostData = (post) => {
  if (!post) return null;
  const properties = post.properties || {};
  const meta = extractWorkMeta(properties);
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
    externalUrl: properties.externalUrl?.url || null,
    ...meta,
  };
};

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { slug } = req.query;
  if (!slug || typeof slug !== 'string') {
    return res.status(400).json({ error: 'Missing slug' });
  }

  const cacheKey = `meta:${slug}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return res.status(200).json(cached.data);
  }

  res.setHeader('Cache-Control', 'public, s-maxage=120, stale-while-revalidate=600');

  try {
    const postData = await getPostBySlug(slug);
    const post = transformPostData(postData);
    const payload = { post };
    cache.set(cacheKey, { timestamp: Date.now(), data: payload });
    return res.status(200).json(payload);
  } catch (error) {
    console.error('Failed to load Notion meta', error);
    return res.status(500).json({ error: 'Failed to load meta' });
  }
}
