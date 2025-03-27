// Side-hustle.js
import React, { useState, useEffect } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { supabase } from "../../lib/supabase";
import Meta from "../../components/Meta";

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

function FetchSupabase({ input }) {
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  async function fetchData() {
    let LikeInput = `%${input}%`;
    let { data, error } = await supabase
      .from("emojis")
      .select("shortname")
      .or("emoji.eq."+input+",name.eq.LikeInput,shortname.eq."+LikeInput)
      .limit(10);

    if (error) {
      setError(error);
    } else {
      const extractedData = data.map(item => item.shortname.replace(/:/g, ''));
      setData(extractedData);
      console.log(extractedData);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchData();
  }, [input]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div className="resultConatiner">
      {data.map((item, index) => (
        <div key={index} className="result">{item}</div>
      ))}
    </div>
  );
}

export default function SideHustle() {
  const [input, setInput] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const handleSearch = () => {
    setSearchInput(input);
  };

  return (
    <div>
      <Meta title="Side Hustle" description="Side Hustle" />
      <Header />
      <main>
        <section className="home">
          <h2>안녕하세요 장승환입니다.</h2>
          <p>이곳은 사이드 허슬 페이지입니다.</p>
          <div id="container">
            <span id="title">Emoji Translator</span>
            <input
              type="text"
              id="submittedEmoji"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button
              type="button"
              id="submit"
              onClick={handleSearch}
              className="button m primary"
            >
              Get short name
            </button>
            <div id="apiResponse">
              {searchInput && <FetchSupabase input={searchInput} />}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
