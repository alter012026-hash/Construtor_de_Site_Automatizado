"use client";

import { useCallback, useEffect, useState } from "react";

const card = { border: "1px solid #E4E7EC", borderRadius: 12, padding: 16, background: "#fff" };
const button = { border: 0, borderRadius: 7, padding: "8px 11px", background: "#164E63", color: "#fff", fontWeight: 700, cursor: "pointer" };
const input = { width: "100%", border: "1px solid #E4E7EC", borderRadius: 7, padding: "9px 10px", font: "inherit" };

export default function SiteEditorialPanel({ site }) {
  const [drafts, setDrafts] = useState([]);
  const [topic, setTopic] = useState("");
  const [category, setCategory] = useState(site.profile.generation.categories[0] || "");
  const [checks, setChecks] = useState({});
  const [reasons, setReasons] = useState({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const endpoint = `/api/admin/sites/${encodeURIComponent(site.slug)}/editorial`;
  const loadDrafts = useCallback(async () => {
    const response = await fetch(endpoint, { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Não foi possível carregar os rascunhos.");
    setDrafts(data.drafts || []);
  }, [endpoint]);

  useEffect(() => {
    setError("");
    loadDrafts().catch((loadError) => setError(loadError.message));
  }, [loadDrafts]);

  async function submit(action, payload) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...payload }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "A operação editorial falhou.");
      setMessage(action === "generate"
        ? `Rascunho gerado por ${data.draft.provider || "IA"} e enviado para revisão.`
        : action === "approve" ? "Artigo publicado no site." : "Rascunho rejeitado.");
      if (action === "generate") setTopic("");
      await loadDrafts();
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <section style={{ ...card, display: "grid", gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 18 }}>Criar um rascunho</h2>
          <p style={{ margin: "5px 0 0", color: "#667085", fontSize: 13 }}>
            A pauta é gerada para <strong>{site.profile.name}</strong>. Todo conteúdo passa pela fila de revisão antes de ser publicado.
          </p>
        </div>
        <label style={{ display: "grid", gap: 6, color: "#344054", fontSize: 13, fontWeight: 700 }}>
          Categoria
          <select style={input} value={category} onChange={(event) => setCategory(event.target.value)}>
            {site.profile.generation.categories.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label style={{ display: "grid", gap: 6, color: "#344054", fontSize: 13, fontWeight: 700 }}>
          Pauta
          <textarea style={{ ...input, resize: "vertical" }} rows={3} minLength={8} maxLength={500}
            placeholder="Descreva com clareza o assunto que deve ser pesquisado e explicado."
            value={topic} onChange={(event) => setTopic(event.target.value)} />
        </label>
        <button type="button" disabled={busy || topic.trim().length < 8 || !category}
          onClick={() => submit("generate", { topic: topic.trim(), category })} style={{ ...button, justifySelf: "start" }}>
          {busy ? "Processando…" : "Gerar rascunho"}
        </button>
      </section>

      {error && <p role="alert" style={{ ...card, color: "#B42318" }}>{error}</p>}
      {message && <p role="status" style={{ ...card, color: "#167044" }}>{message}</p>}

      <section style={{ ...card, display: "grid", gap: 14 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 18 }}>Fila editorial ({drafts.length})</h2>
          <p style={{ margin: "5px 0 0", color: "#667085", fontSize: 13 }}>
            Confira o texto e as referências antes de aprovar. A publicação adiciona o artigo ao sitemap deste site.
          </p>
        </div>
        {!drafts.length && <p style={{ margin: 0, color: "#667085", fontSize: 13 }}>Nenhum rascunho aguardando revisão.</p>}
        {drafts.map((draft) => {
          const checked = checks[draft.id] || {};
          const issues = draft.validationIssues || [];
          const canApprove = checked.facts === true && checked.sources === true && issues.length === 0;
          return (
            <article key={draft.id} style={{ border: "1px solid #E4E7EC", borderRadius: 10, padding: 14, display: "grid", gap: 12 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16 }}>{draft.title}</h3>
                <p style={{ margin: "5px 0 0", color: "#667085", fontSize: 12 }}>{draft.category} · {draft.file} · {draft.status}</p>
              </div>
              {issues.length > 0 && (
                <div role="alert" style={{ padding: 10, borderRadius: 8, background: "#FFF4E5", color: "#9A5B00", fontSize: 13 }}>
                  <strong>Validações pendentes:</strong> {issues.join("; ")}
                </div>
              )}
              <details>
                <summary style={{ cursor: "pointer", color: "#164E63", fontWeight: 700 }}>Ler rascunho completo</summary>
                <pre style={{ maxHeight: 420, overflow: "auto", whiteSpace: "pre-wrap", overflowWrap: "anywhere", padding: 12, background: "#F8FAFC", borderRadius: 8, font: "13px/1.6 ui-monospace, monospace" }}>{draft.content}</pre>
              </details>
              {!!draft.sourceUrls?.length && (
                <div style={{ display: "grid", gap: 5, fontSize: 13 }}>
                  <strong>Referências incluídas</strong>
                  {draft.sourceUrls.map((url) => <a key={url} href={url} target="_blank" rel="noreferrer">{url}</a>)}
                </div>
              )}
              <label style={{ display: "flex", gap: 8, alignItems: "flex-start", color: "#344054", fontSize: 13 }}>
                <input type="checkbox" checked={checked.facts === true} onChange={(event) => setChecks((current) => ({ ...current, [draft.id]: { ...current[draft.id], facts: event.target.checked } }))} />
                Revisei os fatos e o conteúdo integral do rascunho.
              </label>
              <label style={{ display: "flex", gap: 8, alignItems: "flex-start", color: "#344054", fontSize: 13 }}>
                <input type="checkbox" checked={checked.sources === true} onChange={(event) => setChecks((current) => ({ ...current, [draft.id]: { ...current[draft.id], sources: event.target.checked } }))} />
                Revisei as fontes e referências do conteúdo.
              </label>
              <label style={{ display: "grid", gap: 6, color: "#344054", fontSize: 13, fontWeight: 700 }}>
                Motivo (necessário para rejeitar)
                <input style={input} value={reasons[draft.id] || ""} onChange={(event) => setReasons((current) => ({ ...current, [draft.id]: event.target.value }))} />
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                <button type="button" disabled={busy || !canApprove}
                  onClick={() => submit("approve", { draftId: draft.id, verifiedFacts: true, verifiedSources: true })}
                  style={{ ...button, opacity: canApprove ? 1 : 0.55 }}>Aprovar e publicar</button>
                <button type="button" disabled={busy || !(reasons[draft.id] || "").trim()}
                  onClick={() => submit("reject", { draftId: draft.id, reason: reasons[draft.id] })}
                  style={{ ...button, background: "#fff", color: "#B42318", border: "1px solid #FDA29B" }}>Rejeitar</button>
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}
