import { useEffect, useState } from 'react'

function BookmarkSkeletonCard() {
  return (
    <div className="content-card card skeleton-bookmark-card">
      <div className="card__top-row">
        <div className="card__meta">
          <div className="card__category skeleton-box"></div>
        </div>
      </div>
      <div className="card__image-container">
        <div className="card__image skeleton-box"></div>
      </div>
      <div className="card__content">
        <div className="card__title-row">
          <div className="card__title skeleton-box"></div>
          <div className="skeleton-vote"></div>
        </div>
        <div className="card__meta">
          <div className="card__tags">
            <div className="skeleton-tag skeleton-box"></div>
            <div className="skeleton-tag skeleton-box"></div>
            <div className="skeleton-tag skeleton-box"></div>
          </div>
        </div>
      </div>
    </div>
  )
}

function BlogSkeletonCard() {
  return (
    <div className="skeleton-loader">
      <div className="skeleton-thumbnail"></div>
      <div className="skeleton-item">
        <div className="skeleton-title"></div>
        <div className="skeleton-content"></div>
      </div>
    </div>
  )
}

function WorkCardSkeleton() {
  return (
    <div className="WorkCard WorkCard--skeleton">
      <div className="WorkCard__media">
        <div className="work-card-skeleton__media"></div>
      </div>
      <div className="WorkCard__body">
        <div className="WorkCard__meta-line">
          <span className="work-card-skeleton__meta"></span>
          <span className="work-card-skeleton__meta small"></span>
        </div>
        <div className="work-card-skeleton__title"></div>
        <div className="work-card-skeleton__excerpt"></div>
        <div className="work-card-skeleton__excerpt short"></div>
        <div className="WorkCard__meta">
          <span className="work-card-skeleton__date"></span>
        </div>
      </div>
    </div>
  )
}

function BlogPostSkeleton({ lines = 8 }) {
  return (
    <div className="skeleton-post">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="skeleton-line"></div>
      ))}
    </div>
  )
}

function PortfolioPageSkeleton() {
  return (
    <div className="skeleton-portfolio-page">
      <div className="skeleton-title lg"></div>
      <div className="skeleton-meta"></div>
      <div className="skeleton-wide"></div>
      <div className="skeleton-paragraph"></div>
      <div className="skeleton-paragraph"></div>
      <div className="skeleton-grid">
        <div className="skeleton-box"></div>
        <div className="skeleton-box"></div>
        <div className="skeleton-box"></div>
      </div>
    </div>
  )
}

function SkeletonLoader({ isLoading = true, variant = 'blog', count = 9 }) {
  const [shouldFadeOut, setShouldFadeOut] = useState(false)

  useEffect(() => {
    if (!isLoading) setShouldFadeOut(true)
  }, [isLoading])

  if (variant === 'bookmark') {
    return (
      <div className={`content-grid skeleton-grid ${shouldFadeOut ? 'animate-fade-out' : ''}`}>
        {Array.from({ length: count }).map((_, i) => (
          <BookmarkSkeletonCard key={i} />
        ))}
      </div>
    )
  }

  if (variant === 'blogPost') {
    return (
      <div className={`${shouldFadeOut ? 'animate-fade-out' : ''}`}>
        <BlogPostSkeleton lines={count} />
      </div>
    )
  }

  if (variant === 'portfolioPage') {
    return (
      <div className={`${shouldFadeOut ? 'animate-fade-out' : ''}`}>
        <PortfolioPageSkeleton />
      </div>
    )
  }

  if (variant === 'workCard') {
    return (
      <>
        {Array.from({ length: count }).map((_, i) => (
          <WorkCardSkeleton key={i} />
        ))}
      </>
    )
  }

  // 기본 blog skeleton
  return (
    <div className={`skeleton-loader ${shouldFadeOut ? 'animate-fade-out' : ''}`}>
      <BlogSkeletonCard />
    </div>
  )
}

export default SkeletonLoader
