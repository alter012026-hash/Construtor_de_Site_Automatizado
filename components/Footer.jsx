import Link from "next/link";
import config from "../site.config";
import Logo from "./Logo";
import NewsletterBox from "./NewsletterBox";
import { CookiePrefsButton } from "./ConsentBanner";

export default function Footer() {
  const year = new Date().getFullYear();
  const navigation = config.modules?.health
    ? config.navigation
    : [
        { label: "Início", href: "/" },
        { label: "Conteúdos", href: "/blog" },
        ...(config.generation?.categories || []).slice(0, 4).map((category) => ({
          label: category,
          href: `/blog?categoria=${encodeURIComponent(category)}`,
        })),
      ];
  const footerNavigation = config.modules?.health
    ? config.footerNavigation
    : [
        { label: "Sobre", href: "/sobre" },
        { label: "Metodologia", href: "/metodologia" },
        { label: "Contato", href: "/contato" },
        { label: "Privacidade", href: "/privacidade" },
      ];

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-inner">
          <div className="footer-brand">
            <Logo />
            <p className="footer-tagline">{config.tagline}</p>
          </div>

          <div className="footer-cols">
            <nav aria-label="Explorar">
              <p className="footer-col-title">Explorar</p>
              <div className="footer-nav">
                {navigation.map((item) => (
                  <Link key={item.href} href={item.href} className="footer-link">{item.label}</Link>
                ))}
              </div>
            </nav>
            <nav aria-label="Institucional">
              <p className="footer-col-title">Sobre o projeto</p>
              <div className="footer-nav">
                {footerNavigation.map((item) => (
                  <Link key={item.href} href={item.href} className="footer-link">{item.label}</Link>
                ))}
              </div>
            </nav>
          </div>

          {config.modules?.newsletter && <div className="footer-newsletter"><NewsletterBox /></div>}
        </div>

        <div className="footer-bottom">
          <p className="footer-copy">
            © {year} {config.name}. Todos os direitos reservados.
            <CookiePrefsButton className="footer-linkbtn" />
          </p>
        </div>
      </div>
      <span className="footer-wordmark" aria-hidden="true">{config.name}</span>
    </footer>
  );
}
