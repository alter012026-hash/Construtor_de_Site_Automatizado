import Link from "next/link";
import { notFound } from "next/navigation";
import PostCard from "../../../../components/PostCard";
import { getAllPosts } from "../../../../lib/posts";
import { getRegisteredSite, getRegisteredSites, getSitePublicUrl } from "../../../../lib/site-registry";

export function generateStaticParams() {
  return getRegisteredSites({ includeInactive: false }).map(({ slug }) => ({ siteSlug: slug }));
}

export async function generateMetadata({ params }) {
  const { siteSlug } = await params;
  const site = getRegisteredSite(siteSlug, { includeInactive: false });
  if (!site) return {};
  const siteUrl = getSitePublicUrl(site);
  return {
    title: `Conteúdos | ${site.profile.name}`,
    description: site.profile.description,
    alternates: { canonical: `${siteUrl}/blog` },
  };
}

export default async function ManagedSiteBlog({ params, searchParams }) {
  const { siteSlug } = await params;
  const query = await searchParams;
  const site = getRegisteredSite(siteSlug, { includeInactive: false });
  if (!site) notFound();

  const basePath = `/sites/${site.slug}`;
  const category = typeof query?.categoria === "string" ? query.categoria : "";
  const allPosts = getAllPosts(site.profile);
  const posts = category ? allPosts.filter((post) => post.category === category) : allPosts;
  const categories = [...new Set(allPosts.map((post) => post.category))].sort();

  return (
    <section className="managed-site-content">
      <p className="managed-site-label">{site.profile.name}</p>
      <h1>{category || "Conteúdos"}</h1>
      <p>{site.profile.description}</p>
      <div className="hub-actions" style={{ marginBottom: 25 }}>
        <Link className="hub-button hub-button--secondary" href={`${basePath}/blog`}>Todos os temas</Link>
        {categories.map((item) => (
          <Link
            className="hub-button hub-button--secondary"
            href={`${basePath}/blog?categoria=${encodeURIComponent(item)}`}
            key={item}
          >
            {item}
          </Link>
        ))}
      </div>
      {posts.length > 0 ? (
        <div className="managed-site-article-grid">
          {posts.map((post) => (
            <PostCard post={post} key={post.slug} hrefPrefix={`${basePath}/blog`} />
          ))}
        </div>
      ) : (
        <p>Nenhum artigo publicado nesta categoria ainda.</p>
      )}
    </section>
  );
}
