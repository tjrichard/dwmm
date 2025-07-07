import React from "react";

function BookmarkFooter() {
  return (
    <footer>
      <div className="footer-content desktop-subbody-caption">
        <a href="https://www.linkedin.com/in/tjrichatd/" className="cursor-pointer">Bio</a>
        <div className="footer-made-with">
          <p>Made with 🖤</p>{" "}
          <p>...and Figma, Cursor, Supabase</p>
        </div>
        <p>
          by <a href="https://dwmm.site" className="cursor-pointer">DWMM</a>
        </p>
      </div>
    </footer>
  );
}

export default BookmarkFooter;
