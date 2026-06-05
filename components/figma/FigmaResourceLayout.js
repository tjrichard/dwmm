import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, MessageCircle, PanelRightClose, PanelRightOpen, Plus, Search, X } from "lucide-react";
import WebsiteRequestForm from "../bookmark/WebsiteRequestForm";
import { RealtimeCursors } from "../realtime-cursors.tsx";

const fallbackImages = [
  "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1559028012-481c04fa702d?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80",
];

const failedImageSources = new Set();

function getCardImage(item, index) {
  if (item.thumbnail) return item.thumbnail;
  if (item.image) return item.image;
  return fallbackImages[index % fallbackImages.length];
}

function normalizeKind(item) {
  if (item.kind) return item.kind;
  if (item.type === "essay") return "Essay";
  if (item.type === "case-study") return "Case";
  if (item.type === "ai-workflow") return "AI";
  if (item.type === "design-system") return "System";
  return item.category || "Resource";
}

function compactText(value, limit = 220) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (text.length <= limit) return text;
  return `${text.slice(0, limit).trim()}...`;
}

function LogoMark() {
  return <img src="/logo.svg" alt="DWMM" width="28" height="28" />;
}

export function FigmaCard({ item, index = 0, href, onCategoryClick, onTagClick, selectedTags = [] }) {
  const title = item.title || "Untitled";
  const description = compactText(item.description || item.summary || item.excerpt || "");
  const image = getCardImage(item, index);
  const fallbackImage = fallbackImages[index % fallbackImages.length];
  const resolvedImage = failedImageSources.has(image) ? fallbackImage : image;
  const [imageSrc, setImageSrc] = useState(resolvedImage);
  const kind = normalizeKind(item);
  const tags = Array.from(new Set([kind, ...(Array.isArray(item.tags) ? item.tags : [])].filter(Boolean))).slice(0, 4);
  const cardHref = href || item.href || item.original_link || "/";
  const external = /^https?:\/\//.test(cardHref);
  const className = `figma-card${index % 5 === 0 ? " figma-card--wide" : ""}`;

  useEffect(() => {
    setImageSrc(failedImageSources.has(image) ? fallbackImage : image);
  }, [fallbackImage, image]);

  const body = (
    <>
      <div className="figma-card__image">
        <img
          src={imageSrc}
          alt=""
          onError={(event) => {
            event.currentTarget.onerror = null;
            failedImageSources.add(imageSrc);
            setImageSrc(fallbackImage);
          }}
        />
        <span>{String(kind).toUpperCase()}</span>
      </div>
      <div className="figma-card__body">
        <div className="figma-card__number">{String(index + 1).padStart(2, "0")}</div>
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
          <div className="figma-card__tags">
            {tags.map((tag) => {
              const selected = selectedTags.includes(String(tag));
              return (
                <button
                  key={tag}
                  type="button"
                  className={selected ? "is-selected" : ""}
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    if (tag === kind) onCategoryClick?.(tag);
                    else onTagClick?.(tag);
                  }}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>
        <ArrowUpRight size={16} aria-hidden="true" />
      </div>
    </>
  );

  if (external) {
    return (
      <a className={className} href={cardHref} target="_blank" rel="noreferrer">
        {body}
      </a>
    );
  }

  return (
    <Link className={className} href={cardHref} prefetch={false}>
      {body}
    </Link>
  );
}

function AskMockPanel({ selectedTitle, onClose }) {
  const [question, setQuestion] = useState("");
  const answer = question
    ? `${selectedTitle || "DWMM"} 기준으로 보면, 핵심은 자료를 더 많이 모으는 것이 아니라 맥락, 제약, 다음 행동을 함께 드러내는 것입니다. 현재 LLM 응답은 목업이며 실제 모델 호출 없이 디자인 검증용으로 동작합니다.`
    : "질문을 입력하면 현재 화면의 콘텐츠 맥락을 바탕으로 목업 응답을 생성합니다.";

  return (
    <div className="figma-panel" role="dialog" aria-modal="true">
      <div className="figma-panel__head">
        <span>Ask archive</span>
        <button type="button" onClick={onClose} aria-label="Close ask panel">
          <X size={16} />
        </button>
      </div>
      <textarea
        value={question}
        onChange={(event) => setQuestion(event.target.value)}
        placeholder="Ask about the selected resource..."
      />
      <div className="figma-panel__answer">
        <strong>Mocked answer</strong>
        <p>{answer}</p>
      </div>
    </div>
  );
}

export function FigmaResourceLayout({
  titleLines = ["Things,", "Worth Visiting"],
  eyebrow = "DWMM",
  description,
  items = [],
  activeCategory = "",
  selectedTags = [],
  categories: providedCategories = [],
  tags: providedTags = [],
  query = "",
  onSearch,
  onCategoryClick,
  onTagClick,
  cardHref,
  emptyState,
  gridFooter = null,
  showSubmit = true,
  realtimeRoom = "dwmm-figma",
  children,
}) {
  const [panelMode, setPanelMode] = useState(null);
  const submitOpen = panelMode === "suggest";
  const askOpen = panelMode === "ask";
  const panelOpen = Boolean(panelMode);
  const categories = useMemo(() => {
    if (providedCategories.length > 0) {
      return Array.from(new Set(providedCategories.filter(Boolean)));
    }
    const values = items.map((item) => normalizeKind(item)).filter(Boolean);
    return Array.from(new Set(values)).slice(0, 8);
  }, [items, providedCategories]);
  const tags = useMemo(() => {
    if (providedTags.length > 0) {
      return Array.from(new Set(providedTags.filter(Boolean)));
    }
    const values = items.flatMap((item) => (Array.isArray(item.tags) ? item.tags : [])).filter(Boolean);
    return Array.from(new Set(values)).slice(0, 12);
  }, [items, providedTags]);

  return (
    <div className="figma-page">
      <div className="figma-cursors">
        <RealtimeCursors roomName={realtimeRoom} username="Visitor" />
      </div>
      <aside className="figma-rail">
        <Link href="/" className="figma-wordmark" prefetch={false}>
          <LogoMark />
        </Link>
        <p className="figma-eyebrow">{eyebrow}</p>
        <h1>{titleLines.map((line) => <span key={line}>{line}</span>)}</h1>
        {description && <p className="figma-rail__description">{description}</p>}
        <label className="figma-search">
          <Search size={14} aria-hidden="true" />
          <input
            value={query}
            onChange={(event) => onSearch?.(event.target.value)}
            placeholder="Search"
          />
        </label>
        <div className="figma-filter-group">
          <span>Topic</span>
          {categories.map((category) => (
            <button
              type="button"
              key={category}
              className={String(activeCategory).toUpperCase() === String(category).toUpperCase() ? "is-selected" : ""}
              onClick={() => onCategoryClick?.(category)}
            >
              {category}
            </button>
          ))}
        </div>
        <div className="figma-filter-group">
          <span>Tags</span>
          {tags.map((tag) => (
            <button
              type="button"
              key={tag}
              className={selectedTags.includes(String(tag)) ? "is-selected" : ""}
              onClick={() => onTagClick?.(tag)}
            >
              {tag}
            </button>
          ))}
        </div>
      </aside>

      <main className="figma-main">
        {children || (
          <section className="figma-grid" aria-label="Resource cards">
            {items.length > 0
              ? items.map((item, index) => (
                  <FigmaCard
                    key={item.id || item.slug || item.title || index}
                    item={item}
                    index={index}
                    href={cardHref ? cardHref(item) : undefined}
                    onCategoryClick={onCategoryClick}
                    onTagClick={onTagClick}
                    selectedTags={selectedTags}
                  />
                ))
              : emptyState || <p className="figma-empty">No matching things to show.</p>}
            {gridFooter}
          </section>
        )}
      </main>

      <FigmaBottomHeader
        showSubmit={showSubmit}
        panelOpen={panelOpen}
        onAsk={() => {
          setPanelMode("ask");
        }}
        onSuggest={() => {
          setPanelMode("suggest");
        }}
        onTogglePanel={() => {
          setPanelMode((mode) => (mode ? null : "ask"));
        }}
      />

      {panelOpen && <div className="figma-scrim" onClick={() => {
        setPanelMode(null);
      }} />}
      {submitOpen && (
        <div className="figma-panel figma-panel--right" role="dialog" aria-modal="true">
          <div className="figma-panel__head">
            <span>Suggest a website</span>
            <button type="button" onClick={() => setPanelMode(null)} aria-label="Close submit panel">
              <X size={16} />
            </button>
          </div>
          <WebsiteRequestForm fromSuggest onComplete={() => setPanelMode(null)} />
        </div>
      )}
      {askOpen && <AskMockPanel selectedTitle={titleLines.join(" ")} onClose={() => setPanelMode(null)} />}
    </div>
  );
}

export function FigmaBottomHeader({
  showSubmit = true,
  panelOpen = false,
  onAsk = () => {},
  onSuggest = () => {},
  onTogglePanel = () => {},
}) {
  return (
    <header className="figma-bottom-header" role="banner">
      <Link href="/" className="figma-bottom-header__brand" aria-label="DWMM home" prefetch={false}>
        <LogoMark />
      </Link>
      <nav className="figma-bottom-header__nav" aria-label="Primary">
        <Link href="/" prefetch={false}>Visiting</Link>
        <Link href="/works" prefetch={false}>Sharing</Link>
        <Link href="/about" prefetch={false}>About</Link>
      </nav>
      <div className="figma-bottom-header__actions" role="toolbar" aria-label="Page actions">
        <button type="button" onClick={onAsk}>
          <MessageCircle size={15} />
          Ask
        </button>
        {showSubmit && (
          <button type="button" onClick={onSuggest}>
            <Plus size={15} />
            Suggest
          </button>
        )}
      </div>
      <button
        type="button"
        className="figma-bottom-header__panel-toggle"
        onClick={onTogglePanel}
        aria-expanded={panelOpen}
      >
        {panelOpen ? <PanelRightClose size={15} /> : <PanelRightOpen size={15} />}
        {panelOpen ? "Close panel" : "Open panel"}
      </button>
    </header>
  );
}

export function FigmaDetailLayout({ post, content, metaRows = [], children }) {
  const [askOpen, setAskOpen] = useState(false);
  const title = post?.title || "Untitled";
  const tags = Array.isArray(post?.tags) ? post.tags : [];

  return (
    <div className="figma-page figma-page--detail">
      <div className="figma-cursors">
        <RealtimeCursors roomName="dwmm-detail" username="Reader" />
      </div>
      <main className="figma-detail">
        <Link href="/works" className="figma-wordmark" prefetch={false}>
          <LogoMark />
        </Link>
        <article className="figma-article">
          <header>
            <p className="figma-eyebrow">{post?.category || "Essay"}</p>
            <h1>{title}</h1>
            <p>{post?.excerpt || post?.summary}</p>
            <div className="figma-card__tags">
              {tags.map((tag) => <span key={tag}>{tag}</span>)}
            </div>
          </header>
          <div className="figma-article__body">{children || content}</div>
        </article>
      </main>
      <aside className="figma-notes" aria-label="Article context">
        <section>
          <span>Profile</span>
          <strong>Ryan Kim</strong>
          <p>B2B SaaS product designer focused on workflow architecture, systems, and AI-assisted product work.</p>
        </section>
        <section>
          <span>Context</span>
          {metaRows.map(([label, value]) => (
            <p key={label}>
              <strong>{label}</strong>
              {value}
            </p>
          ))}
        </section>
      </aside>
      <FigmaBottomHeader
        showSubmit={false}
        panelOpen={askOpen}
        onAsk={() => setAskOpen(true)}
        onTogglePanel={() => setAskOpen((open) => !open)}
      />
      {askOpen && <div className="figma-scrim" onClick={() => setAskOpen(false)} />}
      {askOpen && <AskMockPanel selectedTitle={title} onClose={() => setAskOpen(false)} />}
    </div>
  );
}

export function FigmaProfileLayout({ profile, onAsk }) {
  const [askOpen, setAskOpen] = useState(false);
  const notes = profile?.details || [];

  return (
    <div className="figma-page figma-page--profile">
      <div className="figma-cursors">
        <RealtimeCursors roomName="dwmm-profile" username="Visitor" />
      </div>
      <main className="figma-profile">
        <article className="figma-profile-card">
          <div className="figma-avatar" aria-hidden="true">R</div>
          <p className="figma-eyebrow">{profile?.role}</p>
          <h1>{profile?.title}</h1>
          <p className="figma-profile-card__summary">{profile?.summary}</p>
          <div className="figma-profile-card__body">
            {(profile?.body || []).map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          </div>
        </article>
      </main>
      <aside className="figma-notes figma-notes--profile" aria-label="Profile context">
        <section>
          <span>Working file</span>
          <strong>about-ryan.profile</strong>
          <p>A public profile note for B2B product design, AI workflows, and system-level design practice.</p>
        </section>
        <section>
          <span>Labels</span>
          {notes.map(([label, value]) => (
            <p key={label}>
              <strong>{label}</strong>
              {value}
            </p>
          ))}
        </section>
      </aside>
      <FigmaBottomHeader
        showSubmit={false}
        panelOpen={askOpen}
        onAsk={() => setAskOpen(true)}
        onTogglePanel={() => setAskOpen((open) => !open)}
      />
      {askOpen && <div className="figma-scrim" onClick={() => setAskOpen(false)} />}
      {askOpen && <AskMockPanel selectedTitle={profile?.title || "Ryan Kim"} onClose={() => setAskOpen(false)} />}
    </div>
  );
}
