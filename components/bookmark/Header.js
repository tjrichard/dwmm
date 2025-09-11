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
      await signOut();
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  const handleCustomSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Custom sign in failed:', error);
    }
  };

  useEffect(() => {
    // Google GSI 초기화를 지연시켜서 스크립트가 완전히 로드된 후 실행
    const initializeGoogle = () => {
      if (typeof window !== 'undefined' && window.google && window.google.accounts && window.google.accounts.id) {
        try {
          console.log('Initializing Google GSI...');
          
          // 이미 초기화되었는지 확인
          if (window.google.accounts.id._initialized) {
            console.log('Google GSI already initialized');
            renderGoogleButton();
            return;
          }

          window.google.accounts.id.initialize({
            client_id: '101631927675-8nath7oncb52rlitu07h7dknhsqklm2c.apps.googleusercontent.com',
            callback: 'handleSignInWithGoogle',
            context: 'signup',
            ux_mode: 'popup', // redirect 대신 popup 사용
            itp_support: true,
            auto_select: false,
            cancel_on_tap_outside: true
          });
          
          console.log('Google GSI initialized successfully');
          renderGoogleButton();
        } catch (error) {
          console.error('Error initializing Google GSI:', error);
          setGoogleButtonError(true);
        }
      } else {
        console.log('Google GSI not ready, retrying in 100ms...');
        setTimeout(initializeGoogle, 100);
      }
    };

    // Google 버튼을 명시적으로 렌더링
    const renderGoogleButton = () => {
      try {
        const buttonElement = document.getElementById('google-signin-button');
        if (buttonElement && window.google && window.google.accounts && window.google.accounts.id) {
          window.google.accounts.id.renderButton(buttonElement, {
            type: 'standard',
            shape: 'rectangular',
            theme: 'filled_black',
            text: 'continue_with',
            size: 'medium',
            logo_alignment: 'left'
          });
          console.log('Google button rendered successfully');
          setGoogleButtonLoaded(true);
          setGoogleButtonError(false);
        } else {
          console.warn('Button element not found or Google GSI not ready');
          setGoogleButtonError(true);
        }
      } catch (error) {
        console.error('Error rendering Google button:', error);
        setGoogleButtonError(true);
      }
    };

    // 스크립트 로드 완료 이벤트 리스너
    const handleGoogleLoaded = () => {
      console.log('Google script loaded event received');
      initializeGoogle();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('google-loaded', handleGoogleLoaded);
      
      // 이미 로드되어 있다면 즉시 초기화
      if (window.google && window.google.accounts) {
        initializeGoogle();
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
                <div 
                  id="google-signin-button"
                  style={{ 
                    display: (googleButtonLoaded && !googleButtonError) ? 'inline-block' : 'none',
                    height: '32px',
                    minWidth: '120px'
                  }}
                ></div>
                {(!googleButtonLoaded || googleButtonError) && (
                  <button 
                    className="button s tertiary cursor-pointer" 
                    onClick={handleCustomSignIn}
                    style={{
                      display: 'inline-block',
                      height: '32px',
                      minWidth: '120px',
                      backgroundColor: '#4285f4',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}
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
