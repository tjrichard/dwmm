import React, { useState } from "react";
import { supabase } from "../lib/supabase";

const SubscribeForm = () => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      setMessage("Please enter your email address");
      return;
    }

    setIsSubmitting(true);

    try {
      // First, handle user identification
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // If user is anonymous, update with email to identify them
      if (user && user.app_metadata?.provider === "anonymous") {
        const { error: updateError } = await supabase.auth.updateUser({
          email,
        });

        if (updateError) {
          console.error("Error updating user with email:", updateError);
        }
      }

      // Add to subscribers table
      const { error } = await supabase
        .from("subscribers")
        .insert([{ email, subscribed_at: new Date() }]);

      if (error) {
        if (error.code === "23505") {
          // Unique violation
          setMessage("You are already subscribed!");
        } else {
          throw error;
        }
      } else {
        setIsSuccess(true);
        setMessage("Thank you for subscribing!");
        setEmail("");
      }
    } catch (error) {
      console.error("Error subscribing:", error);
      setMessage("Error subscribing. Please try again.");
      setIsSuccess(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="subscribe-form-container">
      <h2>Stay Updated</h2>
      <p>Subscribe to receive new design resources in your inbox</p>

      <form onSubmit={handleSubmit} className="subscribe-form">
        <div className="form-input-group">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Your email address"
            disabled={isSubmitting || isSuccess}
          />
          <button
            type="submit"
            className="button primary"
            disabled={isSubmitting || isSuccess}
          >
            {isSubmitting ? "Subscribing..." : "Subscribe"}
          </button>
        </div>

        {message && (
          <div className={`message ${isSuccess ? "success" : "error"}`}>
            {message}
          </div>
        )}
      </form>
    </div>
  );
};

export default SubscribeForm;
