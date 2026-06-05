import React, { useState, useEffect } from "react";
import { Star } from 'lucide-react'

const VoteButton = ({
  contentId,
  initialVoteCount = 0,
  userHasVoted = false,
}) => {
  const [voteCount, setVoteCount] = useState(initialVoteCount);
  const [isVoted, setIsVoted] = useState(userHasVoted);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsVoted(userHasVoted);
  }, [userHasVoted]);

  const handleVote = async () => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      if (isVoted) {
        setVoteCount((prev) => Math.max(0, prev - 1));
        setIsVoted(false);
      } else {
        setVoteCount((prev) => prev + 1);
        setIsVoted(true);
      }
    } catch (error) {
      console.error("Error toggling vote:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="vote-button-container">
      <button
        className={`vote-button ${isVoted ? "voted" : ""} ${isLoading ? "loading" : ""}`}
        onClick={handleVote}
        disabled={isLoading}
        aria-label={isVoted ? "Remove vote" : "Vote for this content"}
      >
        <span className="vote-icon">
          <Star size={14} fill={isVoted ? "currentColor" : "none"} stroke={isVoted ? "currentColor" : "currentColor"} />
        </span>
        <span className="vote-count">{voteCount}</span>
      </button>
    </div>
  );
};

export default VoteButton;
