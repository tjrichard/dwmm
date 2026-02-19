import React from "react";
import Link from "next/link";

function Header() {
  return (
    <div className="header-container">
      <div className="header">
        <img src="/logo.svg" className="dwmm-logo" alt="logo" />
        <div className="tab-container">
          <Link href="/" className="header-link">
            Bookmarks
          </Link>
          <Link href="/works" className="header-link">
            Works
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Header;
