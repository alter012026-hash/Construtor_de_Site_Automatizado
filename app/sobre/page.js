import Link from "next/link";

export const metadata = {
  title: "Sobre o hub",
  description: "Conheça o hub para planejar, configurar e administrar sites de diferentes nichos.",
};

export default function AboutPage() {
  return (
    <main className="section section--light">
      <div className="container article-layout">
        <article className="prose">
          <header>
            <h1>Sobre o hub</h1>
            <p className="article-excerpt">
              Um painel central para criar e administrar projetos editoriais de diferentes nichos,
              com identidade, conteúdo e publicação configurados por site.
            </p>
          </header>
          <hr className="article-divider" />
          <h2>Projetos independentes</h2>
          <p>
            Cada site pode ter domínio, identidade visual, categorias, regras editoriais e
            metadados próprios. Conteúdo e estado de geração são separados por projeto.
          </p>
          <h2>Configuração responsável</h2>
          <p>
            Ferramentas de automação apoiam a produção e a publicação. O responsável por cada
            projeto deve revisar o conteúdo, configurar os serviços utilizados e manter suas
            credenciais protegidas.
          </p>
          <p><Link href="/guias">Consulte os guias de configuração.</Link></p>
        </article>
      </div>
    </main>
  );
}
