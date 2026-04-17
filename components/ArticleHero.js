import React from "react";
import ImageWithSkeleton from "./ImageWithSkeleton";

const formatDate = (dateString) => {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

function ArticleHero({ post }) {
  if (!post) return null;

  const titleWords = String(post.title || "").split(" ").filter(Boolean);

  return (
    <header className="article-hero">
      <div className="article-hero__ambient" aria-hidden="true" />
      <div className="article-hero__copy">
        <div className="article-hero__meta">
          <span>{post.category || "Work"}</span>
          {post.created_at && <time dateTime={post.created_at}>{formatDate(post.created_at)}</time>}
        </div>
        <h1 className="article-hero__title" aria-label={post.title}>
          {titleWords.map((word, index) => (
            <span key={`${word}-${index}`} style={{ "--word-index": index }}>
              {word}
            </span>
          ))}
        </h1>
        {post.excerpt && <p className="article-hero__excerpt">{post.excerpt}</p>}
        {post.tags?.length > 0 && (
          <div className="article-hero__tags" aria-label="Post tags">
            {post.tags.slice(0, 5).map((tag) => (
              <span key={tag}>#{tag}</span>
            ))}
          </div>
        )}
      </div>

      <div className="article-hero__visual">
        {post.thumbnail ? (
          <ImageWithSkeleton
            src={post.thumbnail}
            alt={post.title}
            aspectRatio="16/10"
            className="article-hero__image"
            imgStyle={{ objectFit: "cover" }}
            loading="eager"
            fetchPriority="high"
            fallback={
              <div className="article-hero__placeholder">
                <span>{post.category || "DWMM"}</span>
              </div>
            }
          />
        ) : (
          <div className="article-hero__placeholder">
            <span>{post.category || "DWMM"}</span>
          </div>
        )}
      </div>
    </header>
  );
}

export default ArticleHero;
