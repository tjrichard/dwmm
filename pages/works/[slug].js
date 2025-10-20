import React from 'react';
import { useRouter } from 'next/router';
import Meta from '../../components/Meta';
import SkeletonLoader from '../../components/SkeletonLoader';
import ImageWithSkeleton from '../../components/ImageWithSkeleton';
import { getPublishedPosts, getPostBySlug, getPostContent } from '../../lib/notion';

import NotionBlockRenderer from '../../components/NotionBlockRenderer';

// Notion 페이지 데이터를 UI에 맞게 변환하는 함수
const transformPostData = (post) => {
  if (!post) return null;
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
    externalUrl: properties.externalUrl?.url || null,
  };
};

export default function WorkDetailPage({ post, content, error: staticError }) {
  const router = useRouter();

  if (staticError) {
    return (
      <div className="error-container" style={{ padding: '2rem', textAlign: 'center' }}>
        <h3>데이터를 불러오는 중 오류가 발생했습니다</h3>
        <p>{staticError}</p>
      </div>
    );
  }

  if (router.isFallback) {
    return <SkeletonLoader variant="blogPost" />;
  }

  if (!post) {
    return (
      <div className="error-container" style={{ padding: '2rem', textAlign: 'center' }}>
        <h3>작업물을 찾을 수 없습니다</h3>
        <p>콘텐츠를 준비 중이거나, 요청하신 작업물이 존재하지 않을 수 있습니다.</p>
      </div>
    );
  }

  return (
    <div className="work-detail-page">
      <Meta 
        title={post.title}
        description={post.excerpt || post.title}
        image={post.thumbnail}
      />
      <article className="work-article minimal">
        <header className="work-header">
          <div className="work-category">{post.category}</div>
          <h1 className="work-title">{post.title}</h1>
          {post.excerpt && (
            <p className="work-excerpt">{post.excerpt}</p>
          )}
        </header>
        
        {post.thumbnail && (
          <figure className="work-hero-wrap">
            <ImageWithSkeleton
              src={post.thumbnail}
              alt={post.title}
              aspectRatio="16/9"
              className="work-hero"
              imgStyle={{ objectFit: 'cover' }}
              loading="eager"
              fetchPriority="high"
            />
          </figure>
        )}
        
        <div className="work-content prose">
          <NotionBlockRenderer content={content} />
        </div>

        {post.tags && post.tags.length > 0 && (
          <div className="work-tags">
            {post.tags.map((tag, index) => (
              <span key={index} className="work-tag">#{tag}</span>
            ))}
          </div>
        )}

        {post.externalUrl && (
          <div className="work-external-link">
            <a href={post.externalUrl} target="_blank" rel="noopener noreferrer" className="external-link-button">
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
      fallback: 'blocking',
    };
  } catch (error) {
    console.error('Error in getStaticPaths:', error);
    return {
      paths: [],
      fallback: 'blocking',
    };
  }
}

export async function getStaticProps({ params }) {
  try {
    const postData = await getPostBySlug(params.slug);

    if (!postData) {
      return { notFound: true };
    }

    const content = await getPostContent(postData.id);
    const transformedPost = transformPostData(postData);

    return {
      props: {
        post: transformedPost,
        content,
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
