// pages/works/index.js
import React, { useCallback, useEffect, useRef, useState } from "react";
import Meta from "../../components/meta.js";
import Link from 'next/link';
import SkeletonLoader from '../../components/skeletonLoader.js';
import ImageWithSkeleton from '../../components/ImageWithSkeleton.js'
import ContentGrid from '../../components/ContentGrid.js';
import { getPublishedPostsPage, getCareerEntries } from "../../lib/notion.js";
import { getNotionThumbnail } from "../../utils/notion";

const PAGE_SIZE = 5;

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const formatYear = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.getFullYear();
};

const formatTimelineDate = (value) => {
  if (!value) return '';
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (/^\d{4}$/.test(trimmed)) return trimmed;
    const parts = trimmed.split(/[./-]/).filter(Boolean);
    if (parts.length >= 2 && /^\d{4}$/.test(parts[0])) {
      return `${parts[0]}.${String(parts[1]).padStart(2, '0')}`;
    }
    const parsed = new Date(trimmed);
    if (Number.isNaN(parsed.getTime())) return trimmed;
    const month = parsed.getMonth() + 1;
    return `${parsed.getFullYear()}.${String(month).padStart(2, '0')}`;
  }
  if (value instanceof Date) {
    const month = value.getMonth() + 1;
    return `${value.getFullYear()}.${String(month).padStart(2, '0')}`;
  }
  return '';
};

const formatPeriod = (start, end) => {
  const startText = formatTimelineDate(start);
  const endText = formatTimelineDate(end) || '현재';
  if (!startText && !endText) return '';
  return `${startText || '현재'} - ${endText}`;
};

// Notion 데이터를 기존 UI에 맞게 변환하는 함수
const transformNotionData = (notionPosts) => {
  return notionPosts.map(post => {
    const properties = post.properties;
    return {
      id: post.id,
      _id: post.id,
      title: properties.title?.title[0]?.plain_text || '제목 없음',
      slug: properties.slug?.rich_text[0]?.plain_text,
      excerpt: properties.summary?.rich_text[0]?.plain_text || '',
      thumbnail: getNotionThumbnail(post),
      category: properties.category?.select?.name || '미분류',
      tags: properties.tags?.multi_select?.map(tag => tag.name) || [],
      created_at: properties.publishedAt?.date?.start || post.created_time,
    };
  });
};

function WorksList({ works, careerTimeline, loading, loadingMore, hasMore, loadMoreRef, error }) {
  if (!works) {
    return null;
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
    <div className="works-page">
      <div className="works-main">
        <section className="works-hero">
          <div className="works-hero__intro">
            <h1 className="works-hero__title">
              I'm DWMM, a designer who <em>builds</em>.
            </h1>
            <p className="works-hero__subtitle">
              노션을 CMS로 사용하고, 제품과 브랜드에 의미 있는 경험을 설계합니다.
            </p>
          </div>
          {careerTimeline.length > 0 && (
            <div className="works-hero__timeline">
              {careerTimeline.map((item) => (
                <div key={item.id} className="works-hero__timeline-item">
                  <span className="works-hero__period">{formatPeriod(item.start, item.end)}</span>
                  <div className="works-hero__info">
                    <span className="works-hero__item-title">
                      {item.role ? `${item.name} • ${item.role}` : item.name}
                    </span>
                    {item.note && <span className="works-hero__item-note">{item.note}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="works-grid">
          {loading && (
            <div className="works-grid__loading">
              <div className="WorksLists">
                <SkeletonLoader variant="workCard" count={1} />
              </div>
            </div>
          )}
          {!loading && works.length > 0 && (
            <ContentGrid
              contents={works.map(p => ({
                ...p,
                thumbnail: p.thumbnail
              }))}
              renderItem={(item) => (
                <div className="WorkCard animate-fade-in">
                  <Link href={`/works/${item.slug}`} className="WorkCard__link">
                    {item.thumbnail && (
                      <div className="WorkCard__media">
                        <ImageWithSkeleton src={item.thumbnail} alt={item.title} aspectRatio="16/9" loading="lazy" decoding="async" />
                      </div>
                    )}
                    <div className="WorkCard__body">
                      <div className="WorkCard__meta-line">
                        <span>{item.category}</span>
                        <span>{formatYear(item.created_at)}</span>
                      </div>
                      <h2 className="WorkCard__title">{item.title}</h2>
                      <p className="WorkCard__excerpt">
                        {item.excerpt ? `${item.excerpt.slice(0, 160)}...` : ''}
                      </p>
                      <div className="WorkCard__meta">
                        <span className="WorkCard__date">{formatDate(item.created_at)}</span>
                      </div>
                    </div>
                  </Link>
                </div>
              )}
            />
          )}
          {hasMore && !loading && (
            <div
              className={`works-grid__sentinel ${loadingMore ? 'is-loading' : ''}`}
              ref={loadMoreRef}
            >
              {loadingMore && (
                <div className="WorksLists">
                  <SkeletonLoader variant="workCard" count={1} />
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function Works({ title, description, works, careerTimeline, error, deferred, nextCursor, initialHasMore }) {
  const [clientWorks, setClientWorks] = useState(works || []);
  const [clientCareer, setClientCareer] = useState(careerTimeline || []);
  const [loading, setLoading] = useState(deferred || !works?.length);
  const [loadingMore, setLoadingMore] = useState(false);
  const [clientError, setClientError] = useState(error || null);
  const [cursor, setCursor] = useState(nextCursor || null);
  const [hasMore, setHasMore] = useState(initialHasMore ?? true);
  const loadMoreRef = useRef(null);

  const fetchPage = useCallback(async ({ cursor: next, isInitial }) => {
    if (isInitial) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    setClientError(null);

    try {
      const params = new URLSearchParams();
      params.set('page_size', String(PAGE_SIZE));
      if (next) params.set('cursor', next);
      const response = await fetch(`/api/works/list?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to load works list');
      const data = await response.json();
      setClientWorks((prev) => (isInitial ? data.works || [] : [...prev, ...(data.works || [])]));
      if (data.careerTimeline && data.careerTimeline.length > 0) {
        setClientCareer(data.careerTimeline);
      }
      setCursor(data.nextCursor || null);
      setHasMore(Boolean(data.hasMore));
    } catch (err) {
      setClientError('데이터를 불러오는 중 오류가 발생했습니다');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    const hasInitialData = Array.isArray(works) && works.length > 0 && !deferred;
    if (hasInitialData) {
      setLoading(false);
      setHasMore(initialHasMore ?? false);
      setCursor(nextCursor || null);
      return;
    }

    fetchPage({ cursor: null, isInitial: true });
  }, [deferred, works, fetchPage, initialHasMore, nextCursor]);

  useEffect(() => {
    if (!hasMore || loading || loadingMore) return;
    const target = loadMoreRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasMore && !loadingMore) {
          fetchPage({ cursor, isInitial: false });
        }
      },
      { rootMargin: '200px', threshold: 0.01 }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [cursor, fetchPage, hasMore, loading, loadingMore]);

  return (
    <div>
      <Meta title={title} description={description} />
      <main>
        <section>
          <WorksList
            works={clientWorks}
            careerTimeline={clientCareer}
            loading={loading}
            loadingMore={loadingMore}
            hasMore={hasMore}
            loadMoreRef={loadMoreRef}
            error={clientError}
          />
        </section>
      </main>
    </div>
  );
}

export async function getStaticProps() {
  try {
    const eagerList = process.env.NOTION_EAGER_WORKS_LIST === 'true';
    let transformedWorks = [];
    let careerTimeline = [];
    let nextCursor = null;
    let hasMore = false;

    if (eagerList) {
      const response = await getPublishedPostsPage({ pageSize: PAGE_SIZE });
      transformedWorks = transformNotionData(response.results || []);
      nextCursor = response.next_cursor || null;
      hasMore = Boolean(response.has_more);

      try {
        careerTimeline = await getCareerEntries();
      } catch (careerError) {
        console.error('Error fetching career data from Notion:', careerError);
      }
    }

    return {
      props: {
        title: "DWMM | Works",
        description: "My thoughts and creative works",
        works: transformedWorks,
        careerTimeline,
        error: null,
        deferred: !eagerList,
        nextCursor,
        initialHasMore: hasMore
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
        careerTimeline: [],
        error: error.message || "An unexpected error occurred.",
        deferred: true,
        nextCursor: null,
        initialHasMore: true
      },
      revalidate: 60,
    };
  }
}

export default Works;
