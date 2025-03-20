import React, { useState, useEffect, useCallback } from "react";
import Meta from "../../components/Meta.js";
import Hero from "../../components/Hero";
import ContentGrid from "../../components/ContentGrid";
import FloatingCTA from "../../components/FloatingCTA";
// import SubscribeForm from "../../components/SubscribeForm";
import Pagination from "../../components/Pagination";
import { supabase } from "../../lib/supabase";
import Header from "../../components/Header.js";
import Footer from "../../components/Footer.js";
import { getUserVotedWebsites } from "../../lib/voteUtils";
import SubscribeForm from "../../components/SubscribeForm.js";

// Number of items per page
const ITEMS_PER_PAGE = 9;

export async function getStaticProps() {
  try {
    // 초기 데이터 한 번에 가져오기
    const { data: bookmarks, error: bookmarksError } = await supabase
      .from("bookmarks")
      .select(`
        *,
        vote:vote(count)
      `)
      .eq("public", true)
      .order("created_at", { ascending: false })

    if (bookmarksError) throw bookmarksError

    // 태그와 카테고리 추출
    const allTags = [...new Set(bookmarks.flatMap(item => item.tags))]
    const allCategories = [...new Set(bookmarks.map(item => item.category))]

    const processedBookmarks = bookmarks.map(item => ({
      ...item,
      vote_count: item.vote?.length || 0
    }))

    return {
      props: {
        title: "DWMM | Bookmarks",
        description: "Curated design resources for B2B SaaS product designers",
        initialBookmarks: processedBookmarks,
        initialTags: allTags,
        initialCategories: allCategories,
      },
      revalidate: 3600
    }
  } catch (error) {
    console.error("Error in getStaticProps:", error)
    return { props: { error: "Failed to load initial data" } }
  }
}

function Bookmarks({ 
  title, 
  description, 
  initialBookmarks, 
  initialTags, 
  initialCategories,
  error 
}) {
  const [displayedBookmarks, setDisplayedBookmarks] = useState(initialBookmarks)
  const [currentPage, setCurrentPage] = useState(1)
  const [searchParams, setSearchParams] = useState({
    query: '',
    category: '',
    tags: []
  })
  const [userVotedWebsites, setUserVotedWebsites] = useState([])

  const handleSearch = useCallback((searchParams) => {
    setSearchParams(searchParams)
  }, [])

  // Update the search filtering effect
  useEffect(() => {
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

    setDisplayedBookmarks(filtered)
    setCurrentPage(1)
  }, [searchParams, initialBookmarks])

  // 컴포넌트 마운트 시 사용자 투표 정보만 가져오기
  useEffect(() => {
    const fetchUserVotes = async () => {
      const votedWebsites = await getUserVotedWebsites()
      setUserVotedWebsites(votedWebsites)
    }
    fetchUserVotes()
  }, [])

  const handlePageChange = (page) => {
    setCurrentPage(page)
    window.scrollTo({
      top: document.querySelector(".main-content")?.offsetTop - 100,
      behavior: "smooth"
    })
  }

  if (error) return <div>Failed to load bookmarks</div>

  const paginatedBookmarks = displayedBookmarks.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  const totalPages = Math.ceil(displayedBookmarks.length / ITEMS_PER_PAGE)
  const isSearchActive = Boolean(searchParams.query || searchParams.category || searchParams.tags.length)

  return (
    <div>
      <Meta title={title} description={description} />
      <Header />
      <Hero 
        onSearch={handleSearch} 
        categories={initialCategories} 
        tags={initialTags}
      />

      <main className="main-content">
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
      </main>

      <FloatingCTA />
      <SubscribeForm />
      <Footer />
    </div>
  )
}

export default Bookmarks
