import React from "react";
import ContentCard from "./ContentCard";
import EmptyResults from "./EmptyResults";

const ContentGrid = ({ contents, isSearching, onRequestSubmit }) => {
  if (isSearching && contents.length === 0) {
    return <EmptyResults onSubmit={onRequestSubmit} />;
  }

  return (
    <div className="content-grid grid">
      {contents.map((content) => (
        <ContentCard key={content.id} content={content} />
      ))}
    </div>
  );
};

export default ContentGrid;
