import React from "react";
import logo from "./logo.svg";
import { Link } from "react-router-dom";

function Header() {
  return (
    <header className="header">
      <h1>홈페이지</h1>
      <img src={logo} className="App-logo" alt="logo" />
      <div class="tab-container">
        <Link to="/" className="button tertiary">
          Home
        </Link>
        <Link to="/blog" className="button tertiary">
          Blog
        </Link>
        <Link to="/side-hustle" className="button tertiary">
          Side Hustle
        </Link>
      </div>
    </header>
  );
}

export default Header;
