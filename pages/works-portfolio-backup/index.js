import { useEffect, useState } from 'react'
import Link from 'next/link'
import Meta from "../../components/Meta";
import { supabase } from '../../lib/supabase'
import SkeletonLoader from '../../components/SkeletonLoader'
import ImageWithSkeleton from '../../components/ImageWithSkeleton'

export default function PortfolioIndex() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchItems = async () => {
      // 1차: portfolio_entries
      const res = await supabase
        .from('portfolio_entries')
        .select('id, slug, title, summary, thumbnail, created_at, tags, public')
        .eq('public', true)
        .order('created_at', { ascending: false })
        .limit(12)
      if (res.error) {
        setError(res.error)
      } else {
        setItems(res.data || [])
      }
      setLoading(false)
    }
    fetchItems()
  }, [])

  return (
    <div className="portfolio-index">
      <Meta title="DWMM | Portfolio" description="Design works and interactive demos" />
      {loading ? (
        <SkeletonLoader variant="bookmark" count={6} />
      ) : error ? (
        <div>오류가 발생했습니다: {error.message}</div>
      ) : (
        <div className="content-grid">
          {items.map(item => (
            <div className="content-card card" key={item.id}>
              <Link href={`/works/${item.slug}`}>
                {item.thumbnail && (
                  <div className="card__image-container">
                    <ImageWithSkeleton src={item.thumbnail} alt={item.title} aspectRatio="4/3" loading="lazy" decoding="async" />
                  </div>
                )}
                <div className="card__content">
                  <h3 className="card__title">{item.title}</h3>
                  <p className="card__excerpt">{item.summary}</p>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

