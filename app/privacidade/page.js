import config from "../../data/site-profile.json";
import { CookiePrefsButton } from "../../components/ConsentBanner";

export const metadata = {
  title: "Política de Privacidade",
  description: "Como este site trata informações de navegação, cookies e integrações.",
};

export default function PrivacyPage() {
  const contactEmail = config.contactEmail?.trim();

  return (
    <main className="section section--light">
      <div className="container article-layout">
        <article className="prose">
          <header>
            <h1>Política de Privacidade</h1>
            <p className="article-excerpt">
              Esta política explica como este site trata dados de navegação, cookies e integrações
              configuradas pelo responsável do projeto.
            </p>
          </header>
          <hr className="article-divider" />
          <h2>Dados de navegação e cookies</h2>
          <p>
            Cookies próprios de estatística só são habilitados após sua escolha no aviso de
            consentimento. O Google Analytics, quando configurado para um site, também só é
            carregado após o aceite. Você pode alterar essa escolha a qualquer momento:
          </p>
          <p><CookiePrefsButton className="linkbtn">Abrir preferências de cookies</CookiePrefsButton></p>
          <p>
            Sites publicados neste hub podem integrar ferramentas de análise, publicidade ou
            serviços externos. Essas ferramentas são configuradas pelo responsável de cada site
            e seguem também as políticas dos respectivos provedores.
          </p>
          <h2>Conteúdo e serviços de terceiros</h2>
          <p>
            O hub pode armazenar perfis, conteúdo editorial e configurações de publicação em
            serviços de hospedagem, controle de versão e provedores de inteligência artificial.
            Credenciais de integração devem ser mantidas em variáveis de ambiente e não são
            exibidas no painel.
          </p>
          <h2>Seus direitos</h2>
          <p>
            Para solicitar informações ou exercer direitos sobre dados pessoais, escreva para{" "}
            {contactEmail
              ? <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
              : "o canal de contato informado pelo responsável deste site"}.
          </p>
          <p>
            Esta política deve ser revisada pelo responsável antes da publicação de cada site,
            considerando as ferramentas e práticas efetivamente ativadas.
          </p>
        </article>
      </div>
    </main>
  );
}
