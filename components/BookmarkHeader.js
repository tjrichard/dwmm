import React, { useState } from "react";
import Link from "next/link";
import WebsiteRequestForm from "./WebsiteRequestForm";

function BookmarkHeader() {
  const [showModal, setShowModal] = useState(false);

  const openModal = () => {
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  return (
    <>
      <div className="bookmark-header-container">
        <div className="bookmark-header">
          <Link href="/" className="logo-link cursor-pointer">
            <img src="/logo.svg" className="dwmm-logo" alt="logo" />
          </Link>
          <div className="bookmark-buttons">
            <button className="button s tertiary cursor-pointer" onClick={openModal}>Suggest</button>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal}>×</button>
            <WebsiteRequestForm onComplete={closeModal} fromSuggest={true} />
          </div>
        </div>
      )}
    </>
  );
}

export default BookmarkHeader;