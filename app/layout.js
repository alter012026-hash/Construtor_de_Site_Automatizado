import "./styles/tokens.css";
import "./styles/article.css";
import "./styles/hub.css";
import { Bricolage_Grotesque, Literata } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import AnalyticsEvents from "../components/AnalyticsEvents";
import ConsentBanner from "../components/ConsentBanner";
import PageViewTracker from "../components/PageViewTracker";
import PageTransition from "../components/PageTransition";
import RouteProgress from "../components/RouteProgress";
import ViewTransitions from "../components/ViewTransitions";
import HideOn from "../components/HideOn";

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
    siteName: "Hub de Sites Automatizados",
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
  return (
    <html lang="pt-BR" className={`${display.variable} ${read.variable}`} suppressHydrationWarning>
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
          "--color-primary": "#164E63",
          "--color-primary-dark": "#0F3B4D",
          "--color-primary-light": "#164E6322",
          "--color-chip-text": "#164E63",
          "--color-focus": "#164E6359",
          "--color-warning": "#D97706",
        }}
      >
        <RouteProgress />
        <ViewTransitions />
        <PageTransition>{children}</PageTransition>
        <AnalyticsEvents />
        <PageViewTracker />
        <HideOn paths={["/admin"]}>
          <ConsentBanner />
        </HideOn>
        {isVercelProduction && <Analytics />}
      </body>
    </html>
  );
}
