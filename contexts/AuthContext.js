import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [signInLoading, setSignInLoading] = useState(false);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      setSignInLoading(true);
      
      // 클라이언트사이드에서만 실행
      if (typeof window === 'undefined') {
        throw new Error('Google sign-in is only available on the client side');
      }

      // Google GSI 라이브러리가 로드되었는지 확인
      if (!window.google || !window.google.accounts || !window.google.accounts.id) {
        console.error('Google GSI library not loaded');
        // GSI가 로드되지 않았다면 직접 OAuth URL로 리다이렉트
        const clientId = '101631927675-8nath7oncb52rlitu07h7dknhsqklm2c.apps.googleusercontent.com';
        const redirectUri = encodeURIComponent('http://localhost:3002/auth/callback');
        const scope = encodeURIComponent('openid email profile');
        const responseType = 'code';
        const state = 'google_oauth';
        
        const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&response_type=${responseType}&state=${state}`;
        
        console.log('Redirecting to Google OAuth:', authUrl);
        window.location.href = authUrl;
        return;
      }

      // Google GSI prompt를 직접 호출
      console.log('Attempting Google sign-in with GSI...');
      window.google.accounts.id.prompt();
      
    } catch (error) {
      console.error('Sign in error:', error);
      setSignInLoading(false);
      throw error;
    }
  };

  const signInWithGooglePopup = async () => {
    try {
      // Google GSI의 prompt를 직접 호출
      // FedCM이 비활성화되어 있어도 Google이 자동으로 팝업 방식으로 전환
      console.log('Attempting Google sign-in with popup fallback...');
      window.google.accounts.id.prompt();
      
    } catch (error) {
      console.error('Popup sign in error:', error);
      setSignInLoading(false);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out:', error);
        throw error;
      }
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    signInLoading,
    setSignInLoading,
    signInWithGoogle,
    signOut,
    isAuthenticated: !!user && !user.is_anonymous,
    isAnonymous: !!user && user.is_anonymous
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
