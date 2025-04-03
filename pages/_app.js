import React, { useEffect } from "react";
// import { TempoDevtools } from "tempo-devtools";
import "../styles/main.scss";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { ensureAuthenticated } from "../lib/auth";
import { useRouter } from "next/router";

function MyApp({ Component, pageProps }) {
  const router = useRouter();
  const isBookmarksPage = router.pathname.startsWith('/bookmarks');

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_TEMPO) {
      TempoDevtools.init();
    }

    // Ensure user is authenticated on app load
    const initAuth = async () => {
      await ensureAuthenticated();
      const { user } = await import("../lib/auth").then((module) =>
        module.getCurrentUser(),
      );
      console.log("Current Supabase User ID:", user?.id);
    };

    initAuth();
  }, []);

  return (
    <>
      {!isBookmarksPage && <Header />}
      <Component {...pageProps} />
      <Footer />
    </>
  );
}

export default MyApp;
