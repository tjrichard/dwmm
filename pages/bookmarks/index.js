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
import WebsiteRequestForm from '../../components/WebsiteRequestForm'
import BookmarkHeader from '../../components/BookmarkHeader';

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
    const allTags = [...new Set(bookmarks.flatMap(item => item.tags?.map(tag => tag.toLowerCase()) || []))];
    const allCategories = [...new Set(bookmarks.map(item => item.category || ''))];

    // 추가 태그 및 카테고리 추출
    const { data: tags } = await supabase.from("bookmarks_tags").select("tag");
    const { data: categories } = await supabase.from("bookmarks_categories").select("category");

    const additionalTags = tags?.map(tag => tag.tag?.toLowerCase()) || [];
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
        // initialCategories에서 대소문자 구분 없이 일치하는 카테고리 찾기
        const exactCategory = initialCategories.find(
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
  }, []);

  const handleCategorySelect = (category) => {
    // 대소문자 구분 없는 카테고리 선택 - 검색용으로는 소문자 버전 저장
    const categoryStr = category ? String(category) : "";
    setSelectedCategory(categoryStr.toLowerCase());
  };

  const handleTagSelect = (tag) => {
    // 대소문자 구분 없는 태그 선택
    // tag가 문자열인지 확인하고 문자열이 아니면 변환
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
  };

  const handleCategoryClick = (category) => {
    // 이미 선택된 카테고리면 필터 해제 (소문자 기준 비교)
    if (selectedCategory === String(category || '').toLowerCase()) {
      handleCategorySelect("");
    } else {
      handleCategorySelect(category);
    }
    
    // 페이지 상단으로 스크롤
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleTagClick = (tag) => {
    const tagLower = String(tag || '').toLowerCase();
    
    // 이미 선택된 태그면 필터 해제, 아니면 추가
    if (selectedTags.includes(tagLower)) {
      setSelectedTags(prev => prev.filter(t => t !== tagLower));
    } else {
      setSelectedTags(prev => [...prev, tagLower]);
    }
    
    // 페이지 상단으로 스크롤
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <BookmarkHeader />
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
          
          {bookmarks.length === 0 && (searchQuery || selectedCategory || selectedTags.length > 0) ? (
            <div className="no-results-container">
              <div className="no-results-message">
                <h3>검색 결과가 없습니다</h3>
                <p>다른 검색어나 필터를 사용해보세요.</p>
                <p className="no-results-divider">또는</p>
                <WebsiteRequestForm />
              </div>
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
        </div>

        <FloatingCTA />
        <SubscribeForm />
      </div>
    </>
  );
}
