import React from "react"
import ContentCard from "./ContentCard"

function ContentGrid({ contents = [], isSearching = false, lastBookmarkRef = null, onCategoryClick, onTagClick }) {
  return (
    <div className="content-grid grid">
      {contents.map((content, index) => {
        const isLastItem = contents.length === index + 1
        return isLastItem ? (
          <div ref={lastBookmarkRef} className="fade-in">
            <ContentCard 
              content={content} 
              onCategoryClick={onCategoryClick}
              onTagClick={onTagClick}
            />
          </div>
        ) : (
          <div className="fade-in">
            <ContentCard 
              content={content} 
              onCategoryClick={onCategoryClick}
              onTagClick={onTagClick}
            />
          </div>
        )
      })}
    </div>
  )
}

export default React.memo(ContentGrid)
