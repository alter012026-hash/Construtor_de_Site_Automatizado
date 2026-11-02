const test = require("node:test");
const assert = require("node:assert/strict");
const defaultProfile = require("../data/site-profile.json");
const { mergeProfile, validateSiteProfile, createGenericSiteProfile } = require("../lib/site-profile");
const { getEditorialStatePath } = require("../lib/editorial-state");
const { getRegisteredSite, validateSiteRegistry } = require("../lib/site-registry");
const { buildPrompt, validateArticleForProfile } = require("../lib/article-generator");

function genericProfile() {
  return mergeProfile(defaultProfile, {
    name: "Guia de Jardinagem",
    niche: "jardinagem para iniciantes",
    modules: {
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

test("generic profile accepts an independent niche without niche-specific modules", () => {
  const profile = genericProfile();
  assert.equal(validateSiteProfile(profile), null);
});

test("generic profile accepts only topic ideas assigned to configured categories", () => {
  const profile = genericProfile();
  profile.generation.topicSeeds = [{ category: "Guias", topics: ["Como cuidar de plantas"] }];
  assert.equal(validateSiteProfile(profile), null);

  profile.generation.topicSeeds = [{ category: "Categoria inexistente", topics: ["Uma pauta"] }];
  assert.match(validateSiteProfile(profile), /pautas devem estar associadas/i);
});

test("editorial state is isolated per site", () => {
  assert.equal(
    getEditorialStatePath("quality-log.json", "posts/novo-site"),
    ".editorial-state/novo-site/quality-log.json"
  );
  assert.throws(() => getEditorialStatePath("quality-log.json", "posts"));
  assert.throws(() => getEditorialStatePath("../secrets.json", "posts/novo-site"));
  assert.throws(() => getEditorialStatePath("quality-log.json", "posts/../secrets"));
});

test("the hub starts without registered sites and validates unique identifiers", () => {
  assert.equal(getRegisteredSite("site-inexistente"), null);
  assert.equal(validateSiteRegistry([
    { slug: "first-site", active: true },
    { slug: "first-site", active: false },
  ]), 'O identificador "first-site" está duplicado.');
  assert.equal(validateSiteRegistry([{ slug: "../bad", active: true }]), "Um site tem um identificador inválido.");
});

test("new sites start with a valid generic profile and no niche modules", () => {
  const profile = createGenericSiteProfile({ name: "Jardim em Casa", niche: "jardinagem", slug: "jardim-em-casa" });
  assert.equal(validateSiteProfile(profile), null);
  assert.equal(profile.contentDirectory, "posts/jardim-em-casa");
  assert.equal(profile.modules.officialSources, false);
});

test("generic article prompts use the configured niche", () => {
  const profile = genericProfile();
  const prompt = buildPrompt({
    topic: "Como escolher plantas para ambientes com pouca luz",
    category: "Plantas de interior",
    generation: profile.generation,
    profile,
  });

  assert.match(prompt, /Guia de Jardinagem/);
  assert.match(prompt, /jardinagem para iniciantes/);
});

test("generic article validation does not impose medical safety sections", () => {
  const profile = genericProfile();
  assert.deepEqual(
    validateArticleForProfile("## Introdução\n\nConteúdo geral sobre plantas.", profile),
    []
  );
});
