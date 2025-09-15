import { useEffect, useContext } from 'react';
import { supabase } from '../lib/supabase';
import { AuthContext } from '../contexts/AuthContext';

export default function GoogleSignIn() {
  const { setSignInLoading } = useContext(AuthContext);

  useEffect(() => {
    // 클라이언트사이드에서만 실행
    if (typeof window === 'undefined') return;

    // Google ID 토큰 디코딩 함수
    const decodeGoogleIdToken = (token) => {
      try {
        // JWT 토큰은 base64url로 인코딩된 3개 부분으로 구성: header.payload.signature
        const parts = token.split('.');
        if (parts.length !== 3) {
          throw new Error('Invalid JWT token format');
        }
        
        // payload 부분 디코딩 (base64url)
        const payload = parts[1];
        // base64url을 base64로 변환 (padding 추가)
        const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
        const padded = base64 + '='.repeat((4 - base64.length % 4) % 4);
        
        const decodedPayload = JSON.parse(atob(padded));
        console.log('🔍 Decoded Google ID token payload:', decodedPayload);
        
        return {
          email: decodedPayload.email,
          name: decodedPayload.name,
          picture: decodedPayload.picture,
          given_name: decodedPayload.given_name,
          family_name: decodedPayload.family_name,
          sub: decodedPayload.sub
        };
      } catch (error) {
        console.error('❌ Error decoding Google ID token:', error);
        return null;
      }
    };

    // Google Sign-In 콜백 함수 (전역 스코프에 있어야 함)
    window.handleSignInWithGoogle = async (response) => {
      try {
        console.log('🔐 Google sign-in response received:', response);
        setSignInLoading(true);
        
        // Google ID 토큰에서 사용자 정보 추출
        const userInfo = decodeGoogleIdToken(response.credential);
        if (!userInfo) {
          throw new Error('Failed to decode Google ID token');
        }
        
        console.log('👤 Extracted user info from Google token:', userInfo);
        
        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: response.credential,
          options: {
            data: {
              name: userInfo.name,
              full_name: userInfo.name,
              given_name: userInfo.given_name,
              family_name: userInfo.family_name,
              picture: userInfo.picture,
              avatar_url: userInfo.picture,
              email: userInfo.email
            }
          }
        });

        if (error) {
          console.error('❌ Error signing in with Google:', error);
          setSignInLoading(false);
          throw error;
        }

        console.log('✅ Successfully signed in with Google:', {
          user: data.user ? {
            id: data.user.id,
            email: data.user.email,
            is_anonymous: data.user.is_anonymous,
            raw_user_meta_data: data.user.raw_user_meta_data
          } : 'no user data',
          session: data.session ? 'session created' : 'no session'
        });
        
        setSignInLoading(false);
        
        // 성공 이벤트 발생
        window.dispatchEvent(new CustomEvent('google-signin-success', { 
          detail: { user: data.user, session: data.session, extractedInfo: userInfo } 
        }));
        
      } catch (error) {
        console.error('❌ Sign in error:', error);
        setSignInLoading(false);
        
        // FedCM 관련 에러인지 확인하고 전역 이벤트 발생
        if (error.message && error.message.includes('FedCM')) {
          console.log('⚠️ FedCM error detected, dispatching event');
          window.dispatchEvent(new CustomEvent('fedcm-error', { 
            detail: { error: error.message } 
          }));
        }
        
        // 일반 에러 이벤트 발생
        window.dispatchEvent(new CustomEvent('google-signin-error', { 
          detail: { error: error.message } 
        }));
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
