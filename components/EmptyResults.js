import React from "react";
import WebsiteRequestForm from "./website-request-form";

const EmptyResults = ({ onSubmit }) => {
  return (
    <div className="empty-results">
      <h2>No results found</h2>
      <p>We couldn't find any resources matching your search criteria.</p>
      <p>Would you like to suggest a resource for our collection?</p>

      <WebsiteRequestForm onSubmit={onSubmit} />
    </div>
  );
};

export default EmptyResults;
