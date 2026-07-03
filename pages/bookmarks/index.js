import React, { useState, useEffect, useCallback, useRef } from "react";
import Meta from "../../components/meta.js";
import { hasUsableSupabasePublicConfig, supabase } from "../../lib/supabase.js";
import { normalizeBookmarkThumbnail } from "../../lib/bookmarkThumbnail.js";
import { FigmaResourceLayout } from "../../components/figma/FigmaResourceLayout.js";
import { curatedResources } from "../../data/workspace/workspaceContent.js";

// Number of items per page
const ITEMS_PER_PAGE = 9;

// 여기서부터 시작

export async function getStaticProps() {
  try {
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
        highlight,
        thumbnail
      `)
      .order("created_at", { ascending: false })
      .range(0, ITEMS_PER_PAGE - 1);

    if (bookmarksError) throw bookmarksError;

    if (!bookmarks || bookmarks.length === 0) {
      return {
        props: {
          title: "DWMM | Bookmarks",
          description: "Curated design resources for B2B SaaS product designers",
          bookmarks: [],
          tags: [],
          categories: [],
        },
        revalidate: 3600,
      };
    }

    // bookmark_categories와 bookmark_tags 테이블에서 데이터 가져오기
    const { data: categories, error: categoriesError } = await supabase
      .from("bookmark_categories")
      .select("category");

    const { data: tags, error: tagsError } = await supabase
      .from("bookmark_tags")
      .select("tag");

    if (categoriesError) throw categoriesError;
    if (tagsError) throw tagsError;

    const allCategories = categories?.map(item => item.category) || [];
    const allTags = tags?.map(item => item.tag) || [];

    const processedBookmarks = bookmarks.map(item => ({
      ...item,
      thumbnail: normalizeBookmarkThumbnail(item.thumbnail),
      url: item.original_link // original_link를 url로 매핑
    }));

    return {
      props: {
        title: "DWMM | Bookmarks",
        description: "Curated design resources for B2B SaaS product designers",
        bookmarks: processedBookmarks,
        tags: allTags,
        categories: allCategories,
      },
      revalidate: 3600,
    };
  } catch (error) {
    const fallbackBookmarks = curatedResources.map((resource) => ({
      ...resource,
      original_link: resource.original_link || resource.href || "/",
      vote_count: 0,
      created_at: resource.created_at || null,
      highlight: false,
    }));
    return {
      props: {
        title: "DWMM | Bookmarks",
        description: "Curated design resources for B2B SaaS product designers",
        bookmarks: fallbackBookmarks,
        tags: Array.from(new Set(fallbackBookmarks.flatMap((bookmark) => bookmark.tags || []))),
        categories: Array.from(new Set(fallbackBookmarks.map((bookmark) => bookmark.category).filter(Boolean))),
        error: "Failed to load live bookmarks; showing curated workspace resources.",
      },
      revalidate: 3600,
    };
  }
}

export default function Bookmarks({
  title,
  description,
  bookmarks: initialBookmarks,
  tags: availableTags,
  categories: availableCategories,
}) {
  const [bookmarks, setBookmarks] = useState(initialBookmarks);
  const [loading, setLoading] = useState(false);
  const [isLoadingTotalCount, setIsLoadingTotalCount] = useState(false);
  const [totalCount, setTotalCount] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState("Newest"); // 기본 정렬: Newest
  const observer = useRef();
  const loadingRef = useRef(null);
  const [bookmarkClickCounts, setBookmarkClickCounts] = useState({});
  const canUseSupabase = hasUsableSupabasePublicConfig();
  const fallbackTotalCountRef = useRef(initialBookmarks.length);

  // useRef를 사용하여 의존성 배열 문제 해결
  const sortOrderRef = useRef(sortOrder);
  const selectedCategoryRef = useRef(selectedCategory);
  const selectedTagsRef = useRef(selectedTags);
  const searchQueryRef = useRef(searchQuery);
  const didMountFiltersRef = useRef(false);

  // ref 값들을 최신으로 유지
  useEffect(() => {
    sortOrderRef.current = sortOrder;
    selectedCategoryRef.current = selectedCategory;
    selectedTagsRef.current = selectedTags;
    searchQueryRef.current = searchQuery;
  }, [sortOrder, selectedCategory, selectedTags, searchQuery]);

  const fetchTotalCount = useCallback(async () => {
    if (!canUseSupabase) {
      setTotalCount(fallbackTotalCountRef.current);
      setIsLoadingTotalCount(false);
      return;
    }
    
    setIsLoadingTotalCount(true);
    try {
      let query = supabase
        .from("bookmarks_public")
        .select("id", { count: "exact" });

      if (selectedCategoryRef.current) {
        const exactCategory = availableCategories.find(
          cat => String(cat || '').toUpperCase() === String(selectedCategoryRef.current || '').toUpperCase()
        );
        if (exactCategory) {
          query = query.eq("category", exactCategory);
        }
      }
      if (selectedTagsRef.current.length > 0) {
        selectedTagsRef.current.forEach(tag => {
          query = query.contains('tags', [tag]);
        });
      }
      if (searchQueryRef.current) {
        query = query.or(`title.ilike.%${searchQueryRef.current}%,description.ilike.%${searchQueryRef.current}%`);
      }

      const { count, error } = await query;

      if (error) {
        console.error("❌ Count query error:", error);
        throw error;
      }
      setTotalCount(count);
    } catch (error) {
      console.error("❌ Error fetching total count:", error);
      setTotalCount(0);
    } finally {
      setIsLoadingTotalCount(false);
    }
  }, [availableCategories, canUseSupabase]);

  const fetchBookmarks = useCallback(async (pageNumber) => {
    if (!canUseSupabase) {
      setLoading(false);
      setHasMore(false);
      return;
    }
    
    setLoading(true)
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
          created_at,
          thumbnail
        `)

      // 정렬 기준 적용
      if (sortOrderRef.current === "Newest") {
        query = query.order("created_at", { ascending: false })
      }
      else if (sortOrderRef.current === "Oldest") {
        query = query.order("created_at", { ascending: true })
      }
      else if (sortOrderRef.current === "Recommended") {
        query = query.order("vote_count", { ascending: false })
      }

      query = query.range((pageNumber - 1) * ITEMS_PER_PAGE, pageNumber * ITEMS_PER_PAGE - 1)

      if (selectedCategoryRef.current) {
        const exactCategory = availableCategories.find(
          cat => String(cat || '').toUpperCase() === String(selectedCategoryRef.current || '').toUpperCase()
        )
        if (exactCategory) {
          query = query.eq("category", exactCategory)
        }
      }
      if (selectedTagsRef.current.length > 0) {
        selectedTagsRef.current.forEach(tag => {
          query = query.contains('tags', [tag])
        })
      }
      if (searchQueryRef.current) {
        query = query.or(`title.ilike.%${searchQueryRef.current}%,description.ilike.%${searchQueryRef.current}%`)
      }

      const { data, error } = await query

      if (error) {
        console.error("❌ Query error:", error);
        throw error;
      }

      const processedBookmarks = (data || []).map((item) => ({
        ...item,
        thumbnail: normalizeBookmarkThumbnail(item.thumbnail),
      }))

      setHasMore(processedBookmarks.length === ITEMS_PER_PAGE)

      if (pageNumber === 1) {
        setBookmarks(processedBookmarks)
      } else {
        setBookmarks(prev => [...prev, ...processedBookmarks])
      }
    } catch (error) {
      console.error("❌ Error fetching bookmarks:", error)
    } finally {
      setLoading(false)
    }
  }, [availableCategories, canUseSupabase])

  const fetchClickCounts = useCallback(async (bookmarkIds) => {
    if (!canUseSupabase) return;
    if (!bookmarkIds || bookmarkIds.length === 0) return
    const { data, error } = await supabase
      .from('bookmark_clicks')
      .select('bookmark_id, click_count')
      .in('bookmark_id', bookmarkIds)
    if (!error && data) {
      const counts = {}
      data.forEach(row => {
        counts[row.bookmark_id] = row.click_count || 0
      })
      setBookmarkClickCounts(counts)
    }
  }, [canUseSupabase])

  const handleCategorySelect = (category) => {
    const categoryStr = category ? String(category) : "";
    setSelectedCategory(categoryStr.trim().toUpperCase());
  };

  const handleTagSelect = (tag) => {
    const tagStr = String(tag || '');
    const tagLower = tagStr.toLowerCase();
    setSelectedTags(prev =>
      prev.includes(tagLower)
        ? prev.filter(t => t !== tagLower)
        : [...prev, tagLower]
    );
  };

  const handleSearch = async (params) => {
    const next =
      typeof params === "string"
        ? { query: params, category: selectedCategory, tags: selectedTags, sortOrder }
        : params || {};
    setSearchQuery(next.query || "");
    setSelectedCategory(String(next.category || "").trim().toUpperCase());
    setSelectedTags(next.tags || []);
    setSortOrder(next.sortOrder || "Newest");
    setPage(1);
    setHasMore(true); // hasMore 상태 초기화 추가
    
    // 상태 업데이트 후 ref 값들이 동기화될 때까지 잠시 대기
    await new Promise(resolve => setTimeout(resolve, 0));
    
    await fetchTotalCount();
    await fetchBookmarks(1); // fetchBookmarks 호출 추가
  };

  const handleCategoryClick = async (category) => {
    const categoryUpper = String(category || '').trim().toUpperCase();
    if (selectedCategory === categoryUpper) {
      handleCategorySelect("");
    } else {
      handleCategorySelect(categoryUpper);
    }
    setPage(1);
    setHasMore(true); // hasMore 상태 초기화 추가
    
    // 상태 업데이트 후 ref 값들이 동기화될 때까지 잠시 대기
    await new Promise(resolve => setTimeout(resolve, 0));
    
    await fetchTotalCount();
    await fetchBookmarks(1); // fetchBookmarks 호출 추가
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleTagClick = async (tag) => {
    const tagStr = String(tag || '');
    if (selectedTags.includes(tagStr)) {
      setSelectedTags(prev => prev.filter(t => t !== tagStr));
    } else {
      setSelectedTags(prev => [...prev, tagStr]);
    }
    setPage(1);
    setHasMore(true); // hasMore 상태 초기화 추가
    
    // 상태 업데이트 후 ref 값들이 동기화될 때까지 잠시 대기
    await new Promise(resolve => setTimeout(resolve, 0));
    
    await fetchTotalCount();
    await fetchBookmarks(1); // fetchBookmarks 호출 추가
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // useEffect hooks
  useEffect(() => {
    if (page === 1) return;
    fetchBookmarks(page)
  }, [fetchBookmarks, page])

  // 필터 상태 변경 시 데이터 다시 가져오기
  useEffect(() => {
    if (!didMountFiltersRef.current) {
      didMountFiltersRef.current = true;
      return;
    }
    if (page === 1) {
      fetchTotalCount();
      fetchBookmarks(1);
    }
  }, [selectedCategory, selectedTags, searchQuery, sortOrder, fetchTotalCount, fetchBookmarks]);

  // 초기 totalCount 로딩
  useEffect(() => {
    fetchTotalCount();
    fetchBookmarks(1);
  }, [fetchTotalCount, fetchBookmarks]);

  useEffect(() => {
    if (bookmarks && bookmarks.length > 0) {
      const ids = bookmarks.map(b => b.id).filter((id) => /^\d+$/.test(String(id)))
      fetchClickCounts(ids)
    }
  }, [bookmarks, fetchClickCounts])

  const loadMoreRef = useCallback((node) => {
    loadingRef.current = node;
    if (loading || !hasMore || !canUseSupabase) return;
    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) {
        setPage((prevPage) => prevPage + 1);
      }
    }, {
      rootMargin: "360px 0px",
      threshold: 0,
    });

    if (node) observer.current.observe(node);
  }, [canUseSupabase, hasMore, loading]);

  useEffect(() => {
    return () => {
      if (observer.current) observer.current.disconnect();
    };
  }, []);

  return (
    <>
      <Meta title={title} description={description} />
      <FigmaResourceLayout
        titleLines={["Things,", "Worth Visiting"]}
        eyebrow="Bookmarks"
        description="Community-submitted websites and references for product designers working through complex SaaS systems."
        items={bookmarks.map((bookmark) => ({
          ...bookmark,
          rawId: bookmark.id,
          type: "resource",
          click_count: bookmarkClickCounts[bookmark.id] || 0,
        }))}
        activeCategory={selectedCategory}
        selectedTags={selectedTags}
        categories={availableCategories}
        tags={availableTags}
        query={searchQuery}
        onSearch={handleSearch}
        onCategoryClick={handleCategoryClick}
        onTagClick={handleTagClick}
        realtimeRoom="dwmm-bookmarks"
        gridFooter={
          <div ref={loadMoreRef} className="figma-grid__sentinel" aria-hidden="true">
            {loading ? "Loading more..." : hasMore ? "" : "End"}
          </div>
        }
        emptyState={
          <p className="figma-empty">
            {isLoadingTotalCount || loading
              ? "Loading curated websites..."
              : totalCount === 0
                ? "There's no result to show. Try another keyword or suggest a website."
                : "No bookmarks are available."}
          </p>
        }
      />
    </>
  );
}
