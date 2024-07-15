// src/HomePage.js
import React from 'react';
import { Link } from 'react-router-dom';
import logo from './logo.svg';

function HomePage() {
  return (
    <div>
    <header className="header">
        <h1>홈페이지</h1>
        <img src={logo} className="App-logo" alt="logo" />
      </header>
      <main>
        <section className="home">
          <h2>안녕하세요 장승환입니다.</h2>
          <p>이곳은 홈 페이지입니다.</p>
        </section>
        <section>
          <Link to="/first-page">첫 번째 페이지로 이동</Link>
        </section>
      </main>
      <footer className="footer">
        <p>DWMM, all rights reserved</p>
      </footer>
    </div>
  );
}

export default HomePage;
