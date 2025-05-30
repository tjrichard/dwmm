import React, { useContext, useState, useCallback } from "react";
import VoteButton from "./VoteButton";
import { supabase } from "../lib/supabase";

const ContentCard = ({ content, onCategoryClick, onTagClick }) => {
  const {
    id,
    title,
    description,
    category,
    tags,
    original_link,
    vote_count = 0,
    user_has_voted = false,
  } = content;
  
  const getUtmLink = () => {
    const baseUrl = original_link;
    const utmParams = new URLSearchParams({
      utm_source: "dwmm",
      utm_medium: "link-share",
      utm_content: "b2b-designers",
    });

    return `${baseUrl}${baseUrl.includes("?") ? "&" : "?"}${utmParams.toString()}`;
  };

  // Supabase 썸네일 URL 생성
  const getSupabaseThumbnailUrl = () => {
    return `https://lqrkuvemtnnnjgvptnlo.supabase.co/storage/v1/object/public/assets/bookmarks/${id}/thumbnail.webp`;
  };

  // 기존 dicebear 이미지 URL 생성
  const getWebsitePreviewImage = () => {
    try {
      const domain = new URL(original_link).hostname;
      return `https://api.dicebear.com/7.x/identicon/svg?seed=${domain}`;
    } catch (e) {
      return `https://api.dicebear.com/7.x/identicon/svg?seed=default`;
    }
  };

  // 이미지 소스 state 관리
  const [imgSrc, setImgSrc] = useState(getSupabaseThumbnailUrl());
  const [fallbackUsed, setFallbackUsed] = useState(false);

  // onError 핸들러
  const handleImgError = useCallback(() => {
    if (!fallbackUsed) {
      setImgSrc(getWebsitePreviewImage());
      setFallbackUsed(true);
    }
  }, [fallbackUsed, original_link]);

  const handleVoteClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleCategoryClick = (e, categoryValue) => {
    e.preventDefault();
    e.stopPropagation();
    if (onCategoryClick) {
      onCategoryClick(categoryValue);
    }
  };

  const handleTagClick = (e, tagValue) => {
    e.preventDefault();
    e.stopPropagation();
    if (onTagClick) {
      onTagClick(String(tagValue || ''));
    }
  };

  const handleClick = async (e) => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      // Get referrer and user agent
      const referrer = document.referrer || '';
      const userAgent = navigator.userAgent;

      // Insert click tracking data
      const { error } = await supabase
        .from('click_tracking')
        .insert([
          {
            bookmark_id: id,
            user_id: user?.id || null,
            referrer: referrer,
            user_agent: userAgent
          }
        ]);

      if (error) {
        console.error('Error tracking click:', error);
      }
    } catch (error) {
      console.error('Error in click tracking:', error);
    }
  };

  return (
    <a
      href={getUtmLink()}
      target="_blank"
      rel="noopener noreferrer"
      className="content-card card cursor-pointer"
      onClick={handleClick}
    >
      <div className="card__top-row">
        <div className="card__meta">
          <div 
            className="cursor-pointer card__category button xs text active" 
            role="button"
            onClick={(e) => handleCategoryClick(e, category)}
          >
            {category ? String(category).toUpperCase() : ''}
          </div>
        <div className="card__arrow">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M7 17l9.2-9.2M17 17V7H7" />
          </svg>
        </div>
        </div>
      </div>
      <div className="card__image-container">
        <img
          src={imgSrc}
          alt={title}
          className="card__image"
          onError={handleImgError}
        />
      </div>
      <div className="card__content">
        <div className="card__title-row">
          <h3 className="card__title">{title}</h3>
          <div onClick={handleVoteClick}>
            <VoteButton
              contentId={id}
              initialVoteCount={vote_count}
              userHasVoted={user_has_voted}
            />
          </div>
        </div>
        <div className="card__meta">
          <div className="card__tags">
            {tags && tags.map((tag, index) => (
              <span 
                key={index} 
                className="cursor-pointer tag button xs text"
                onClick={(e) => handleTagClick(e, tag)}
              >
                {String(tag || '')}
              </span>
            ))}
          </div>
        </div>
      </div>
    </a>
  );
};

export default ContentCard;
