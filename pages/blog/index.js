// pages/blog/index.js
import React, { useEffect, useState } from "react";
import Meta from "../../components/Meta.js";
import { supabase } from "../../lib/supabase";
import Link from 'next/link';
import SkeletonLoader from '../../components/SkeletonLoader.js';

export async function getStaticProps() {
  // 여기에 필요한 데이터를 서버에서 가져오거나 정의합니다.
  const pageProps = {
    title: "DWMM | Blog",
    content: "Thing I have been thinking",
  };

  // 이 객체가 MyApp 컴포넌트로 전달됩니다.
  return {
    props: pageProps,
  };
}

// Supabase로 부터 PostList를 받아오는 컴포넌트
function stripHtml(html) {
  let doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent || "";
}

function FetchPostLists() {
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imageLoading, setImageLoading] = useState(true);

  async function fetchData() {
    // Simulate a longer loading time
    // await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay

    let { data, error } = await supabase
      .from("posts")
      .select("*")
      .eq("public", true)
      .order("id", { ascending: false })
      .limit(10);

    if (error) {
      setError(error);
    } else {
      setData(data);
      console.log(data);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="PostLists">
        {[...Array(10)].map((_, index) => (
          <SkeletonLoader key={index} />
        ))}
      </div>
    );
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div className="PostLists">
      {data.map((item, index) => (
        <div key={index} className="PostListItem animate-fade-in">
          <Link href={`/blog/${item.slug}`}>
            {imageLoading && <div className="skeleton-loader skeleton-thumbnail"></div>}
            <img
              src={item.thumbnail}
              alt={item.title}
              onLoad={() => setImageLoading(false)}
              style={{ display: imageLoading ? 'none' : 'block', width: '100%', height: 'auto' }}
            />
            <h2 className="postTitle desktop-headings-heading-4 bold">{item.title}</h2>
            <p className="postContent">{stripHtml(item.content).substring(0, 400)}...</p>
          </Link>
        </div>
      ))}
    </div>
  );
}

function Blog({ title, description }) {
  return (
    <div>
      <Meta title={title} description={description} />
      <main>
        {/* <section className="home">
          <h2>안녕하세요 장승환입니다.</h2>
          <p>이곳은 블로그 페이지입니다.</p>
        </section> */}
        <section>
          <FetchPostLists />
        </section>
      </main>
    </div>
  );
}

export default Blog;
