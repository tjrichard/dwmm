import { useEffect, useState } from 'react'

function SkeletonLoader({ isLoading }) {
  const [shouldFadeOut, setShouldFadeOut] = useState(false)

  useEffect(() => {
    if (!isLoading) setShouldFadeOut(true)
  }, [isLoading])

  return (
    <div className={`skeleton-loader ${shouldFadeOut ? 'animate-fade-out' : ''}`}>
      <div className="skeleton-thumbnail"></div>
      <div className="skeleton-item">
        <div className="skeleton-title"></div>
        <div className="skeleton-content"></div>
      </div>
    </div>
  )
}

export default SkeletonLoader;