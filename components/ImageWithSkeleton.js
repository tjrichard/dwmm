import React, { useEffect, useRef, useState } from 'react'

export default function ImageWithSkeleton({
  src,
  alt = '',
  className = '',
  aspectRatio = '16/9',
  rounded = true,
  style = {},
  imgStyle = {},
  onLoad: onLoadProp,
  loading = 'lazy',
  decoding = 'async',
  fetchPriority,
}) {
  const imgRef = useRef(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
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
      className={`img-skeleton ${loaded ? 'is-loaded' : ''} ${className}`}
      style={{ aspectRatio, ...style }}
    >
      {!loaded && <div className="img-skeleton__shimmer" />}
      {src && (
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          onLoad={handleLoad}
          className={`img-skeleton__img ${rounded ? 'rounded' : ''}`}
          style={imgStyle}
          loading={loading}
          decoding={decoding}
          fetchpriority={fetchPriority}
        />
      )}
    </div>
  )
}


