import React, { useState, useEffect, useCallback, useRef } from "react";
import Meta from "../../components/Meta.js";
import LNB from "../../components/BookmarkLNB.js";
import ContentGrid from "../../components/ContentGrid";
import ContentCard from "../../components/ContentCard";
import FloatingCTA from "../../components/FloatingCTA";
import SearchBar from "../../components/SearchBar";
// import SubscribeForm from "../../components/SubscribeForm";
import { supabase } from "../../lib/supabase";
import { getUserVotedWebsites } from "../../lib/voteUtils";
import SubscribeForm from "../../components/SubscribeForm.js";

// Number of items per page
const ITEMS_PER_PAGE = 9;

export async function getStaticProps() {
  try {
    console.log("Starting getStaticProps...");

    // bookmarks_public 테이블에서 초기 데이터 가져오기
    const { data: bookmarks, error: bookmarksError } = await supabase
      .from("bookmarks_public")
      .select(`
        id,
        title,
        description,
        original_link,
        category,
        tags,
        vote_count,
        created_at,
        highlight
      `)
      .order("created_at", { ascending: false });

    if (bookmarksError) {
      throw bookmarksError;
    }

    if (!bookmarks || bookmarks.length === 0) {
      return {
        props: {
          title: "DWMM | Bookmarks",
          description: "Curated design resources for B2B SaaS product designers",
          initialBookmarks: [],
          initialTags: [],
          initialCategories: [],
        },
        revalidate: 3600,
      };
    }

    // 태그와 카테고리 추출
    const allTags = [...new Set(bookmarks.flatMap(item => item.tags || []))];
    const allCategories = [...new Set(bookmarks.map(item => item.category || ''))];

    // 추가 태그 및 카테고리 추출
    const { data: tags } = await supabase.from("bookmarks_tags").select("tag");
    const { data: categories } = await supabase.from("bookmarks_categories").select("category");

    const additionalTags = tags?.map(tag => tag.tag) || [];
    const additionalCategories = categories?.map(category => category.category) || [];

    allTags.push(...additionalTags);
    allCategories.push(...additionalCategories);

    console.log('Initial Categories:', [...new Set(allCategories)].filter(Boolean));
    console.log('Initial Tags:', [...new Set(allTags)].filter(Boolean));

    const processedBookmarks = bookmarks.map(item => ({
      ...item,
      url: item.original_link // original_link를 url로 매핑
    }));

    return {
      props: {
        title: "DWMM | Bookmarks",
        description: "Curated design resources for B2B SaaS product designers",
        initialBookmarks: processedBookmarks,
        initialTags: [...new Set(allTags)].filter(Boolean),
        initialCategories: [...new Set(allCategories)].filter(Boolean),
      },
      revalidate: 3600,
    };
  } catch (error) {
    return {
      props: {
        title: "DWMM | Bookmarks",
        description: "Curated design resources for B2B SaaS product designers",
        initialBookmarks: [],
        initialTags: [],
        initialCategories: [],
        error: "Failed to load bookmarks",
      },
      revalidate: 3600,
    };
  }
}

export default function Bookmarks({
  title,
  description,
  initialBookmarks,
  initialTags,
  initialCategories,
}) {
  const [bookmarks, setBookmarks] = useState(initialBookmarks);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const observer = useRef();
  const loadingRef = useRef(null);

  const fetchBookmarks = async (pageNumber) => {
    setLoading(true);
    try {
      let query = supabase
        .from("bookmarks_public")
        .select(`
          id,
          title,
          description,
          original_link,
          category,
          tags,
          vote_count,
          created_at
        `)
        .order("created_at", { ascending: false })
        .range((pageNumber - 1) * ITEMS_PER_PAGE, pageNumber * ITEMS_PER_PAGE - 1);

      // Apply filters
      if (selectedCategory) {
        query = query.eq("category", selectedCategory);
      }
      if (selectedTags.length > 0) {
        query = query.contains("tags", selectedTags);
      }
      if (searchQuery) {
        query = query.ilike("title", `%${searchQuery}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      if (data.length < ITEMS_PER_PAGE) {
        setHasMore(false);
      }

      if (pageNumber === 1) {
        setBookmarks(data);
      } else {
        setBookmarks(prev => [...prev, ...data]);
      }
    } catch (error) {
      console.error("Error fetching bookmarks:", error);
    } finally {
      setLoading(false);
    }
  };

  // Intersection Observer callback
  const lastBookmarkRef = useCallback(node => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prevPage => prevPage + 1);
      }
    });

    if (node) observer.current.observe(node);
  }, [loading, hasMore]);

  // Fetch bookmarks when page changes
  useEffect(() => {
    fetchBookmarks(page);
  }, [page, selectedCategory, selectedTags, searchQuery]);

  // Reset pagination when filters change
  useEffect(() => {
    setPage(1);
    setHasMore(true);
    setBookmarks([]);
  }, [selectedCategory, selectedTags, searchQuery]);

  const handleTagSelect = (tag) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
  };

  const handleSearch = (params) => {
    setSearchQuery(params.query || '');
    setSelectedCategory(params.category || '');
    setSelectedTags(params.tags || []);
  };

  return (
    <div className="container">
      <Meta title={title} description={description} />
      <div className="bookmarks-main-container">
      <LNB 
        categories={initialCategories}
        tags={initialTags}
        selectedCategory={selectedCategory}
        selectedTags={selectedTags}
        onCategorySelect={handleCategorySelect}
        onTagSelect={handleTagSelect}
        onSearch={handleSearch}
      />
      
      <ContentGrid
        contents={bookmarks}
        isSearching={loading}
        lastBookmarkRef={lastBookmarkRef}
      />

      {loading && (
        <div className="loading-spinner">
          Loading more bookmarks...
        </div>
      )}

      {!hasMore && bookmarks.length > 0 && (
        <div className="no-more-content">
          No more bookmarks to load
        </div>
      )}
      </div>

      <FloatingCTA />
      <SubscribeForm />
    </div>
  );
}
