import React from "react";
import SearchBar from "./SearchBar";

const Hero = ({ onSearch, categories, tags }) => {
  return (
    <div className="hero-section">
      <div className="hero-content">
        <h1>Design Resources for B2B Product Designers</h1>
        <p className="hero-subtitle">
          Discover curated tools, articles, and inspiration to elevate your B2B
          SaaS product design
        </p>

        <SearchBar onSearch={onSearch} categories={categories} tags={tags} />
      </div>
    </div>
  );
};

export default Hero;
