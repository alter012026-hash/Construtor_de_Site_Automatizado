import Link from "next/link";
import HubShell from "../components/HubShell";
import { getRegisteredSites } from "../lib/site-registry";

export const revalidate = 300;

const QUICK_STEPS = [
  {
    title: "Escolha o nicho",
    description: "Defina o público, a necessidade que o site atende e os limites do conteúdo.",
  },
  {
    title: "Monte o perfil",
    description: "Configure marca, categorias, tom editorial, fontes, módulos e regras.",
  },
  {
    title: "Prepare o conteúdo",
    description: "Cadastre pautas, gere rascunhos, revise e publique com aprovação humana.",
  },
  {
    title: "Lance e acompanhe",
    description: "Ative a página pública do site, acompanhe resultados e ajuste sua estratégia.",
  },
];

export default function HubHomePage() {
  const activeSites = getRegisteredSites({ includeInactive: false });

  return (
    <HubShell>
      <main>
        <section className="hub-hero">
          <div className="hub-container hub-hero-grid">
            <div>
              <p className="hub-eyebrow">Seu centro de criação editorial</p>
              <h1>Vários nichos. Uma base para criar e administrar.</h1>
              <p className="hub-hero-copy">
                Planeje sites automatizados sem começar do zero. O hub guia a configuração de cada projeto,
                organiza seus sites e publica cada nicho em um endereço próprio dentro desta plataforma.
              </p>
              <div className="hub-actions">
                <Link className="hub-button" href="/admin?view=sites">Criar ou administrar sites</Link>
                <Link className="hub-button hub-button--secondary" href="/guias">Ver guias de criação</Link>
              </div>
            </div>
            <aside className="hub-hero-card">
              <h2>Do planejamento ao lançamento</h2>
              <ul className="hub-checklist">
                {[
                  "Um perfil e uma identidade para cada nicho",
                  "Pautas, categorias e regras editoriais configuráveis",
                  "Módulos ativáveis conforme o projeto",
                  "Sites ocultáveis sem excluir configurações ou conteúdo",
                ].map((text) => (
                  <li key={text}><span className="hub-check" aria-hidden="true">✓</span>{text}</li>
                ))}
              </ul>
            </aside>
          </div>
        </section>

        <section className="hub-section hub-section--white">
          <div className="hub-container">
            <div className="hub-section-head">
              <div>
                <p className="hub-eyebrow">Como funciona</p>
                <h2>Um fluxo guiado para cada novo projeto</h2>
                <p>Crie sites independentes no conteúdo, mas administrados a partir de um único centro.</p>
              </div>
            </div>
            <div className="hub-steps">
              {QUICK_STEPS.map((step) => (
                <article className="hub-step" key={step.title}>
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="hub-section">
          <div className="hub-container">
            <div className="hub-section-head">
              <div>
                <p className="hub-eyebrow">Sites públicos</p>
                <h2>Projetos ativos no hub</h2>
                <p>Somente sites ativados aparecem aqui. Ocultar um site não apaga seu conteúdo nem seu perfil.</p>
              </div>
              <Link className="hub-button hub-button--secondary" href="/admin?view=sites">Gerenciar sites</Link>
            </div>
            {activeSites.length > 0 ? (
              <div className="hub-site-grid">
                {activeSites.map((site) => (
                  <Link className="hub-site-card" href={`/sites/${site.slug}`} key={site.slug}>
                    <p className="hub-eyebrow">{site.profile.niche}</p>
                    <h3>{site.profile.name}</h3>
                    <p>{site.profile.description}</p>
                    <span className="hub-card-link">Visitar site →</span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="hub-guide-card">
                <h3>Nenhum site ativo ainda</h3>
                <p>Crie um perfil e ative o primeiro projeto no painel do hub.</p>
                <Link className="hub-card-link" href="/admin?view=sites">Começar criação →</Link>
              </div>
            )}
          </div>
        </section>

        <section className="hub-section hub-section--white">
          <div className="hub-container">
            <div className="hub-section-head">
              <div>
                <p className="hub-eyebrow">Central de orientação</p>
                <h2>Guias para criar com método</h2>
                <p>Aprenda a planejar cada etapa antes de publicar ou ativar um novo nicho.</p>
              </div>
              <Link className="hub-button hub-button--secondary" href="/guias">Abrir todos os guias</Link>
            </div>
            <div className="hub-guide-grid">
              <Link className="hub-guide-card" href="/guias#planejamento">
                <h3>Planejamento do nicho</h3>
                <p>Defina público, proposta de valor, limites e diferenciais antes de produzir conteúdo.</p>
                <span className="hub-card-link">Ler guia →</span>
              </Link>
              <Link className="hub-guide-card" href="/guias#configuracao">
                <h3>Configuração passo a passo</h3>
                <p>Saiba o que preencher no assistente e como organizar categorias, fontes e módulos.</p>
                <span className="hub-card-link">Ler guia →</span>
              </Link>
              <Link className="hub-guide-card" href="/guias#lancamento">
                <h3>Revisão e lançamento</h3>
                <p>Confira o checklist de qualidade, páginas institucionais e monetização responsável.</p>
                <span className="hub-card-link">Ler guia →</span>
              </Link>
            </div>
          </div>
        </section>
      </main>
    </HubShell>
  );
}
