import Link from "next/link";

export default function ManagedSiteShell({ site, children }) {
  const basePath = `/sites/${site.slug}`;
  const primaryColor = site.profile.brand?.primaryColor || "#164e63";
  const accentColor = site.profile.brand?.accentColor || "#d97706";

  return (
    <div
      className="managed-site"
      style={{ "--site-primary": primaryColor, "--site-accent": accentColor }}
    >
      <header className="managed-site-header">
        <Link className="managed-site-brand" href={basePath}>
          {site.profile.logoUrl && (
            <img className="managed-site-logo" src={site.profile.logoUrl} alt="" />
          )}
          {site.profile.name}
        </Link>
        <nav className="managed-site-nav" aria-label={`Navegação de ${site.profile.name}`}>
          <Link href={basePath}>Início</Link>
          <Link href={`${basePath}/blog`}>Conteúdos</Link>
          <Link href="/">Hub de sites</Link>
        </nav>
      </header>
      <main className="managed-site-main">{children}</main>
      <footer className="managed-site-footer">
        © {new Date().getFullYear()} {site.profile.name}. Conteúdo informativo para {site.profile.niche}.
      </footer>
    </div>
  );
}
