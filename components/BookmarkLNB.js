import React from "react";
import SearchBar from "./SearchBar";

const BookmarkLNB = ({
  categories,
  tags,
  selectedCategory,
  selectedTags,
  onCategorySelect,
  onTagSelect,
  onSearch
}) => {
  return (
    <div className="LNB-section">
      <div className="LNB-content">
        <h1>
          USE<br />
          READ<br />
          SHARE
        </h1>
        <p className="LNB-subtitle">
        Design Resources for B2B Product Designers
        </p>

        <SearchBar
          categories={categories}
          tags={tags}
          selectedCategory={selectedCategory}
          selectedTags={selectedTags}
          onCategorySelect={onCategorySelect}
          onTagSelect={onTagSelect}
          onSearch={onSearch}
        />
      </div>
    </div>
  );
};

export default BookmarkLNB;
