'use client'

import React, { useState, useEffect, useCallback } from "react"

function SearchBar({
  onSearch,
  categories = [],
  tags = [],
  selectedCategory = "",
  selectedTags = [],
}) {
  const [searchQuery, setSearchQuery] = useState("")
  const [localSelectedCategory, setLocalSelectedCategory] = useState(selectedCategory)
  const [localSelectedTags, setLocalSelectedTags] = useState(selectedTags)
  const [sortOrder, setSortOrder] = useState("Newest") // 기본 정렬: 최신 순

  // 외부에서 selectedCategory나 selectedTags가 변경될 때 로컬 상태 업데이트
  useEffect(() => {
    setLocalSelectedCategory(selectedCategory);
  }, [selectedCategory]);

  useEffect(() => {
    setLocalSelectedTags(selectedTags);
  }, [selectedTags]);

  // Debounce helper
  const debounce = (func, delay) => {
    let timeoutId
    return (...args) => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => func(...args), delay)
    }
  }

  // Create debounced search callback for query input
  const debouncedQuerySearch = useCallback(
    debounce((query) => {
      onSearch({
        query: query.trim(),
        category: localSelectedCategory,
        tags: localSelectedTags,
        sortOrder: sortOrder, // 정렬 기준 추가
      });
    }, 500),
    [onSearch, localSelectedCategory, localSelectedTags, sortOrder] // category/tags/sortOrder 변경 시에도 debounce 콜백 재생성
  );

  // Trigger debounced search only when searchQuery changes
  useEffect(() => {
    debouncedQuerySearch(searchQuery);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]); // searchQuery만 의존성으로 가짐

  const handleSearch = (e) => {
    if (e) e.preventDefault()
    // Immediate search on form submit (Enter key)
    onSearch({
      query: searchQuery,
      category: localSelectedCategory,
      tags: localSelectedTags,
      sortOrder: sortOrder, // 정렬 기준 추가
    });
  };

  const handleCategorySelect = (category) => {
    // 문자열 변환 후 소문자로 처리
    const categoryStr = String(category || '');
    const categoryLower = categoryStr.toLowerCase();
    const newCategory = localSelectedCategory === categoryLower ? "" : categoryLower;
    setLocalSelectedCategory(newCategory);
    // 카테고리 변경 시 즉시 onSearch 호출
    onSearch({
      query: searchQuery,
      category: newCategory,
      tags: localSelectedTags,
      sortOrder: sortOrder, // 정렬 기준 추가
    });
  };

  const handleTagToggle = (tag) => {
    // 문자열 변환 후 원본 대소문자 유지
    const tagStr = String(tag || '');
    const newTags = localSelectedTags.includes(tagStr)
      ? localSelectedTags.filter((t) => t !== tagStr)
      : [...localSelectedTags, tagStr];
    setLocalSelectedTags(newTags);
    // 태그 변경 시 즉시 onSearch 호출
    onSearch({
      query: searchQuery,
      category: localSelectedCategory,
      tags: newTags,
      sortOrder: sortOrder, // 정렬 기준 추가
    });
  };

  const handleSortOrderChange = (order) => {
    setSortOrder(order)
    onSearch({
      query: searchQuery,
      category: localSelectedCategory,
      tags: localSelectedTags,
      sortOrder: order, // 정렬 기준 추가
    })
  }

  return (
    <div className="search-container">
      <form onSubmit={handleSearch} className="search-form">
        <input
          type="text"
          className="search-input-container cursor-pointer"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search anything"
        />
      </form>

      <div className="filter-container">
        <div className="filter-group">
          <p className="filter-label">Sort</p>
          <div className="filter-badges">
            {["Newest", "Oldest", "Recommended"].map((order) => (
              <button
                key={order}
                type="button"
                className={`cursor-pointer button xs text ${
                  sortOrder === order ? "active" : "inactive"
                }`}
                onClick={() => handleSortOrderChange(order)}
              >
                {order}
              </button>
            ))}
          </div>
        </div>

        {categories.length > 0 && (
          <div className="filter-group">
            <p className="filter-label">Category</p>
            <div className="filter-badges">
              <button
                type="button"
                className={`cursor-pointer button xs text ${!localSelectedCategory ? "active" : "inactive"}`}
                onClick={() => handleCategorySelect("")}
              >
                ALL
              </button>
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  className={`cursor-pointer button xs text ${
                    localSelectedCategory === String(category || '').toLowerCase() ? "active" : "inactive"
                  }`}
                  onClick={() => handleCategorySelect(category)}
                >
                  {String(category || '').toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        )}

        {tags.length > 0 && (
          <div className="filter-group">
            <p className="filter-label">Tags</p>
            <div className="filter-badges">
              {tags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  className={`cursor-pointer button xs text ${
                    localSelectedTags.includes(String(tag || '')) ? "selected" : "inactive"
                  }`}
                  onClick={() => handleTagToggle(tag)}
                >
                  {String(tag || '')}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default SearchBar
