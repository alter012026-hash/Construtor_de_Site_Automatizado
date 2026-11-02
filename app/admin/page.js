"use client";

import { useEffect, useState } from "react";
import PlatformSetupTab from "../../components/admin/PlatformSetupTab";
import SiteEditorialPanel from "../../components/admin/SiteEditorialPanel";
import siteProfileTools from "../../lib/site-profile";

const { createGenericSiteProfile } = siteProfileTools;

const colors = {
  ink: "#17212B",
  muted: "#667085",
  border: "#E4E7EC",
  panel: "#F8FAFC",
  primary: "#164E63",
  danger: "#B42318",
  success: "#167044",
};

const card = { background: "#fff", border: `1px solid ${colors.border}`, borderRadius: 14, padding: 20 };
const input = { width: "100%", border: `1px solid ${colors.border}`, borderRadius: 8, padding: "10px 12px", color: colors.ink, fontSize: 14 };
const label = { display: "grid", gap: 7, color: colors.ink, fontSize: 13, fontWeight: 700 };
const button = { border: 0, borderRadius: 8, padding: "10px 14px", background: colors.primary, color: "#fff", fontWeight: 750, cursor: "pointer" };

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function Field({ title, value, onChange, type = "text", placeholder = "", disabled = false }) {
  return (
    <label style={label}>
      {title}
      <input
        style={input}
        type={type}
        value={value ?? ""}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function TextArea({ title, value, onChange, rows = 4, placeholder = "" }) {
  return (
    <label style={label}>
      {title}
      <textarea
        style={{ ...input, resize: "vertical", lineHeight: 1.5 }}
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value)}
        rows={rows}
        placeholder={placeholder}
      />
    </label>
  );
}

function Section({ title, description, children }) {
  return (
    <section style={{ ...card, display: "grid", gap: 16 }}>
      <div>
        <h2 style={{ margin: 0, color: colors.ink, fontSize: 18 }}>{title}</h2>
        {description && <p style={{ margin: "6px 0 0", color: colors.muted, fontSize: 13, lineHeight: 1.55 }}>{description}</p>}
      </div>
      {children}
    </section>
  );
}

function seedText(profile) {
  return (profile.generation?.topicSeeds || [])
    .map((entry) => `${entry.category} | ${(entry.topics || []).join("; ")}`)
    .join("\n");
}

function parseSeeds(value, categories) {
  const parsed = value.split(/\r?\n/).map((line) => {
    const [category, topics = ""] = line.split("|", 2);
    return {
      category: category?.trim(),
      topics: topics.split(";").map((topic) => topic.trim()).filter(Boolean),
    };
  }).filter((entry) => entry.category && entry.topics.length && categories.includes(entry.category));
  return parsed;
}

export default function AdminPage() {
  const [checking, setChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [tab, setTab] = useState("sites");
  const [sites, setSites] = useState([]);
  const [revision, setRevision] = useState(null);
  const [selectedSlug, setSelectedSlug] = useState("");
  const [profile, setProfile] = useState(null);
  const [isNew, setIsNew] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function loadSites() {
    const response = await fetch("/api/admin/sites", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Não foi possível carregar os sites.");
    setSites(data.sites || []);
    setRevision(data.revision || null);
    if (selectedSlug) {
      const current = (data.sites || []).find((site) => site.slug === selectedSlug);
      if (current) setProfile(clone(current.profile));
    }
  }

  useEffect(() => {
    fetch("/api/admin/platform-status", { cache: "no-store" })
      .then((response) => {
        if (response.ok) {
          setAuthenticated(true);
          return loadSites();
        }
        return undefined;
      })
      .catch((loadError) => setError(loadError.message))
      .finally(() => setChecking(false));
  }, []);

  function update(section, key, value) {
    setProfile((current) => section === "root"
      ? { ...current, [key]: value }
      : { ...current, [section]: { ...current[section], [key]: value } });
  }

  function updateSlug(nextSlug) {
    setSelectedSlug(nextSlug);
    setProfile((current) => {
      if (!current) return current;
      const next = clone(current);
      next.contentDirectory = `posts/${nextSlug}`;
      if (next.url.includes("/sites/")) next.url = next.url.replace(/\/sites\/[^/]*$/, `/sites/${nextSlug}`);
      return next;
    });
  }

  async function login(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Não foi possível entrar.");
      setAuthenticated(true);
      setPassword("");
      await loadSites();
    } catch (loginError) {
      setError(loginError.message);
    } finally {
      setBusy(false);
    }
  }

  function createSite() {
    const slug = `novo-site-${sites.length + 1}`;
    setSelectedSlug(slug);
    setProfile(createGenericSiteProfile({ slug }));
    setIsNew(true);
    setTab("sites");
    setError("");
    setMessage("");
  }

  function editSite(site) {
    setSelectedSlug(site.slug);
    setProfile(clone(site.profile));
    setIsNew(false);
    setError("");
    setMessage("");
  }

  async function saveSite(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/admin/sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save",
          slug: selectedSlug,
          profile,
          active: isNew ? true : sites.find((site) => site.slug === selectedSlug)?.active === true,
          revision,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Não foi possível salvar o site.");
      setRevision(data.revision || null);
      setIsNew(false);
      await loadSites();
      setMessage(data.deploymentTriggered ? "Configuração salva; o deploy foi iniciado." : "Configuração salva.");
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setBusy(false);
    }
  }

  async function toggleSite(site) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/admin/sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "set-active", slug: site.slug, active: !site.active, revision }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Não foi possível atualizar a visibilidade.");
      setRevision(data.revision || null);
      await loadSites();
      setMessage(data.active ? "Site ativado." : "Site ocultado. O perfil e o conteúdo foram preservados.");
    } catch (toggleError) {
      setError(toggleError.message);
    } finally {
      setBusy(false);
    }
  }

  async function connectDomain() {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch(`/api/admin/sites/${encodeURIComponent(selectedSlug)}/domain`, { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Não foi possível conectar o domínio.");
      setMessage(data.message);
    } catch (domainError) {
      setError(domainError.message);
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    await fetch("/api/admin/auth", { method: "DELETE" });
    setAuthenticated(false);
    setProfile(null);
    setSelectedSlug("");
  }

  if (checking) return <main style={{ maxWidth: 1000, margin: "60px auto", padding: 20, color: colors.muted }}>Carregando painel…</main>;

  if (!authenticated) {
    return (
      <main style={{ maxWidth: 420, margin: "10vh auto", padding: 20 }}>
        <form onSubmit={login} style={{ ...card, display: "grid", gap: 16 }}>
          <div>
            <p style={{ margin: "0 0 8px", color: colors.primary, fontSize: 12, fontWeight: 850, letterSpacing: ".12em" }}>HUB DE SITES</p>
            <h1 style={{ margin: 0, fontSize: 26, color: colors.ink }}>Acesso administrativo</h1>
          </div>
          <Field title="Senha administrativa" type="password" value={password} onChange={setPassword} />
          {error && <p role="alert" style={{ margin: 0, color: colors.danger }}>{error}</p>}
          <button style={button} disabled={busy}>{busy ? "Verificando…" : "Entrar"}</button>
        </form>
      </main>
    );
  }

  const categories = profile?.generation?.categories || [];
  const categoriesText = categories.join("\n");
  const profileChanged = (section, key, value) => update(section, key, value);

  return (
    <main style={{ minHeight: "100vh", background: colors.panel, color: colors.ink }}>
      <header style={{ background: "#fff", borderBottom: `1px solid ${colors.border}` }}>
        <div style={{ maxWidth: 1240, margin: "0 auto", padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
          <div>
            <p style={{ margin: 0, color: colors.primary, fontSize: 11, fontWeight: 850, letterSpacing: ".12em" }}>CENTRO DE OPERAÇÕES</p>
            <h1 style={{ margin: "4px 0 0", fontSize: 22 }}>Hub de criação de sites</h1>
          </div>
          <button type="button" onClick={logout} style={{ ...button, background: "#fff", color: colors.ink, border: `1px solid ${colors.border}` }}>Sair</button>
        </div>
      </header>

      <div style={{ maxWidth: 1240, margin: "0 auto", padding: 20 }}>
        <nav aria-label="Seções administrativas" style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 18 }}>
          {[["sites", "Sites do hub"], ["content", "Conteúdo"], ["platform", "Infraestrutura"]].map(([id, title]) => (
            <button key={id} type="button" onClick={() => setTab(id)} aria-current={tab === id ? "page" : undefined}
              style={{ ...button, background: tab === id ? colors.primary : "#fff", color: tab === id ? "#fff" : colors.ink, border: `1px solid ${colors.border}` }}>
              {title}
            </button>
          ))}
        </nav>

        {error && <p role="alert" style={{ ...card, color: colors.danger, borderColor: "#FDA29B" }}>{error}</p>}
        {message && <p role="status" style={{ ...card, color: colors.success }}>{message}</p>}

        {tab === "platform" ? <PlatformSetupTab /> : tab === "content" ? (
          <div style={{ display: "grid", gap: 14 }}>
            <section style={{ ...card, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12 }}>
              <label style={{ ...label, minWidth: 260 }}>
                Site
                <select style={input} value={selectedSlug} onChange={(event) => {
                  setSelectedSlug(event.target.value);
                  setProfile(null);
                }}>
                  <option value="">Selecione um site</option>
                  {sites.map((site) => <option key={site.slug} value={site.slug}>{site.profile.name} ({site.slug})</option>)}
                </select>
              </label>
              <p style={{ margin: 0, color: colors.muted, fontSize: 13 }}>Os rascunhos são mantidos isolados no projeto selecionado.</p>
            </section>
            {sites.find((site) => site.slug === selectedSlug)
              ? <SiteEditorialPanel key={selectedSlug} site={sites.find((site) => site.slug === selectedSlug)} />
              : <p style={{ ...card, color: colors.muted }}>Selecione um site cadastrado para gerar e revisar conteúdo.</p>}
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "minmax(230px, 0.75fr) minmax(0, 2fr)", gap: 18, alignItems: "start" }}>
            <aside style={{ ...card, display: "grid", gap: 10 }}>
              <button type="button" onClick={createSite} style={button}>+ Criar site</button>
              <p style={{ margin: "4px 0", color: colors.muted, fontSize: 13 }}>Sites cadastrados: {sites.length}</p>
              {sites.map((site) => (
                <div key={site.slug} style={{ padding: 12, border: `1px solid ${colors.border}`, borderRadius: 10, background: selectedSlug === site.slug ? "#F0F9FC" : "#fff" }}>
                  <button type="button" onClick={() => editSite(site)} style={{ width: "100%", textAlign: "left", border: 0, background: "transparent", color: colors.ink, cursor: "pointer", fontWeight: 750 }}>
                    {site.profile.name || site.slug}
                  </button>
                  <p style={{ margin: "5px 0 10px", color: colors.muted, fontSize: 12 }}>{site.slug} · {site.active ? "Ativo" : "Oculto"}</p>
                  <button type="button" onClick={() => toggleSite(site)} disabled={busy}
                    style={{ border: `1px solid ${colors.border}`, borderRadius: 7, background: "#fff", padding: "6px 9px", cursor: "pointer", color: colors.ink, fontSize: 12 }}>
                    {site.active ? "Ocultar site" : "Ativar site"}
                  </button>
                  <button type="button" onClick={() => { setSelectedSlug(site.slug); setProfile(null); setTab("content"); }}
                    style={{ marginLeft: 7, border: `1px solid ${colors.border}`, borderRadius: 7, background: "#fff", padding: "6px 9px", cursor: "pointer", color: colors.ink, fontSize: 12 }}>
                    Conteúdo
                  </button>
                </div>
              ))}
              {!sites.length && <p style={{ color: colors.muted, fontSize: 13, lineHeight: 1.55 }}>Comece criando seu primeiro projeto. Cada site mantém perfil, conteúdo e estado editorial separados.</p>}
            </aside>

            {profile ? (
              <form onSubmit={saveSite} style={{ display: "grid", gap: 14 }}>
                <Section title={isNew ? "1. Identidade do site" : `Configurar: ${profile.name}`} description="Defina o nicho, o público e os endereços do projeto.">
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
                    <Field title="Identificador da URL" value={selectedSlug} disabled={!isNew} onChange={updateSlug} placeholder="meu-novo-site" />
                    <Field title="Nome do site" value={profile.name} onChange={(value) => profileChanged("root", "name", value)} />
                    <Field title="Nicho" value={profile.niche} onChange={(value) => profileChanged("root", "niche", value)} />
                    <Field title="URL pública / endereço base" value={profile.url} onChange={(value) => profileChanged("root", "url", value)} placeholder="https://exemplo.com" />
                    <Field title="Domínio próprio (sem https://)" value={profile.customDomain} onChange={(value) => profileChanged("root", "customDomain", value)} placeholder="www.exemplo.com.br" />
                    <Field title="E-mail de contato" value={profile.contactEmail} onChange={(value) => profileChanged("root", "contactEmail", value)} type="email" />
                  </div>
                  <TextArea title="Descrição do projeto" value={profile.description} onChange={(value) => profileChanged("root", "description", value)} rows={3} />
                  <Field title="Frase de apresentação" value={profile.tagline} onChange={(value) => profileChanged("root", "tagline", value)} />
                </Section>

                <Section title="2. Aparência e marca" description="Personalize as cores, o logotipo e a apresentação inicial do site.">
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
                    <Field title="URL ou caminho do logotipo" value={profile.logoUrl} onChange={(value) => profileChanged("root", "logoUrl", value)} placeholder="/logo.svg" />
                    <Field title="Cor principal" value={profile.brand.primaryColor} onChange={(value) => profileChanged("brand", "primaryColor", value)} placeholder="#164E63" />
                    <Field title="Cor de destaque" value={profile.brand.accentColor} onChange={(value) => profileChanged("brand", "accentColor", value)} placeholder="#D97706" />
                    <Field title="Título da página inicial" value={profile.homepage.heroTitle} onChange={(value) => profileChanged("homepage", "heroTitle", value)} />
                  </div>
                  <TextArea title="Texto de apresentação da página inicial" value={profile.homepage.heroDescription} onChange={(value) => profileChanged("homepage", "heroDescription", value)} rows={3} />
                </Section>

                <Section title="3. Conteúdo e automação" description="Monte categorias e pautas por site; a geração automática exige o identificador do projeto.">
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
                    <Field title="Público" value={profile.editorial.audience} onChange={(value) => profileChanged("editorial", "audience", value)} />
                    <Field title="Tom editorial" value={profile.editorial.tone} onChange={(value) => profileChanged("editorial", "tone", value)} />
                    <label style={label}>Provedor preferido
                      <select style={input} value={profile.generation.aiProvider} onChange={(event) => profileChanged("generation", "aiProvider", event.target.value)}>
                        {["auto", "Cerebras", "Grok", "Groq", "OpenRouter", "Gemini"].map((provider) => <option key={provider} value={provider}>{provider === "auto" ? "Automático" : provider}</option>)}
                      </select>
                    </label>
                    <Field title="Palavras mínimas por artigo" type="number" value={profile.generation.minWords} onChange={(value) => profileChanged("generation", "minWords", Number(value))} />
                  </div>
                  <TextArea title="Categorias (uma por linha)" value={categoriesText} onChange={(value) => {
                    const nextCategories = value.split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
                    setProfile((current) => ({
                      ...current,
                      generation: {
                        ...current.generation,
                        categories: nextCategories,
                        topicSeeds: current.generation.topicSeeds.filter((entry) => nextCategories.includes(entry.category)),
                      },
                    }));
                  }} rows={4} placeholder={"Guias\nPerguntas frequentes\nNovidades"} />
                  <TextArea title="Pautas por categoria (Categoria | pauta 1; pauta 2)" value={seedText(profile)} onChange={(value) => update("generation", "topicSeeds", parseSeeds(value, categories))} rows={5} />
                  <TextArea title="Regras editoriais (uma por linha)" value={(profile.editorial.contentRules || []).join("\n")} onChange={(value) => profileChanged("editorial", "contentRules", value.split(/\r?\n/).map((item) => item.trim()).filter(Boolean))} rows={4} />
                </Section>

                <Section title="4. SEO, Google e monetização" description="Configure os dados usados nos metadados e serviços de cada projeto.">
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
                    <Field title="Verificação do Google Search Console" value={profile.seo.googleSiteVerification} onChange={(value) => profileChanged("seo", "googleSiteVerification", value)} />
                    <Field title="ID do Google Analytics 4" value={profile.seo.googleAnalyticsId} onChange={(value) => profileChanged("seo", "googleAnalyticsId", value)} placeholder="G-XXXXXXXXXX" />
                    <Field title="Imagem Open Graph" value={profile.seo.ogImage} onChange={(value) => profileChanged("seo", "ogImage", value)} />
                    <Field title="Palavras-chave (separadas por vírgula)" value={(profile.keywords || []).join(", ")} onChange={(value) => profileChanged("root", "keywords", value.split(",").map((item) => item.trim()).filter(Boolean))} />
                  </div>
                  <label style={{ display: "flex", alignItems: "center", gap: 9, color: colors.ink, fontSize: 14 }}>
                    <input type="checkbox" checked={profile.adsense.enabled} onChange={(event) => profileChanged("adsense", "enabled", event.target.checked)} />
                    Ativar Google AdSense quando o site estiver em produção
                  </label>
                  <Field title="Publisher ID do AdSense" value={profile.adsense.publisherId} onChange={(value) => profileChanged("adsense", "publisherId", value)} placeholder="ca-pub-0000000000000000" />
                </Section>

                <Section title="5. Conexão e publicação">
                  <p style={{ margin: 0, color: colors.muted, fontSize: 13, lineHeight: 1.6 }}>
                    As chaves de IA, GitHub e Vercel são configuradas em variáveis de ambiente, nunca neste perfil. Ao salvar em produção, o hub versiona a configuração e pode iniciar um deploy.
                  </p>
                  {profile.customDomain && !isNew && profile.customDomain === sites.find((site) => site.slug === selectedSlug)?.profile.customDomain && (
                    <button type="button" onClick={connectDomain} disabled={busy} style={{ ...button, justifySelf: "start" }}>
                      {busy ? "Conectando…" : `Conectar ${profile.customDomain} à Vercel`}
                    </button>
                  )}
                  {profile.customDomain && isNew && <p style={{ margin: 0, color: colors.muted, fontSize: 13 }}>Salve o perfil antes de conectar o domínio à Vercel.</p>}
                  {profile.customDomain && !isNew && profile.customDomain !== sites.find((site) => site.slug === selectedSlug)?.profile.customDomain && <p style={{ margin: 0, color: colors.muted, fontSize: 13 }}>Salve o novo domínio antes de conectar à Vercel.</p>}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                    <button type="submit" disabled={busy} style={button}>{busy ? "Salvando…" : "Salvar configuração"}</button>
                    <button type="button" onClick={() => { setProfile(null); setSelectedSlug(""); setIsNew(false); }} style={{ ...button, background: "#fff", color: colors.ink, border: `1px solid ${colors.border}` }}>Fechar editor</button>
                  </div>
                </Section>
              </form>
            ) : (
              <section style={{ ...card, minHeight: 220, display: "grid", placeContent: "center", textAlign: "center" }}>
                <h2 style={{ margin: 0 }}>Seu espaço de criação</h2>
                <p style={{ maxWidth: 460, color: colors.muted, lineHeight: 1.6 }}>Crie um site para abrir o assistente guiado. Cada nicho recebe identidade, conteúdo, SEO, domínio e configurações editoriais independentes.</p>
                {!sites.length && <button type="button" onClick={createSite} style={{ ...button, justifySelf: "center" }}>Criar primeiro site</button>}
              </section>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
