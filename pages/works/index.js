// pages/works/index.js
import React, { useEffect, useMemo, useState } from "react";
import Meta from "../../components/Meta.js";
import Link from 'next/link';
import SkeletonLoader from '../../components/SkeletonLoader.js';
import ImageWithSkeleton from '../../components/ImageWithSkeleton.js'
import BookmarkLNB from '../../components/bookmark/Lnb.js';
import ContentGrid from '../../components/ContentGrid.js';
import { client } from "../../src/sanity/client";
import { WORKS_QUERY, CATEGORIES_QUERY, TAGS_QUERY } from "../../src/sanity/lib/queries";
import { urlFor } from "../../src/sanity/lib/image";

// Helper functions
const stripHtml = (html) => {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '');
};

const stripMarkdown = (markdown) => {
  if (!markdown) return '';
  return markdown
    .replace(/^### (.*$)/gim, '$1') // h3
    .replace(/^## (.*$)/gim, '$1') // h2
    .replace(/^# (.*$)/gim, '$1') // h1
    .replace(/^\- (.*$)/gim, '$1') // list
    .replace(/\*\*(.*)\*\*/gim, '$1') // bold
    .replace(/\*(.*)\*/gim, '$1') // italic
    .replace(/\[([^\]]+)\]\([^)]+\)/gim, '$1') // links
    .replace(/`([^`]+)`/gim, '$1') // code
    .replace(/\n/g, ' ') // newlines
    .replace(/\s+/g, ' ') // multiple spaces
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

// Sanity 데이터를 기존 UI에 맞게 변환하는 함수
const transformSanityData = (sanityWorks) => {
  return sanityWorks.map(work => ({
    _id: work._id,
    title: work.title,
    slug: work.slug?.current,
    excerpt: work.excerpt,
    content_markdown: work.excerpt, // 기존 UI 호환성을 위해
    thumbnail: work.coverImage ? urlFor(work.coverImage).url() : null,
    category: work.categories?.[0]?.title || 'Uncategorized',
    tags: work.tags?.map(tag => tag.title) || [],
    created_at: work.publishedAt,
    public: true // Sanity에서는 published 상태로 관리
  }));
};

function FetchWorksLists({ initialWorks, initialCategories, initialTags }) {
  const [data, setData] = useState(initialWorks || []);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedTag, setSelectedTag] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  // Hooks moved to top for consistent order
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
        <p>{error.message}</p>
        <p>잠시 후 다시 시도해주세요.</p>
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
                  {(item.excerpt && item.excerpt.slice(0, 160)) || stripMarkdown(item.content_markdown).slice(0, 160)}...
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

function Works({ title, description, works, categories, tags }) {
  return (
    <div>
      <Meta title={title} description={description} />
      <main>
        <section>
          <FetchWorksLists initialWorks={works} initialCategories={categories} initialTags={tags} />
        </section>
      </main>
    </div>
  );
}

export async function getStaticProps() {
  try {
    // Sanity에서 works, categories, tags 데이터 가져오기
    const [works, categories, tags] = await Promise.all([
      client.fetch(WORKS_QUERY),
      client.fetch(CATEGORIES_QUERY),
      client.fetch(TAGS_QUERY)
    ]);

    // Sanity 데이터를 기존 UI에 맞게 변환
    const transformedWorks = transformSanityData(works);

    const pageProps = {
      title: "DWMM | Works",
      description: "My thoughts and creative works",
      works: transformedWorks,
      categories: categories || [],
      tags: tags || []
    };

    return {
      props: pageProps,
      revalidate: 60, // 1분마다 재검증
    };
  } catch (error) {
    console.error('Error fetching data from Sanity:', error);
    
    // 에러 발생 시 기본 props 반환
    return {
      props: {
        title: "DWMM | Works",
        description: "My thoughts and creative works",
        works: [],
        categories: [],
        tags: [],
        error: error.message
      },
      revalidate: 60,
    };
  }
}

export default Works;
