import React, { useState, useEffect } from "react";
import SearchBar from "./Searchbar.js";
import BookmarkLNBFilterPanel from "./FilterPanel.js";
import { Menu, X } from "lucide-react";

const MOBILE_BREAKPOINT = 768

const BookmarkLNB = ({
  categories,
  tags = [],
  selectedCategory,
  selectedTags,
  onSearch
}) => {
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [localCategory, setLocalCategory] = useState(String(selectedCategory || "").trim().toUpperCase())
  const [localTags, setLocalTags] = useState(
    Array.isArray(selectedTags) ? selectedTags.map(String) : []
  )
  const [sortOrder, setSortOrder] = useState("Newest")
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    function handleResize() {
      // 모바일: 768px 미만에서만 true
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  
  // tag 필드가 존재하는 객체만 추출 후 오름차순 정렬
  const sortedTags = tags
    .map(t => (typeof t === "object" && t !== null && "tag" in t ? t.tag : typeof t === "string" ? t : null))
    .filter(tag => typeof tag === "string" && tag.length > 0)
    .sort((a, b) => a.localeCompare(b))

  // 외부에서 선택 상태가 바뀌면 로컬 상태 동기화
  useEffect(() => {
    setLocalCategory(String(selectedCategory || "").trim().toUpperCase())
  }, [selectedCategory])

  useEffect(() => {
    const normalized = Array.isArray(selectedTags) ? selectedTags.map(String) : []
    setLocalTags(normalized)
  }, [selectedTags])

  // 선택된 태그를 최상단으로 이동 (선택 그룹, 비선택 그룹 각각 알파벳 정렬 유지)
  const selectedLowerSet = new Set((localTags || []).map(t => String(t).toLowerCase()))
  const selectedFirst = []
  const unselected = []
  for (const tag of sortedTags) {
    if (selectedLowerSet.has(String(tag).toLowerCase())) selectedFirst.push(tag)
    else unselected.push(tag)
  }
  const prioritizedTags = [...selectedFirst, ...unselected]

  function handleCategorySelect(category) {
    const normalized = String(category || '').trim().toUpperCase()
    setLocalCategory(normalized)
    onSearch({ category: normalized, tags: localTags, sortOrder })
  }
  function handleTagToggle(tag) {
    const tagStr = String(tag || '')
    const newTags = localTags.includes(tagStr)
      ? localTags.filter((t) => t !== tagStr)
      : [...localTags, tagStr]
    setLocalTags(newTags)
    onSearch({ category: localCategory, tags: newTags, sortOrder })
  }
  function handleSortOrderChange(order) {
    setSortOrder(order)
    onSearch({ category: localCategory, tags: localTags, sortOrder: order })
  }

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
        <div className="lnb-searchbar-row">
          <SearchBar
            selectedCategory={localCategory}
            selectedTags={localTags}
            onSearch={onSearch}
          />
          {isMobile && (
            <button
              className="lnb-filter-btn"
              aria-label={isFilterOpen ? "Close filter" : "Open filter"}
              onClick={() => setIsFilterOpen((v) => !v)}
              style={{ position: 'relative', width: 32, height: 32 }}
            >
              <span className="lnb-filter-icon">
                <Menu
                  style={{
                    opacity: isFilterOpen ? 0 : 1,
                    transform: isFilterOpen ? 'scale(0.8) rotate(-20deg)' : 'scale(1) rotate(0deg)',
                    transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    pointerEvents: isFilterOpen ? 'none' : 'auto',
                  }}
                  aria-hidden={isFilterOpen}
                />
                <X
                  style={{
                    opacity: isFilterOpen ? 1 : 0,
                    transform: isFilterOpen ? 'scale(1) rotate(0deg)' : 'scale(1.2) rotate(20deg)',
                    transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    pointerEvents: isFilterOpen ? 'auto' : 'none',
                  }}
                  aria-hidden={!isFilterOpen}
                />
              </span>
            </button>
          )}
        </div>
        {isMobile && (
          <div
            className={`lnb-filter-overlay lnb-filter-transition${isFilterOpen ? ' open' : ''}`}
            onClick={() => setIsFilterOpen(false)}
            style={{ pointerEvents: isFilterOpen ? 'auto' : 'none' }}
          >
            <BookmarkLNBFilterPanel
              categories={categories}
              tags={prioritizedTags}
              selectedCategory={localCategory}
              selectedTags={localTags}
              sortOrder={sortOrder}
              onCategorySelect={handleCategorySelect}
              onTagToggle={handleTagToggle}
              onSortOrderChange={handleSortOrderChange}
              onClose={() => setIsFilterOpen(false)}
            />
          </div>
        )}
        {!isMobile && (
          <div className="lnb-filter-desktop lnb-filter-transition open">
            <BookmarkLNBFilterPanel
              categories={categories}
              tags={prioritizedTags}
              selectedCategory={localCategory}
              selectedTags={localTags}
              sortOrder={sortOrder}
              onCategorySelect={handleCategorySelect}
              onTagToggle={handleTagToggle}
              onSortOrderChange={handleSortOrderChange}
              onClose={() => {}}
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default BookmarkLNB
