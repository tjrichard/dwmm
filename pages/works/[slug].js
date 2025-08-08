import React, { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/router'
import Meta from '../../components/Meta'
import { supabase } from '../../lib/supabase'
import SkeletonLoader from '../../components/SkeletonLoader'
import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'
import ImageWithSkeleton from '../../components/ImageWithSkeleton'
import DOMPurify from 'dompurify'

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
const BlockRenderer = ({ blocks }) => {
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
              <div key={index} className="demo-block" dangerouslySetInnerHTML={{ __html: sanitizeHtml(block.embed_html) }} />
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
        {tabs[activeTab]?.content}
      </div>
    </div>
  );
};

export default function WorkDetailPage() {
  const router = useRouter()
  const { slug } = router.query
  const [entry, setEntry] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Hooks must be called in the same order on every render
  const content = entry?.content_markdown?.replace(/\\n/g, '\n') || ''

  const md = useMemo(() => new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true,
    breaks: true,
    highlight: function (str, lang) {
      let highlighted;
      if (lang && hljs.getLanguage(lang)) {
        try {
          highlighted = hljs.highlight(str, { language: lang, ignoreIllegals: true }).value;
        } catch (_) { }
      }
      if (!highlighted) {
        try {
          highlighted = hljs.highlightAuto(str).value;
        } catch (_) { }
      }
      const finalCode = highlighted || escapeHtml(str);
      return `<pre><code class="hljs">${finalCode}</code></pre>`;
    },
  }).use(require('markdown-it-image-lazy_loading'), {
    loading: 'lazy',
    decoding: 'async',
    class: 'post-content-image'
  }), []);

  const renderedHtml = useMemo(() => {
    const rawHtml = md.render(content);
    return sanitizeHtml(rawHtml);
  }, [md, content]);

  useEffect(() => {
    if (!slug) return

    const fetchEntry = async () => {
      try {
        let { data, error } = await supabase
          .from("works")
          .select("*")
          .eq("slug", slug)
          .eq("public", true)
          .single();

        if (error) {
          console.error("Supabase error:", error);
          setError(error);
        } else {
          setEntry(data);
        }
      } catch (err) {
        console.error("Fetch error:", err);
        setError(err);
      } finally {
        setLoading(false);
      }
    }

    fetchEntry()
  }, [slug])

  if (loading) return <SkeletonLoader variant="blogPost" />
  if (error) return <div>오류가 발생했습니다: {error.message}</div>
  if (!entry) return <div>작업물을 찾을 수 없습니다.</div>

  return (
    <div className="work-detail-page">
      <Meta title={entry.title} description={entry.excerpt || entry.title} />
      <article className="work-article minimal">
        <header className="work-header">
          <div className="work-category">{entry.category}</div>
          <h1 className="work-title">{entry.title}</h1>
        </header>
        {entry.thumbnail && (
          <figure className="work-hero-wrap">
            <ImageWithSkeleton
              src={entry.thumbnail}
              alt={entry.title}
              aspectRatio="16/9"
              className="work-hero"
              imgStyle={{ objectFit: 'cover' }}
              loading="eager"
              fetchPriority="high"
            />
          </figure>
        )}
        
        {entry.category === 'Blog' ? (
          <div className="work-content prose" dangerouslySetInnerHTML={{ __html: renderedHtml }} />
        ) : (
          <BlockRenderer blocks={entry.content_blocks || []} />
        )}
      </article>
    </div>
  )
}


