import React, { useState, useEffect, useCallback } from "react";
import Meta from "../../components/Meta.js";
import Hero from "../../components/Hero";
import ContentGrid from "../../components/ContentGrid";
import FloatingCTA from "../../components/FloatingCTA";
// import SubscribeForm from "../../components/SubscribeForm";
import Pagination from "../../components/Pagination";
import { supabase } from "../../lib/supabase";
import { getUserVotedWebsites } from "../../lib/voteUtils";
import SubscribeForm from "../../components/SubscribeForm.js";

// Number of items per page
const ITEMS_PER_PAGE = 5;

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

function Bookmarks({ 
  title, 
  description, 
  initialBookmarks = [], 
  initialTags = [], 
  initialCategories = [],
  error 
}) {
  console.log("Bookmarks component props:", {
    title,
    description,
    initialBookmarks,
    initialTags,
    initialCategories,
    error
  })

  const [displayedBookmarks, setDisplayedBookmarks] = useState(initialBookmarks)
  const [currentPage, setCurrentPage] = useState(1)
  const [searchParams, setSearchParams] = useState({
    query: '',
    category: '',
    tags: []
  })
  const [userVotedWebsites, setUserVotedWebsites] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  const handleSearch = useCallback((searchParams) => {
    setSearchParams(searchParams)
  }, [])

  // Update the search filtering effect
  useEffect(() => {
    const filterBookmarks = () => {
      let filtered = [...initialBookmarks]
      const { query, category, tags } = searchParams

      if (query) {
        const searchLower = query.toLowerCase()
        filtered = filtered.filter(item => 
          (item.title?.toLowerCase()?.includes(searchLower) || false) ||
          (item.description?.toLowerCase()?.includes(searchLower) || false)
        )
      }

      if (category) {
        filtered = filtered.filter(item => item.category === category)
      }

      if (tags?.length > 0) {
        filtered = filtered.filter(item => 
          item.tags?.some(tag => tags.includes(tag))
        )
      }

      return filtered
    }

    const filteredBookmarks = filterBookmarks()
    
    // 현재 표시된 북마크와 필터링된 결과가 다를 때만 상태 업데이트
    if (JSON.stringify(displayedBookmarks) !== JSON.stringify(filteredBookmarks)) {
      setDisplayedBookmarks(filteredBookmarks)
      setCurrentPage(1)
    }
  }, [searchParams, initialBookmarks])

  // 컴포넌트 마운트 시 사용자 투표 정보만 가져오기
  useEffect(() => {
    const fetchUserVotes = async () => {
      const votedWebsites = await getUserVotedWebsites()
      setUserVotedWebsites(votedWebsites)
    }
    fetchUserVotes()
  }, [])

  useEffect(() => {
    setIsLoading(false)
  }, [])

  const handlePageChange = (page) => {
    setCurrentPage(page)
    window.scrollTo({
      top: document.querySelector(".main-content")?.offsetTop - 100,
      behavior: "smooth"
    })
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Failed to load bookmarks</h1>
          <p className="text-gray-600">Please try again later.</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Loading...</h1>
        </div>
      </div>
    )
  }

  const paginatedBookmarks = displayedBookmarks.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  const totalPages = Math.ceil(displayedBookmarks.length / ITEMS_PER_PAGE)
  const isSearchActive = Boolean(searchParams.query || searchParams.category || searchParams.tags.length)

  return (
    <div>
      <Meta title={title} description={description} />
      {!error && (
        <>
          <Hero 
            onSearch={handleSearch} 
            categories={initialCategories} 
            tags={initialTags}
          />

          <main className="main-content">
            {displayedBookmarks.length > 0 ? (
              <>
                <ContentGrid
                  contents={paginatedBookmarks.map(bookmark => ({
                    ...bookmark,
                    user_has_voted: userVotedWebsites.includes(bookmark.id)
                  }))}
                  isSearching={isSearchActive}
                />

                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </>
            ) : (
              <div className="text-center py-12">
                <h2 className="text-xl font-semibold mb-2">No bookmarks found</h2>
                <p className="text-gray-600">Try adjusting your search criteria</p>
              </div>
            )}
          </main>

          <FloatingCTA />
          <SubscribeForm />
        </>
      )}
    </div>
  )
}

export default Bookmarks
