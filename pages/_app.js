import React, { useEffect } from "react";
import "../styles/main.scss";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { ensureAuthenticated, checkUserStatus } from "../lib/auth";
import { useRouter } from "next/router";

function MyApp({ Component, pageProps }) {
  const router = useRouter();
  const isPortfolioPage = router.pathname.startsWith('/portfolio');

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
    <>
      {isPortfolioPage && <Header />}
      <Component {...pageProps} />
      {isPortfolioPage && <Footer />}
    </>
  );
}

export default MyApp;