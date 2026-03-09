import React, { useEffect } from "react";
import "../styles/main.scss";
import Header from "../components/header";
import Footer from "../components/footer";
import { ensureAuthenticated, checkUserStatus } from "../lib/auth";
import { useRouter } from "next/router";
import { AuthProvider } from "../contexts/AuthContext";
import GoogleScript from "../components/GoogleScript";
import GoogleSignIn from "../components/GoogleSignIn";
import 'highlight.js/styles/github-dark.css'; // Import Highlight.js theme

function MyApp({ Component, pageProps }) {
  const router = useRouter();
  const isWorksPage = router.pathname.startsWith('/works');
  const isHubPage = router.pathname === '/';
  const shouldShowGlobalChrome = isWorksPage || isHubPage;

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_TEMPO) {
      TempoDevtools.init();
    }

    const initAuth = async () => {
      await ensureAuthenticated();
      await checkUserStatus();
    };

    initAuth();
  }, []);

  return (
    <AuthProvider>
      <GoogleScript />
      <GoogleSignIn />
      {shouldShowGlobalChrome && <Header />}
      <Component {...pageProps} />
      {shouldShowGlobalChrome && <Footer />}
    </AuthProvider>
  );
}

export default MyApp;