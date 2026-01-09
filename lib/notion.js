import { Client } from '@notionhq/client';

const notion = new Client({ auth: process.env.NOTION_API_KEY });

// 데이터소스 이름을 기반으로 동적으로 ID를 찾는 함수
const findDataSourceIdByName = async (name) => {
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
    throw new Error(`Data source with name "${name}" not found via search API.`);
  }
  
  const dataSource = response.results[0];
  console.log(`Data source found via search! ID: ${dataSource.id}`);
  return dataSource.id;
};

export const getPublishedPosts = async () => {
  const dynamicDataSourceId = await findDataSourceIdByName("Blog");

  if (!dynamicDataSourceId) {
    throw new Error('Could not dynamically find the data source ID.');
  }

  // dataSources.query를 사용하고, data_source_id를 전달
  const response = await notion.dataSources.query({
    data_source_id: dynamicDataSourceId,
    // filter: {
    //   property: 'status',
    //   select: {
    //     equals: 'published',
    //   },
    // },
    sorts: [
      {
        property: 'publishedAt',
        direction: 'descending',
      },
    ],
  });
  return response.results;
};

export const getPostBySlug = async (slug) => {
  const dynamicDataSourceId = await findDataSourceIdByName("Blog");

  if (!dynamicDataSourceId) {
    throw new Error('Could not dynamically find the data source ID.');
  }

  // dataSources.query를 사용하고, data_source_id를 전달
  const response = await notion.dataSources.query({
    data_source_id: dynamicDataSourceId,
    filter: {
      property: 'slug',
      rich_text: {
        equals: slug,
      },
    },
  });
  return response.results[0];
};

export const getPostContent = async (pageId) => {
  const response = await notion.blocks.children.list({ block_id: pageId });
  return response.results;
};
