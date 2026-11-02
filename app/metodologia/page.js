import Link from "next/link";
import config from "../../site.config";

export const metadata = {
  title: `Metodologia - ${config.name}`,
  description: `Como o ${config.name} produz, revisa e corrige conteúdo sobre ${config.niche}.`,
};

export default function MetodologiaPage() {
  return (
    <main className="section section--light">
      <div className="container article-layout">
        <article className="prose">
          <header>
            <h1>Como produzimos nosso conteúdo</h1>
            <p className="article-excerpt">{config.methodology.summary}</p>
          </header>
          <hr className="article-divider" />
          <h2>Fontes e produção</h2>
          <p>
            {config.editorial?.requireSources
              ? `Os textos usam fontes permitidas para ${config.niche}.`
              : `As fontes são selecionadas conforme o tema e as necessidades de cada pauta.`}
            {" "}Ferramentas de inteligência artificial podem apoiar a redação, mas não são fonte de verdade nem substituem a checagem.
          </p>
          <h2>Revisão antes da publicação</h2>
          <p>
            Todo conteúdo passa por revisão editorial antes de ser publicado. A equipe confere afirmações,
            links, avisos de segurança e referências necessárias. Artigos com validações pendentes não podem ser publicados.
          </p>
          <h2>Limites e correções</h2>
          <p>
            Informações podem mudar. Verifique a data e as fontes de cada conteúdo. Se encontrar erro ou
            informação desatualizada, avise pela página de <Link href="/contato">contato</Link>.
          </p>
          <p>
            {config.modules?.officialSources && <><Link href="/fontes-oficiais">Conheça as fontes recomendadas</Link>.{" "}</>}
            {config.modules?.health && <Link href="/aviso-de-saude">Leia o aviso de saúde</Link>}
          </p>
        </article>
      </div>
    </main>
  );
}
