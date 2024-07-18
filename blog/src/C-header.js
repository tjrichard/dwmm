import React from "react";
import logo from "./logo.svg";
import { Link } from "react-router-dom";

function Header() {
  return (
    <header className="header">
      <h1>홈페이지</h1>
      <img src={logo} className="App-logo" alt="logo" />
      <div class="tab-container">
          <button class="button tertiary">
            <Link to="/">Home</Link>
          </button>
          <button class="button tertiary">
            <Link to="/blog">Blog</Link>
          </button>
          <button class="button tertiary">
            <Link to="/side-hustle">Side Hustle</Link>
          </button>
      </div>
    </header>
  );
}

export default Header;