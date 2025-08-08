// pages/blog/index.js
import React, { useEffect, useMemo, useState } from "react";
import Meta from "../../components/Meta.js";
import { supabase } from "../../lib/supabase";
import Link from 'next/link';
import SkeletonLoader from '../../components/SkeletonLoader.js';
import ImageWithSkeleton from '../../components/ImageWithSkeleton.js'
import BookmarkLNB from '../../components/bookmark/Lnb.js';
import ContentGrid from '../../components/ContentGrid.js';

// Helper functions
const stripHtml = (html) => {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '');
};

const stripMarkdown = (markdown) => {
  if (!markdown) return '';
  return markdown
    .replace(/^### (.*$)/gim, '$1') // h3
    .replace(/^## (.*$)/gim, '$1') // h2
    .replace(/^# (.*$)/gim, '$1') // h1
    .replace(/^\- (.*$)/gim, '$1') // list
    .replace(/\*\*(.*)\*\*/gim, '$1') // bold
    .replace(/\*(.*)\*/gim, '$1') // italic
    .replace(/\[([^\]]+)\]\([^)]+\)/gim, '$1') // links
    .replace(/`([^`]+)`/gim, '$1') // code
    .replace(/\n/g, ' ') // newlines
    .replace(/\s+/g, ' ') // multiple spaces
    .trim();
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

function FetchWorksLists() {
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedTag, setSelectedTag] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  // Hooks moved to top for consistent order
  const allTags = useMemo(() => {
    const set = new Set();
    (data || []).forEach(p => (p.tags || []).forEach(t => set.add(t)));
    return Array.from(set);
  }, [data]);

  const allCategories = useMemo(() => {
    const set = new Set();
    (data || []).forEach(p => set.add(p.category));
    return Array.from(set);
  }, [data]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (data || []).filter(p => {
      const matchText = !q || p.title?.toLowerCase().includes(q) || (p.excerpt || stripMarkdown(p.content_markdown || "")).toLowerCase().includes(q)
      const matchTag = !selectedTag || (p.tags || []).includes(selectedTag)
      const matchCategory = !selectedCategory || p.category === selectedCategory
      return matchText && matchTag && matchCategory
    })
  }, [data, search, selectedTag, selectedCategory]);

  async function fetchData() {
    try {
      let { data, error } = await supabase
        .from("works")
        .select("*")
        .eq("public", true)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) {
        console.error("Supabase error:", error);
        setError(error);
      } else {
        setData(data || []);
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="WorksLists">
        {[...Array(10)].map((_, index) => (
          <SkeletonLoader key={index} />
        ))}
      </div>
    );
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div className="works-list-layout">
      <aside className="works-sidebar">
        <BookmarkLNB
          categories={allCategories}
          tags={allTags}
          selectedCategory={selectedCategory}
          selectedTags={selectedTag ? [selectedTag] : []}
          onSearch={({ tags, category }) => {
            setSelectedTag(tags[0] || "");
            setSelectedCategory(category || "");
          }}
        />
      </aside>

      <ContentGrid
        contents={filtered.map(p => ({
          ...p,
          thumbnail: p.thumbnail
        }))}
        isSearching={loading}
        renderItem={(item) => (
          <div className="WorkCard animate-fade-in">
            <Link href={`/works/${item.slug}`} className="WorkCard__link">
              {item.thumbnail && (
                <div className="WorkCard__media">
                  <ImageWithSkeleton src={item.thumbnail} alt={item.title} aspectRatio="16/9" loading="lazy" decoding="async" />
                </div>
              )}
              <div className="WorkCard__body">
                <div className="WorkCard__category">{item.category}</div>
                <h2 className="WorkCard__title">{item.title}</h2>
                <p className="WorkCard__excerpt">
                  {(item.excerpt && item.excerpt.slice(0, 160)) || stripMarkdown(item.content_markdown).slice(0, 160)}...
                </p>
                <div className="WorkCard__meta">
                  <span className="WorkCard__date">{formatDate(item.created_at)}</span>
                  {item.tags && item.tags.length > 0 && (
                    <div className="WorkCard__tags">
                      {item.tags.slice(0, 3).map((t, i) => (
                        <span key={i} className="WorkCard__tag">#{t}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Link>
          </div>
        )}
      />
    </div>
  );
}

function Works({ title, description }) {
  return (
    <div>
      <Meta title={title} description={description} />
      <main>
        <section>
          <FetchWorksLists />
        </section>
      </main>
    </div>
  );
}

export async function getStaticProps() {
  const pageProps = {
    title: "DWMM | Works",
    description: "My thoughts and creative works",
  };
  return {
    props: pageProps,
  };
}

export default Works;
