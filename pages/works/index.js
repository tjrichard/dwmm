// pages/works/index.js
import React, { useMemo, useState } from "react";
import Meta from "../../components/Meta.js";
import Link from 'next/link';
import SkeletonLoader from '../../components/SkeletonLoader.js';
import ImageWithSkeleton from '../../components/ImageWithSkeleton.js'
import BookmarkLNB from '../../components/bookmark/Lnb.js';
import ContentGrid from '../../components/ContentGrid.js';
import { getPublishedPosts } from "../../lib/notion.js";

// Helper functions
const stripMarkdown = (markdown) => {
  if (!markdown) return '';
  return markdown
    .replace(/^### (.*$)/gim, '$1')
    .replace(/^## (.*$)/gim, '$1')
    .replace(/^# (.*$)/gim, '$1')
    .replace(/^\- (.*$)/gim, '$1')
    .replace(/\*\*(.*)\*\*/gim, '$1')
    .replace(/\*(.*)\*/gim, '$1')
    .replace(/\ \[([^\]]+)\]\(([^)]+)\)/gim, '$1')
    .replace(/`([^`]+)`/gim, '$1')
    .replace(/\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Notion 데이터를 기존 UI에 맞게 변환하는 함수
const transformNotionData = (notionPosts) => {
  return notionPosts.map(post => {
    const properties = post.properties;
    return {
      _id: post.id,
      title: properties.title?.title[0]?.plain_text || '제목 없음',
      slug: properties.slug?.rich_text[0]?.plain_text,
      excerpt: properties.summary?.rich_text[0]?.plain_text || '',
      thumbnail: properties.thumbnail?.url || null,
      category: properties.category?.select?.name || '미분류',
      tags: properties.tags?.multi_select?.map(tag => tag.name) || [],
      created_at: properties.publishedAt?.date?.start || post.created_time,
    };
  });
};

function FetchWorksLists({ initialWorks, initialCategories, initialTags, error }) {
  const [data, setData] = useState(initialWorks || []);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedTag, setSelectedTag] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  const allTags = useMemo(() => {
    const set = new Set();
    (data || []).forEach(p => (p.tags || []).forEach(t => set.add(t)));
    return Array.from(set);
  }, [data]);

  const allCategories = useMemo(() => {
    const set = new Set();
    (data || []).forEach(p => set.add(p.category));
    return Array.from(set);
  }, [data]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (data || []).filter(p => {
      const matchText = !q || p.title?.toLowerCase().includes(q) || (p.excerpt || stripMarkdown(p.content_markdown || "")).toLowerCase().includes(q)
      const matchTag = !selectedTag || (p.tags || []).includes(selectedTag)
      const matchCategory = !selectedCategory || p.category === selectedCategory
      return matchText && matchTag && matchCategory
    })
  }, [data, search, selectedTag, selectedCategory]);

  if (loading) {
    return (
      <div className="WorksLists">
        {[...Array(10)].map((_, index) => (
          <SkeletonLoader key={index} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container" style={{ padding: '2rem', textAlign: 'center' }}>
        <h3>데이터를 불러오는 중 오류가 발생했습니다</h3>
        <p>{error}</p>
        <p>잠시 후 다시 시도해주세요. (.env.local 파일의 Notion 키를 확인해보세요)</p>
      </div>
    );
  }

  return (
    <div className="works-list-layout">
      <aside className="works-sidebar">
        <BookmarkLNB
          categories={allCategories}
          tags={allTags}
          selectedCategory={selectedCategory}
          selectedTags={selectedTag ? [selectedTag] : []}
          onSearch={({ tags, category }) => {
            setSelectedTag(tags[0] || "");
            setSelectedCategory(category || "");
          }}
        />
      </aside>

      <ContentGrid
        contents={filtered.map(p => ({
          ...p,
          thumbnail: p.thumbnail
        }))}
        isSearching={loading}
        renderItem={(item) => (
          <div className="WorkCard animate-fade-in">
            <Link href={`/works/${item.slug}`} className="WorkCard__link">
              {item.thumbnail && (
                <div className="WorkCard__media">
                  <ImageWithSkeleton src={item.thumbnail} alt={item.title} aspectRatio="16/9" loading="lazy" decoding="async" />
                </div>
              )}
              <div className="WorkCard__body">
                <div className="WorkCard__category">{item.category}</div>
                <h2 className="WorkCard__title">{item.title}</h2>
                <p className="WorkCard__excerpt">
                  {(item.excerpt && item.excerpt.slice(0, 160)) || ''}...
                </p>
                <div className="WorkCard__meta">
                  <span className="WorkCard__date">{formatDate(item.created_at)}</span>
                  {item.tags && item.tags.length > 0 && (
                    <div className="WorkCard__tags">
                      {item.tags.slice(0, 3).map((t, i) => (
                        <span key={i} className="WorkCard__tag">#{t}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Link>
          </div>
        )}
      />
    </div>
  );
}

function Works({ title, description, works, categories, tags, error }) {
  return (
    <div>
      <Meta title={title} description={description} />
      <main>
        <section>
          <FetchWorksLists initialWorks={works} initialCategories={categories} initialTags={tags} error={error} />
        </section>
      </main>
    </div>
  );
}

export async function getStaticProps() {
  try {
    const notionPosts = await getPublishedPosts();
    console.log('Fetched Notion Posts:', JSON.stringify(notionPosts, null, 2));

    const transformedWorks = transformNotionData(notionPosts);

    const categories = [...new Set(transformedWorks.map(work => work.category))];
    const tags = [...new Set(transformedWorks.flatMap(work => work.tags))];

    return {
      props: {
        title: "DWMM | Works",
        description: "My thoughts and creative works",
        works: transformedWorks,
        categories: categories,
        tags: tags,
        error: null
      },
      revalidate: 60,
    };
  } catch (error) {
    console.error('Error fetching data from Notion:', error);
    return {
      props: {
        title: "DWMM | Works",
        description: "My thoughts and creative works",
        works: [],
        categories: [],
        tags: [],
        error: error.message || "An unexpected error occurred."
      },
      revalidate: 60,
    };
  }
}

export default Works;
