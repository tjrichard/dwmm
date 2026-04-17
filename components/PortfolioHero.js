import React from "react";
import Link from "next/link";
import ImageWithSkeleton from "./ImageWithSkeleton";

const formatDate = (dateString) => {
  if (!dateString) return "Recently";
  return new Date(dateString).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const getWorkHref = (work) => (work?.slug ? `/works/${work.slug}` : "/works");

function PortfolioHero({ works = [] }) {
  const featured = works.find((work) => work?.thumbnail) || works[0];
  const previewWorks = works
    .filter((work) => work?._id !== featured?._id && work?.slug)
    .slice(0, 4);
  const categories = new Set(works.map((work) => work?.category).filter(Boolean));
  const titleWords = ["Work", "notes", "systems", "in", "motion"];

  const handlePointerMove = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width - 0.5).toFixed(3);
    const y = ((event.clientY - rect.top) / rect.height - 0.5).toFixed(3);
    event.currentTarget.style.setProperty("--pointer-x", x);
    event.currentTarget.style.setProperty("--pointer-y", y);
  };

  return (
    <section className="portfolio-hero" onPointerMove={handlePointerMove}>
      <div className="portfolio-hero__field" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>

      <div className="portfolio-hero__copy">
        <p className="portfolio-hero__eyebrow">DWMM Works</p>
        <h1 className="portfolio-hero__title" aria-label={titleWords.join(" ")}>
          {titleWords.map((word, index) => (
            <span key={word} style={{ "--word-index": index }}>
              {word}
            </span>
          ))}
        </h1>
        <p className="portfolio-hero__intro">
          Product thinking, interface experiments, and field notes collected as a living archive.
        </p>
        <div className="portfolio-hero__actions">
          <a href="#works-directory" className="portfolio-hero__button portfolio-hero__button--primary">
            Explore works
          </a>
          {featured?.slug && (
            <Link href={getWorkHref(featured)} className="portfolio-hero__button portfolio-hero__button--ghost">
              Read latest
            </Link>
          )}
        </div>
        <dl className="portfolio-hero__stats">
          <div>
            <dt>{works.length}</dt>
            <dd>Entries</dd>
          </div>
          <div>
            <dt>{categories.size}</dt>
            <dd>Tracks</dd>
          </div>
          <div>
            <dt>{formatDate(featured?.created_at)}</dt>
            <dd>Latest</dd>
          </div>
        </dl>
      </div>

      <div className="portfolio-hero__stage" aria-label="Featured work preview">
        <div className="portfolio-hero__beam" aria-hidden="true" />
        {featured ? (
          <Link href={getWorkHref(featured)} className="portfolio-hero__featured">
            <div className="portfolio-hero__screen">
              {featured.thumbnail ? (
                <ImageWithSkeleton
                  src={featured.thumbnail}
                  alt={featured.title}
                  aspectRatio="16/10"
                  loading="eager"
                  fetchPriority="high"
                  imgStyle={{ objectFit: "cover" }}
                  fallback={
                    <div className="portfolio-hero__image-fallback">
                      <span>{featured.category || "Work"}</span>
                    </div>
                  }
                />
              ) : (
                <div className="portfolio-hero__image-fallback">
                  <span>{featured.category || "Work"}</span>
                </div>
              )}
            </div>
            <div className="portfolio-hero__featured-copy">
              <span>{featured.category || "Featured"}</span>
              <strong>{featured.title}</strong>
              {featured.excerpt && <p>{featured.excerpt}</p>}
            </div>
          </Link>
        ) : (
          <div className="portfolio-hero__empty">
            <strong>Work is on the way.</strong>
            <span>New entries will appear here soon.</span>
          </div>
        )}

        {previewWorks.map((work, index) => (
          <Link
            href={getWorkHref(work)}
            className="portfolio-hero__orbit-card"
            key={work._id || work.slug}
            style={{ "--card-index": index }}
          >
            {work.thumbnail ? (
              <ImageWithSkeleton
                src={work.thumbnail}
                alt={work.title}
                aspectRatio="4/3"
                loading="lazy"
                decoding="async"
                imgStyle={{ objectFit: "cover" }}
                fallback={<div className="portfolio-hero__orbit-fallback" />}
              />
            ) : (
              <div className="portfolio-hero__orbit-fallback" />
            )}
            <span>{work.title}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default PortfolioHero;
