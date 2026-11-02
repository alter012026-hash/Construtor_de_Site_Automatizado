import Link from "next/link";
import profile from "../../data/site-profile.json";

export const metadata = {
  title: "Contato",
  description: "Entre em contato com a equipe responsável pelo hub.",
};

export default function ContactPage() {
  const email = profile.contactEmail?.trim();

  return (
    <main className="section section--light">
      <div className="container article-layout">
        <article className="prose">
          <header>
            <h1>Contato</h1>
            <p className="article-excerpt">
              Use o canal de contato configurado pelo responsável do hub para dúvidas,
              solicitações ou correções.
            </p>
          </header>
          <hr className="article-divider" />
          {email ? (
            <p>E-mail: <a href={`mailto:${email}`}>{email}</a></p>
          ) : (
            <p>O responsável ainda não configurou um e-mail público de contato.</p>
          )}
          <p>Para informações sobre dados e integrações, consulte a <Link href="/privacidade">Política de Privacidade</Link>.</p>
        </article>
      </div>
    </main>
  );
}
