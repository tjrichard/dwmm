// // Blog.js
// import React, { useState, useEffect } from "react";
// import Header from "../../components/Header.js";
// import Footer from "../../components/Footer.js";
// import Meta from "../../components/Meta.js";
// import { supabase } from "../../lib/supabase.js";

// export async function getStaticProps() {
//   // 여기에 필요한 데이터를 서버에서 가져오거나 정의합니다.
//   const pageProps = {
//     title: "DWMM | Bookmarks",
//     content: "Bookmarks for Designers",
//   };

//   // 이 객체가 MyApp 컴포넌트로 전달됩니다.
//   return {
//     props: pageProps,
//   };
// }

// const Bookmarks = ({ title, description }) => {
//   const [bookmarks, setBookmarks] = useState([]);

//   useEffect(() => {
//     const fetchBookmarks = async () => {
//       const { data, error } = await supabase
//         .from('bookmarks')
//         .select('*')
//         .eq("public", true)
//         .order('created_at', { ascending: false });

//       if (error) {
//         console.error('Error fetching bookmarks:', error);
//       } else {
//         setBookmarks(data);
//       }
//     };

//     fetchBookmarks();
//   }, []);

//   return (
//     <div>
//       <Meta title={title} description={description} />
//       <Header />
//       <h1>Bookmarks</h1>
//       <div className="bookmarkLists">
//         {bookmarks.map((bookmark) => (
//           <div key={bookmark.id} className="bookmarkListItem card">
//             <a
//               href={`${bookmark.original_link}?utm_source=dwmm&utm_medium=link-share&utm_content=b2b-designers`}
//               target="_blank"
//               rel="noopener noreferrer"
//             >
//               {bookmark.title}
//             </a>
//             <p className="desktop-body-content">{bookmark.description}</p>
//             <p>Tags: {bookmark.tags.join(', ')}</p>
//           </div>
//         ))}
//       </div>
//       <Footer />
//     </div>
//   );
// };

// export default Bookmarks;

import React, { useState, useEffect } from "react";
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

// Number of items per page
const ITEMS_PER_PAGE = 9;

export async function getStaticProps() {
  // Fetch initial data for static generation
  let bookmarks = [];
  let allTags = [];
  let totalCount = 0;

  try {
    // Get total count for pagination
    const { count, error: countError } = await supabase
      .from("bookmarks")
      .select("id", { count: "exact" })
      .eq("public", true);

    if (!countError) {
      totalCount = count;
    }

    // Fetch first page of bookmarks with vote counts
    const { data, error } = await supabase
      .from("bookmarks")
      .select(
        `
        *,
        vote:vote(count)
      `,
      )
      .eq("public", true)
      .order("created_at", { ascending: false })
      .limit(ITEMS_PER_PAGE);

    if (!error) {
      // Process the data to format vote_count
      bookmarks = data.map((item) => ({
        ...item,
        vote_count: item.vote && item.vote.length ? item.vote.length : 0,
      }));

      // Extract all tags and remove duplicates
      const tags = data.flatMap((item) => item.tags);
      allTags = [...new Set(tags)];
    }
  } catch (error) {
    console.error("Error fetching initial data:", error);
  }

  const pageProps = {
    title: "DWMM | Bookmarks",
    description: "Curated design resources for B2B SaaS product designers",
  };

  return {
    props: {
      ...pageProps,
      initialBookmarks: bookmarks,
      initialTags: allTags,
      totalCount,
    },
    revalidate: 3600, // Revalidate every hour
  };
}

function Bookmarks({
  title,
  description,
  initialBookmarks,
  initialTags,
  totalCount: initialTotalCount,
}) {
  const [bookmarks, setBookmarks] = useState(initialBookmarks || []);
  const [filteredBookmarks, setFilteredBookmarks] = useState(
    initialBookmarks || [],
  );
  const [tags, setTags] = useState(initialTags || []);
  const [categories, setCategories] = useState([
    "AI",
    "Tool",
    "Website",
    "Article",
    "Collection",
    "Book",
  ]);
  const [isSearching, setIsSearching] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(
    Math.ceil((initialTotalCount || 0) / ITEMS_PER_PAGE),
  );
  const [totalCount, setTotalCount] = useState(initialTotalCount || 0);
  const [isLoading, setIsLoading] = useState(false);
  const [searchParams, setSearchParams] = useState(null);
  const [userVotedWebsites, setUserVotedWebsites] = useState([]);

  useEffect(() => {
    // If we didn't get initial data or want to refresh, fetch it client-side
    if (!initialBookmarks || initialBookmarks.length === 0) {
      fetchBookmarks(1);
    }

    // Fetch user's voted websites once on component mount
    const fetchUserVotes = async () => {
      const votedWebsites = await getUserVotedWebsites();
      setUserVotedWebsites(votedWebsites);
    };

    fetchUserVotes();
  }, [initialBookmarks]);

  const fetchBookmarks = async (page = 1, params = null) => {
    setIsLoading(true);
    const offset = (page - 1) * ITEMS_PER_PAGE;

    try {
      let query = supabase
        .from("bookmarks")
        .select(
          `
          *,
          vote:vote(count)
        `,
          { count: "exact" },
        )
        .eq("public", true);

      // Apply search filters if provided
      if (params) {
        const { query: searchQuery, category, tags } = params;

        if (searchQuery) {
          const lowercaseQuery = searchQuery.toLowerCase();
          query = query.or(
            `title.ilike.%${lowercaseQuery}%,description.ilike.%${lowercaseQuery}%`,
          );
        }

        if (category) {
          query = query.eq("category", category);
        }

        if (tags && tags.length > 0) {
          // This is a simplification - in a real app you'd need a more sophisticated approach
          // for filtering by multiple tags in an array field
          query = query.contains("tags", tags);
        }
      }

      // Apply pagination and ordering
      const { data, count, error } = await query
        .order("created_at", { ascending: false })
        .range(offset, offset + ITEMS_PER_PAGE - 1);

      if (error) throw error;

      // Process the data to format vote_count and add user's vote status
      const processedData = data.map((item) => ({
        ...item,
        vote_count: item.vote && item.vote.length ? item.vote.length : 0,
        user_has_voted: userVotedWebsites.includes(item.id),
      }));

      setBookmarks(processedData);
      setFilteredBookmarks(processedData);
      setTotalCount(count || 0);
      setTotalPages(Math.ceil((count || 0) / ITEMS_PER_PAGE));

      // Extract all tags and remove duplicates if this is the first page
      if (page === 1 && !params) {
        const allTags = data.flatMap((item) => item.tags);
        setTags([...new Set(allTags)]);
      }
    } catch (error) {
      console.error("Error fetching bookmarks:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (params) => {
    setIsSearching(true);
    setSearchParams(params);
    setCurrentPage(1); // Reset to first page on new search
    fetchBookmarks(1, params);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchBookmarks(page, searchParams);
    // Scroll to top of content grid
    window.scrollTo({
      top: document.querySelector(".main-content").offsetTop - 100,
      behavior: "smooth",
    });
  };

  const handleRequestSubmit = (newRequest) => {
    // Just acknowledge the submission, no need to add to the list
    // as it starts as non-public
    console.log("New resource request submitted:", newRequest);
  };

  return (
    <div>
      <Meta title={title} description={description} />
      <Header />

      <Hero onSearch={handleSearch} categories={categories} tags={tags} />

      <main className="main-content">
        {isLoading && (
          <div className="loading-indicator">Loading resources...</div>
        )}

        <ContentGrid
          contents={filteredBookmarks}
          isSearching={isSearching}
          onRequestSubmit={handleRequestSubmit}
        />

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />

        {/* <SubscribeForm /> */}
      </main>

      <FloatingCTA />
      <Footer />
    </div>
  );
}

export default Bookmarks;
