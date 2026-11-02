import config from "../../site.config";
import { notFound } from "next/navigation";

export const metadata = {
  title: `Fontes recomendadas - ${config.name}`,
  description: `Fontes recomendadas para conteúdos sobre ${config.niche}.`,
};

export default function FontesOficiaisPage() {
  if (!config.modules?.officialSources) notFound();

  const sources = (config.officialSourceDomains || []).map((domain) => ({
    name: domain,
    url: `https://${domain}`,
  }));

  return (
    <main className="section section--light">
      <div className="container article-layout">
        <article className="prose">
          <header>
            <h1>Fontes recomendadas</h1>
            <p className="article-excerpt">
              Domínios aprovados para apoiar conteúdos sobre {config.niche}. Consulte cada fonte para verificar a informação original.
            </p>
          </header>
          <hr className="article-divider" />
          <ul>
            {sources.map((source) => (
              <li key={source.url}>
                <a href={source.url} target="_blank" rel="noopener noreferrer">
                  {source.name}
                </a>
                {" — Fonte permitida para pesquisa editorial."}
              </li>
            ))}
          </ul>
          <p>
            Links externos podem mudar. Se algum endereço não funcionar, navegue pelo site oficial
            do órgão e procure o serviço pelo nome.
          </p>
        </article>
      </div>
    </main>
  );
}
