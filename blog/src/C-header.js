import React from "react";
import logo from "./logo.svg";
import { Link } from "react-router-dom";

function Header() {
  return (
    <div className="header-container">
      <div className="header shadow-3">
        <img src={logo} className="App-logo" alt="logo" />
        <div className="tab-container">
          <Link to="/" className="button m tertiary bold">
            Home
          </Link>
          <Link to="/blog" className="button m tertiary bold">
            Blog
          </Link>
          <Link to="/side-hustle" className="button m tertiary bold">
            Side Hustle
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Header;
