import React, { useState, useEffect, useCallback, useRef } from "react";
import Meta from "../../components/Meta.js";
import Hero from "../../components/Hero";
import ContentGrid from "../../components/ContentGrid";
import FloatingCTA from "../../components/FloatingCTA";
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
          error: null
        },
        revalidate: 3600
      };
    }

    // 태그와 카테고리 추출
    const allTags = [...new Set(bookmarks.flatMap(item => item.tags || []))];
    const allCategories = [...new Set(bookmarks.map(item => item.category || '').filter(Boolean))];

    // 추가 태그 및 카테고리 추출
    const { data: tags } = await supabase.from("bookmarks_tags").select("tag");
    const { data: categories } = await supabase.from("bookmarks_categories").select("category");

    const additionalTags = tags?.map(tag => tag.tag) || [];
    const additionalCategories = categories?.map(category => category.category) || [];

    // 모든 태그와 카테고리 병합 및 중복 제거
    const finalTags = [...new Set([...allTags, ...additionalTags])].filter(Boolean);
    const finalCategories = [...new Set([...allCategories, ...additionalCategories])].filter(Boolean);

    const processedBookmarks = bookmarks.map((item, index) => ({
      ...item,
      url: item.original_link,
      image: `/images/bookmark-${(index % 8) + 1}.jpg`,
      vote_count: item.vote_count || 0
    }));

    return {
      props: {
        title: "DWMM | Bookmarks",
        description: "Curated design resources for B2B SaaS product designers",
        initialBookmarks: processedBookmarks,
        initialTags: finalTags,
        initialCategories: finalCategories,
        error: null
      },
      revalidate: 3600
    };
  } catch (error) {
    console.error("Error in getStaticProps:", error);
    return {
      props: {
        title: "DWMM | Bookmarks",
        description: "Curated design resources for B2B SaaS product designers",
        initialBookmarks: [],
        initialTags: [],
        initialCategories: [],
        error: "Failed to load bookmarks"
      },
      revalidate: 3600
    };
  }
}

export default function Bookmarks({
  title = "DWMM | Bookmarks",
  description = "Curated design resources for B2B SaaS product designers",
  initialBookmarks = [],
  initialTags = [],
  initialCategories = [],
  error
}) {
  const [bookmarks, setBookmarks] = useState(initialBookmarks);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [userVotedWebsites, setUserVotedWebsites] = useState([]);
  const observer = useRef();
  const loadingRef = useRef(null);

  // 컴포넌트 마운트 시 사용자 투표 정보 가져오기
  useEffect(() => {
    const fetchUserVotes = async () => {
      const votedWebsites = await getUserVotedWebsites();
      setUserVotedWebsites(votedWebsites);
    };
    fetchUserVotes();
  }, []);

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

      const processedData = data.map((item, index) => ({
        ...item,
        url: item.original_link,
        image: `/images/bookmark-${(index % 8) + 1}.jpg`,
        user_has_voted: userVotedWebsites.includes(item.id)
      }));

      if (data.length < ITEMS_PER_PAGE) {
        setHasMore(false);
      }

      if (pageNumber === 1) {
        setBookmarks(processedData);
      } else {
        setBookmarks(prev => [...prev, ...processedData]);
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

  if (error) {
    return (
      <div className="error-container">
        <h2>데이터를 불러오는데 실패했습니다</h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="container">
      <Meta title={title} description={description} />
      <Hero 
        categories={initialCategories}
        tags={initialTags}
        selectedCategory={selectedCategory}
        selectedTags={selectedTags}
        onCategorySelect={handleCategorySelect}
        onTagSelect={handleTagSelect}
        onSearch={handleSearch}
      />
      
      <main className="main-content">
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
      </main>

      <FloatingCTA />
      <SubscribeForm />
    </div>
  );
}
