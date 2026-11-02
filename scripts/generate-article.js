#!/usr/bin/env node
/**
 * generate-article.js
 * Gera artigos para um site registrado no hub.
 *
 * A lógica de geração (prompt, providers, validação de qualidade) vive em
 * lib/article-generator.js e é compartilhada com app/api/admin/quality/route.js
 * (que usa o mesmo núcleo, mas persiste via GitHub API em vez de fs, porque
 * roda dentro de uma function serverless da Vercel).
 *
 * Este script é o "modo CLI": roda em VPS/local/GitHub Actions e grava
 * artigos na fila editorial isolada do site; a publicação exige aprovação no admin.
 *
 *  - Título sempre em Title Case
 *  - Excerpt nunca corta no meio da palavra/frase
 *  - Não repete tópicos recentes nem gera conteúdo quase-idêntico a posts existentes
 *  - Valida qualidade (tamanho, frases genéricas, similaridade) e tenta de novo se reprovar
 *  - Loga cada geração em .quality-log.json (lido pelo painel admin)
 *  - Suporta --force-file <nome.md> para gerar uma atualização em revisão,
 *    sem substituir o artigo publicado antes da aprovação
 */

require("dotenv").config({ path: ".env.local", override: false });

const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");
const qe = require("../lib/quality-engine.js");
const ag = require("../lib/article-generator.js");
const { getLocalEditorialStatePath } = require("../lib/editorial-state.js");

// ─────────────────────────────────────────────
// SAFE CONFIG LOADER (mantido do original)
// ─────────────────────────────────────────────
const initialArgs = process.argv.slice(2);
const siteArg = initialArgs.includes("--site")
  ? initialArgs[initialArgs.indexOf("--site") + 1]
  : null;
if (!siteArg) throw new Error("Informe o site do hub com --site <slug>.");
const { getRegisteredSite } = require("../lib/site-registry.js");
const site = getRegisteredSite(siteArg);
if (!site) throw new Error(`O site "${siteArg}" não existe no cadastro do hub.`);
const siteConfig = site.profile;
const generation = siteConfig?.generation || {};

const CATEGORIES = generation.categories || [];

// ─── CLI ──────────────────────────────────────────────────────────────
const args = initialArgs;

const topicArg = args.includes("--topic")
  ? args[args.indexOf("--topic") + 1]
  : null;
const categoryArg = args.includes("--category")
  ? args[args.indexOf("--category") + 1]
  : null;

const countArg = args.includes("--count")
  ? parseInt(args[args.indexOf("--count") + 1], 10)
  : (generation.articlesPerRun || 1);

// regenera o conteúdo de um post já publicado, mantendo filename/data/categoria
const forceFileArg = args.includes("--force-file")
  ? args[args.indexOf("--force-file") + 1]
  : null;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ─── Paths ────────────────────────────────────────────────────────────
const postsDir = path.resolve(__dirname, "..", siteConfig.contentDirectory);
const getStatePath = (fileName) => getLocalEditorialStatePath(
  fileName,
  siteConfig.contentDirectory,
  path.resolve(__dirname, "..")
);
const editorialDraftsPath = getStatePath("editorial-drafts.json");
const usedTopicsLogPath = getStatePath("used-topics.json");
const signaturesLogPath = getStatePath("content-signatures.json");
const qualityLogPath = getStatePath("quality-log.json");

// ─── Helpers ──────────────────────────────────────────────────────────
function loadJson(filePath, fallback) {
  if (!fs.existsSync(filePath)) return fallback;
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function saveJson(filePath, data, keepLast = 400) {
  const arr = Array.isArray(data) ? data.slice(-keepLast) : data;
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(arr, null, 2), "utf8");
}

function getExistingSlugs() {
  if (!fs.existsSync(postsDir)) return new Set();
  return new Set(
    fs.readdirSync(postsDir)
      .filter((f) => f.endsWith(".md"))
      .map((f) => qe.slugFromFileName(f))
  );
}

function appendQualityLog(entry) {
  const log = loadJson(qualityLogPath, []);
  log.push({ timestamp: new Date().toISOString(), ...entry });
  saveJson(qualityLogPath, log);
}

function saveSignature(slug, words) {
  const signatures = loadJson(signaturesLogPath, []);
  signatures.push({ slug, words });
  saveJson(signaturesLogPath, signatures);
}

function getExistingSignatures() {
  return loadJson(signaturesLogPath, []);
}

function saveEditorialDraft(article, result, topic) {
  const drafts = loadJson(editorialDraftsPath, []);
  const sourceUrls = [...new Set((result.verifiedSources || []).map((source) => source.url))];
  const existingIndex = drafts.findIndex((draft) => draft.file === article.file);
  const previousHistory = existingIndex >= 0 ? drafts[existingIndex].history || [] : [];
  const draft = {
    id: `${article.date}-${article.slug}`,
    file: article.file,
    targetFile: fs.existsSync(path.join(postsDir, article.file)) ? article.file : null,
    title: article.normalizedTitle,
    slug: article.slug,
    category: article.category,
    topic,
    content: article.content,
    sourceUrls,
    sourceCheckedAt: result.verifiedSources?.[0]?.fetchedAt || null,
    verifiedSources: (result.verifiedSources || []).map(({ url, host, fetchedAt, characterCount }) => ({
      url, host, fetchedAt, characterCount,
    })),
    validationIssues: result.issues,
    status: "NEEDS_REVIEW",
    generatedAt: new Date().toISOString(),
    history: [
      ...previousHistory,
      { status: "DRAFT_GENERATED", at: new Date().toISOString() },
      { status: "NEEDS_REVIEW", at: new Date().toISOString() },
    ],
  };

  if (existingIndex >= 0) drafts[existingIndex] = draft;
  else drafts.unshift(draft);
  fs.mkdirSync(path.dirname(editorialDraftsPath), { recursive: true });
  fs.writeFileSync(editorialDraftsPath, `${JSON.stringify(drafts.slice(0, 400), null, 2)}\n`, "utf8");
}

// ─── Tópicos ──────────────────────────────────────────────────────────
const SEEDS = Object.fromEntries(CATEGORIES.map((category) => [
  category,
  generation.topicSeeds?.find((entry) => entry.category === category)?.topics || [],
]));

function buildTopic() {
  if (topicArg) {
    if (categoryArg && !CATEGORIES.includes(categoryArg)) {
      throw new Error(`Categoria inválida: ${categoryArg}`);
    }
    const category = categoryArg || CATEGORIES[0];
    if (!category) throw new Error("Configure ao menos uma categoria editorial no perfil do site.");
    return { topic: topicArg, category };
  }
  if (categoryArg && !CATEGORIES.includes(categoryArg)) {
    throw new Error(`Categoria inválida: ${categoryArg}`);
  }
  if (!CATEGORIES.length) throw new Error("Configure ao menos uma categoria editorial no perfil do site.");
  const categories = categoryArg ? [categoryArg] : CATEGORIES;
  const usedTopics = loadJson(usedTopicsLogPath, []);
  const existingSlugs = getExistingSlugs();
  const available = categories.flatMap((category) =>
    (SEEDS[category] || [])
      .filter((topic) => !usedTopics.includes(topic) && !existingSlugs.has(ag.slugify(topic)))
      .map((topic) => ({ topic, category }))
  );
  if (!available.length) {
    throw new Error("Não há pautas inéditas configuradas. Adicione tópicos ao perfil do site ou informe --topic.");
  }
  return ag.randomItem(available);
}

// ─── Save ─────────────────────────────────────────────────────────────
async function saveArticle(result, topic, category, forceFile) {
  if (!fs.existsSync(postsDir)) fs.mkdirSync(postsDir, { recursive: true });

  let existingFrontmatter;
  if (forceFile) {
    const oldRaw = fs.readFileSync(path.join(postsDir, forceFile), "utf8");
    const frontmatterEnd = oldRaw.indexOf("\n---", 3);
    const oldData = frontmatterEnd >= 0 ? yaml.load(oldRaw.slice(3, frontmatterEnd)) : {};

    existingFrontmatter = {
      date: oldData?.date,
      category: oldData?.category,
      curiosity: oldData?.curiosity,
      takeaways: Array.isArray(oldData?.takeaways) ? oldData.takeaways : [],
    };
  }

  // Curiosidade pro card "💡 Curiosidade" — gerada 1x aqui, junto com o
  // artigo, e nunca em runtime. Se falhar, buildArticleFile cai de volta
  // pra curiosidade anterior (regeneração) ou simplesmente omite o campo.
  const curiosity = await ag.generateCuriosity(result.body);

  // "Spoiler" do artigo (o que o leitor vai encontrar/aprender) — mesma
  // filosofia: gerado 1x aqui, com fallback pros tópicos anteriores em
  // caso de falha na regeneração.
  const takeaways = await ag.generateTakeaways(result.body);

  const article = ag.buildArticleFile({
    title: result.title,
    body: result.body,
    topic,
    category,
    forceFile,
    existingFrontmatter,
    curiosity,
    takeaways,
  });

  saveEditorialDraft(article, result, topic);
  saveSignature(article.slug, result.signature);

  appendQualityLog({
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
  });

  return article.file;
}

// ─── MAIN ─────────────────────────────────────────────────────────────
async function main() {
  console.log("🔑 CONFIG SAFE MODE");
  console.log("Categories:", CATEGORIES.length);

  // modo regeneração de post existente
  if (forceFileArg) {
    if (!topicArg) {
      console.error("❌ --force-file precisa ser usado junto com --topic");
      process.exit(1);
    }
    const filePath = path.join(postsDir, forceFileArg);
    if (!fs.existsSync(filePath)) {
      console.error(`❌ Arquivo não encontrado: ${forceFileArg}`);
      process.exit(1);
    }

    console.log(`\n🔁 Regenerando conteúdo de: ${forceFileArg}\n`);
    const raw = fs.readFileSync(filePath, "utf8");
    const frontmatterEnd = raw.indexOf("\n---", 3);
    const existingData = frontmatterEnd >= 0 ? yaml.load(raw.slice(3, frontmatterEnd)) : {};
    const category = existingData?.category;
    if (!CATEGORIES.includes(category)) {
      console.error(`❌ Categoria do artigo inválida ou não configurada: ${category || "(vazia)"}`);
      process.exit(1);
    }

    try {
      const result = await ag.generateValidatedArticle({
        topic: topicArg,
        category,
        generation,
        existingSignatures: getExistingSignatures(),
      });
      const file = await saveArticle(result, topicArg, category, forceFileArg);
      console.log(`💾 Atualizado: ${file} (${result.wordCount} palavras, via ${result.provider})`);
    } catch (err) {
      console.error(`❌ Erro ao regenerar: ${err.message}`);
      appendQualityLog({
        file: forceFileArg,
        topic: topicArg,
        status: err.code === "VALIDATION_FAILED" ? "VALIDATION_FAILED" : "erro",
        issues: err.issues || [],
        error: err.message,
      });
      process.exit(1);
    }
    return;
  }

  const count = countArg;
  if (!Number.isInteger(count) || count < 1 || count > 20) {
    throw new Error("Informe uma quantidade entre 1 e 20 para --count.");
  }

  for (let i = 0; i < count; i++) {
    const { topic, category } = buildTopic();
    console.log(`\n📝 ${i + 1}/${count}: ${topic}`);

    try {
      const result = await ag.generateValidatedArticle({
        topic,
        category,
        generation,
        existingSignatures: getExistingSignatures(),
      });
      const file = await saveArticle(result, topic, category, null);

      const used = loadJson(usedTopicsLogPath, []);
      used.push(topic);
      saveJson(usedTopicsLogPath, used, 300);

      console.log(`📝 Enviado para revisão editorial: ${file} (${result.wordCount} palavras, via ${result.provider})`);
    } catch (err) {
      console.error(`❌ Erro: ${err.message}`);
      appendQualityLog({
        topic,
        category,
        status: err.code === "VALIDATION_FAILED" ? "VALIDATION_FAILED" : "erro",
        issues: err.issues || [],
        error: err.message,
      });
    }

    if (i < count - 1) await sleep(2000);
  }
}

main().catch((err) => {
  console.error("ERRO FATAL:", err.message);
  process.exit(1);
});
