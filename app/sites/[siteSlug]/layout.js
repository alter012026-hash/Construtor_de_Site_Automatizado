import { notFound } from "next/navigation";
import ManagedSiteShell from "../../../components/ManagedSiteShell";
import AdSenseScript from "../../../components/AdSenseScript";
import { getRegisteredSite, getRegisteredSites } from "../../../lib/site-registry";

const isVercelProduction = process.env.VERCEL === "1" && process.env.VERCEL_ENV === "production";

export function generateStaticParams() {
  return getRegisteredSites({ includeInactive: false }).map(({ slug }) => ({ siteSlug: slug }));
}

export async function generateMetadata({ params }) {
  const { siteSlug } = await params;
  const site = getRegisteredSite(siteSlug, { includeInactive: false });
  if (!site) return {};

  const basePath = `/sites/${site.slug}`;
  return {
    title: { default: site.profile.name, template: `%s | ${site.profile.name}` },
    description: site.profile.description,
    keywords: site.profile.keywords,
    authors: [{ name: site.profile.author?.name || site.profile.name }],
    ...(site.profile.seo?.googleSiteVerification
      ? { verification: { google: site.profile.seo.googleSiteVerification } }
      : {}),
    alternates: { canonical: basePath },
    openGraph: {
      type: "website",
      locale: site.profile.locale || "pt_BR",
      url: basePath,
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
      />
      <ManagedSiteShell site={site}>{children}</ManagedSiteShell>
    </>
  );
}
