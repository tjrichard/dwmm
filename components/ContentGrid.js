import React, { useMemo } from "react"
import ContentCard from "./ContentCard"

function ContentGrid({ contents = [], isSearching = false, lastBookmarkRef = null, onCategoryClick, onTagClick, selectedTags = [], renderItem }) {
  // stableId들을 미리 계산하여 Hook 호출 순서 안정화
  const stableIds = useMemo(() => 
    contents.map((content, index) => 
      content.id || `content-${index}-${Math.random().toString(36).slice(2, 11)}`
    ), 
    [contents]
  );

  return (
    <div className="content-grid grid">
      {contents.map((content, index) => {
        const stableId = stableIds[index];
        
        const isLastItem = contents.length === index + 1

        if (typeof renderItem === 'function') {
          return (
            <div key={stableId} ref={isLastItem ? lastBookmarkRef : null} className="fade-in">
              {renderItem(content, index, isLastItem)}
            </div>
          )
        }

        return (
          <div key={stableId} ref={isLastItem ? lastBookmarkRef : null} className="fade-in">
            <ContentCard
              content={content}
              onCategoryClick={onCategoryClick}
              onTagClick={onTagClick}
              selectedTags={selectedTags}
            />
          </div>
        )
      })}
    </div>
  )
}

export default React.memo(ContentGrid)
