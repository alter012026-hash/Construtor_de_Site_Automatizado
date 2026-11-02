import Link from "next/link";
import { notFound } from "next/navigation";
import PostCard from "../../../components/PostCard";
import { getAllPosts, getCategoryStats } from "../../../lib/posts";
import { getRegisteredSite, getRegisteredSites } from "../../../lib/site-registry";

export function generateStaticParams() {
  return getRegisteredSites({ includeInactive: false }).map(({ slug }) => ({ siteSlug: slug }));
}

export default async function ManagedSiteHome({ params }) {
  const { siteSlug } = await params;
  const site = getRegisteredSite(siteSlug, { includeInactive: false });
  if (!site) notFound();

  const profile = site.profile;
  const basePath = `/sites/${site.slug}`;
  const posts = getAllPosts(profile);
  const categories = getCategoryStats(profile);
  const homepage = profile.homepage || {};

  return (
    <>
      <section className="managed-site-hero">
        <div className="hub-container">
          <span className="managed-site-label">{profile.tagline}</span>
          <h1>{homepage.heroTitle || profile.name}</h1>
          <p>{homepage.heroDescription || profile.description}</p>
          <div className="hub-actions">
            <Link className="hub-button" href={`${basePath}/blog`}>
              {homepage.primaryActionLabel || "Explorar conteúdos"}
            </Link>
          </div>
        </div>
      </section>

      <section className="managed-site-content">
        {categories.length > 0 && (
          <div style={{ marginBottom: 36 }}>
            <p className="managed-site-label">Explore por tema</p>
            <div className="hub-guide-grid">
              {categories.map((category) => (
                <Link
                  className="hub-guide-card"
                  href={`${basePath}/blog?categoria=${encodeURIComponent(category.name)}`}
                  key={category.name}
                >
                  <h3>{category.name}</h3>
                  <p>{category.count} {category.count === 1 ? "artigo" : "artigos"}</p>
                  <span className="hub-card-link">Ver tema →</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="hub-section-head">
          <div>
            <p className="managed-site-label">Conteúdo</p>
            <h2>Artigos recentes</h2>
          </div>
          {posts.length > 0 && (
            <Link className="hub-card-link" href={`${basePath}/blog`}>Ver todos →</Link>
          )}
        </div>
        {posts.length > 0 ? (
          <div className="managed-site-article-grid">
            {posts.slice(0, 6).map((post) => (
              <PostCard post={post} key={post.slug} hrefPrefix={`${basePath}/blog`} />
            ))}
          </div>
        ) : (
          <p>Os primeiros conteúdos estão em preparação editorial.</p>
        )}
      </section>
    </>
  );
}
