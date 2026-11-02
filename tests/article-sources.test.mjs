import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { fetchOfficialSource, fetchOfficialSources, extractReadableText } = require("../lib/official-source-fetcher.js");
const { inferCategory } = require("../lib/article-categories.cjs");
const { isOfficialUrl } = require("../lib/source-validation.js");
const { buildPrompt } = require("../lib/article-generator.js");
const defaultProfile = require("../data/site-profile.json");
const categories = ["Guias", "Plantas de interior"];
const allowedDomains = ["example.gov.br"];
const longText = "Informação confiável sobre jardinagem e cultivo para ambientes domésticos. ".repeat(8);
const profile = {
  ...defaultProfile,
  name: "Jardim em Casa",
  niche: "jardinagem doméstica",
  officialSourceDomains: allowedDomains,
  editorial: { ...defaultProfile.editorial, requireSources: true },
};

test("extração de página remove scripts e preserva texto útil", () => {
  const text = extractReadableText(
    `<html><script>não usar</script><main>${longText}</main></html>`,
    "text/html"
  );
  assert.ok(text.includes("Informação confiável"));
  assert.ok(!text.includes("não usar"));
});

test("checagem aceita somente página HTTPS permitida com texto legível", async () => {
  const source = await fetchOfficialSource(
    "https://portal.example.gov.br/referencia",
    allowedDomains,
    async () => new Response(`<article>${longText}</article>`, {
      status: 200,
      headers: { "content-type": "text/html; charset=utf-8" },
    })
  );
  assert.equal(source.host, "portal.example.gov.br");
  assert.equal(source.url, "https://portal.example.gov.br/referencia");
  assert.ok(source.characterCount > 250);
});

test("checagem bloqueia redirecionamento para host não permitido", async () => {
  let requests = 0;
  await assert.rejects(
    fetchOfficialSource("https://portal.example.gov.br/redirect", allowedDomains, async () => {
      requests += 1;
      return new Response(null, {
        status: 302,
        headers: { location: "http://127.0.0.1/admin" },
      });
    }),
    /domínio não permitido/
  );
  assert.equal(requests, 1);
});

test("fontes permitidas precisam usar HTTPS e a porta HTTPS padrão", () => {
  assert.equal(isOfficialUrl("https://portal.example.gov.br/reference", allowedDomains), true);
  assert.equal(isOfficialUrl("http://portal.example.gov.br/reference", allowedDomains), false);
  assert.equal(isOfficialUrl("https://portal.example.gov.br:8443/reference", allowedDomains), false);
});

test("fontes parciais reportam falhas sem descartar a fonte acessível", async () => {
  const result = await fetchOfficialSources([
    "https://portal.example.gov.br/ok",
    "https://outro.example.gov.br/unavailable",
  ], allowedDomains, async (url) => (
    String(url).includes("/ok")
      ? new Response(`<main>${longText}</main>`, {
        status: 200,
        headers: { "content-type": "text/html" },
      })
      : new Response("indisponível", { status: 503 })
  ));
  assert.equal(result.verified.length, 1);
  assert.equal(result.failures.length, 1);
});

test("categoria inferida para uma pauta usa os seeds configurados", () => {
  const inferred = inferCategory(
    "como escolher plantas para ambientes com pouca luz",
    {
      Guias: ["como começar uma horta em casa"],
      "Plantas de interior": ["como escolher plantas para ambientes internos"],
    },
    categories
  );
  assert.equal(inferred, "Plantas de interior");
});

test("tema fora das pautas cadastradas não recebe categoria arbitrária", () => {
  assert.equal(
    inferCategory("astronomia para iniciantes", { Guias: ["plantas para casas"], "Plantas de interior": [] }, categories),
    null
  );
});

test("prompt inclui a categoria e a evidência checada", () => {
  const prompt = buildPrompt({
    topic: "como escolher plantas para locais pouco iluminados",
    category: "Plantas de interior",
    generation: { categories, minWords: 200 },
    profile,
    officialSources: [{
      url: "https://portal.example.gov.br/reference",
      text: "Informação confiável sobre plantas para ambientes internos.",
    }],
  });
  assert.match(prompt, /Categoria definida: "Plantas de interior"/);
  assert.match(prompt, /FONTES PERMITIDAS CHECADAS/);
  assert.match(prompt, /Informação confiável sobre plantas para ambientes internos/);
});
