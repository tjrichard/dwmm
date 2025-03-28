import React from "react";
import SearchBar from "./SearchBar";

export default function Hero({
  categories = [],
  tags = [],
  selectedCategory = "",
  selectedTags = [],
  onSearch,
  onCategorySelect,
  onTagSelect
}) {
  return (
    <section className="hero">
      <div className="hero-content">
        <div className="hero-text">
          <h1 className="hero-title">
            B2B SaaS 디자이너를 위한
            <br />
            큐레이션 북마크
          </h1>
          <p className="hero-description">
            B2B SaaS 제품을 디자인하는 데 도움이 되는 리소스들을 모았습니다.
            <br />
            유용한 리소스를 발견하셨다면 투표해주세요.
          </p>
        </div>

        <SearchBar
          categories={categories}
          tags={tags}
          selectedCategory={selectedCategory}
          selectedTags={selectedTags}
          onSearch={onSearch}
          onCategorySelect={onCategorySelect}
          onTagSelect={onTagSelect}
        />
      </div>
    </section>
  );
}
