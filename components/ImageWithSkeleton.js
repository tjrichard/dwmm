import React, { useEffect, useRef, useState } from 'react'

export default function ImageWithSkeleton({
  src,
  alt = '',
  className = '',
  aspectRatio = '16/9',
  rounded = true,
  style = {},
  imgStyle = {},
  fallback = null,
  onLoad: onLoadProp,
  loading = 'lazy',
  decoding = 'async',
  fetchPriority,
}) {
  const imgRef = useRef(null)
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)
  const isAuto = aspectRatio === 'auto'

  useEffect(() => {
    setLoaded(false)
    setFailed(false)
    const img = imgRef.current
    if (!img) return
    if (img.complete && img.naturalWidth > 0) {
      setLoaded(true)
    }
  }, [src])

  const handleLoad = (e) => {
    setLoaded(true)
    onLoadProp?.(e)
  }

  return (
    <div
      className={`img-skeleton ${loaded ? 'is-loaded' : ''} ${isAuto ? 'is-auto' : ''} ${className}`}
      style={{ aspectRatio: isAuto ? undefined : aspectRatio, ...style }}
    >
      {!loaded && !failed && !isAuto && <div className="img-skeleton__shimmer" />}
      {failed ? (
        fallback || <div className="img-skeleton__fallback" />
      ) : src && (
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          onLoad={handleLoad}
          onError={() => setFailed(true)}
          className={`img-skeleton__img ${rounded ? 'rounded' : ''} ${isAuto ? 'is-auto' : ''}`}
          style={imgStyle}
          loading={loading}
          decoding={decoding}
          fetchpriority={fetchPriority}
        />
      )}
    </div>
  )
}
