import React from "react";
import SearchBar from "./SearchBar";

const BookmarkLNB = ({
  categories,
  tags = [],
  selectedCategory,
  selectedTags,
  onSearch
}) => {
  // tag 필드가 존재하는 객체만 추출 후 오름차순 정렬
  const sortedTags = tags
    .map(t => (typeof t === "object" && t !== null && "tag" in t ? t.tag : typeof t === "string" ? t : null))
    .filter(tag => typeof tag === "string" && tag.length > 0)
    .sort((a, b) => a.localeCompare(b));
  return (
    <div className="LNB-section">
      <div className="LNB-content">
        <h1 className="instrument-serif-regular">
          USE<br />
          READ<br />
          SHARE
        </h1>
        <p className="LNB-subtitle">
        Design Resources for B2B Product Designers
        </p>

        <SearchBar
          categories={categories}
          tags={sortedTags}
          selectedCategory={selectedCategory}
          selectedTags={selectedTags}
          onSearch={onSearch}
        />
      </div>
    </div>
  );
};

export default BookmarkLNB;
