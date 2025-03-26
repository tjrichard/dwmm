import React, { useState } from "react";
import { supabase } from "../lib/supabase";
import { GoogleGenerativeAI } from '@google/generative-ai'

const ThankYouComponent = ({ onAddNew }) => {
  return (
    <div className="thank-you-container animate-fade-in">
      <div className="thank-you-icon">✓</div>
      <h3>Thank You!</h3>
      <p>Your resource has been submitted successfully.</p>
      <p>We'll review it shortly and add it to our collection.</p>
      <button onClick={onAddNew} className="button primary">
        Add a new request
      </button>
    </div>
  );
};

const geminiApiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY

const genAI = new GoogleGenerativeAI(geminiApiKey)

const model = genAI.getGenerativeModel({
  model: 'gemini-2.0-flash',
  systemInstruction: 'Analyze the provided input and generate a structured output. Instructions: 1. Title: Use the given title directly unless it is too descriptive. If needed, infer a concise and noun-based title. 2. Description: Summarize the provided description and htmlContents to create a concise and informative description. Ensure clarity and relevance. Then add relevant meta keywords that would be useful for search. Provide keywords in both Korean and English, considering possible typos and include as many as possible. Separate each keyword with a comma. 3. Category: Determine the most suitable category from the following: "AI", "Collection", "Website", "Article", "Service", "Book". If the content curates multiple resources, classify it as "Collection". 4. Tags: Extract 3 to 5 relevant tags based on the provided keywords, description, and htmlContents. Ensure tags are useful for search and discovery.',
})

const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192,
  responseMimeType: 'application/json',
  responseSchema: {
    type: 'object',
    properties: {
      title: { type: 'string' },
      description: { type: 'string' },
      category: {
        type: 'string',
        enum: ['AI', 'Collection', 'Website', 'Article', 'Service', 'Book'],
      },
      tags: {
        type: 'array',
        items: { type: 'string' },
      },
      original_link: { type: 'string' },
      created_at: { type: 'string' },
    },
    required: ['title', 'category', 'original_link'],
  },
}

function WebsiteRequestFormGemini() {
  const [url, setUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [message, setMessage] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    if (!url) {
      setHasError(true)
      setMessage('URL is required')
      return
    }

    setIsLoading(true)
    setHasError(false)
    setMessage('')

    try {
      const chatSession = model.startChat({ generationConfig, history: [] })
      const result = await chatSession.sendMessage(url)
      const response = JSON.parse(result.response.text())

      const { title, description, category, tags, original_link, created_at } = response

      const { data, error } = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, category, tags, original_link, created_at, url }),
      }).then(res => res.json())

      if (error) throw new Error(error.message)

      setMessage('Data inserted successfully')
    } catch (error) {
      console.error('Error:', error)
      setHasError(true)
      setMessage('Internal Server Error')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="url"
        value={url}
        onChange={e => setUrl(e.target.value)}
        placeholder="Enter website URL"
        required
      />
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Submitting...' : 'Submit'}
      </button>
      {message && <p>{message}</p>}
    </form>
  )
}

const WebsiteRequestForm = ({ onSubmit }) => {
  const [url, setUrl] = useState("");
  const [email, setEmail] = useState("");
  const [subscribeConsent, setSubscribeConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);

  // Extract domain name from URL for title suggestion
  const extractDomainName = (url) => {
    try {
      const domain = new URL(url).hostname.replace("www.", "");
      return (
        domain.split(".")[0].charAt(0).toUpperCase() +
        domain.split(".")[0].slice(1)
      );
    } catch (e) {
      return "";
    }
  };

  const resetForm = () => {
    setUrl("");
    setEmail("");
    setSubscribeConsent(false);
    setMessage("");
    setIsSuccess(false);
    setShowThankYou(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setIsSuccess(false);

    if (!url) {
      setMessage("Please enter a valid URL");
      return;
    }

    if (!email) {
      setMessage("Please enter your email address");
      return;
    }

    setIsSubmitting(true);

    try {
      // Handle user identification if they provided an email
      let userId = null;

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // If user is anonymous and provided email with consent to subscribe
      if (
        user &&
        user.app_metadata?.provider === "anonymous" &&
        subscribeConsent
      ) {
        // Convert anonymous user to identified user
        const { error: updateError } = await supabase.auth.updateUser({
          email,
        });

        if (updateError) {
          console.error("Error updating user with email:", updateError);
        } else {
          // Also add to subscribers table if they consented
          await supabase
            .from("subscribers")
            .insert([{ email, subscribed_at: new Date() }])
            .single();
        }
      }

      userId = user?.id;

      // Create the request object with fields that match the table schema
      const newRequest = {
        original_link: url,
        title: extractDomainName(url) || "New Resource",
        description: `A resource submitted by a user`,
        category: "Website", // Default category
        tags: ["User Submitted"], // Default tag
        public: false, // Requests start as non-public until approved
        user_email: email, // Store the email with the request
        user_id: userId, // Store the user ID if available
      };

      console.log("Submitting bookmark:", newRequest);

      const { data, error } = await supabase
        .from("bookmarks")
        .insert([newRequest])
        .select();

      if (error) {
        console.error("Supabase error details:", error);
        throw error;
      }

      console.log("Submission successful:", data);
      setIsSuccess(true);
      setMessage("Thank you for your submission!");
      setShowThankYou(true);

      if (onSubmit && data) {
        onSubmit(data[0] || newRequest);
      }
    } catch (error) {
      console.error("Error submitting request:", error);
      let errorMessage = "Error submitting your request. ";

      if (error.code === "23505") {
        errorMessage += "This resource has already been submitted.";
      } else if (error.code === "23502") {
        errorMessage += "Missing required fields.";
      } else if (error.message) {
        errorMessage += error.message;
      } else {
        errorMessage += "Please try again.";
      }

      setMessage(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showThankYou) {
    return <ThankYouComponent onAddNew={resetForm} />;
  }

  return (
    <div className="website-request-form">
      <h3>Suggest a Resource</h3>
      {message && (
        <div className={`message ${isSuccess ? "success" : "error"}`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="url">Resource URL *</label>
          <input
            type="url"
            id="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">Your Email *</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
          />
        </div>

        <div className="form-group checkbox-group">
          <input
            type="checkbox"
            id="subscribeConsent"
            checked={subscribeConsent}
            onChange={(e) => setSubscribeConsent(e.target.checked)}
          />
          <label htmlFor="subscribeConsent">
            I agree to receive updates about new design resources
          </label>
        </div>

        <button
          type="submit"
          className="button primary"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Submitting..." : "Submit Resource"}
        </button>
      </form>
    </div>
  );
};

export default WebsiteRequestForm;
