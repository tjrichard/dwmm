import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { getCurrentUser } from "../lib/auth";

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
    <button
      className={`vote-button ${isVoted ? "voted" : ""} ${isLoading ? "loading" : ""}`}
      onClick={handleVote}
      disabled={isLoading}
      aria-label={isVoted ? "Remove vote" : "Vote for this content"}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M10 1L13 7L19 8L14.5 13L15.5 19L10 16L4.5 19L5.5 13L1 8L7 7L10 1Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill={isVoted ? "currentColor" : "none"}
        />
      </svg>
      <span>{voteCount.toLocaleString()}</span>
    </button>
  );
};

export default VoteButton;
