import React from "react";
import logo from "./logo.svg";

function Header() {
  return (
    <header className="header">
      <h1>홈페이지</h1>
      <img src={logo} className="App-logo" alt="logo" />
    </header>
  );
}

export default Header;