import { getRegisteredSites, getSitePublicUrl } from "../lib/site-registry";

export default function sitemap() {
  const hubUrl = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
  const sites = getRegisteredSites({ includeInactive: false });
  return [
    { url: hubUrl, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${hubUrl}/guias`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    ...sites.map((site) => ({
      url: getSitePublicUrl(site),
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    })),
  ];
}