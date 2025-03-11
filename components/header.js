import React from "react";
import Link from "next/link";

function Header() {
  return (
    <div className="header-container">
      <div className="header shadow-3">
        <img src="/logo.svg" className="dwmm-logo" alt="logo" />
        <div className="tab-container">
          <Link href="/" className="button m tertiary bold">
            Home
          </Link>
          <Link href="/blog" className="button m tertiary bold">
            Blog
          </Link>
          <Link href="/bookmarks" className="button m tertiary bold">
            Bookmarks
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Header;
