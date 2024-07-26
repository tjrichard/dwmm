// Side-hustle.js
import React, { useState, useEffect } from "react";
import Header from "../components/header.js";
import Footer from "../components/footer.js";
import { supabase } from "../lib/supabase.js";
import Meta from "../components/meta";

export async function getStaticProps() {
  // 여기에 필요한 데이터를 서버에서 가져오거나 정의합니다.
  const pageProps = {
    title: "DWMM | Side-Hustle",
    content: "Things I have been working on",
  };

  // 이 객체가 MyApp 컴포넌트로 전달됩니다.
  return {
    props: pageProps,
  };
}

function FetchSupabase() {
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      let { data, error } = await supabase.from("emojis").select("*").limit(10);

      if (error) {
        setError(error);
      } else {
        setData(data);
      }
      setLoading(false);
    }

    fetchData();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}

function SideHustle({ title, description }) {
  return (
    <div>
      <Meta title={title} description={description} />
      <Header />
      <main>
        <section className="home">
          <h2>안녕하세요 장승환입니다.</h2>
          <p>이곳은 사이드 허슬 페이지입니다.</p>
          <FetchSupabase />
        </section>
      </main>
      <Footer />
    </div>
  );
}

export default SideHustle;
