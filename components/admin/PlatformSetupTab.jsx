"use client";

import { useEffect, useState } from "react";

const cardStyle = {
  border: "1px solid #E4E7EC",
  borderRadius: 14,
  background: "#fff",
  padding: 20,
};

function Status({ ready, children }) {
  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 7,
      borderRadius: 999,
      padding: "5px 10px",
      background: ready ? "#E8F5EE" : "#FFF4E5",
      color: ready ? "#167044" : "#9A5B00",
      fontSize: 12,
      fontWeight: 750,
    }}>
      <span aria-hidden="true">{ready ? "●" : "○"}</span>
      {children}
    </span>
  );
}

function IntegrationCard({ title, description, ready, children }) {
  return (
    <section style={cardStyle}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 17 }}>{title}</h2>
          <p style={{ margin: "8px 0 0", color: "#526170", fontSize: 13, lineHeight: 1.6 }}>{description}</p>
        </div>
        <Status ready={ready}>{ready ? "Configurado" : "Precisa configurar"}</Status>
      </div>
      {children && <div style={{ marginTop: 16 }}>{children}</div>}
    </section>
  );
}

export default function PlatformSetupTab() {
  const [status, setStatus] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/admin/platform-status", { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Não foi possível carregar o status da plataforma.");
        if (active) setStatus(data);
      })
      .catch((loadError) => {
        if (active) setError(loadError.message);
      });
    return () => { active = false; };
  }, []);

  if (error) return <p role="alert" style={{ color: "#B42318" }}>{error}</p>;
  if (!status) return <p style={{ color: "#526170" }}>Verificando integrações do hub…</p>;

  const configuredProviders = status.aiProviders.filter((provider) => provider.configured);
  const envLink = "Configure credenciais somente em .env.local durante o desenvolvimento ou nas variáveis de ambiente do projeto em produção. O hub nunca salva nem mostra os valores dos segredos.";

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <section style={{ ...cardStyle, background: "#F5FAFC" }}>
        <p style={{ margin: "0 0 6px", color: "#164E63", fontSize: 11, fontWeight: 850, letterSpacing: ".12em", textTransform: "uppercase" }}>
          Centro de operações
        </p>
        <h2 style={{ margin: 0, fontSize: 22 }}>Integrações e publicação</h2>
        <p style={{ maxWidth: 820, margin: "9px 0 0", color: "#526170", lineHeight: 1.65 }}>
          Acompanhe as conexões necessárias para gerar conteúdo, versionar cada configuração, publicar na Vercel
          e preparar a presença dos sites nos mecanismos de busca. Segredos são mantidos fora dos perfis dos sites.
        </p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 17, color: "#344054", fontSize: 13 }}>
          <span><strong>Ambiente:</strong> {status.runtime === "vercel" ? "Vercel" : "Local"}</span>
          <span aria-hidden="true">·</span>
          <span><strong>Sites:</strong> {status.sites.active} ativos de {status.sites.total}</span>
          {status.publicUrl && <><span aria-hidden="true">·</span><span>{status.publicUrl}</span></>}
        </div>
      </section>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 14 }}>
        <IntegrationCard
          title="Inteligência artificial"
          description="A geração usa provedores com chave configurada e aplica fallback quando a seleção do site está em modo automático."
          ready={configuredProviders.length > 0}
        >
          <div style={{ display: "grid", gap: 7, fontSize: 13, color: "#344054" }}>
            {status.aiProviders.map((provider) => (
              <div key={provider.name} style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                <span>{provider.name}</span>
                <strong style={{ color: provider.configured ? "#167044" : "#667085" }}>
                  {provider.configured ? "Disponível" : "Sem chave"}
                </strong>
              </div>
            ))}
          </div>
          <p style={{ margin: "13px 0 0", color: "#667085", fontSize: 12, lineHeight: 1.55 }}>{envLink}</p>
        </IntegrationCard>

        <IntegrationCard
          title="GitHub"
          description="Armazena perfis e conteúdo do hub no repositório. Commits na branch de produção podem iniciar o deploy automaticamente."
          ready={status.github.configured}
        >
          <p style={{ margin: 0, color: "#344054", fontSize: 13 }}>
            <strong>Repositório:</strong> {status.github.repository || "Não definido"}<br />
            <strong>Branch:</strong> {status.github.branch}
          </p>
          <p style={{ margin: "13px 0 0", color: "#667085", fontSize: 12, lineHeight: 1.55 }}>
            Configure GITHUB_TOKEN, GITHUB_REPO e, se necessário, GITHUB_BRANCH. Use um token com acesso mínimo ao repositório.
          </p>
          <a href="https://github.com/settings/tokens" target="_blank" rel="noreferrer" style={{ display: "inline-block", marginTop: 12, color: "#164E63", fontSize: 13, fontWeight: 750 }}>
            Gerenciar tokens do GitHub ↗
          </a>
        </IntegrationCard>

        <IntegrationCard
          title="Vercel e domínios"
          description="Publica os sites e permite conectar domínios próprios pela API da Vercel."
          ready={status.vercel.deployed && status.vercel.domainApiConfigured}
        >
          <p style={{ margin: 0, color: "#344054", fontSize: 13 }}>
            <strong>Deploy:</strong> {status.vercel.deployed ? "Executando na Vercel" : "Ambiente local"}<br />
            <strong>Gerenciamento de domínio:</strong> {status.vercel.domainApiConfigured ? "API pronta" : "Token ou ID do projeto pendente"}
          </p>
          <p style={{ margin: "13px 0 0", color: "#667085", fontSize: 12, lineHeight: 1.55 }}>
            Configure VERCEL_TOKEN e VERCEL_PROJECT_ID. VERCEL_TEAM_ID é opcional. O domínio precisa estar registrado
            e os registros DNS devem ser concluídos no provedor indicado pela Vercel.
          </p>
          <a href="https://vercel.com/dashboard" target="_blank" rel="noreferrer" style={{ display: "inline-block", marginTop: 12, color: "#164E63", fontSize: 13, fontWeight: 750 }}>
            Abrir painel Vercel ↗
          </a>
        </IntegrationCard>

        <IntegrationCard
          title="Google e SEO"
          description="Os códigos de Search Console e Google Analytics são definidos por site no assistente e aplicados ao publicar."
          ready={status.search.googleVerificationConfigured || status.search.googleAnalyticsConfigured}
        >
          <p style={{ margin: 0, color: "#344054", fontSize: 13 }}>
            <strong>Search Console:</strong> {status.search.googleVerificationConfigured ? "configurado em ao menos um site" : "pendente"}<br />
            <strong>Google Analytics:</strong> {status.search.googleAnalyticsConfigured ? "configurado em ao menos um site" : "pendente"}
          </p>
          <p style={{ margin: "13px 0 0", color: "#667085", fontSize: 12, lineHeight: 1.55 }}>
            Cadastre a propriedade e verifique o domínio no Google Search Console. O sitemap de cada site deve ser enviado
            depois que o endereço estiver público e implantado.
          </p>
          <a href="https://search.google.com/search-console" target="_blank" rel="noreferrer" style={{ display: "inline-block", marginTop: 12, color: "#164E63", fontSize: 13, fontWeight: 750 }}>
            Abrir Google Search Console ↗
          </a>
        </IntegrationCard>

        <IntegrationCard
          title="Acesso administrativo"
          description="Proteja o painel e as operações de criação com senha e segredo de sessão fortes."
          ready={status.security.adminPassword && status.security.sessionSecret}
        >
          <p style={{ margin: 0, color: "#344054", fontSize: 13 }}>
            <strong>Senha administrativa:</strong> {status.security.adminPassword ? "definida" : "pendente"}<br />
            <strong>Segredo de sessão:</strong> {status.security.sessionSecret ? "definido" : "pendente"}
          </p>
          <p style={{ margin: "13px 0 0", color: "#667085", fontSize: 12, lineHeight: 1.55 }}>
            Defina ADMIN_PASSWORD e ADMIN_SESSION_SECRET fora do repositório. Gere um segredo aleatório e nunca o compartilhe.
          </p>
        </IntegrationCard>

        <IntegrationCard
          title="URL pública do hub"
          description="Usada como origem de publicação, metadados e links administrativos."
          ready={Boolean(status.publicUrl)}
        >
          <p style={{ margin: 0, color: "#344054", fontSize: 13, overflowWrap: "anywhere" }}>
            {status.publicUrl || "NEXT_PUBLIC_SITE_URL ainda não foi configurada."}
          </p>
          <p style={{ margin: "13px 0 0", color: "#667085", fontSize: 12, lineHeight: 1.55 }}>
            Em produção, configure NEXT_PUBLIC_SITE_URL para o domínio principal do hub e publique um novo deploy.
          </p>
        </IntegrationCard>
      </div>
    </div>
  );
}
