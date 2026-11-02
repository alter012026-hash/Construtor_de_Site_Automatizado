import Link from "next/link";
import config from "../../site.config";

export const metadata = {
  title: `Sobre - ${config.name}`,
  description: `Conheça o propósito e os limites do ${config.name}.`,
};

export default function SobrePage() {
  const healthEnabled = config.modules?.health === true;
  const sourcesEnabled = config.modules?.officialSources === true;

  return (
    <main className="section section--light">
      <div className="container article-layout">
        <article className="prose">
          <header>
            <h1>Sobre o projeto</h1>
            <p className="article-excerpt">
              {config.description}
            </p>
          </header>
          <hr className="article-divider" />
          <h2>O que é o {config.name}?</h2>
          <p>
            Somos um projeto editorial independente sobre {config.niche}. Produzimos conteúdo para
            {` ${config.editorial?.audience || "leitores interessados no tema"}`} com transparência e revisão editorial.
          </p>
          <h2>Como trabalhamos</h2>
          <p>
            {config.methodology.summary} Consulte nossa <Link href="/metodologia">metodologia editorial</Link>.
          </p>
          {healthEnabled && (
            <>
              <h2>Um limite importante</h2>
              <p>O conteúdo não substitui a bula oficial nem a orientação de um profissional de saúde.</p>
              <p><Link href="/aviso-de-saude">Leia nosso aviso de saúde</Link>.</p>
            </>
          )}
          {sourcesEnabled && <p><Link href="/fontes-oficiais">Consulte as fontes recomendadas</Link>.</p>}
        </article>
      </div>
    </main>
  );
}
