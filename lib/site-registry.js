const fs = require("fs");
const path = require("path");

function resolveRegistryPath() {
  for (const startDirectory of [__dirname, process.cwd()]) {
    let directory = startDirectory;
    while (true) {
      const candidate = path.join(directory, "data", "sites.json");
      if (fs.existsSync(candidate)) return candidate;

      const parent = path.dirname(directory);
      if (parent === directory) break;
      directory = parent;
    }
  }

  throw new Error("Não foi possível localizar data/sites.json.");
}

function readSiteRegistry(filePath = resolveRegistryPath()) {
  const registry = JSON.parse(fs.readFileSync(filePath, "utf8"));
  if (registry?.version !== 1 || !Array.isArray(registry.sites)) {
    throw new Error("O cadastro de sites precisa ter versão 1 e uma lista de sites.");
  }
  return registry;
}

function resolveSiteProfile(site) {
  if (site.profile && typeof site.profile === "object") return site.profile;
  return null;
}

function getRegisteredSites({ includeInactive = true } = {}) {
  return readSiteRegistry().sites
    .map((site) => ({ ...site, profile: resolveSiteProfile(site) }))
    .filter((site) => site.profile && (includeInactive || site.active === true));
}

function getRegisteredSite(slug, { includeInactive = true } = {}) {
  if (typeof slug !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return null;
  return getRegisteredSites({ includeInactive }).find((site) => site.slug === slug) || null;
}

function getSitePublicUrl(site) {
  const domain = site?.profile?.customDomain?.trim();
  if (domain) return `https://${domain}`;

  const configuredOrigin = process.env.NEXT_PUBLIC_SITE_URL
    || (process.env.VERCEL_PROJECT_PRODUCTION_URL && `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`)
    || (process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`)
    || "http://localhost:3000";
  return new URL(`/sites/${site.slug}`, configuredOrigin).toString().replace(/\/$/, "");
}

function validateSiteSlug(slug) {
  return typeof slug === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)
    ? null
    : "Use um identificador curto, com letras minúsculas, números e hífens.";
}

function validateSiteRegistry(sites) {
  if (!Array.isArray(sites) || sites.length > 100) {
    return "O hub pode administrar até 100 sites.";
  }

  const seenSlugs = new Set();
  for (const site of sites) {
    if (!site || validateSiteSlug(site.slug)) return "Um site tem um identificador inválido.";
    if (seenSlugs.has(site.slug)) return `O identificador "${site.slug}" está duplicado.`;
    seenSlugs.add(site.slug);
    if (typeof site.active !== "boolean") return `Defina se o site "${site.slug}" está ativo.`;
  }

  return null;
}

module.exports = {
  getRegisteredSite,
  getRegisteredSites,
  getSitePublicUrl,
  readSiteRegistry,
  validateSiteRegistry,
  validateSiteSlug,
};
