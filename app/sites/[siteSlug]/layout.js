import { notFound } from "next/navigation";
import ManagedSiteShell from "../../../components/ManagedSiteShell";
import AdSenseScript from "../../../components/AdSenseScript";
import GoogleAnalytics from "../../../components/GoogleAnalytics";
import { getRegisteredSite, getRegisteredSites, getSitePublicUrl } from "../../../lib/site-registry";

const isVercelProduction = process.env.VERCEL === "1" && process.env.VERCEL_ENV === "production";

export function generateStaticParams() {
  return getRegisteredSites({ includeInactive: false }).map(({ slug }) => ({ siteSlug: slug }));
}

export async function generateMetadata({ params }) {
  const { siteSlug } = await params;
  const site = getRegisteredSite(siteSlug, { includeInactive: false });
  if (!site) return {};

  const siteUrl = getSitePublicUrl(site);
  return {
    title: { default: site.profile.name, template: `%s | ${site.profile.name}` },
    description: site.profile.description,
    keywords: site.profile.keywords,
    authors: [{ name: site.profile.author?.name || site.profile.name }],
    ...(site.profile.seo?.googleSiteVerification
      ? { verification: { google: site.profile.seo.googleSiteVerification } }
      : {}),
    metadataBase: new URL(siteUrl),
    alternates: { canonical: siteUrl },
    openGraph: {
      type: "website",
      locale: site.profile.locale || "pt_BR",
      url: siteUrl,
      siteName: site.profile.name,
      description: site.profile.description,
      ...(site.profile.seo?.ogImage
        ? { images: [{ url: site.profile.seo.ogImage, width: 1200, height: 630, alt: site.profile.name }] }
        : {}),
    },
  };
}

export default async function ManagedSiteLayout({ children, params }) {
  const { siteSlug } = await params;
  const site = getRegisteredSite(siteSlug, { includeInactive: false });
  if (!site) notFound();

  return (
    <>
      <AdSenseScript
        enabled={isVercelProduction && site.profile.adsense?.enabled === true}
        publisherId={site.profile.adsense?.publisherId || ""}
      />
      <GoogleAnalytics measurementId={site.profile.seo?.googleAnalyticsId || ""} />
      <ManagedSiteShell site={site}>{children}</ManagedSiteShell>
    </>
  );
}
