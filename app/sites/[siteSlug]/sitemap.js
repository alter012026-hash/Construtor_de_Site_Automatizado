import { getAllPosts } from "../../../lib/posts";
import { getRegisteredSite, getRegisteredSites, getSitePublicUrl } from "../../../lib/site-registry";

export function generateStaticParams() {
  return getRegisteredSites({ includeInactive: false }).map(({ slug }) => ({ siteSlug: slug }));
}

export default async function sitemap({ params }) {
  const { siteSlug } = await params;
  const site = getRegisteredSite(siteSlug, { includeInactive: false });
  if (!site) return [];

  const siteUrl = getSitePublicUrl(site);
  const posts = getAllPosts(site.profile).filter((post) => post.date && !post.noindex);
  return [
    { url: siteUrl, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${siteUrl}/blog`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    ...posts.map((post) => ({
      url: `${siteUrl}/blog/${post.slug}`,
      lastModified: new Date(post.date),
      changeFrequency: "weekly",
      priority: 0.7,
    })),
  ];
}
