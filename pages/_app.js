import React, { useEffect } from "react";
import "../styles/main.scss";
import 'highlight.js/styles/github-dark.css'; // Import Highlight.js theme

function MyApp({ Component, pageProps }) {
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_TEMPO) {
      TempoDevtools.init();
    }
  }, []);

  return <Component {...pageProps} />;
}

export default MyApp;
