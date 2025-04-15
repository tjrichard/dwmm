import React from "react";
import ContentCard from "./ContentCard";

const ContentGrid = ({ contents = [], isSearching = false, lastBookmarkRef = null, onCategoryClick, onTagClick }) => {
  return (
    <div className="content-grid grid">
      {contents.map((content, index) => {
        if (contents.length === index + 1) {
          return (
            <div ref={lastBookmarkRef} key={content.id}>
              <ContentCard 
                content={content} 
                onCategoryClick={onCategoryClick}
                onTagClick={onTagClick}
              />
            </div>
          );
        } else {
          return (
            <ContentCard 
              key={content.id} 
              content={content} 
              onCategoryClick={onCategoryClick}
              onTagClick={onTagClick}
            />
          );
        }
      })}
    </div>
  );
};

export default ContentGrid;
