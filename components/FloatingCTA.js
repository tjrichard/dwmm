import React, { useState, useEffect } from "react";
import WebsiteRequestForm from "./WebsiteRequestForm";

const ThankYouBubble = ({ onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000); // Auto close after 3 seconds

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="thank-you-bubble animate-fade-in">
      <div className="thank-you-bubble-content">
        <div className="thank-you-icon">✓</div>
        <p>Thank you for your submission!</p>
      </div>
    </div>
  );
};

const FloatingCTA = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const toggleForm = () => {
    if (isOpen) {
      closeForm();
    } else {
      setIsOpen(true);
      setShowThankYou(false);
    }
  };

  const closeForm = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
    }, 300); // Match this with the CSS animation duration
  };

  const handleSubmit = (data) => {
    // Show thank you bubble instead of immediately closing
    setShowThankYou(true);
    closeForm();
  };

  const handleThankYouClose = () => {
    setShowThankYou(false);
  };

  return (
    <div className="floating-cta-container">
      {showThankYou && <ThankYouBubble onClose={handleThankYouClose} />}

      {isOpen && (
        <div
          className={`floating-form-container ${isClosing ? "animate-fade-out" : "animate-fade-in"}`}
        >
          <button className="close-button" onClick={toggleForm}>
            &times;
          </button>
          <WebsiteRequestForm onSubmit={handleSubmit} />
        </div>
      )}

      <button
        className="floating-cta-button"
        onClick={toggleForm}
        aria-label="Suggest a resource"
      >
        {isOpen ? "×" : "+"}
      </button>
    </div>
  );
};

export default FloatingCTA;
