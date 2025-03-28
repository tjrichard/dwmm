'use client'

import React, { useState, useEffect, useCallback } from "react"

function SearchBar({
  onSearch,
  categories = [],
  tags = [],
  selectedCategory = "",
  selectedTags = [],
  onCategorySelect,
  onTagSelect
}) {
  const [searchQuery, setSearchQuery] = useState("")
  const [localSelectedCategory, setLocalSelectedCategory] = useState(selectedCategory)
  const [localSelectedTags, setLocalSelectedTags] = useState(selectedTags)

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
    debouncedSearch(searchParams)
  }, [searchQuery, localSelectedCategory, localSelectedTags, debouncedSearch])

  const handleSearch = (e) => {
    if (e) e.preventDefault()
    // Immediate search on form submit
    onSearch({
      query: searchQuery,
      category: localSelectedCategory,
      tags: localSelectedTags,
    })
  }

  const handleCategorySelect = (category) => {
    const newCategory = localSelectedCategory === category ? "" : category
    setLocalSelectedCategory(newCategory)
    if (onCategorySelect) {
      onCategorySelect(newCategory)
    }
  }

  const handleTagToggle = (tag) => {
    const newTags = localSelectedTags.includes(tag)
      ? localSelectedTags.filter((t) => t !== tag)
      : [...localSelectedTags, tag]
    setLocalSelectedTags(newTags)
    if (onTagSelect) {
      onTagSelect(newTags)
    }
  }

  return (
<<<<<<< HEAD
    <div className="search-section">
      <form onSubmit={handleSearch} className="search-bar">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="검색어를 입력하세요..."
        />
        <button type="submit" aria-label="검색">
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M19 19L14.65 14.65M17 9C17 13.4183 13.4183 17 9 17C4.58172 17 1 13.4183 1 9C1 4.58172 4.58172 1 9 1C13.4183 1 17 4.58172 17 9Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </form>

      <div className="filter-section">
        {categories.length > 0 && (
          <div className="filter-group">
            <h4>카테고리</h4>
            <div className="filter-badges">
              <button
                className={`badge ${!localSelectedCategory ? "badge-active" : ""}`}
                onClick={() => handleCategorySelect("")}
              >
                전체
=======
    <div className="search-container">
      <form onSubmit={handleSearch} className="search-form">
        <div className="search-input-container">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for design resources..."
            className="search-input"
          />
          <button type="submit" className="button primary search-button">
            Search
          </button>
        </div>

        <div className="filter-container">
          <div className="category-filter">
            <h4>Categories</h4>
            <div className="category-options">
              <button
                type="button"
                className={`filter-button ${selectedCategory === "" ? "active" : ""}`}
                onClick={() => setSelectedCategory("")}
              >
                All
>>>>>>> parent of 861b518 (fix errors)
              </button>
              {categories.map((category) => (
                <button
                  key={category}
<<<<<<< HEAD
                  className={`badge ${
                    localSelectedCategory === category ? "badge-active" : ""
                  }`}
                  onClick={() => handleCategorySelect(category)}
=======
                  type="button"
                  className={`filter-button ${selectedCategory === category ? "active" : ""}`}
                  onClick={() => setSelectedCategory(category)}
>>>>>>> parent of 861b518 (fix errors)
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
<<<<<<< HEAD
        )}

        {tags.length > 0 && (
          <div className="filter-group">
            <h4>태그</h4>
            <div className="filter-badges">
              {tags.map((tag) => (
                <button
                  key={tag}
                  className={`badge ${
                    localSelectedTags.includes(tag) ? "badge-active" : ""
                  }`}
=======

          <div className="tag-filter">
            <h4>Tags</h4>
            <div className="tag-options">
              {tags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  className={`tag-button ${selectedTags.includes(tag) ? "active" : ""}`}
>>>>>>> parent of 861b518 (fix errors)
                  onClick={() => handleTagToggle(tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
<<<<<<< HEAD
        )}
      </div>
=======
        </div>
      </form>
>>>>>>> parent of 861b518 (fix errors)
    </div>
  )
}

export default SearchBar
