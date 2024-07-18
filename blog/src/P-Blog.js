// src/P-Blog.js
import React from "react";
import Header from "./C-header.js";
import Footer from "./C-footer.js";

function PostList({ title, url, thumbnail }) {
  return (
    <div>
      <a href={url}>
        <img src={thumbnail} alt=""></img>
        <h2>{title}</h2>
      </a>
    </div>
  );
}

const blogPosts = [
  {
    title: "B2B 프로덕트 디자이너가 신경써야 할 8가지 #1 - B2B 프로덕트의 특징",
    url: "https://dwmm.site/blog/8-things-keep-in-mind-as-b2b-product-designer/",
    thumbnail:
      "https://dwmm.site/blog/8-things-keep-in-mind-as-b2b-product-designer/img/header_img.png",
  },
  {
    title:
      "B2B 프로덕트 디자이너가 신경써야 할 8가지 #2 - 디자이너가 고려해야 하는 점",
    url: "https://dwmm.site/blog/8-things-keep-in-mind-as-b2b-product-designer_2/",
    thumbnail:
      "https://dwmm.site/blog/8-things-keep-in-mind-as-b2b-product-designer_2/img/header_img.png",
  }
];

function Blog() {
  return (
    <div>
      <Header />
      <main>
        <section className="home">
          <h2>안녕하세요 장승환입니다.</h2>
          <p>이곳은 블로그 페이지입니다.</p>
        </section>
        <section>
          {blogPosts.map(posts => (
            <PostList
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
