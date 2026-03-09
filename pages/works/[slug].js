import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Meta from '../../components/meta';
import SkeletonLoader from '../../components/skeletonLoader';
import ImageWithSkeleton from '../../components/ImageWithSkeleton';
import { getPublishedPosts, getPostBySlug, getPostContent } from '../../lib/notion';
import {
  findProperty,
  getNotionThumbnail,
  getPropertyDateRange,
  getPropertyMultiSelect,
  getPropertyText,
} from '../../utils/notion';

import NotionBlockRenderer from '../../components/NotionBlockRenderer';

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

// Notion 페이지 데이터를 UI에 맞게 변환하는 함수
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
    tags: properties.tags?.multi_select?.map(tag => tag.name) || [],
    created_at: properties.publishedAt?.date?.start || post.created_time,
    externalUrl: properties.externalUrl?.url || null,
    ...meta,
  };
};

const formatYear = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '';
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

const formatTimelineRange = (start, end, fallbackText) => {
  if (fallbackText) return fallbackText;
  const startText = formatTimelineDate(start);
  const endText = formatTimelineDate(end);
  if (!startText && !endText) return '';
  if (startText && endText) return `${startText} - ${endText}`;
  return `${startText || endText} - 현재`;
};

export default function WorkDetailPage({ post, content, initialHasMore, slug, error: staticError }) {
  const router = useRouter();
  const [postState, setPostState] = useState(post || null);
  const [postLoading, setPostLoading] = useState(!post);
  const [postError, setPostError] = useState(null);
  const postId = postState?.id || postState?._id || null;
  const pageSize = 12;
  const [clientContent, setClientContent] = useState(content || []);
  const [contentLoading, setContentLoading] = useState(!content);
  const [loadingMore, setLoadingMore] = useState(false);
  const [contentError, setContentError] = useState(null);
  const [nextCursor, setNextCursor] = useState(null);
  const [hasMore, setHasMore] = useState(initialHasMore ?? true);
  const loadMoreRef = useRef(null);
  const showInitialSkeleton = clientContent.length === 0 && !contentError && (contentLoading || hasMore);

  useEffect(() => {
    if (post) {
      setPostState(post);
      setPostLoading(false);
      setPostError(null);
    }
  }, [post]);

  useEffect(() => {
    if (post) return;
    if (!slug) return;

    const loadMeta = async () => {
      setPostLoading(true);
      setPostError(null);
      try {
        const response = await fetch(`/api/works/meta?slug=${slug}`);
        if (!response.ok) throw new Error('Failed to load post meta');
        const data = await response.json();
        if (data.post) {
          setPostState(data.post);
        } else {
          setPostError('작업물을 찾을 수 없습니다');
        }
      } catch (error) {
        setPostError('작업물을 불러오는 중 오류가 발생했습니다.');
      } finally {
        setPostLoading(false);
      }
    };

    loadMeta();
  }, [post, slug]);

  useEffect(() => {
    if (content && content.length > 0) {
      setContentLoading(false);
      setHasMore(initialHasMore ?? false);
    } else {
      setClientContent([]);
      setHasMore(true);
      setNextCursor(null);
      setContentError(null);
      setContentLoading(true);
    }
  }, [content, initialHasMore, postId]);

  const fetchChunk = async ({ cursor, isInitial }) => {
    if (!postId) return;

    if (isInitial) {
      setContentLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const params = new URLSearchParams();
      params.set('id', postId);
      params.set('page_size', String(pageSize));
      if (cursor) params.set('cursor', cursor);
      const response = await fetch(`/api/works/content?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to load content');
      const data = await response.json();
      setClientContent((prev) => (isInitial ? data.content || [] : [...prev, ...(data.content || [])]));
      setNextCursor(data.nextCursor || null);
      setHasMore(Boolean(data.hasMore));
    } catch (error) {
      setContentError('콘텐츠를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setContentLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (content && content.length > 0) return;
    if (!postId) return;
    fetchChunk({ cursor: null, isInitial: true });
  }, [postId]);

  useEffect(() => {
    if (!hasMore || contentLoading || loadingMore) return;
    const target = loadMoreRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasMore && !loadingMore) {
          fetchChunk({ cursor: nextCursor, isInitial: false });
        }
      },
      { rootMargin: '200px', threshold: 0.01 }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [hasMore, nextCursor, contentLoading, loadingMore]);

  if (staticError) {
    return (
      <div className="error-container" style={{ padding: '2rem', textAlign: 'center' }}>
        <h3>데이터를 불러오는 중 오류가 발생했습니다</h3>
        <p>{staticError}</p>
      </div>
    );
  }

  if (router.isFallback || postLoading) {
    return <SkeletonLoader variant="blogPost" />;
  }

  if (postError) {
    return (
      <div className="error-container" style={{ padding: '2rem', textAlign: 'center' }}>
        <h3>작업물을 찾을 수 없습니다</h3>
        <p>{postError}</p>
      </div>
    );
  }

  if (!postState) {
    return (
      <div className="error-container" style={{ padding: '2rem', textAlign: 'center' }}>
        <h3>작업물을 찾을 수 없습니다</h3>
        <p>콘텐츠를 준비 중이거나, 요청하신 작업물이 존재하지 않을 수 있습니다.</p>
      </div>
    );
  }

  const timelineLabel = formatTimelineRange(
    postState.timelineStart,
    postState.timelineEnd,
    postState.timelineText
  );
  const skillsValue = Array.isArray(postState.skills)
    ? postState.skills
    : (postState.skills ? [postState.skills] : []);
  const workInfoItems = [
    { label: 'Role', value: postState.role },
    { label: 'Timeline', value: timelineLabel },
    { label: 'Team', value: postState.team },
    { label: 'Skills', value: skillsValue },
  ].filter((item) => {
    if (Array.isArray(item.value)) return item.value.length > 0;
    return Boolean(item.value);
  });
  const metaYear = formatYear(postState.created_at);

  return (
    <div className="work-detail-page">
      <Meta
        title={postState.title}
        description={postState.excerpt || postState.title}
        image={postState.thumbnail}
      />
      <article className="work-article minimal">
        <header className="work-header">
          <div className="work-header__nav">
            <Link href="/works" className="work-back">← Back</Link>
          </div>
          <div className="work-header__main">
            <div className="work-meta-line">
              {postState.category && <span>{postState.category}</span>}
              {postState.category && metaYear && <span className="work-meta-dot">•</span>}
              {metaYear && <span>{metaYear}</span>}
            </div>
            <h1 className="work-title">{postState.title}</h1>
            {postState.excerpt && (
              <p className="work-excerpt">{postState.excerpt}</p>
            )}
          </div>
        </header>

        {postState.thumbnail && (
          <figure className="work-hero-wrap">
            <ImageWithSkeleton
              src={postState.thumbnail}
              alt={postState.title}
              aspectRatio="16/9"
              className="work-hero"
              imgStyle={{ objectFit: 'cover' }}
              loading="eager"
              fetchPriority="high"
            />
          </figure>
        )}

        {workInfoItems.length > 0 && (
          <section className="work-info-grid">
            {workInfoItems.map((item) => (
              <div key={item.label} className="work-info-item">
                <span className="work-info-label">{item.label}</span>
                <div className="work-info-value">
                  {Array.isArray(item.value)
                    ? item.value.map((value, index) => (
                        <span key={`${item.label}-${index}`} className="work-info-line">
                          {value}
                        </span>
                      ))
                    : (
                      <span className="work-info-line">{item.value}</span>
                    )}
                </div>
              </div>
            ))}
          </section>
        )}

        <div className="work-content prose">
          {showInitialSkeleton && <SkeletonLoader variant="blogPost" count={10} />}
          {!contentLoading && contentError && <p className="work-content-error">{contentError}</p>}
          {clientContent.length > 0 && <NotionBlockRenderer content={clientContent} />}
          {hasMore && !contentError && (
            <div className={`work-content-sentinel ${loadingMore ? 'is-loading' : ''}`} ref={loadMoreRef}>
              {loadingMore && <SkeletonLoader variant="blogPost" count={14} />}
              {/* Load more 버튼 제거: 무한 스크롤로만 로딩 */}
            </div>
          )}
        </div>

        {postState.tags && postState.tags.length > 0 && (
          <div className="work-tags">
            {postState.tags.map((tag, index) => (
              <span key={index} className="work-tag">#{tag}</span>
            ))}
          </div>
        )}

        {postState.externalUrl && (
          <div className="work-external-link">
            <a href={postState.externalUrl} target="_blank" rel="noopener noreferrer" className="external-link-button">
              프로젝트 보기 →
            </a>
          </div>
        )}
      </article>
    </div>
  );
}

export async function getStaticPaths() {
  try {
    const posts = await getPublishedPosts();
    const paths = posts.map(post => ({
      params: { slug: post.properties.slug?.rich_text[0]?.plain_text },
    })).filter(p => p.params.slug);

    return {
      paths,
      fallback: true,
    };
  } catch (error) {
    console.error('Error in getStaticPaths:', error);
    return {
      paths: [],
      fallback: true,
    };
  }
}

export async function getStaticProps({ params }) {
  try {
    const eagerMeta = process.env.NOTION_EAGER_WORKS_META === 'true';
    const postData = eagerMeta ? await getPostBySlug(params.slug) : null;
    if (eagerMeta && !postData) {
      return { notFound: true };
    }

    const eagerContent = process.env.NOTION_EAGER_WORKS_CONTENT === 'true';
    const content = eagerContent && postData ? await getPostContent(postData.id) : null;
    const transformedPost = postData ? transformPostData(postData) : null;

    return {
      props: {
        post: transformedPost,
        content,
        initialHasMore: !(eagerContent && content),
        slug: params.slug,
      },
      revalidate: 60,
    };
  } catch (error) {
    console.error(`Error in getStaticProps for slug: ${params.slug}`, error);
    return {
      props: {
        post: null,
        content: null,
        error: 'Failed to fetch post data.',
      },
      revalidate: 60,
    };
  }
}
