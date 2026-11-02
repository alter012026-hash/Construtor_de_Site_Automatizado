import { getRegisteredSite, getRegisteredSites, getSitePublicUrl } from "../../../lib/site-registry";

export function generateStaticParams() {
  return getRegisteredSites({ includeInactive: false }).map(({ slug }) => ({ siteSlug: slug }));
}

export async function generateMetadata({ params }) {
  const { siteSlug } = await params;
  const site = getRegisteredSite(siteSlug, { includeInactive: false });
  return site ? { metadataBase: new URL(getSitePublicUrl(site)) } : {};
}

export default async function robots({ params }) {
  const { siteSlug } = await params;
  const site = getRegisteredSite(siteSlug, { includeInactive: false });
  if (!site) return { rules: { userAgent: "*", disallow: "/" } };
  const siteUrl = getSitePublicUrl(site);
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/admin"] },
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
