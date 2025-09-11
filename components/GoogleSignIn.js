import { useEffect, useContext } from 'react';
import { supabase } from '../lib/supabase';
import { AuthContext } from '../contexts/AuthContext';

export default function GoogleSignIn() {
  const { setSignInLoading } = useContext(AuthContext);

  useEffect(() => {
    // 클라이언트사이드에서만 실행
    if (typeof window === 'undefined') return;

    // Google Sign-In 콜백 함수 (전역 스코프에 있어야 함)
    window.handleSignInWithGoogle = async (response) => {
      try {
        console.log('Google sign-in response received:', response);
        
        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: response.credential,
        });

        if (error) {
          console.error('Error signing in with Google:', error);
          setSignInLoading(false);
          throw error;
        }

        console.log('Successfully signed in with Google:', data);
        setSignInLoading(false);
      } catch (error) {
        console.error('Sign in error:', error);
        setSignInLoading(false);
        
        // FedCM 관련 에러인지 확인하고 전역 이벤트 발생
        if (error.message && error.message.includes('FedCM')) {
          window.dispatchEvent(new CustomEvent('fedcm-error', { 
            detail: { error: error.message } 
          }));
        }
      }
    };

    // Google GSI 초기화는 Header.js에서 담당하므로 여기서는 콜백 함수만 설정
    console.log('GoogleSignIn component mounted - callback function ready');

    return () => {
      if (typeof window !== 'undefined') {
        // 전역 함수 정리
        delete window.handleSignInWithGoogle;
      }
    };
  }, []);

  return null; // 이 컴포넌트는 UI를 렌더링하지 않음
}
