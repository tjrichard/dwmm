import { useEffect } from 'react';

export default function GoogleScript() {
  useEffect(() => {
    // 클라이언트사이드에서만 실행
    if (typeof window === 'undefined') return;

    // Google GSI 스크립트가 이미 로드되었는지 확인
    if (document.querySelector('script[src*="accounts.google.com/gsi/client"]')) {
      console.log('Google GSI script already loaded');
      // 이미 로드되어 있다면 이벤트 발생
      setTimeout(() => {
        window.dispatchEvent(new Event('google-loaded'));
      }, 100);
      return;
    }

    console.log('Loading Google GSI script...');
    
    // Google GSI 스크립트 로드
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      console.log('Google GSI script loaded successfully');
      // 스크립트 로드 완료 이벤트 발생
      setTimeout(() => {
        window.dispatchEvent(new Event('google-loaded'));
      }, 100);
    };

    script.onerror = () => {
      console.error('Failed to load Google GSI script');
    };

    document.head.appendChild(script);

    return () => {
      // 컴포넌트 언마운트 시 스크립트 제거
      const existingScript = document.querySelector('script[src*="accounts.google.com/gsi/client"]');
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, []);

  return null;
}
