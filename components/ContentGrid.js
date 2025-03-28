import React from "react";
import ContentCard from "./ContentCard";
import EmptyResults from "./EmptyResults";

const ContentGrid = ({ contents = [], isSearching = false, lastBookmarkRef = null }) => {
  if (isSearching && contents.length === 0) {
    return <EmptyResults />;
  }

  return (
    <div className="content-grid grid">
      {contents.map((content, index) => {
        if (contents.length === index + 1) {
          return (
            <div ref={lastBookmarkRef} key={content.id}>
              <ContentCard content={content} />
            </div>
          );
        } else {
          return <ContentCard key={content.id} content={content} />;
        }
      })}
    </div>
  );
};

export default ContentGrid;
