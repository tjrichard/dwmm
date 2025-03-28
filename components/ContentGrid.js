import React from "react";
import ContentCard from "./ContentCard";

export default function ContentGrid({ contents = [], isSearching = false, lastBookmarkRef }) {
  if (!contents || contents.length === 0) {
    return (
      <div className="no-content">
        {isSearching ? "검색 결과가 없습니다." : "북마크가 없습니다."}
      </div>
    );
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
        }
        return (
          <div key={content.id}>
            <ContentCard content={content} />
          </div>
        );
      })}
    </div>
  );
}
