import React, { useState, useEffect, useCallback, useRef } from "react";
import Meta from "../components/Meta.js";
import { supabase } from "../lib/supabase.js";
import { getUserVotedWebsites } from "../lib/voteUtils.js";
import { RealtimeCursors } from "../components/realtime-cursors.tsx";
import { ensureAuthenticated } from "../lib/auth.js";
import BookmarkHeader from '../components/bookmark/Header.js';
import LNB from '../components/bookmark/Lnb.js';
import BookmarkFooter from '../components/bookmark/Footer.js';
import WebsiteRequestForm from '../components/bookmark/WebsiteRequestForm.js';
import ContentGrid from "../components/ContentGrid.js";
import SkeletonLoader from "../components/SkeletonLoader.js";
import ClickCount from "../components/bookmark/ClickCount.js";

// Number of items per page
const ITEMS_PER_PAGE = 9;

// 여기서부터 시작

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

    console.log('All Categories:', allCategories);
    console.log('All Tags:', allTags);

    const processedBookmarks = bookmarks.map(item => ({
      ...item,
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
    return {
      props: {
        title: "DWMM | Bookmarks",
        description: "Curated design resources for B2B SaaS product designers",
        bookmarks: [],
        tags: [],
        categories: [],
        error: "Failed to load bookmarks",
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
  const [userId, setUserId] = useState(null);
  const [bookmarkClickCounts, setBookmarkClickCounts] = useState({});

  // useRef를 사용하여 의존성 배열 문제 해결
  const sortOrderRef = useRef(sortOrder);
  const selectedCategoryRef = useRef(selectedCategory);
  const selectedTagsRef = useRef(selectedTags);
  const searchQueryRef = useRef(searchQuery);

  // ref 값들을 최신으로 유지
  useEffect(() => {
    sortOrderRef.current = sortOrder;
    selectedCategoryRef.current = selectedCategory;
    selectedTagsRef.current = selectedTags;
    searchQueryRef.current = searchQuery;
  }, [sortOrder, selectedCategory, selectedTags, searchQuery]);

  const fetchTotalCount = useCallback(async () => {
    console.log("📊 fetchTotalCount called");
    console.log("🔍 Current filter state for count:", {
      selectedCategory: selectedCategoryRef.current,
      selectedTags: selectedTagsRef.current,
      searchQuery: searchQueryRef.current
    });
    
    setIsLoadingTotalCount(true);
    try {
      let query = supabase
        .from("bookmarks_public")
        .select("id", { count: "exact" });

      console.log("🔧 Building count query...");

      if (selectedCategoryRef.current) {
        const exactCategory = availableCategories.find(
          cat => String(cat || '').toUpperCase() === String(selectedCategoryRef.current || '').toUpperCase()
        );
        if (exactCategory) {
          query = query.eq("category", exactCategory);
          console.log("🏷️ Applied category filter for count:", exactCategory);
        } else {
          console.log("⚠️ Category not found in availableCategories for count:", selectedCategoryRef.current);
        }
      }
      if (selectedTagsRef.current.length > 0) {
        selectedTagsRef.current.forEach(tag => {
          query = query.contains('tags', [tag]);
        });
        console.log("🏷️ Applied tags filter for count:", selectedTagsRef.current);
      }
      if (searchQueryRef.current) {
        query = query.or(`title.ilike.%${searchQueryRef.current}%,description.ilike.%${searchQueryRef.current}%`);
        console.log("🔍 Applied search filter for count:", searchQueryRef.current);
      }

      console.log("🚀 Executing count query...");
      const { count, error } = await query;

      if (error) {
        console.error("❌ Count query error:", error);
        throw error;
      }
      
      console.log("✅ Count query successful, total count:", count);
      setTotalCount(count);
    } catch (error) {
      console.error("❌ Error fetching total count:", error);
      setTotalCount(0);
    } finally {
      setIsLoadingTotalCount(false);
    }
  }, [availableCategories]);

  const fetchBookmarks = useCallback(async (pageNumber) => {
    console.log("📚 fetchBookmarks called with pageNumber:", pageNumber);
    console.log("🔍 Current filter state:", {
      sortOrder: sortOrderRef.current,
      selectedCategory: selectedCategoryRef.current,
      selectedTags: selectedTagsRef.current,
      searchQuery: searchQueryRef.current
    });
    
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
          created_at
        `)

      console.log("🔧 Building query with select fields...");

      // 정렬 기준 적용
      if (sortOrderRef.current === "Newest") {
        query = query.order("created_at", { ascending: false })
        console.log("📊 Applied sort: Newest (created_at DESC)");
      }
      else if (sortOrderRef.current === "Oldest") {
        query = query.order("created_at", { ascending: true })
        console.log("📊 Applied sort: Oldest (created_at ASC)");
      }
      else if (sortOrderRef.current === "Recommended") {
        query = query.order("vote_count", { ascending: false })
        console.log("📊 Applied sort: Recommended (vote_count DESC)");
      }

      query = query.range((pageNumber - 1) * ITEMS_PER_PAGE, pageNumber * ITEMS_PER_PAGE - 1)
      console.log("📄 Applied range:", (pageNumber - 1) * ITEMS_PER_PAGE, "to", pageNumber * ITEMS_PER_PAGE - 1);

      if (selectedCategoryRef.current) {
        const exactCategory = availableCategories.find(
          cat => String(cat || '').toUpperCase() === String(selectedCategoryRef.current || '').toUpperCase()
        )
        if (exactCategory) {
          query = query.eq("category", exactCategory)
          console.log("🏷️ Applied category filter:", exactCategory);
        } else {
          console.log("⚠️ Category not found in availableCategories:", selectedCategoryRef.current);
        }
      }
      if (selectedTagsRef.current.length > 0) {
        selectedTagsRef.current.forEach(tag => {
          query = query.contains('tags', [tag])
        })
        console.log("🏷️ Applied tags filter:", selectedTagsRef.current);
      }
      if (searchQueryRef.current) {
        query = query.or(`title.ilike.%${searchQueryRef.current}%,description.ilike.%${searchQueryRef.current}%`)
        console.log("🔍 Applied search filter:", searchQueryRef.current);
      }

      console.log("🚀 Executing query...");
      const { data, error } = await query

      if (error) {
        console.error("❌ Query error:", error);
        throw error;
      }

      console.log("✅ Query successful, data length:", data?.length);
      console.log("📋 First item sample:", data?.[0]);

      if (data.length < ITEMS_PER_PAGE) setHasMore(false)

      if (pageNumber === 1) {
        console.log("🔄 Setting bookmarks (page 1)");
        setBookmarks(data)
      } else {
        console.log("➕ Appending bookmarks (page", pageNumber, ")");
        setBookmarks(prev => [...prev, ...data])
      }
    } catch (error) {
      console.error("❌ Error fetching bookmarks:", error)
    } finally {
      setLoading(false)
    }
  }, [availableCategories])

  const fetchClickCounts = useCallback(async (bookmarkIds) => {
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
  }, [])

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
    console.log("🔍 handleSearch called with params:", params);
    setSearchQuery(params.query || "");
    setSelectedCategory(String(params.category || "").trim().toUpperCase());
    setSelectedTags(params.tags || []);
    setSortOrder(params.sortOrder || "Newest");
    setPage(1);
    setHasMore(true); // hasMore 상태 초기화 추가
    
    // 상태 업데이트 후 ref 값들이 동기화될 때까지 잠시 대기
    await new Promise(resolve => setTimeout(resolve, 0));
    
    console.log("🔄 handleSearch: calling fetchTotalCount and fetchBookmarks");
    await fetchTotalCount();
    await fetchBookmarks(1); // fetchBookmarks 호출 추가
  };

  const handleCategoryClick = async (category) => {
    console.log("🔍 handleCategoryClick called with category:", category);
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
    
    console.log("🔄 handleCategoryClick: calling fetchTotalCount and fetchBookmarks");
    await fetchTotalCount();
    await fetchBookmarks(1); // fetchBookmarks 호출 추가
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleTagClick = async (tag) => {
    console.log("🔍 handleTagClick called with tag:", tag);
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
    
    console.log("🔄 handleTagClick: calling fetchTotalCount and fetchBookmarks");
    await fetchTotalCount();
    await fetchBookmarks(1); // fetchBookmarks 호출 추가
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // useEffect hooks
  useEffect(() => {
    async function fetchUserId() {
      const id = await ensureAuthenticated();
      const { data: { user } } = await supabase.auth.getUser();
      console.log("ensureAuthenticated userId:", id);
      console.log("supabase.auth.getUser() userId:", user?.id);
      setUserId(id);
    }
    fetchUserId();
  }, []);

  useEffect(() => {
    fetchBookmarks(page)
  }, [fetchBookmarks, page])

  // 필터 상태 변경 시 데이터 다시 가져오기
  useEffect(() => {
    if (page === 1) {
      console.log("🔄 Filter state changed, refetching data...");
      fetchTotalCount();
      fetchBookmarks(1);
    }
  }, [selectedCategory, selectedTags, searchQuery, sortOrder, fetchTotalCount, fetchBookmarks]);

  // 초기 totalCount 로딩
  useEffect(() => {
    fetchTotalCount();
  }, [fetchTotalCount]);

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

  // 유저가 투표한 웹사이트 정보 가져오기
  useEffect(() => {
    async function fetchUserVotes() {
      try {
        const votedWebsiteIds = await getUserVotedWebsites();
        if (votedWebsiteIds.length > 0) {
          setBookmarks(prev => 
            prev.map(bookmark => ({
              ...bookmark,
              user_has_voted: votedWebsiteIds.includes(bookmark.id)
            }))
          );
        }
      } catch (error) {
        console.error("Error fetching user votes:", error);
      }
    }
    
    fetchUserVotes();
  }, []); // 최초 1회만 실행

  useEffect(() => {
    if (bookmarks && bookmarks.length > 0) {
      const ids = bookmarks.map(b => b.id)
      fetchClickCounts(ids)
    }
  }, [bookmarks, fetchClickCounts])

  return (
    <div className="bookmarks-page-wrapper">
      {/* RealtimeCursors를 항상 렌더링하되 내부에서 조건부 처리 */}
      <RealtimeCursors
        roomName="dwmm-bookmarks"
        userId={userId}
        username={""} // 필요시 닉네임 전달
      />
      <BookmarkHeader />
      <Meta title={title} description={description} />
      <div 
        className="bookmarks-layout-container"
      >

        <LNB 
          categories={availableCategories}
          tags={availableTags}
          selectedCategory={selectedCategory}
          selectedTags={selectedTags}
          onSearch={handleSearch}
        />
        <div className="content-scroll-wrapper">
          {isLoadingTotalCount ? (
            <div className="skeleton-container">
              <SkeletonLoader variant="bookmark"/>
            </div>
          ) : (totalCount === 0 || bookmarks.length === 0) ? (
            <div className="no-results-container">
              <h3>There's no result to show..</h3>
              <p>try another keyword or filter</p>
              <p className="no-results-divider">or</p>
              <WebsiteRequestForm />
            </div>
          ) : (
            <ContentGrid
              contents={bookmarks.map(b => ({
                ...b,
                click_count: bookmarkClickCounts[b.id] || 0
              }))}
              isSearching={loading}
              lastBookmarkRef={lastBookmarkRef}
              onCategoryClick={handleCategoryClick}
              onTagClick={handleTagClick}
              selectedTags={selectedTags}
            />
          )}
          {/* <SubscribeForm /> */}
          <BookmarkFooter />
        </div>
      </div>
    </div>
  );
}
