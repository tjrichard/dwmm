import { Client } from '@notionhq/client';

const notion = new Client({ auth: process.env.NOTION_API_KEY });

const memoryCache = new Map();
const inflightRequests = new Map();

const getCached = (key) => {
  const entry = memoryCache.get(key);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    memoryCache.delete(key);
    return null;
  }
  return entry.value;
};

const setCached = (key, value, ttlMs = 1000 * 60 * 5) => {
  memoryCache.set(key, {
    value,
    expiresAt: Date.now() + ttlMs,
  });
  return value;
};

const withRequestCache = async (key, ttlMs, factory) => {
  const cached = getCached(key);
  if (cached) return cached;

  if (inflightRequests.has(key)) {
    return inflightRequests.get(key);
  }

  const pending = (async () => {
    const value = await factory();
    return setCached(key, value, ttlMs);
  })();

  inflightRequests.set(key, pending);

  try {
    return await pending;
  } finally {
    inflightRequests.delete(key);
  }
};


const fetchBlockChildren = async (blockId) => {
  return withRequestCache(`block:all:${blockId}`, 1000 * 60 * 10, async () => {
    let results = [];
    let cursor = undefined;

    do {
      const response = await notion.blocks.children.list({
        block_id: blockId,
        start_cursor: cursor,
        page_size: 100,
      });
      results = results.concat(response.results);
      cursor = response.has_more ? response.next_cursor : undefined;
    } while (cursor);

    return results;
  });
};

const fetchBlockChildrenPage = async (blockId, cursor, pageSize = 20) => {
  const cacheKey = `block:page:${blockId}:${cursor || 'start'}:${pageSize}`;
  return withRequestCache(cacheKey, 1000 * 60 * 5, async () => {
    const response = await notion.blocks.children.list({
      block_id: blockId,
      start_cursor: cursor || undefined,
      page_size: pageSize,
    });

    return response;
  });
};

const normalizeBlocks = (blocks = []) => {
  const normalized = [];
  let i = 0;

  while (i < blocks.length) {
    const block = blocks[i];

    if (block.type === 'image') {
      const imageGroup = [block];
      let j = i + 1;
      while (j < blocks.length && blocks[j].type === 'image') {
        imageGroup.push(blocks[j]);
        j += 1;
      }

      if (imageGroup.length > 1) {
        normalized.push({
          id: `image-row-${block.id}`,
          type: 'image_row',
          items: imageGroup,
        });
      } else {
        normalized.push(block);
      }

      i = j;
      continue;
    }

    if (block.type === 'bulleted_list_item' || block.type === 'numbered_list_item') {
      const listType = block.type === 'bulleted_list_item' ? 'bulleted_list' : 'numbered_list';
      const items = [block];
      let j = i + 1;

      while (j < blocks.length && blocks[j].type === block.type) {
        items.push(blocks[j]);
        j += 1;
      }

      normalized.push({
        id: `list-${block.id}`,
        type: listType,
        items,
      });

      i = j;
      continue;
    }

    normalized.push(block);
    i += 1;
  }

  return normalized;
};

const getBlocksWithChildren = async (blockId) => {
  const blocks = await fetchBlockChildren(blockId);
  const hydrated = await Promise.all(
    blocks.map(async (block) => {
      if (block.has_children) {
        return {
          ...block,
          children: await getBlocksWithChildren(block.id),
        };
      }
      return block;
    })
  );

  return normalizeBlocks(hydrated);
};

const getBlocksPageWithChildren = async (blockId, cursor, pageSize) => {
  const response = await fetchBlockChildrenPage(blockId, cursor, pageSize);
  const hydrated = await Promise.all(
    response.results.map(async (block) => {
      if (block.has_children) {
        return {
          ...block,
          children: await getBlocksWithChildren(block.id),
        };
      }
      return block;
    })
  );

  return {
    content: normalizeBlocks(hydrated),
    nextCursor: response.next_cursor || null,
    hasMore: response.has_more,
  };
};

// 데이터소스 이름을 기반으로 동적으로 ID를 찾는 함수
const findDataSourceIdByName = async (name, envHint) => {
  console.log(`Searching for data_source with name: "${name}"`);
  const response = await notion.search({
    query: name,
    filter: {
      value: 'data_source', // "database"가 아닌 "data_source"로 검색
      property: 'object',
    },
    page_size: 1,
  });

  if (response.results.length === 0) {
    const hint = envHint ? ` ${envHint}` : '';
    throw new Error(
      `Data source with name "${name}" not found via search API.${hint}`
    );
  }
  
  const dataSource = response.results[0];
  console.log(`Data source found via search! ID: ${dataSource.id}`);
  return dataSource.id;
};

const resolveDataSourceId = async ({ dataSourceId, databaseId, name, envHint }) => {
  if (dataSourceId) {
    return dataSourceId;
  }

  if (databaseId) {
    const database = await notion.databases.retrieve({ database_id: databaseId });
    const derivedId =
      database?.data_sources?.[0]?.id ||
      database?.data_source?.id ||
      database?.data_sources?.[0];

    if (derivedId) {
      return derivedId;
    }
  }

  if (name) {
    return findDataSourceIdByName(name, envHint);
  }

  throw new Error('Missing Notion data source configuration.');
};

let cachedWorksDataSourceId = null;
const getWorksDataSourceId = async () => {
  if (cachedWorksDataSourceId) return cachedWorksDataSourceId;

  cachedWorksDataSourceId = await resolveDataSourceId({
    dataSourceId: process.env.NOTION_WORKS_DATA_SOURCE_ID,
    databaseId: process.env.NOTION_WORKS_DATABASE_ID,
    name: 'DWMM',
    envHint: 'Set NOTION_WORKS_DATA_SOURCE_ID or NOTION_WORKS_DATABASE_ID in .env.local.',
  });

  return cachedWorksDataSourceId;
};

let cachedCareerDataSourceId = null;
const getCareerDataSourceId = async () => {
  if (cachedCareerDataSourceId) return cachedCareerDataSourceId;

  cachedCareerDataSourceId = await resolveDataSourceId({
    dataSourceId: process.env.NOTION_CAREER_DATA_SOURCE_ID,
    databaseId: process.env.NOTION_CAREER_DATABASE_ID,
    name: 'CAREER',
    envHint: 'Set NOTION_CAREER_DATA_SOURCE_ID or NOTION_CAREER_DATABASE_ID in .env.local.',
  });

  return cachedCareerDataSourceId;
};

const getPlainText = (richText = []) => richText.map((item) => item?.plain_text || '').join('');

const getPropertyText = (property) => {
  if (!property) return '';

  switch (property.type) {
    case 'title':
      return getPlainText(property.title);
    case 'rich_text':
      return getPlainText(property.rich_text);
    case 'select':
      return property.select?.name || '';
    case 'multi_select':
      return (property.multi_select || []).map((item) => item.name).join(', ');
    case 'status':
      return property.status?.name || '';
    case 'date':
      return property.date?.start || '';
    case 'number':
      return property.number?.toString() || '';
    case 'created_time':
      return property.created_time || '';
    case 'formula':
      if (property.formula?.type === 'string') return property.formula.string || '';
      if (property.formula?.type === 'number') return property.formula.number?.toString() || '';
      if (property.formula?.type === 'date') return property.formula.date?.start || '';
      return '';
    case 'rollup':
      if (property.rollup?.type === 'date') return property.rollup.date?.start || '';
      if (property.rollup?.type === 'string') return property.rollup.string || '';
      if (property.rollup?.type === 'number') return property.rollup.number?.toString() || '';
      return '';
    case 'people':
      return (property.people || []).map((person) => person.name).join(', ');
    case 'url':
      return property.url || '';
    default:
      return '';
  }
};

const findProperty = (properties, names) => {
  if (!properties) return null;
  const entries = Object.entries(properties);
  for (const name of names) {
    const lower = name.toLowerCase();
    const match = entries.find(([key]) => key.toLowerCase() === lower);
    if (match) return match[1];
  }
  return null;
};

const findTitleProperty = (properties) => {
  if (!properties) return null;
  return Object.values(properties).find((prop) => prop.type === 'title') || null;
};

const parseDateToken = (token) => {
  if (!token) return null;
  const parts = token.split(/[./-]/).filter(Boolean);
  if (!parts.length) return null;
  const year = Number(parts[0]);
  if (!year) return null;
  const month = parts[1] ? Math.min(Math.max(Number(parts[1]), 1), 12) : 1;
  const day = parts[2] ? Math.min(Math.max(Number(parts[2]), 1), 31) : 1;
  if (Number.isNaN(month) || Number.isNaN(day)) return null;
  return new Date(Date.UTC(year, month - 1, day));
};

const extractDateTokens = (text = '') => {
  return text.match(/\d{4}(?:[./-]\d{1,2}){0,2}/g) || [];
};

const getDateRangeFromText = (text = '') => {
  const tokens = extractDateTokens(text);
  if (!tokens.length) return { start: '', end: '' };
  if (tokens.length === 1) return { start: tokens[0], end: '' };
  return { start: tokens[0], end: tokens[1] };
};

const getDateRangeFromProperty = (property) => {
  if (!property) return { start: '', end: '' };

  if (property.type === 'date') {
    return {
      start: property.date?.start || '',
      end: property.date?.end || '',
    };
  }

  if (property.type === 'formula' && property.formula?.type === 'date') {
    return {
      start: property.formula.date?.start || '',
      end: property.formula.date?.end || '',
    };
  }

  if (property.type === 'rollup' && property.rollup?.type === 'date') {
    return {
      start: property.rollup.date?.start || '',
      end: property.rollup.date?.end || '',
    };
  }

  if (property.type === 'created_time') {
    return { start: property.created_time, end: '' };
  }

  if (property.type === 'number') {
    return { start: property.number?.toString() || '', end: '' };
  }

  const text = getPropertyText(property);
  return getDateRangeFromText(text);
};

const getDateRangeFromProperties = (properties, createdTime) => {
  const periodProperty = findProperty(properties, ['period', '기간', 'duration', 'term', 'range']);
  if (periodProperty) {
    const range = getDateRangeFromProperty(periodProperty);
    if (range.start || range.end) return range;
  }

  const startProperty = findProperty(properties, [
    'start',
    'start_date',
    'startdate',
    'from',
    'since',
    '시작',
    '시작일',
  ]);
  const endProperty = findProperty(properties, [
    'end',
    'end_date',
    'enddate',
    'to',
    'until',
    '종료',
    '종료일',
  ]);

  const startRange = getDateRangeFromProperty(startProperty);
  const endRange = getDateRangeFromProperty(endProperty);
  const start = startRange.start || startRange.end;
  const end = endRange.end || endRange.start;

  if (start || end) {
    return { start, end };
  }

  const fallbackDate = findProperty(properties, ['date', 'year', '년도']);
  const fallbackRange = getDateRangeFromProperty(fallbackDate);
  if (fallbackRange.start || fallbackRange.end) return fallbackRange;

  if (createdTime) return { start: createdTime, end: '' };

  return { start: '', end: '' };
};

const getSortDateValue = (value) => {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === 'string') {
    const parsed = parseDateToken(value) || new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
};

const extractYear = (value) => {
  if (!value) return '';
  if (typeof value === 'number') return String(value);
  if (typeof value === 'string') {
    const match = value.match(/(19|20)\d{2}/);
    return match ? match[0] : '';
  }
  return '';
};

const getYearFromProperties = (properties, createdTime) => {
  const yearProperty = findProperty(properties, [
    'year',
    '년도',
    'start',
    'startDate',
    'start_date',
    'date',
    '기간',
  ]);

  if (yearProperty) {
    if (yearProperty.type === 'date' && yearProperty.date?.start) {
      return String(new Date(yearProperty.date.start).getFullYear());
    }
    if (yearProperty.type === 'number') {
      return String(yearProperty.number);
    }
    const text = getPropertyText(yearProperty);
    const parsed = extractYear(text);
    if (parsed) return parsed;
  }

  const fallbackDate = findProperty(properties, ['createdAt', 'created_at']);
  if (fallbackDate && fallbackDate.type === 'created_time') {
    return String(new Date(fallbackDate.created_time).getFullYear());
  }

  if (createdTime) {
    return String(new Date(createdTime).getFullYear());
  }

  return '';
};

export const getPublishedPosts = async () => {
  const dynamicDataSourceId = await getWorksDataSourceId();
  return withRequestCache(`works:all:${dynamicDataSourceId}`, 1000 * 60 * 2, async () => {
    const response = await notion.dataSources.query({
      data_source_id: dynamicDataSourceId,
      sorts: [
        {
          property: 'publishedAt',
          direction: 'descending',
        },
      ],
    });
    return response.results;
  });
};

export const getPublishedPostsPage = async ({ cursor = null, pageSize = 5 } = {}) => {
  const dynamicDataSourceId = await getWorksDataSourceId();
  const cacheKey = `works:page:${dynamicDataSourceId}:${cursor || 'start'}:${pageSize}`;

  return withRequestCache(cacheKey, 1000 * 60 * 2, async () => {
    const response = await notion.dataSources.query({
      data_source_id: dynamicDataSourceId,
      start_cursor: cursor || undefined,
      page_size: pageSize,
      sorts: [
        {
          property: 'publishedAt',
          direction: 'descending',
        },
      ],
    });

    return response;
  });
};

export const getPostBySlug = async (slug) => {
  const dynamicDataSourceId = await getWorksDataSourceId();

  return withRequestCache(`works:slug:${dynamicDataSourceId}:${slug}`, 1000 * 60 * 10, async () => {
    const response = await notion.dataSources.query({
      data_source_id: dynamicDataSourceId,
      filter: {
        property: 'slug',
        rich_text: {
          equals: slug,
        },
      },
      page_size: 1,
    });
    return response.results[0];
  });
};

export const getCareerEntries = async () => {
  const dataSourceId = await getCareerDataSourceId();
  const response = await withRequestCache(`career:list:${dataSourceId}`, 1000 * 60 * 10, async () => notion.dataSources.query({
    data_source_id: dataSourceId,
    page_size: 100,
  }));

  const entries = response.results.map((page) => {
    const properties = page.properties || {};
    const primaryProperty =
      findProperty(properties, ['company', '회사', 'organization', 'org', 'place', 'name', 'client']) ||
      findTitleProperty(properties);
    const roleProperty = findProperty(properties, [
      'role',
      'position',
      '직무',
      '직책',
      'title',
      'job',
    ]);
    const noteProperty = findProperty(properties, [
      'note',
      'memo',
      'description',
      'summary',
      'detail',
      '비고',
      '메모',
      '설명',
      '노트',
    ]);

    const primary = getPropertyText(primaryProperty) || 'Untitled';
    const role = getPropertyText(roleProperty);
    const note = getPropertyText(noteProperty);
    const dateRange = getDateRangeFromProperties(properties, page.created_time);

    return {
      id: page.id,
      start: dateRange.start,
      end: dateRange.end,
      name: primary,
      role,
      note,
      sortDate: dateRange.end || dateRange.start || page.created_time,
    };
  });

  return entries
    .filter((entry) => entry.name)
    .sort((a, b) => {
      const aDate = getSortDateValue(a.sortDate);
      const bDate = getSortDateValue(b.sortDate);
      const aTime = aDate ? aDate.getTime() : 0;
      const bTime = bDate ? bDate.getTime() : 0;
      return bTime - aTime;
    })
    .map(({ sortDate, ...entry }) => entry);
};

export const getPostContent = async (pageId) => {
  return getBlocksWithChildren(pageId);
};

export const getPostContentChunk = async (pageId, cursor = null, pageSize = 20) => {
  return getBlocksPageWithChildren(pageId, cursor, pageSize);
};
