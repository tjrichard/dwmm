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
import WebsiteRequestForm from '../../components/WebsiteRequestForm';
import BookmarkHeader from '../../components/BookmarkHeader';
import { RealtimeCursors } from "../../components/realtime-cursors";

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
        const exactCategory = availableCategories.find(
          cat => cat.toLowerCase() === selectedCategory.toLowerCase()
        );
        if (exactCategory) {
          query = query.eq("category", exactCategory);
        }
      }
      if (selectedTags.length > 0) {
        selectedTags.forEach(tag => {
          query = query.contains('tags', [tag]);
        });
      }
      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
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

  // Fetch bookmarks when page changes or filters change
  useEffect(() => {
    fetchBookmarks(page);
  }, [page, selectedCategory, selectedTags, searchQuery]);
  
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

  const handleSearch = (params) => {
    setSearchQuery(params.query || '');
    setSelectedCategory(params.category || '');
    setSelectedTags(params.tags || []);
    setPage(1); 
  };

  const handleCategoryClick = (category) => {
    const categoryLower = String(category || '').toLowerCase();
    if (selectedCategory === categoryLower) {
      handleCategorySelect("");
    } else {
      handleCategorySelect(category);
    }
    setPage(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleTagClick = (tag) => {
    const tagStr = String(tag || '');
    if (selectedTags.includes(tagStr)) {
      setSelectedTags(prev => prev.filter(t => t !== tagStr));
    } else {
      setSelectedTags(prev => [...prev, tagStr]);
    }
    setPage(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="bookmarks-page-wrapper">
      <RealtimeCursors roomName="demo-room" username={`User-${Math.floor(Math.random() * 1000)}`} />
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
          {bookmarks.length === 0 && (searchQuery || selectedCategory || selectedTags.length > 0) ? (
            <div className="no-results-container">
              <h3>검색 결과가 없습니다</h3>
              <p>다른 검색어나 필터를 사용해보세요.</p>
              <p className="no-results-divider">또는</p>
              <WebsiteRequestForm />
            </div>
          ) : bookmarks.length === 0 ? (
            <WebsiteRequestForm />
          ) : (
            <ContentGrid
              contents={bookmarks}
              isSearching={loading}
              lastBookmarkRef={lastBookmarkRef}
              onCategoryClick={handleCategoryClick}
              onTagClick={handleTagClick}
            />
          )}
          <FloatingCTA />
          <SubscribeForm />
        </div>
      </div>
    </div>
  );
}
