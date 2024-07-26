// Blog.js
import React from "react";
import Header from "../components/header.js";
import Footer from "../components/footer.js";
import Meta from "../components/meta";

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

function PostList({ title, url, thumbnail }) {
  return (
    <div className="PostListItem">
      <a href={url}>
        <img src={thumbnail} alt={title} />
        <h2>{title}</h2>
      </a>
    </div>
  );
}

const blogPosts = [
  {
    index: 1,
    title: "B2B 프로덕트 디자이너가 신경써야 할 8가지 #1 - B2B 프로덕트의 특징",
    url: "https://dwmm.site/blog/8-things-keep-in-mind-as-b2b-product-designer/",
    thumbnail:
      "https://dwmm.site/blog/8-things-keep-in-mind-as-b2b-product-designer/img/header_img.png",
  },
  {
    index: 2,
    title:
      "B2B 프로덕트 디자이너가 신경써야 할 8가지 #2 - 디자이너가 고려해야 하는 점",
    url: "https://dwmm.site/blog/8-things-keep-in-mind-as-b2b-product-designer_2/",
    thumbnail:
      "https://dwmm.site/blog/8-things-keep-in-mind-as-b2b-product-designer_2/img/header_img.png",
  },
];

function Blog({ title, description }) {
  return (
    <div>
      <Meta title={title} description={description} />
      <Header />
      <main>
        <section className="home">
          <h2>안녕하세요 장승환입니다.</h2>
          <p>이곳은 블로그 페이지입니다.</p>
        </section>
        <section className="PostLists">
          {blogPosts.map((posts, index) => (
            <PostList
              key={index}
              title={posts.title}
              url={posts.url}
              thumbnail={posts.thumbnail}
            />
          ))}
        </section>
      </main>
      <Footer />
    </div>
  );
}

export default Blog;
