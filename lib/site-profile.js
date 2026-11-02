const siteProfile = require("../data/site-profile.json");

const MAX_PROFILE_BYTES = 100_000;

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function sanitizeValue(value, depth = 0) {
  if (depth > 8) return null;
  if (typeof value === "string") return value.slice(0, 4000);
  if (typeof value === "number" || typeof value === "boolean" || value === null) return value;
  if (Array.isArray(value)) return value.slice(0, 100).map((item) => sanitizeValue(item, depth + 1));
  if (isPlainObject(value)) {
    return Object.fromEntries(
      Object.entries(value)
        .slice(0, 100)
        .map(([key, item]) => [key.slice(0, 100), sanitizeValue(item, depth + 1)])
    );
  }
  return null;
}

function mergeProfile(base, input) {
  if (!isPlainObject(input)) return base;

  const merged = { ...base };
  for (const [key, value] of Object.entries(input)) {
    if (!(key in base)) continue;
    const current = base[key];

    if (isPlainObject(current) && isPlainObject(value)) {
      merged[key] = mergeProfile(current, value);
    } else if (Array.isArray(current) && Array.isArray(value)) {
      merged[key] = value.slice(0, 100).map((item) => sanitizeValue(item));
    } else if (typeof current === "string" && typeof value === "string") {
      merged[key] = value.slice(0, 4000);
    } else if (typeof current === "number" && Number.isFinite(value)) {
      merged[key] = value;
    } else if (typeof current === "boolean" && typeof value === "boolean") {
      merged[key] = value;
    } else if (current === null && (typeof value === "string" || value === null)) {
      merged[key] = typeof value === "string" ? value.slice(0, 1000) : null;
    }
  }
  return merged;
}

function validateSiteProfile(input) {
  if (!isPlainObject(input)) return "A configuração do site deve ser um objeto.";
  if (Buffer.byteLength(JSON.stringify(input), "utf8") > MAX_PROFILE_BYTES) {
    return "A configuração excede o tamanho máximo permitido.";
  }

  const profile = mergeProfile(siteProfile, input);
  if (!profile.name.trim()) return "Informe o nome do site.";
  if (!profile.niche.trim()) return "Informe o nicho do site.";
  if (!/^posts(?:\/[a-z0-9-]+)*$/.test(profile.contentDirectory || "")) {
    return "A pasta de conteúdo deve estar dentro de posts/ e usar apenas letras, números e hífens.";
  }
  if (typeof profile.customDomain !== "string") {
    return "O domínio próprio deve ser um texto.";
  }
  if (profile.customDomain && !/^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i.test(profile.customDomain)) {
    return "Informe o domínio sem protocolo, caminho ou porta (ex.: www.seudominio.com.br).";
  }
  if (typeof profile.logoUrl !== "string") {
    return "A URL do logo deve ser um texto.";
  }
  if (profile.logoUrl && ((!profile.logoUrl.startsWith("/") && !/^https:\/\//i.test(profile.logoUrl)) || profile.logoUrl.startsWith("//"))) {
    return "O logo deve usar um caminho público iniciado por / ou uma URL HTTPS.";
  }

  try {
    const url = new URL(profile.url);
    if (!["http:", "https:"].includes(url.protocol)) throw new Error();
  } catch {
    return "Informe uma URL válida com http:// ou https://.";
  }

  const categories = profile.generation?.categories;
  if (!Array.isArray(categories) || categories.length === 0 ||
      categories.some((item) => typeof item !== "string" || !item.trim())) {
    return "Informe ao menos uma categoria editorial.";
  }
  if (categories.length > 30) return "Configure no máximo 30 categorias.";
  const topicSeeds = profile.generation?.topicSeeds || [];
  if (!Array.isArray(topicSeeds) || topicSeeds.some((entry) =>
    !isPlainObject(entry)
      || typeof entry.category !== "string"
      || !categories.includes(entry.category)
      || !Array.isArray(entry.topics)
      || entry.topics.some((topic) => typeof topic !== "string" || !topic.trim())
  )) {
    return "As pautas devem estar associadas a uma categoria e conter textos válidos.";
  }
  if (profile.generation.minWords < 100 || profile.generation.minWords > 5000) {
    return "O tamanho mínimo dos artigos deve ficar entre 100 e 5.000 palavras.";
  }
  if (!["auto", "Cerebras", "Grok", "Groq", "OpenRouter", "Gemini"].includes(profile.generation.aiProvider || "auto")) {
    return "Selecione um provedor de IA disponível ou use a seleção automática.";
  }
  const domains = profile.officialSourceDomains || [];
  if (!Array.isArray(domains) || domains.some((domain) =>
    typeof domain !== "string" || !/^(?:[a-z0-9-]+\.)+[a-z]{2,}$/i.test(domain)
  )) {
    return "Informe domínios válidos para as fontes permitidas (sem protocolo ou caminho).";
  }
  if (profile.editorial?.requireSources && domains.length === 0) {
    return "Cadastre ao menos um domínio permitido ou desative a exigência de fontes.";
  }
  for (const actionPath of [
    profile.homepage?.primaryActionHref,
    profile.homepage?.secondaryActionHref,
  ]) {
    if (actionPath && (!actionPath.startsWith("/") || actionPath.startsWith("//"))) {
      return "Os destinos dos botões da página inicial devem ser caminhos internos iniciados por /.";
    }
  }
  if (profile.brand && Object.values(profile.brand).some((color) =>
    typeof color !== "string" || !/^#[0-9a-f]{6}$/i.test(color)
  )) {
    return "Informe as cores da marca no formato hexadecimal #RRGGBB.";
  }
  if (profile.seo?.googleSiteVerification && !/^[a-z0-9_-]+$/i.test(profile.seo.googleSiteVerification)) {
    return "O código de verificação do Google contém caracteres inválidos.";
  }
  if (profile.seo?.googleAnalyticsId && !/^G-[A-Z0-9]+$/i.test(profile.seo.googleAnalyticsId)) {
    return "Informe um ID de medição GA4 válido no formato G-XXXXXXXXXX.";
  }
  if (Object.values(profile.modules || {}).some((enabled) => typeof enabled !== "boolean")) {
    return "As opções de módulos devem ser verdadeiras ou falsas.";
  }

  return null;
}

function createGenericSiteProfile({ name = "Novo site", niche = "Defina seu nicho", slug = "novo-site" } = {}) {
  return mergeProfile(siteProfile, {
    name,
    niche,
    contentDirectory: `posts/${slug}`,
    url: `https://example.com/sites/${slug}`,
    tagline: "Conteúdo claro e útil para quem busca informação confiável.",
    description: "Apresente o propósito do site, o público que atende e o valor dos conteúdos.",
    contactEmail: "",
    keywords: [],
    affiliates: [],
    adsense: {
      enabled: false,
      publisherId: "",
      slots: { header: "", inArticle: "", sidebar: "", articleEnd: "" },
    },
    seo: { twitterHandle: null, ogImage: "/og-default.svg", googleSiteVerification: "", googleAnalyticsId: "" },
    author: {
      name: "Redação",
      bio: "Equipe responsável pela pesquisa, produção e revisão dos conteúdos.",
      avatar: null,
    },
    editorial: {
      audience: "Público interessado no tema",
      tone: "Claro, útil, confiável e direto",
      contentRules: [
        "Não invente fatos, dados, estatísticas ou fontes.",
        "Explique termos técnicos e escreva para o público definido.",
        "Todo conteúdo deve passar por revisão humana antes da publicação.",
      ],
      requireSources: false,
    },
    modules: { officialSources: false, newsletter: false, affiliates: false },
    homepage: {
      heroTitle: "Conteúdo útil para o seu dia a dia.",
      heroDescription: "Apresente aqui o que os leitores encontrarão neste site.",
      primaryActionLabel: "Explorar conteúdos",
      primaryActionHref: "/blog",
      secondaryActionLabel: "",
      secondaryActionHref: "/sobre",
      notice: "",
    },
    methodology: {
      summary: "Conteúdo informativo, produzido com responsabilidade e revisado antes da publicação.",
    },
    generation: {
      tone: "Claro, útil, confiável e direto",
      audienceLevel: "Público interessado no tema",
      categories: ["Guias", "Dúvidas frequentes", "Novidades"],
      topicSeeds: [],
    },
    officialSourceDomains: [],
    navigation: [],
    footerNavigation: [],
    quickStart: { title: "", items: [] },
  });
}

module.exports = {
  mergeProfile,
  validateSiteProfile,
  createGenericSiteProfile,
  isModuleEnabled: (name, profile = siteProfile) => profile.modules?.[name] === true,
};
