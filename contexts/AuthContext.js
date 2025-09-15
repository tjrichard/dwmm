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
  const [session, setSession] = useState(null);

  useEffect(() => {
    // Get initial session with better error handling
    const getInitialSession = async () => {
      try {
        console.log('🔍 Getting initial session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Error getting initial session:', error);
          setUser(null);
          setSession(null);
        } else {
          console.log('✅ Initial session retrieved:', session ? 'authenticated' : 'not authenticated');
          setUser(session?.user ?? null);
          setSession(session);
        }
      } catch (error) {
        console.error('❌ Exception getting initial session:', error);
        setUser(null);
        setSession(null);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes with enhanced logging
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state change:', event, session ? 'authenticated' : 'not authenticated');
        
        try {
          setUser(session?.user ?? null);
          setSession(session);
          
          // Additional session validation
          if (session) {
            console.log('✅ User authenticated:', {
              id: session.user.id,
              email: session.user.email,
              is_anonymous: session.user.is_anonymous
            });
          } else {
            console.log('❌ User not authenticated');
          }
        } catch (error) {
          console.error('❌ Error handling auth state change:', error);
          setUser(null);
          setSession(null);
        } finally {
          setLoading(false);
        }
      }
    );

    return () => {
      console.log('🧹 Cleaning up auth subscription');
      subscription.unsubscribe();
    };
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
        setSignInLoading(false);
        throw new Error('Google GSI library not available');
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


  const signOut = async () => {
    try {
      console.log('🚪 Signing out user...');
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('❌ Error signing out:', error);
        throw error;
      }
      console.log('✅ User signed out successfully');
    } catch (error) {
      console.error('❌ Sign out error:', error);
      throw error;
    }
  };

  // Session validation helper
  const validateSession = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error('❌ Session validation error:', error);
        return false;
      }
      
      if (session) {
        console.log('✅ Session is valid');
        return true;
      } else {
        console.log('❌ No valid session found');
        return false;
      }
    } catch (error) {
      console.error('❌ Exception during session validation:', error);
      return false;
    }
  };

  const value = {
    user,
    session,
    loading,
    signInLoading,
    setSignInLoading,
    signInWithGoogle,
    signOut,
    validateSession,
    isAuthenticated: !!user && !user.is_anonymous,
    isAnonymous: !!user && user.is_anonymous
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
