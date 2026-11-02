import Link from "next/link";
import PostCard from "../components/PostCard";
import LatestCarousel from "../components/LatestCarousel";
import CategoryCards from "../components/CategoryCards";
import QuickStart from "../components/QuickStart";
import MedicationSummary from "../components/MedicationSummary";
import HeroSheet from "../components/HeroSheet";
import { getAllPosts, getCategoryStats } from "../lib/posts";
import config from "../site.config";

export const revalidate = 3600;

export default function HomePage() {
  const posts = getAllPosts();
  const categoryStats = getCategoryStats();
  const healthEnabled = config.modules?.health === true;
  const sourcesEnabled = config.modules?.officialSources === true;
  const homepage = config.homepage || {};

  return (
    <main>
      <section className="hero">
        <HeroSheet />
        <div className="container hero-grid">
          <div className="hero-copy">
            <p className="section-label">{config.tagline}</p>
            <h1>{homepage.heroTitle || config.name}</h1>
            <p className="hero-desc">{homepage.heroDescription || config.description}</p>
            <div className="hero-actions">
              <Link href={homepage.primaryActionHref || "/blog"} className="btn btn--hl">
                {homepage.primaryActionLabel || "Explorar conteúdos"}
              </Link>
              {sourcesEnabled && homepage.secondaryActionLabel && (
                <Link href={homepage.secondaryActionHref || "/fontes-oficiais"} className="btn btn--ghost">
                  {homepage.secondaryActionLabel}
                </Link>
              )}
            </div>
            <p className="hero-facts">
              {posts.length > 0
                ? `${posts.length} artigos publicados sobre ${config.niche}.`
                : "Os primeiros conteúdos estão em preparação editorial."}
            </p>
          </div>
          <QuickStart />
        </div>
      </section>

      {healthEnabled && (
        <section className="section">
          <div className="container health-notice">
            <strong>Importante:</strong> {homepage.notice}
            <Link href="/aviso-de-saude">Leia o aviso de saúde</Link>
          </div>
        </section>
      )}

      {healthEnabled && config.modules?.medicationSummary === true && <MedicationSummary />}

      {posts.length > 0 && (
        <section className="section section--alt">
          <div className="container">
            <div className="section-header">
              <div>
                <p className="section-label">Conteúdo revisado</p>
                <h2 className="section-title">Artigos recentes</h2>
              </div>
              <Link href="/blog" className="section-link">Ver todos</Link>
            </div>
            <LatestCarousel posts={posts.slice(0, 10)} />
          </div>
        </section>
      )}

      {categoryStats.length > 0 && (
        <section className="section">
          <div className="container">
            <div className="section-header">
              <h2 className="section-title">Explore por tema</h2>
            </div>
            <CategoryCards categories={categoryStats} />
          </div>
        </section>
      )}

      {sourcesEnabled && (
        <section className="section section--alt">
          <div className="container">
            <div className="section-header">
              <div>
                <p className="section-label">Conteúdo confiável começa na fonte</p>
                <h2 className="section-title">Consulte fontes para {config.niche}</h2>
              </div>
            </div>
            <p className="hero-desc">{config.editorial?.contentRules?.[0] || config.description}</p>
            <Link href="/fontes-oficiais" className="section-link">Conheça as fontes →</Link>
          </div>
        </section>
      )}
    </main>
  );
}
