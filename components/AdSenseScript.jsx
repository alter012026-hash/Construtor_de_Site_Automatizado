"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

export default function AdSenseScript({ enabled, publisherId = "" }) {
  const pathname = usePathname();

  useEffect(() => {
    const isAdminRoute = pathname === "/admin" || pathname.startsWith("/admin/");
    const scriptId = "google-adsense-script";
    const existingScript = document.getElementById(scriptId);
    const activePublisherId = publisherId.trim();

    if (
      isAdminRoute ||
      !enabled ||
      !activePublisherId ||
      activePublisherId === "ca-pub-XXXXXXXXXXXXXXXX"
    ) {
      existingScript?.remove();
      return;
    }

    if (existingScript) return;

    const script = document.createElement("script");
    script.id = scriptId;
    script.async = true;
    script.crossOrigin = "anonymous";
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${activePublisherId}`;
    document.head.appendChild(script);

    return () => {
      script.remove();
    };
  }, [pathname, enabled, publisherId]);

  return null;
}
