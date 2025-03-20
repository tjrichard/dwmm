import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

const VoteButton = ({
  contentId,
  initialVoteCount = 0,
  initialVoted = false,
  userHasVoted = false,
}) => {
  const [voteCount, setVoteCount] = useState(initialVoteCount);
  const [isVoted, setIsVoted] = useState(userHasVoted || initialVoted);
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState(null);

  // Only fetch user when the vote button is clicked and we don't have a userId yet
  const ensureUser = async () => {
    if (userId) return userId; // Return existing userId if we already have it

    try {
      // Check if user is already signed in
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        // Sign in anonymously if no user exists
        const { data, error } = await supabase.auth.signInAnonymously();
        if (error) {
          console.error("Error signing in anonymously:", error);
          return null;
        }
        setUserId(data.user.id);
        return data.user.id;
      } else {
        setUserId(user.id);
        return user.id;
      }
    } catch (err) {
      console.error("Exception during authentication:", err);
      return null;
    }
  };

  // We rely on the userHasVoted prop passed from parent instead of querying individually
  useEffect(() => {
    setIsVoted(userHasVoted || initialVoted);
  }, [userHasVoted, initialVoted]);

  const handleVote = async () => {
    if (isLoading) return;
    setIsLoading(true);

    // Only get user when vote button is clicked
    const currentUserId = await ensureUser();
    if (!currentUserId) {
      setIsLoading(false);
      return;
    }

    try {
      if (isVoted) {
        // Remove vote
        const { error } = await supabase
          .from("vote")
          .delete()
          .eq("website_id", contentId)
          .eq("user_id", currentUserId);

        if (error) {
          console.error("Error removing vote:", error);
          throw error;
        }

        // Update UI optimistically
        setVoteCount((prev) => Math.max(0, prev - 1));
        setIsVoted(false);
      } else {
        // Add vote
        const { error } = await supabase
          .from("vote")
          .insert([{ website_id: contentId, user_id: currentUserId }]);

        if (error) {
          console.error("Error adding vote:", error);
          throw error;
        }

        // Update UI optimistically
        setVoteCount((prev) => prev + 1);
        setIsVoted(true);
      }
    } catch (error) {
      console.error("Error toggling vote:", error);
      // Revert optimistic update if there was an error
      if (isVoted) {
        setVoteCount((prev) => prev + 1);
      } else {
        setVoteCount((prev) => Math.max(0, prev - 1));
      }
      setIsVoted(!isVoted);
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
        <span className="vote-icon">{isVoted ? "★" : "☆"}</span>
        <span className="vote-count">{voteCount}</span>
      </button>
    </div>
  );
};

export default VoteButton;
