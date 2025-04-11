import React, { useEffect } from "react";
// import { TempoDevtools } from "tempo-devtools";
import "../styles/main.scss";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { ensureAuthenticated, checkUserStatus } from "../lib/auth";
import { useRouter } from "next/router";

function MyApp({ Component, pageProps }) {
  const router = useRouter();
  const isBookmarksPage = router.pathname.startsWith('/bookmarks');

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_TEMPO) {
      TempoDevtools.init();
    }

    // Ensure user is authenticated and log user status
    const initAuth = async () => {
      await ensureAuthenticated();
      await checkUserStatus();
    };

    initAuth();
  }, []);

  return (
    <>
      {!isBookmarksPage && <Header />}
      <Component {...pageProps} />
      {!isBookmarksPage && <Footer />}
    </>
  );
}

export default MyApp;
