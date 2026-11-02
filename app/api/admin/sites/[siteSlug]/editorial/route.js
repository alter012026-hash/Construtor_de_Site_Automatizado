import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { checkAdminAuth } from "../../../../../../lib/admin-auth";
import { commitFile, getFile } from "../../../../../../lib/github-commit";
import { buildArticleFile, generateValidatedArticle, validateArticleForProfile } from "../../../../../../lib/article-generator";
import { getEditorialStatePath } from "../../../../../../lib/editorial-state";
import { fetchOfficialSources } from "../../../../../../lib/official-source-fetcher";
import { normalizeOfficialSources } from "../../../../../../lib/source-validation";
import { getRegisteredSite } from "../../../../../../lib/site-registry";

export const runtime = "nodejs";

const isGitHubPersistence = () =>
  process.env.VERCEL === "1" && process.env.GITHUB_TOKEN && process.env.GITHUB_REPO;

function localStatePath(fileName, contentDirectory) {
  const repoPath = getEditorialStatePath(fileName, contentDirectory);
  return path.join(process.cwd(), ...repoPath.split("/"));
}

async function readState(fileName, contentDirectory, fallback) {
  const repoPath = getEditorialStatePath(fileName, contentDirectory);
  if (isGitHubPersistence()) {
    const remote = await getFile(repoPath);
    if (!remote?.content) return fallback;
    const parsed = JSON.parse(remote.content);
    return parsed;
  }

  const filePath = localStatePath(fileName, contentDirectory);
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

async function writeState(fileName, contentDirectory, value, message) {
  const repoPath = getEditorialStatePath(fileName, contentDirectory);
  const content = `${JSON.stringify(value, null, 2)}\n`;
  if (isGitHubPersistence()) {
    await commitFile(repoPath, content, message);
    return;
  }

  const filePath = localStatePath(fileName, contentDirectory);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, "utf8");
}

async function publishArticle(fileName, contentDirectory, content, message) {
  const repoPath = `${contentDirectory}/${fileName}`;
  if (isGitHubPersistence()) {
    const existing = await getFile(repoPath);
    if (existing) throw new Error("Já existe um artigo com esse endereço. Gere uma nova versão antes de publicar.");
    await commitFile(repoPath, content, message);
    return;
  }

  const filePath = path.join(process.cwd(), ...repoPath.split("/"));
  if (fs.existsSync(filePath)) {
    throw new Error("Já existe um artigo com esse endereço. Gere uma nova versão antes de publicar.");
  }
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, "utf8");
}

export async function GET(_request, { params }) {
  if (!checkAdminAuth()) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const { siteSlug } = await params;
    const site = getRegisteredSite(siteSlug);
    if (!site) return NextResponse.json({ error: "Site não encontrado." }, { status: 404 });

    const drafts = await readState("editorial-drafts.json", site.profile.contentDirectory, []);
    if (!Array.isArray(drafts)) throw new Error("A fila editorial deste site precisa conter uma lista.");
    return NextResponse.json({
      drafts: drafts.filter((draft) => ["NEEDS_REVIEW", "VALIDATION_FAILED"].includes(draft.status)),
    });
  } catch (error) {
    console.error("[admin/sites/editorial][GET]", error);
    return NextResponse.json({ error: error.message || "Não foi possível carregar os rascunhos." }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  if (!checkAdminAuth()) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const { siteSlug } = await params;
    const site = getRegisteredSite(siteSlug);
    if (!site) return NextResponse.json({ error: "Site não encontrado." }, { status: 404 });

    const payload = await request.json();
    const drafts = await readState("editorial-drafts.json", site.profile.contentDirectory, []);
    if (!Array.isArray(drafts)) throw new Error("A fila editorial deste site precisa conter uma lista.");

    if (payload.action === "generate") {
      const topic = String(payload.topic || "").trim();
      const category = String(payload.category || "").trim();
      if (topic.length < 8 || topic.length > 500) {
        return NextResponse.json({ error: "A pauta deve ter entre 8 e 500 caracteres." }, { status: 400 });
      }
      if (!site.profile.generation.categories.includes(category)) {
        return NextResponse.json({ error: "Selecione uma categoria configurada para este site." }, { status: 400 });
      }

      const signatures = await readState("content-signatures.json", site.profile.contentDirectory, []);
      if (!Array.isArray(signatures)) throw new Error("As assinaturas editoriais deste site precisam conter uma lista.");
      const result = await generateValidatedArticle({
        topic,
        category,
        generation: site.profile.generation,
        existingSignatures: signatures.map((entry) => ({ slug: entry.slug, words: entry.words })),
        profile: site.profile,
      });
      const article = buildArticleFile({
        title: result.title,
        body: result.body,
        topic,
        category,
      });
      const generatedAt = new Date().toISOString();
      const draft = {
        id: `${site.slug}-${article.date}-${article.slug}`,
        file: article.file,
        targetFile: null,
        title: article.normalizedTitle,
        slug: article.slug,
        category: article.category,
        topic,
        content: article.content,
        sourceUrls: [...new Set(
          [...article.content.matchAll(/\]\((https?:\/\/[^)\s]+)\)/g)].map((match) => match[1])
        )],
        validationIssues: result.issues,
        status: "NEEDS_REVIEW",
        generatedAt,
        history: [
          { status: "DRAFT_GENERATED", at: generatedAt },
          { status: "NEEDS_REVIEW", at: generatedAt },
        ],
      };
      drafts.unshift(draft);
      await writeState(
        "editorial-drafts.json",
        site.profile.contentDirectory,
        drafts.slice(0, 400),
        `editorial: gerar rascunho para ${site.profile.name} (${article.file})`
      );
      await writeState(
        "quality-log.json",
        site.profile.contentDirectory,
        [...await readState("quality-log.json", site.profile.contentDirectory, []), {
          timestamp: generatedAt,
          file: article.file,
          slug: article.slug,
          title: article.normalizedTitle,
          category: article.category,
          provider: result.provider,
          wordCount: result.wordCount,
          fillerCount: result.fillerCount,
          similarity: Math.round(result.maxSim * 100),
          similarTo: result.mostSimilarSlug,
          status: "NEEDS_REVIEW",
          issues: result.issues,
        }].slice(-400),
        `quality: registrar rascunho de ${site.profile.name}`
      );

      return NextResponse.json({
        ok: true,
        draft: { ...draft, provider: result.provider, wordCount: result.wordCount },
      });
    }

    const draftIndex = drafts.findIndex((draft) => draft.id === payload.draftId);
    if (draftIndex < 0) return NextResponse.json({ error: "Rascunho não encontrado." }, { status: 404 });
    const draft = drafts[draftIndex];
    if (draft.status !== "NEEDS_REVIEW" || draft.targetFile) {
      return NextResponse.json({ error: "Este rascunho não está aguardando publicação." }, { status: 409 });
    }

    if (payload.action === "reject") {
      const reason = String(payload.reason || "").trim();
      if (!reason) return NextResponse.json({ error: "Informe o motivo da rejeição." }, { status: 400 });
      const reviewedAt = new Date().toISOString();
      drafts[draftIndex] = {
        ...draft,
        status: "REJECTED",
        rejectionReason: reason.slice(0, 1000),
        history: [...(draft.history || []), { status: "REJECTED", at: reviewedAt, reason: reason.slice(0, 1000) }],
      };
      await writeState(
        "editorial-drafts.json",
        site.profile.contentDirectory,
        drafts,
        `editorial: rejeitar rascunho (${draft.file})`
      );
      return NextResponse.json({ ok: true, status: "REJECTED" });
    }

    if (payload.action !== "approve") {
      return NextResponse.json({ error: "Ação editorial inválida." }, { status: 400 });
    }
    if (payload.verifiedFacts !== true || payload.verifiedSources !== true) {
      return NextResponse.json({ error: "Confirme a revisão dos fatos e das fontes antes de publicar." }, { status: 400 });
    }
    if (draft.validationIssues?.length) {
      return NextResponse.json({
        error: "O rascunho tem problemas nas validações automáticas e não pode ser publicado.",
      }, { status: 409 });
    }
    const safetyIssues = validateArticleForProfile(draft.content, site.profile);
    if (safetyIssues.length) {
      return NextResponse.json({ error: `O conteúdo não passou nas validações: ${safetyIssues.join("; ")}.` }, { status: 409 });
    }

    const sourcesRequired = site.profile.modules?.health === true || site.profile.editorial?.requireSources === true;
    if (sourcesRequired) {
      const sources = normalizeOfficialSources(draft.sourceUrls, site.profile.officialSourceDomains);
      if (!sources.length) {
        return NextResponse.json({ error: "Adicione ao menos uma fonte HTTPS permitida antes de publicar." }, { status: 400 });
      }
      const checked = await fetchOfficialSources(sources, site.profile.officialSourceDomains);
      if (checked.failures.length) {
        return NextResponse.json({ error: "Uma ou mais fontes não puderam ser verificadas novamente." }, { status: 422 });
      }
    }

    const safeFile = String(draft.file || "");
    if (!/^\d{4}-\d{2}-\d{2}-[a-z0-9-]+\.md$/i.test(safeFile)) {
      return NextResponse.json({ error: "O nome do arquivo do rascunho é inválido." }, { status: 400 });
    }
    const publishedAt = new Date().toISOString();
    await publishArticle(
      safeFile,
      site.profile.contentDirectory,
      draft.content,
      `publish: ${site.profile.name} — ${draft.title}`
    );
    drafts[draftIndex] = {
      ...draft,
      status: "PUBLISHED",
      publishedAt,
      history: [...(draft.history || []), { status: "APPROVED", at: publishedAt }, { status: "PUBLISHED", at: publishedAt }],
    };
    await writeState(
      "editorial-drafts.json",
      site.profile.contentDirectory,
      drafts,
      `editorial: publicar rascunho (${safeFile})`
    );
    const signatures = await readState("content-signatures.json", site.profile.contentDirectory, []);
    await writeState(
      "content-signatures.json",
      site.profile.contentDirectory,
      [...signatures, { slug: draft.slug, words: draft.content.split(/\s+/).length }].slice(-400),
      `quality: atualizar assinaturas de ${site.profile.name}`
    );

    return NextResponse.json({ ok: true, status: "PUBLISHED", url: `/sites/${site.slug}/blog/${draft.slug}` });
  } catch (error) {
    console.error("[admin/sites/editorial][POST]", error);
    return NextResponse.json({ error: error.message || "Não foi possível processar o conteúdo editorial." }, { status: 500 });
  }
}
