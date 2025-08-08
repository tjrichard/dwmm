import React from "react"

function BookmarkLNBFilter({
  categories = [],
  tags = [],
  selectedCategory = "",
  selectedTags = [],
  sortOrder = "Newest",
  onCategorySelect,
  onTagToggle,
  onSortOrderChange,
}) {
  return (
    <div className="filter-container">
      <div className="filter-group">
        <p className="filter-label">Sort</p>
        <div className="filter-badges">
          {["Newest", "Oldest", "Recommended"].map((order) => (
            <button
              key={order}
              type="button"
              className={`cursor-pointer button xs text ${sortOrder === order ? "active" : "inactive"}`}
              onClick={() => onSortOrderChange(order)}
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
              className={`cursor-pointer button xs text ${!selectedCategory ? "active" : "inactive"}`}
              onClick={() => onCategorySelect("")}
            >
              ALL
            </button>
            {categories.map((category) => {
              const normalizedSelected = String(selectedCategory || '').trim().toUpperCase()
              const normalizedCategory = String(category || '').trim().toUpperCase()
              const isActive = normalizedSelected === normalizedCategory
              return (
                <button
                  key={category}
                  type="button"
                  className={`cursor-pointer button xs text ${isActive ? "active" : "inactive"}`}
                  onClick={() => onCategorySelect(normalizedCategory)}
                >
                  {normalizedCategory}
                </button>
              )
            })}
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
                className={`cursor-pointer button xs text ${selectedTags.includes(String(tag || '')) ? "selected" : "inactive"}`}
                onClick={() => onTagToggle(tag)}
              >
                {String(tag || '')}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default BookmarkLNBFilter
