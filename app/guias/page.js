import Link from "next/link";
import HubShell from "../../components/HubShell";

export const metadata = {
  title: "Guias para criar sites de nicho",
  description: "Orientações para planejar, configurar, revisar e lançar sites automatizados no hub.",
};

export default function GuidesPage() {
  return (
    <HubShell>
      <main className="hub-container hub-guide-content">
        <p className="hub-eyebrow">Biblioteca do hub</p>
        <h1>Guias de criação e configuração</h1>
        <p>
          Use estes passos como roteiro para criar projetos editoriais sustentáveis.
          Automação ajuda no processo, mas não substitui pesquisa, revisão e responsabilidade editorial.
        </p>

        <section className="hub-guide-section" id="planejamento">
          <h2>1. Planeje o nicho antes de abrir o assistente</h2>
          <ul>
            <li>Escolha um público específico e descreva o problema que o site ajuda a resolver.</li>
            <li>Pesquise se há demanda, concorrência, fontes confiáveis e espaço para um diferencial real.</li>
            <li>Defina o que o site não fará: temas fora do escopo, promessas e orientações que exigem especialistas.</li>
            <li>Escreva uma proposta de valor simples, verificável e compreensível para o leitor.</li>
          </ul>
        </section>

        <section className="hub-guide-section" id="configuracao">
          <h2>2. Configure o perfil do site</h2>
          <ol>
            <li><strong>Identidade:</strong> nome, identificador do endereço, nicho, tagline e cores.</li>
            <li><strong>Público e voz:</strong> para quem se escreve, nível de conhecimento e tom editorial.</li>
            <li><strong>Estrutura editorial:</strong> categorias claras, pautas iniciais e regras de qualidade.</li>
            <li><strong>Fontes:</strong> cadastre domínios permitidos quando a precisão do nicho exigir referências.</li>
            <li><strong>Módulos:</strong> ative somente os recursos adequados ao projeto.</li>
            <li><strong>SEO e monetização:</strong> configure metadados e espaços de anúncio; mantenha credenciais em variáveis seguras.</li>
          </ol>
          <p>O endereço público inicial usa o padrão <code>/sites/identificador</code>.</p>
        </section>

        <section className="hub-guide-section" id="infraestrutura">
          <h2>3. Conecte as ferramentas de publicação</h2>
          <ul>
            <li>Cadastre as chaves dos provedores de IA no ambiente local ou no painel seguro da Vercel.</li>
            <li>Conecte o repositório GitHub e a branch usada para publicar os perfis e o conteúdo.</li>
            <li>Para usar um domínio comprado, salve o domínio no perfil, conecte-o à Vercel e aplique os registros DNS fornecidos pelo painel.</li>
            <li>Cadastre a propriedade no Google Search Console, verifique o domínio e envie o sitemap após o deploy.</li>
          </ul>
        </section>

        <section className="hub-guide-section" id="conteudo">
          <h2>4. Produza conteúdo com controle</h2>
          <ul>
            <li>Comece com pautas específicas associadas a categorias, não com listas genéricas repetidas.</li>
            <li>Use geração automática como apoio para rascunhos; verifique fatos, fontes, datas e direitos de uso.</li>
            <li>Revise clareza, originalidade, utilidade e adequação ao público antes de publicar.</li>
            <li>Não automatize a publicação de afirmações sensíveis sem uma revisão humana apropriada.</li>
          </ul>
        </section>

        <section className="hub-guide-section" id="lancamento">
          <h2>5. Revise e lance</h2>
          <ul>
            <li>Confira artigos, navegação, páginas de contato, privacidade e metodologia.</li>
            <li>Teste o site em celular e desktop, confirme links e revise título e descrição para busca.</li>
            <li>Ative o site quando estiver pronto para aparecer no catálogo público do hub.</li>
            <li>Ao ocultar um site, seu endereço deixa de ser público, mas o perfil e os arquivos são preservados.</li>
            <li>Antes de monetizar, valide políticas do provedor, transparência de anúncios e requisitos legais aplicáveis.</li>
          </ul>
        </section>

        <section className="hub-guide-section">
          <h2>Próximo passo</h2>
          <p>Quando o planejamento estiver pronto, abra o assistente e construa o perfil do nicho.</p>
          <Link className="hub-button" href="/admin?view=sites">Abrir criação de sites</Link>
        </section>
      </main>
    </HubShell>
  );
}
