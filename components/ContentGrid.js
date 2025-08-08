import React, { useMemo } from "react"
import ContentCard from "./ContentCard"

function ContentGrid({ contents = [], isSearching = false, lastBookmarkRef = null, onCategoryClick, onTagClick, renderItem }) {
  return (
    <div className="content-grid grid">
      {contents.map((content, index) => {
        const stableId = useMemo(() => 
          content.id || `content-${index}-${Math.random().toString(36).substr(2, 9)}`, 
          [content.id, index]
        );
        
        const isLastItem = contents.length === index + 1
        const Wrapper = ({ children }) => (
          <div key={stableId} ref={isLastItem ? lastBookmarkRef : null} className="fade-in">{children}</div>
        )

        if (typeof renderItem === 'function') {
          return <Wrapper>{renderItem(content, index, isLastItem)}</Wrapper>
        }

        return (
          <Wrapper>
            <ContentCard
              content={content}
              onCategoryClick={onCategoryClick}
              onTagClick={onTagClick}
            />
          </Wrapper>
        )
      })}
    </div>
  )
}

export default React.memo(ContentGrid)
