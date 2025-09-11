import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabase';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // URL에서 인증 코드 추출
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const error = urlParams.get('error');

        if (error) {
          console.error('OAuth error:', error);
          router.push('/?error=oauth_error');
          return;
        }

        if (code) {
          // 인증 코드를 세션으로 교환
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          
          if (exchangeError) {
            console.error('Error exchanging code for session:', exchangeError);
            router.push('/?error=exchange_error');
            return;
          }

          if (data.session) {
            console.log('Successfully authenticated:', data.session);
            router.push('/');
          } else {
            router.push('/?error=no_session');
          }
        } else {
          // 코드가 없으면 메인 페이지로 리다이렉트
          router.push('/');
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        router.push('/?error=callback_error');
      }
    };

    handleAuthCallback();
  }, [router]);

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      fontSize: '18px'
    }}>
      인증 처리 중...
    </div>
  );
}