import Link from "next/link";

export const metadata = {
  title: "Metodologia do hub",
  description: "Princípios de configuração, automação e revisão dos projetos do hub.",
};

export default function MethodologyPage() {
  return (
    <main className="section section--light">
      <div className="container article-layout">
        <article className="prose">
          <header>
            <h1>Princípios de publicação</h1>
            <p className="article-excerpt">
              A automação é uma ferramenta de apoio: cada projeto define seu público, suas regras
              editoriais, suas fontes e seu processo de revisão.
            </p>
          </header>
          <hr className="article-divider" />
          <h2>Configuração por projeto</h2>
          <p>
            Perfis, categorias e pautas são administrados individualmente. As chaves de serviços
            externos devem permanecer em variáveis de ambiente, fora dos perfis públicos.
          </p>
          <h2>Revisão humana</h2>
          <p>
            Conteúdos gerados ou editados devem ser verificados antes da publicação. O responsável
            deve conferir fatos, fontes, direitos de uso, adequação ao público e regras aplicáveis
            ao nicho do site.
          </p>
          <h2>Correções</h2>
          <p>
            Mantenha informações e referências atualizadas. Para detalhes sobre dados e integrações,
            consulte a <Link href="/privacidade">Política de Privacidade</Link>.
          </p>
        </article>
      </div>
    </main>
  );
}
