import React from "react";
import Link from "next/link";
import { useRouter } from "next/router";

function Header() {
  const router = useRouter();

  const isActive = (href) => {
    if (href === "/") return router.pathname === "/";
    return router.pathname === href || router.pathname.startsWith(`${href}/`);
  };

  return (
    <div className="header-container">
      <div className="header">
        <Link href="/" className="logo-link cursor-pointer" aria-label="Go to DWMM hub">
          <img src="/logo.svg" className="dwmm-logo" alt="logo" />
        </Link>
        <nav className="tab-container" aria-label="Global navigation">
          <Link href="/" className={`header-link ${isActive("/") ? "is-active" : ""}`}>
            Hub
          </Link>
          <Link
            href="/bookmarks"
            className={`header-link ${isActive("/bookmarks") ? "is-active" : ""}`}
          >
            Bookmarks
          </Link>
          <Link
            href="/works"
            className={`header-link ${isActive("/works") ? "is-active" : ""}`}
          >
            Works/Blog
          </Link>
        </nav>
      </div>
    </div>
  );
}

export default Header;
