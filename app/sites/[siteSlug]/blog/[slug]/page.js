import Link from "next/link";
import { notFound } from "next/navigation";
import { getPostBySlug, getAllSlugs, getRelatedPosts, getPostContentHtml } from "../../../../../lib/posts";
import { getRegisteredSite, getRegisteredSites, getSitePublicUrl } from "../../../../../lib/site-registry";

export function generateStaticParams() {
  return getRegisteredSites({ includeInactive: false }).flatMap((site) =>
    getAllSlugs(site.profile).map((slug) => ({ siteSlug: site.slug, slug }))
  );
}

export async function generateMetadata({ params }) {
  const { siteSlug, slug } = await params;
  const site = getRegisteredSite(siteSlug, { includeInactive: false });
  const post = site ? getPostBySlug(slug, site.profile) : null;
  if (!site || !post) return {};
  const canonicalUrl = `${getSitePublicUrl(site)}/blog/${post.slug}`;

  return {
    title: post.title,
    description: post.excerpt || site.profile.description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      type: "article",
      url: canonicalUrl,
      siteName: site.profile.name,
      title: post.title,
      description: post.excerpt || site.profile.description,
    },
    robots: post.noindex ? { index: false, follow: false } : undefined,
  };
}

export default async function ManagedSiteArticle({ params }) {
  const { siteSlug, slug } = await params;
  const site = getRegisteredSite(siteSlug, { includeInactive: false });
  const post = site ? getPostBySlug(slug, site.profile) : null;
  if (!site || !post) notFound();

  const html = await getPostContentHtml(post.content);
  const related = getRelatedPosts(post.slug, post.category, 3, site.profile);
  const basePath = `/sites/${site.slug}`;

  return (
    <>
      <article className="managed-site-post">
        <Link className="hub-card-link" href={`${basePath}/blog`}>← Voltar aos conteúdos</Link>
        <p className="managed-site-label" style={{ marginTop: 22 }}>{post.category}</p>
        <h1 style={{ margin: "10px 0 14px", fontSize: "clamp(34px, 5vw, 52px)", lineHeight: 1.1 }}>
          {post.title}
        </h1>
        {post.excerpt && <p style={{ color: "#526170", fontSize: 18, lineHeight: 1.65 }}>{post.excerpt}</p>}
        <div
          className="managed-site-post-body"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </article>
      {related.length > 0 && (
        <section className="managed-site-content">
          <h2>Mais conteúdos sobre {post.category}</h2>
          <div className="managed-site-article-grid">
            {related.map((item) => (
              <article className="hub-guide-card" key={item.slug}>
                <Link href={`${basePath}/blog/${item.slug}`} style={{ color: "inherit", textDecoration: "none" }}>
                  <h3>{item.title}</h3>
                  <p>{item.excerpt}</p>
                </Link>
              </article>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
