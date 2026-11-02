const test = require("node:test");
const assert = require("node:assert/strict");
const defaultProfile = require("../data/site-profile.json");
const { mergeProfile, validateSiteProfile } = require("../lib/site-profile");
const { getEditorialStatePath } = require("../lib/editorial-state");
const { buildPrompt, validateArticleForProfile } = require("../lib/article-generator");

function genericProfile() {
  return mergeProfile(defaultProfile, {
    name: "Guia de Jardinagem",
    niche: "jardinagem para iniciantes",
    modules: {
      health: false,
      medicationSummary: false,
      officialSources: false,
    },
    editorial: {
      audience: "pessoas que cuidam de plantas em casa",
      tone: "prático, acessível e acolhedor",
      contentRules: ["Não invente fatos."],
      requireSources: false,
    },
    methodology: { summary: "Conteúdo informativo com revisão editorial." },
    generation: {
      categories: ["Guias", "Plantas de interior"],
      topicSeeds: [],
    },
    officialSourceDomains: [],
  });
}

test("generic profile accepts an independent niche without health-only modules", () => {
  const profile = genericProfile();
  assert.equal(validateSiteProfile(profile), null);
});

test("medication summary cannot be enabled without the health module", () => {
  const profile = genericProfile();
  profile.modules.medicationSummary = true;
  assert.match(validateSiteProfile(profile), /módulo de resumo de bula/i);
});

test("generic profile accepts only topic ideas assigned to configured categories", () => {
  const profile = genericProfile();
  profile.generation.topicSeeds = [{ category: "Guias", topics: ["Como cuidar de plantas"] }];
  assert.equal(validateSiteProfile(profile), null);

  profile.generation.topicSeeds = [{ category: "Categoria inexistente", topics: ["Uma pauta"] }];
  assert.match(validateSiteProfile(profile), /pautas devem estar associadas/i);
});

test("editorial state stays compatible for Bula and is isolated for other niches", () => {
  assert.equal(getEditorialStatePath("quality-log.json", "posts"), ".quality-log.json");
  assert.equal(
    getEditorialStatePath("quality-log.json", "posts/novo-site"),
    ".editorial-state/novo-site/quality-log.json"
  );
  assert.throws(() => getEditorialStatePath("../secrets.json", "posts/novo-site"));
  assert.throws(() => getEditorialStatePath("quality-log.json", "posts/../secrets"));
});

test("generic article prompts use the configured niche instead of the health template", () => {
  const profile = genericProfile();
  const prompt = buildPrompt({
    topic: "Como escolher plantas para ambientes com pouca luz",
    category: "Plantas de interior",
    generation: profile.generation,
    profile,
  });

  assert.match(prompt, /Guia de Jardinagem/);
  assert.match(prompt, /jardinagem para iniciantes/);
  assert.doesNotMatch(prompt, /Descomplica Bula|bula oficial|SAMU|Disque-Intoxicação/i);
});

test("generic article validation does not impose medical safety sections", () => {
  const profile = genericProfile();
  assert.deepEqual(
    validateArticleForProfile("## Introdução\n\nConteúdo geral sobre plantas.", profile),
    []
  );
});
