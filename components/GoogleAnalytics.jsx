"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { readConsentFromDocument } from "../lib/consent";

function configureAnalytics(measurementId) {
  if (!measurementId || readConsentFromDocument() !== "accepted") return false;
  if (document.querySelector(`script[data-google-analytics="${measurementId}"]`)) return true;

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    window.dataLayer.push(arguments);
  };
  window.gtag("js", new Date());
  window.gtag("config", measurementId, { send_page_view: false, cookie_domain: "none" });

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
  script.dataset.googleAnalytics = measurementId;
  document.head.appendChild(script);
  return true;
}

function stopAnalytics() {
  document.querySelectorAll("script[data-google-analytics]").forEach((script) => script.remove());
  for (const cookie of document.cookie.split(";")) {
    const name = cookie.split("=", 1)[0].trim();
    if (name.startsWith("_ga")) {
      document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax`;
    }
  }
  window.gtag = undefined;
  window.dataLayer = [];
}

export default function GoogleAnalytics({ measurementId }) {
  const pathname = usePathname();

  useEffect(() => {
    const trackPageView = () => {
      if (configureAnalytics(measurementId)) {
        window.gtag("event", "page_view", {
          page_path: `${window.location.pathname}${window.location.search}`,
        });
      }
    };
    const handleConsent = (event) => {
      if (event.detail?.choice === "accepted") trackPageView();
      else if (event.detail?.choice === "rejected") stopAnalytics();
    };

    if (readConsentFromDocument() === "accepted") trackPageView();
    window.addEventListener("pj:consent", handleConsent);
    return () => window.removeEventListener("pj:consent", handleConsent);
  }, [measurementId, pathname]);

  return null;
}
