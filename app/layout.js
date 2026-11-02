import "./styles/tokens.css";
import "./styles/chrome.css";
import "./styles/home.css";
import "./styles/article.css";
import "./styles/pages.css";
import "./styles/transitions.css";
import "./styles/health.css";
import "./styles/hub.css";
import { Bricolage_Grotesque, Literata } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import AdSenseScript from "../components/AdSenseScript";
import AnalyticsEvents from "../components/AnalyticsEvents";
import ConsentBanner from "../components/ConsentBanner";
import PageViewTracker from "../components/PageViewTracker";
import PageTransition from "../components/PageTransition";
import RouteProgress from "../components/RouteProgress";
import ViewTransitions from "../components/ViewTransitions";
import Header from "../components/Header";
import MobileDock from "../components/MobileDock";
import Footer from "../components/Footer";
import HideOn from "../components/HideOn";
import { getSearchIndex } from "../lib/search-index";
import config from "../site.config";

const isVercelProduction =
  process.env.VERCEL === "1" && process.env.VERCEL_ENV === "production";

// Fontes auto-hospedadas pelo Next (sem requisição a fonts.googleapis.com):
// a CSP do site só permite font-src 'self', então o @import antigo do
// Google Fonts era bloqueado e o site caía em Georgia/system-ui.
const display = Bricolage_Grotesque({
  subsets: ["latin", "latin-ext"],
  axes: ["opsz", "wdth"],
  display: "swap",
  variable: "--f-display",
});
const read = Literata({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--f-read",
});

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FFFFFF" },
    { media: "(prefers-color-scheme: dark)", color: "#101418" },
  ],
};

export const metadata = {
  title: { default: "Construtor de Sites Automatizados", template: "%s | Construtor de Sites" },
  description: "Planeje, configure e administre sites automatizados de diferentes nichos a partir de um painel central.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL
      || (process.env.VERCEL_PROJECT_PRODUCTION_URL && `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`)
      || (process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`)
      || "http://localhost:3000"
  ),
  // Canônico padrão = a própria URL da página, sem query (?fbclid, ?utm...). Páginas que
  // definem o seu (blog e artigo) sobrescrevem este valor.
  alternates: { canonical: "./" },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "Construtor de Sites Automatizados",
    description: "Planeje, configure e administre sites automatizados de diferentes nichos.",
  },
  twitter: {
    card: "summary_large_image",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

export default function RootLayout({ children }) {
  const searchIndex = getSearchIndex();
  const primaryColor = config.brand?.primaryColor || "#B4232C";
  const accentColor = config.brand?.accentColor || "#B54708";

  return (
    <html lang={config.language.toLowerCase()} className={`${display.variable} ${read.variable}`} suppressHydrationWarning>
      <head>
        {/* Tema salvo aplicado ANTES do primeiro paint (sem flash claro→escuro). */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var d=document.documentElement;var t=localStorage.getItem('theme');if(!t){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}d.setAttribute('data-theme',t);if(/^\\/admin(\\/|$)/.test(location.pathname)){d.setAttribute('data-nodock','');}}catch(e){}})();`,
          }}
        />
      </head>
      <body
        style={{
          "--color-primary": primaryColor,
          "--color-primary-dark": primaryColor,
          "--color-primary-light": `${primaryColor}22`,
          "--color-chip-text": primaryColor,
          "--color-focus": `${primaryColor}59`,
          "--color-warning": accentColor,
        }}
      >
        <HideOn paths={["/", "/guias", "/sites"]}>
          <AdSenseScript
            enabled={
              isVercelProduction &&
              config.adsense.enabled &&
              config.adsense.publisherId !== "ca-pub-XXXXXXXXXXXXXXXX"
            }
          />
        </HideOn>
        <RouteProgress />
        <ViewTransitions />
        <HideOn paths={["/", "/guias", "/sites"]}>
          <Header posts={searchIndex} />
        </HideOn>
        <PageTransition>{children}</PageTransition>
        <HideOn paths={["/admin", "/", "/guias", "/sites"]}>
          <Footer />
        </HideOn>
        <MobileDock />
        <AnalyticsEvents />
        <PageViewTracker />
        <HideOn paths={["/admin", "/", "/guias", "/sites"]}>
          <ConsentBanner />
        </HideOn>
        {isVercelProduction && <Analytics />}
      </body>
    </html>
  );
}
