import React, { useMemo } from "react"
import ContentCard from "./ContentCard"

function ContentGrid({ contents = [], isSearching = false, lastBookmarkRef = null, onCategoryClick, onTagClick, renderItem }) {
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
