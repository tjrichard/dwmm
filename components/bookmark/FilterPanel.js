import React from "react"
import BookmarkLNBFilter from "./filter.js"

function BookmarkLNBFilterPanel({ categories, tags, selectedCategory, selectedTags, onCategorySelect, onTagToggle, onSortOrderChange, onClose, sortOrder }) {
  function handlePanelClick(e) {
    e.stopPropagation()
  }
  return (
    <div className="lnb-filter-panel" onClick={handlePanelClick} role="dialog" aria-modal="true">
      <BookmarkLNBFilter
        categories={categories}
        tags={tags}
        selectedCategory={selectedCategory}
        selectedTags={selectedTags}
        sortOrder={sortOrder}
        onCategorySelect={onCategorySelect}
        onTagToggle={onTagToggle}
        onSortOrderChange={onSortOrderChange}
      />
    </div>
  )
}

export default BookmarkLNBFilterPanel
