import React, { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/router'
import Meta from '../../components/Meta'
import SkeletonLoader from '../../components/SkeletonLoader'
import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'
import ImageWithSkeleton from '../../components/ImageWithSkeleton'
import DOMPurify from 'dompurify'
import { client } from '../../src/sanity/client'
import { WORK_BY_SLUG_QUERY, WORKS_QUERY } from '../../src/sanity/lib/queries'
import { urlFor } from '../../src/sanity/lib/image'
import { PortableText } from '@portabletext/react'

// Helper for HTML escaping
const escapeHtml = (str) => {
  return str.replace(/[&<>"']/g, (match) => {
    switch (match) {
      case '&': return '&amp;';
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '"': return '&quot;';
      case "'": return '&#039;';
    }
  });
};

// HTML sanitization utility function
const sanitizeHtml = (html) => {
  // 서버 사이드에서는 sanitization 없이 반환
  if (typeof window === 'undefined') {
    return html;
  }
  
  // 클라이언트에서만 DOMPurify 사용
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 's', 'del', 'ins',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'dl', 'dt', 'dd',
      'blockquote', 'pre', 'code',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'a', 'img', 'figure', 'figcaption',
      'div', 'span', 'hr'
    ],
    ALLOWED_ATTR: [
      'href', 'src', 'alt', 'title', 'class', 'id',
      'width', 'height', 'loading', 'decoding'
    ],
    ALLOW_DATA_ATTR: false,
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur']
  });
};

// Portfolio Block Renderer Component
const BlockRenderer = ({ blocks, isClient = false }) => {
  const [showAscii, setShowAscii] = useState({});

  const toggleAscii = (index) => {
    setShowAscii(prev => ({ ...prev, [index]: !prev[index] }));
  };

  return (
    <div className="portfolio-content-blocks">
      {blocks.map((block, index) => {
        switch (block.type) {
          case 'intro':
            return <p key={index} className="intro-text">{block.text}</p>;
          case 'image':
            return (
              <div key={index} className="image-block">
                <ImageWithSkeleton
                  src={block.src}
                  alt={block.alt}
                  aspectRatio="4/3"
                  loading="lazy"
                  decoding="async"
                />
              </div>
            );
          case 'full_width_image':
            return (
              <div key={index} className="full-width-image-block">
                <ImageWithSkeleton
                  src={block.src}
                  alt={block.alt}
                  aspectRatio="16/9"
                  loading="lazy"
                  decoding="async"
                />
              </div>
            );
          case 'tabs':
            return (
              <div key={index} className="tabs-block">
                <TabComponent tabs={block.tabs} />
              </div>
            );
          case 'demo':
            return (
              <div key={index} className="demo-block" dangerouslySetInnerHTML={{ __html: isClient ? sanitizeHtml(block.embed_html) : block.embed_html }} />
            );
          case 'ascii_image':
            return (
              <div key={index} className="ascii-image-block">
                <button onClick={() => toggleAscii(index)}>
                  {showAscii[index] ? 'Show Image' : 'Show ASCII'}
                </button>
                {showAscii[index] ? (
                  <pre className="ascii-text">{block.ascii_text}</pre>
                ) : (
                  <ImageWithSkeleton
                    src={block.src}
                    alt="ASCII Art Source"
                    aspectRatio="4/3"
                    loading="lazy"
                    decoding="async"
                  />
                )}
              </div>
            );
          case 'scroll_interaction':
            return (
              <div key={index} className="scroll-interaction-block">
                {block.steps.map((step, sIdx) => (
                  <div key={sIdx} className="scroll-step">
                    <h3>{step.heading}</h3>
                    <p>{step.text}</p>
                  </div>
                ))}
              </div>
            );
          default:
            return null;
        }
      })}
    </div>
  );
};

// Tab Component for Portfolio
const TabComponent = ({ tabs }) => {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className="tabs-component">
      <div className="tabs-header">
        {tabs.map((tab, index) => (
          <button
            key={index}
            className={`tab-button ${activeTab === index ? 'active' : ''}`}
            onClick={() => setActiveTab(index)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="tab-content">
        {tab[activeTab]?.content}
      </div>
    </div>
  );
};

// Sanity Portable Text 컴포넌트
const portableTextComponents = {
  types: {
    image: ({ value }) => {
      if (!value?.asset) return null;
      return (
        <div className="portable-text-image">
          <ImageWithSkeleton
            src={urlFor(value).url()}
            alt={value.alt || ''}
            aspectRatio="16/9"
            loading="lazy"
            decoding="async"
          />
          {value.caption && (
            <figcaption className="image-caption">{value.caption}</figcaption>
          )}
        </div>
      );
    },
    imageGallery: ({ value }) => {
      if (!value?.images || !Array.isArray(value.images)) return null;
      return (
        <div className="image-gallery">
          {value.images.map((image, index) => (
            <div key={index} className="gallery-item">
              <ImageWithSkeleton
                src={urlFor(image).url()}
                alt={image.alt || ''}
                aspectRatio="4/3"
                loading="lazy"
                decoding="async"
              />
            </div>
          ))}
        </div>
      );
    },
    embed: ({ value }) => {
      if (!value?.url) return null;
      return (
        <div className="embed-container">
          <iframe
            src={value.url}
            title={value.title || 'Embedded content'}
            width="100%"
            height="400"
            frameBorder="0"
            allowFullScreen
          />
        </div>
      );
    }
  }
};

export default function WorkDetailPage({ work, error: staticError }) {
  const router = useRouter()
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true);
  }, []);

  // 정적 생성 중 에러가 발생한 경우
  if (staticError) {
    return (
      <div className="error-container" style={{ padding: '2rem', textAlign: 'center' }}>
        <h3>데이터를 불러오는 중 오류가 발생했습니다</h3>
        <p>{staticError}</p>
      </div>
    );
  }

  // work 데이터가 없는 경우
  if (!work) {
    return (
      <div className="error-container" style={{ padding: '2rem', textAlign: 'center' }}>
        <h3>작업물을 찾을 수 없습니다</h3>
        <p>요청하신 작업물이 존재하지 않거나 삭제되었을 수 있습니다.</p>
      </div>
    );
  }

  // fallback 상태에서 로딩 표시
  if (router.isFallback) {
    return <SkeletonLoader variant="blogPost" />;
  }

  return (
    <div className="work-detail-page">
      <Meta 
        title={work.title} 
        description={work.excerpt || work.title}
        image={work.coverImage ? urlFor(work.coverImage).url() : undefined}
      />
      <article className="work-article minimal">
        <header className="work-header">
          <div className="work-category">{work.categories?.[0]?.title || 'Uncategorized'}</div>
          <h1 className="work-title">{work.title}</h1>
          {work.excerpt && (
            <p className="work-excerpt">{work.excerpt}</p>
          )}
        </header>
        
        {work.coverImage && (
          <figure className="work-hero-wrap">
            <ImageWithSkeleton
              src={urlFor(work.coverImage).url()}
              alt={work.title}
              aspectRatio="16/9"
              className="work-hero"
              imgStyle={{ objectFit: 'cover' }}
              loading="eager"
              fetchPriority="high"
            />
          </figure>
        )}
        
        {work.contentKind === 'Blog' ? (
          // Blog 타입인 경우 Portable Text 렌더링
          <div className="work-content prose">
            {work.body && <PortableText value={work.body} components={portableTextComponents} />}
          </div>
        ) : (
          // Portfolio 타입인 경우 기존 블록 렌더러 사용
          <div className="work-content">
            {work.body && <PortableText value={work.body} components={portableTextComponents} />}
          </div>
        )}

        {/* 태그 표시 */}
        {work.tags && work.tags.length > 0 && (
          <div className="work-tags">
            {work.tags.map((tag, index) => (
              <span key={index} className="work-tag">#{tag.title}</span>
            ))}
          </div>
        )}

        {/* 외부 링크가 있는 경우 */}
        {work.externalUrl && (
          <div className="work-external-link">
            <a href={work.externalUrl} target="_blank" rel="noopener noreferrer" className="external-link-button">
              프로젝트 보기 →
            </a>
          </div>
        )}
      </article>
    </div>
  )
}

// 정적 경로 생성
export async function getStaticPaths() {
  try {
    const works = await client.fetch(WORKS_QUERY);
    
    const paths = works
      .filter(work => work.slug?.current)
      .map(work => ({
        params: { slug: work.slug.current }
      }));

    return {
      paths,
      fallback: 'blocking' // 새로운 slug가 추가되면 빌드 시 자동으로 생성
    };
  } catch (error) {
    console.error('Error generating static paths:', error);
    return {
      paths: [],
      fallback: 'blocking'
    };
  }
}

// 정적 props 생성
export async function getStaticProps({ params }) {
  try {
    const { slug } = params;
    
    if (!slug) {
      return {
        notFound: true
      };
    }

    const work = await client.fetch(WORK_BY_SLUG_QUERY, { slug });

    if (!work) {
      return {
        notFound: true
      };
    }

    return {
      props: {
        work
      },
      revalidate: 60 // 1분마다 재검증
    };
  } catch (error) {
    console.error('Error fetching work data:', error);
    
    return {
      props: {
        work: null,
        error: error.message
      },
      revalidate: 60
    };
  }
}


