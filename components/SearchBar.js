'use client'

import React, { useState, useEffect, useCallback } from "react"

function SearchBar({
  onSearch,
  categories = [],
  tags = [],
  selectedCategory = "",
  selectedTags = [],
  // onCategorySelect,
  // onTagSelect
}) {
  const [searchQuery, setSearchQuery] = useState("")
  const [localSelectedCategory, setLocalSelectedCategory] = useState(selectedCategory)
  const [localSelectedTags, setLocalSelectedTags] = useState(selectedTags)

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

  // Create debounced search callback
  const debouncedSearch = useCallback(
    debounce((params) => {
      onSearch(params)
    }, 500),
    [onSearch]
  )

  // Trigger search on any filter change
  useEffect(() => {
    const searchParams = {
      query: searchQuery.trim(),
      category: localSelectedCategory,
      tags: localSelectedTags
    }
    // 검색어가 변경되거나, 카테고리/태그 선택 시 디바운스된 검색 실행
    debouncedSearch(searchParams)
  }, [searchQuery, localSelectedCategory, localSelectedTags, debouncedSearch])

  const handleSearch = (e) => {
    if (e) e.preventDefault()
    // Immediate search on form submit (Enter key)
    onSearch({
      query: searchQuery,
      category: localSelectedCategory,
      tags: localSelectedTags,
    })
  }

  const handleCategorySelect = (category) => {
    // 문자열 변환 후 소문자로 처리
    const categoryStr = String(category || '');
    const categoryLower = categoryStr.toLowerCase();
    const newCategory = localSelectedCategory === categoryLower ? "" : categoryLower;
    setLocalSelectedCategory(newCategory);
    // if (onCategorySelect) {
    //   onCategorySelect(newCategory);
    // }
  }

  const handleTagToggle = (tag) => {
    // 문자열 변환 후 원본 대소문자 유지
    const tagStr = String(tag || '');
    const newTags = localSelectedTags.includes(tagStr)
      ? localSelectedTags.filter((t) => t !== tagStr)
      : [...localSelectedTags, tagStr];
    setLocalSelectedTags(newTags);
    // if (onTagSelect) {
    //   onTagSelect(newTags);
    // }
  }

  return (
    <div className="search-container">
      <form onSubmit={handleSearch} className="search-form">
        <input
          type="text"
          className="search-input-container"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="검색어를 입력하세요..."
        />
      </form>

      <div className="filter-container">
        {categories.length > 0 && (
          <div className="filter-group">
            <p className="filter-label">카테고리</p>
            <div className="filter-badges">
              <button
                type="button"
                className={`button xs text ${!localSelectedCategory ? "active" : "inactive"}`}
                onClick={() => handleCategorySelect("")}
              >
                전체
              </button>
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  className={`button xs text ${
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
            <p className="filter-label">태그</p>
            <div className="filter-badges">
              {tags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  className={`button xs text ${
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
