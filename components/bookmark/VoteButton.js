import React, { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { getCurrentUser } from "../../lib/auth";
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
      const { user, error: userError } = await getCurrentUser();
      if (!user || userError) {
        console.error("Error getting user:", userError);
        return;
      }

      if (isVoted) {
        const { error } = await supabase
          .from("votes")
          .delete()
          .eq("website_id", contentId)
          .eq("user_id", user.id);

        if (error) {
          console.error("Error removing vote:", error);
          throw error;
        }

        setVoteCount((prev) => Math.max(0, prev - 1));
        setIsVoted(false);
      } else {
        const { error } = await supabase
          .from("votes")
          .insert([{ website_id: contentId, user_id: user.id }]);

        if (error) {
          console.error("Error adding vote:", error);
          throw error;
        }

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
