// src/P-Side-hustle.js
import React, { useState, useEffect } from 'react';
import Header from "./C-header.js";
import Footer from "./C-footer.js";
import { supabase } from './lib/supabase.js';

function FetchSupabase() {
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      let { data, error } = await supabase
        .from('emojis')
        .select('*')
        .limit(10);

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

function SideHustle() {
  return (
    <div>
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
