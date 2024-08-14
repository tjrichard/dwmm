// Blog.js
import React from "react";
import Header from "../components/header.js";
import Footer from "../components/footer.js";
import Meta from "../components/meta.js";

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

function Bookmarks({ title, description }) {
  return (
    <div>
      <Meta title={title} description={description} />
      <Header />
      <main>
        <section className="home">
          <h2>안녕하세요 장승환입니다.</h2>
          <p>이곳은 북마크 페이지입니다.</p>
        </section>
      </main>
      <Footer />
    </div>
  );
}

export default Bookmarks;
