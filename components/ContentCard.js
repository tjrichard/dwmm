import React, { useState } from "react";
import Image from "next/image";
import VoteButton from "./VoteButton";
import { supabase } from "../lib/supabase";

export default function ContentCard({ content }) {
  const [isHovered, setIsHovered] = useState(false);

  const getUtmLink = () => {
    const utmParams = new URLSearchParams({
      utm_source: "dwmm",
      utm_medium: "bookmark",
      utm_campaign: "design_resources"
    });

    try {
      const url = new URL(content.url);
      url.search = url.search ? `${url.search}&${utmParams}` : `?${utmParams}`;
      return url.toString();
    } catch (e) {
      console.error("Invalid URL:", content.url);
      return content.url;
    }
  };

  const handleClick = async () => {
    try {
      // 클릭 수 증가
      const { error } = await supabase
        .from("bookmarks_public")
        .update({ click_count: (content.click_count || 0) + 1 })
        .eq("id", content.id);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error("Error updating click count:", error);
    }
  };

  return (
    <a
      href={getUtmLink()}
      target="_blank"
      rel="noopener noreferrer"
      className="content-card"
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="card-image">
        {content.image && (
          <Image
            src={content.image}
            alt={content.title}
            width={400}
            height={300}
            className="rounded-lg object-cover"
          />
        )}
      </div>
      
      <div className="card-content">
        <div className="card-header">
          <h3 className="card-title">{content.title}</h3>
          {content.category && (
            <span className="card-category">{content.category}</span>
          )}
        </div>
        
        <p className="card-description">{content.description}</p>
        
        <div className="card-footer">
          <div className="card-tags">
            {content.tags?.map((tag) => (
              <span key={tag} className="tag">
                {tag}
              </span>
            ))}
          </div>
          
          <div className="card-actions">
            <VoteButton
              contentId={content.id}
              initialVoteCount={content.vote_count}
              userHasVoted={content.user_has_voted}
            />
          </div>
        </div>
      </div>
    </a>
  );
}
