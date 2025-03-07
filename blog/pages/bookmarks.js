// Blog.js
import React, { useState, useEffect } from "react";
import Header from "../components/header.js";
import Footer from "../components/footer.js";
import Meta from "../components/meta.js";
import { supabase } from "../lib/supabase.js";

export async function getStaticProps() {
  // 여기에 필요한 데이터를 서버에서 가져오거나 정의합니다.
  const pageProps = {
    title: "DWMM | Bookmarks",
    content: "Bookmarks for Designers",
  };

  // 이 객체가 MyApp 컴포넌트로 전달됩니다.
  return {
    props: pageProps,
  };
}

const Bookmarks = ({ title, description }) => {
  const [bookmarks, setBookmarks] = useState([]);

  useEffect(() => {
    const fetchBookmarks = async () => {
      const { data, error } = await supabase
        .from('bookmarks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching bookmarks:', error);
      } else {
        setBookmarks(data);
      }
    };

    fetchBookmarks();
  }, []);

  return (
    <div>
      <Meta title={title} description={description} />
      <Header />
      <h1>Bookmarks</h1>
      <ul>
        {bookmarks.map((bookmark) => (
          <li key={bookmark.id}>
            <a
              href={`${bookmark.original_link}?utm_source=dwmm&utm_medium=link-share&utm_content=b2b-designers`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {bookmark.title}
            </a>
            <p>{bookmark.description}</p>
            <p>Tags: {bookmark.tags.join(', ')}</p>
          </li>
        ))}
      </ul>
      <Footer />
    </div>
  );
};

export default Bookmarks;
