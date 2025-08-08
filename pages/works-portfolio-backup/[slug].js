import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Meta from '../../components/Meta'
import { supabase } from '../../lib/supabase'
import SkeletonLoader from '../../components/SkeletonLoader'
import ImageWithSkeleton from '../../components/ImageWithSkeleton'
import DOMPurify from 'dompurify'

// 간단한 블록 렌더러
function BlockRenderer({ blocks = [] }) {
  return (
    <div className="portfolio-blocks">
      {blocks.map((block, idx) => {
        if (!block || !block.type) return null
        switch (block.type) {
          case 'intro':
            return <p key={idx} className="block-intro">{block.text}</p>
          case 'image':
            return (
              <figure key={idx} className="block-image">
                <ImageWithSkeleton src={block.src} alt={block.alt || ''} aspectRatio="4/3" />
                {block.alt && <figcaption>{block.alt}</figcaption>}
              </figure>
            )
          case 'full_width_image':
            return (
              <div key={idx} className="block-full-width">
                <ImageWithSkeleton src={block.src} alt={block.alt || ''} aspectRatio="16/9" rounded={false} />
              </div>
            )
          case 'tabs':
            return <TabsBlock key={idx} tabs={block.tabs || []} />
          case 'demo':
            return <div key={idx} className="block-demo" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(block.embed_html || '') }} />
          case 'ascii_image':
            return <AsciiImageBlock key={idx} src={block.src} asciiText={block.ascii_text} />
          case 'scroll_interaction':
            return (
              <div key={idx} className="block-scroll-steps">
                {(block.steps || []).map((s, i) => (
                  <section key={i} className="scroll-step">
                    {s.heading && <h3>{s.heading}</h3>}
                    {s.text && <p>{s.text}</p>}
                  </section>
                ))}
              </div>
            )
          default:
            return null
        }
      })}
    </div>
  )
}

function TabsBlock({ tabs }) {
  const [active, setActive] = useState(0)
  if (!tabs || tabs.length === 0) return null
  return (
    <div className="tabs-block">
      <div className="tabs-header">
        {tabs.map((t, i) => (
          <button key={i} className={`tab ${i === active ? 'active' : ''}`} onClick={() => setActive(i)}>
            {t.label}
          </button>
        ))}
      </div>
      <div className="tabs-content">
        <div className="tab-panel">{tabs[active]?.content}</div>
      </div>
    </div>
  )
}

function AsciiImageBlock({ src, asciiText }) {
  const [mode, setMode] = useState('ascii') // 'ascii' | 'image'
  return (
    <div className="block-ascii-toggle">
      <div className="toggle-controls">
        <button className={`toggle-btn ${mode === 'ascii' ? 'active' : ''}`} onClick={() => setMode('ascii')}>ASCII</button>
        <button className={`toggle-btn ${mode === 'image' ? 'active' : ''}`} onClick={() => setMode('image')}>Image</button>
      </div>
      {mode === 'ascii' ? (
        <pre className="block-ascii">{asciiText || ''}</pre>
      ) : (
        <img className="block-ascii-image" src={src} alt="ascii source" />
      )}
    </div>
  )
}

export default function PortfolioEntryPage() {
  const router = useRouter()
  const { slug } = router.query
  const [entry, setEntry] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!slug) return
    const fetchEntry = async () => {
      const res = await supabase
        .from('works')
        .select('id, slug, title, summary, thumbnail, created_at, tags, content_blocks, public')
        .eq('slug', slug)
        .eq('public', true)
        .maybeSingle()

      if (res.error) setError(res.error)
      else setEntry(res.data)
      setLoading(false)
    }
    fetchEntry()
  }, [slug])

  if (loading) return <SkeletonLoader variant="portfolioPage" />
  if (error) return <div>오류가 발생했습니다: {error.message}</div>
  if (!entry) return <div>프로젝트를 찾을 수 없습니다.</div>

  return (
    <div className="portfolio-entry-page">
      <Meta title={entry.title} description={entry.summary || entry.title} />
      <article>
        <h1 className="desktop-headings-heading-2 bold">{entry.title}</h1>
        {entry.thumbnail && (
          <div className="post-hero-wrap">
            <ImageWithSkeleton src={entry.thumbnail} alt={entry.title} aspectRatio="16/9" rounded={false} className="post-hero" imgStyle={{ objectFit: 'cover' }} />
          </div>
        )}
        <BlockRenderer blocks={entry.content_blocks || []} />
      </article>
    </div>
  )
}


