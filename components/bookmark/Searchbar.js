import React, { useState, useEffect, useCallback } from "react"

function SearchBar({
  onSearch,
  selectedCategory = "",
  selectedTags = [],
}) {
  const [searchQuery, setSearchQuery] = useState("")
  const [localSelectedCategory, setLocalSelectedCategory] = useState(String(selectedCategory || '').toUpperCase())
  const [localSelectedTags, setLocalSelectedTags] = useState(selectedTags)

  useEffect(() => {
    setLocalSelectedCategory(String(selectedCategory || '').toUpperCase());
  }, [selectedCategory]);

  useEffect(() => {
    setLocalSelectedTags(selectedTags);
  }, [selectedTags]);

  const debounce = (func, delay) => {
    let timeoutId
    return (...args) => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => func(...args), delay)
    }
  }

  const debouncedQuerySearch = useCallback(
    debounce((query) => {
      onSearch({
        query: query.trim(),
        category: String(localSelectedCategory || '').toUpperCase(),
        tags: localSelectedTags,
      });
    }, 500),
    [onSearch, localSelectedCategory, localSelectedTags]
  );

  useEffect(() => {
    debouncedQuerySearch(searchQuery);
  }, [searchQuery]);

  const handleSearch = (e) => {
    if (e) e.preventDefault()
    onSearch({
      query: searchQuery,
      category: String(localSelectedCategory || '').toUpperCase(),
      tags: localSelectedTags,
    });
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
    </div>
  )
}

export default SearchBar
