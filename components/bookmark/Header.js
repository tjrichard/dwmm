import React, { useState, useEffect } from "react";
import Link from "next/link";
import WebsiteRequestForm from "./WebsiteRequestForm.js";
import { X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';


function BookmarkHeader() {
  const [showModal, setShowModal] = useState(false);
  const [googleButtonLoaded, setGoogleButtonLoaded] = useState(false);
  const [googleButtonError, setGoogleButtonError] = useState(false);
  const { user, signInWithGoogle, signOut, isAuthenticated, isAnonymous, signInLoading } = useAuth();

  const openModal = () => {
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  const handleSignOut = async () => {
    try {
      console.log('🚪 Header: Starting sign out process...');
      await signOut();
      console.log('✅ Header: Sign out completed successfully');
    } catch (error) {
      console.error('❌ Header: Sign out failed:', error);
    }
  };

  const handleCustomSignIn = async () => {
    try {
      console.log('🔐 Header: Starting custom Google sign in...');
      await signInWithGoogle();
      console.log('✅ Header: Custom Google sign in initiated');
    } catch (error) {
      console.error('❌ Header: Custom sign in failed:', error);
    }
  };

  useEffect(() => {
    // Google pre-built 방식에서는 자동 초기화되므로 간단한 로드 확인만 수행
    const checkGoogleLoaded = () => {
      if (typeof window !== 'undefined' && window.google && window.google.accounts && window.google.accounts.id) {
        console.log('✅ Header: Google GSI loaded and ready for pre-built buttons');
        setGoogleButtonLoaded(true);
        setGoogleButtonError(false);
      } else {
        console.log('⏳ Header: Google GSI not ready, retrying in 100ms...');
        setTimeout(checkGoogleLoaded, 100);
      }
    };

    // 스크립트 로드 완료 이벤트 리스너
    const handleGoogleLoaded = () => {
      console.log('📜 Header: Google script loaded event received');
      checkGoogleLoaded();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('google-loaded', handleGoogleLoaded);
      
      // 이미 로드되어 있다면 즉시 확인
      if (window.google && window.google.accounts) {
        checkGoogleLoaded();
      }
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('google-loaded', handleGoogleLoaded);
      }
    };
  }, []);

  return (
    <>
      <div className="bookmark-header-container">
        <div className="bookmark-header">
          <Link href="/" className="logo-link cursor-pointer">
            <img src="/logo.svg" className="dwmm-logo" alt="logo" />
          </Link>
          <div className="bookmark-buttons">
            {isAuthenticated ? (
              <button className="button s tertiary cursor-pointer" onClick={handleSignOut}>
                Log out
              </button>
            ) : (
              <>
                {/* Google pre-built 로그인 버튼 */}
                <div 
                  id="g_id_onload"
                  data-client_id="101631927675-8nath7oncb52rlitu07h7dknhsqklm2c.apps.googleusercontent.com"
                  data-context="signin"
                  data-ux_mode="popup"
                  data-callback="handleSignInWithGoogle"
                  data-login_uri="http://localhost:3000"
                  data-auto_select="true"
                  data-itp_support="true"
                  data-use_fedcm_for_prompt="true"
                  style={{ display: 'none' }}
                ></div>

                <div 
                  className="g_id_signin"
                  data-type="icon"
                  data-shape="square"
                  data-theme="outline"
                  data-text="continue_with"
                  data-size="small"
                  style={{ 
                    display: (googleButtonLoaded && !googleButtonError) ? 'inline-block' : 'none'
                  }}
                ></div>

                {/* 폴백 버튼 - Google GSI 로드 실패 시에만 표시 */}
                {(!googleButtonLoaded || googleButtonError) && (
                  <button 
                    className="button s tertiary cursor-pointer google-fallback-btn" 
                    onClick={handleCustomSignIn}
                  >
                    Sign in with Google
                  </button>
                )}
              </>
            )}
            <button className="button s tertiary cursor-pointer" onClick={openModal}>Suggest</button>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal}><X /></button>
            <WebsiteRequestForm onComplete={closeModal} fromSuggest={true} />
          </div>
        </div>
      )}
    </>
  );
}

export default BookmarkHeader;
