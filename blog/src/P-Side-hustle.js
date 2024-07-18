// src/P-Side-hustle.js
import React from "react";
import Header from "./C-header.js";
import Footer from "./C-footer.js";

function SideHustle() {
  return (
    <div>
      <Header />
      <main>
        <section className="home">
          <h2>안녕하세요 장승환입니다.</h2>
          <p>이곳은 사이드 허슬 페이지입니다.</p>
        </section>
      </main>
      <Footer />
    </div>
  );
}

export default SideHustle;
