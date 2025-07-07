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
  const [bookmarkClickCounts, setBookmarkClickCounts] = useState({})

  const fetchTotalCount = useCallback(async () => {
    setIsLoadingTotalCount(true);
    try {
      let query = supabase
        .from("bookmarks_public")
        .select("id", { count: "exact" });

      if (selectedCategory) {
        const exactCategory = availableCategories.find(
          cat => cat.toLowerCase() === selectedCategory.toLowerCase()
        );
        if (exactCategory) query = query.eq("category", exactCategory);
      }
      if (selectedTags.length > 0) {
        selectedTags.forEach(tag => {
          query = query.contains('tags', [tag]);
        });
      }
      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
      }

      const { count, error } = await query;

      if (error) throw error;
      setTotalCount(count);
    } catch (error) {
      console.error("Error fetching total count:", error);
      setTotalCount(0);
    } finally {
      setIsLoadingTotalCount(false);
    }
  }, [selectedCategory, selectedTags, searchQuery, availableCategories]);

  const fetchBookmarks = useCallback(async (pageNumber) => {
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

      // 정렬 기준 적용
      if (sortOrder === "Newest") query = query.order("created_at", { ascending: false })
      else if (sortOrder === "Oldest") query = query.order("created_at", { ascending: true })
      else if (sortOrder === "Recommended") query = query.order("vote_count", { ascending: false })

      query = query.range((pageNumber - 1) * ITEMS_PER_PAGE, pageNumber * ITEMS_PER_PAGE - 1)

      if (selectedCategory) {
        const exactCategory = availableCategories.find(
          cat => cat.toLowerCase() === selectedCategory.toLowerCase()
        )
        if (exactCategory) query = query.eq("category", exactCategory)
      }
      if (selectedTags.length > 0) {
        selectedTags.forEach(tag => {
          query = query.contains('tags', [tag])
        })
      }
      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
      }

      const { data, error } = await query

      if (error) throw error

      if (data.length < ITEMS_PER_PAGE) setHasMore(false)

      if (pageNumber === 1) setBookmarks(data)
      else setBookmarks(prev => [...prev, ...data])
    } catch (error) {
      console.error("Error fetching bookmarks:", error)
    } finally {
      setLoading(false)
    }
  }, [selectedCategory, selectedTags, searchQuery, availableCategories, sortOrder]) // sortOrder 추가

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
    setSelectedCategory(categoryStr.toLowerCase());
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
    setSearchQuery(params.query || "");
    setSelectedCategory(params.category || "");
    setSelectedTags(params.tags || []);
    setSortOrder(params.sortOrder || "Newest");
    setPage(1);
    await fetchTotalCount();
  };

  const handleCategoryClick = async (category) => {
    const categoryLower = String(category || '').toLowerCase();
    if (selectedCategory === categoryLower) {
      handleCategorySelect("");
    } else {
      handleCategorySelect(category);
    }
    setPage(1);
    await fetchTotalCount();
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
    await fetchTotalCount();
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
      {/* userId가 준비된 경우에만 커서 렌더 */}
      {userId && (
        <RealtimeCursors
          roomName="dwmm-bookmarks"
          userId={userId}
          username={""} // 필요시 닉네임 전달
        />
      )}
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
          ) : totalCount === 0 ? (
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
            />
          )}
          {/* <SubscribeForm /> */}
          <BookmarkFooter />
        </div>
      </div>
    </div>
  );
}
