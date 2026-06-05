import { useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";

import Meta from "../../components/meta";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const timer = window.setTimeout(() => router.replace("/"), 1400);
    return () => window.clearTimeout(timer);
  }, [router]);

  return (
    <>
      <Meta title="DWMM | Sign-in removed" description="DWMM no longer uses a public login flow." />
      <div className="figma-page figma-page--auth-removed">
        <main className="figma-auth-removed">
          <p className="figma-eyebrow">Login removed</p>
          <h1>DWMM is a public workspace.</h1>
          <p>The public site no longer uses a Google sign-in flow. Returning to the design index.</p>
          <Link href="/">Go to DWMM</Link>
        </main>
      </div>
    </>
  );
}

AuthCallback.disableSiteShell = true;
