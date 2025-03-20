'use client'

import React, { useState, useEffect, useCallback } from "react"

function SearchBar({ onSearch, categories, tags }) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [selectedTags, setSelectedTags] = useState([])

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
      category: selectedCategory,
      tags: selectedTags
    }
    debouncedSearch(searchParams)
  }, [searchQuery, selectedCategory, selectedTags, debouncedSearch])

  const handleSearch = (e) => {
    if (e) e.preventDefault()
    // Immediate search on form submit
    onSearch({
      query: searchQuery,
      category: selectedCategory,
      tags: selectedTags,
    })
  }

  const handleTagToggle = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag))
    } else {
      setSelectedTags([...selectedTags, tag])
    }
  }

  return (
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
              </button>
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  className={`filter-button ${selectedCategory === category ? "active" : ""}`}
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          <div className="tag-filter">
            <h4>Tags</h4>
            <div className="tag-options">
              {tags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  className={`tag-button ${selectedTags.includes(tag) ? "active" : ""}`}
                  onClick={() => handleTagToggle(tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}

export default SearchBar
