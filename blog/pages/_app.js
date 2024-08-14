import React from "react";
import "../styles/main.scss";
import { SpeedInsights } from "@vercel/speed-insights/next"

function MyApp({ Component, pageProps }) {
  return (
      <Component {...pageProps} />
      <SpeedInsights />
  );
}

export default MyApp;
