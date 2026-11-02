import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { checkAdminAuth } from "../../../../lib/admin-auth";
import { commitFile, getFile, triggerVercelDeploy } from "../../../../lib/github-commit";
import { createGenericSiteProfile, mergeProfile, validateSiteProfile } from "../../../../lib/site-profile";
import { validateSiteRegistry, validateSiteSlug } from "../../../../lib/site-registry";

export const runtime = "nodejs";

const REGISTRY_PATH = "data/sites.json";
const LOCAL_REGISTRY_PATH = path.join(process.cwd(), REGISTRY_PATH);
const MAX_REGISTRY_BYTES = 2_000_000;

function readLocalRegistry() {
  return JSON.parse(fs.readFileSync(LOCAL_REGISTRY_PATH, "utf8"));
}

function validateRegistry(registry) {
  const validationError = validateSiteRegistry(registry?.sites);
  if (validationError) return validationError;
  if (Buffer.byteLength(JSON.stringify(registry), "utf8") > MAX_REGISTRY_BYTES) {
    return "O cadastro de sites excedeu o tamanho máximo permitido.";
  }

  for (const site of registry.sites) {
    const profileError = validateSiteProfile(site.profile);
    if (profileError) return `Site "${site.slug}": ${profileError}`;
    if (site.profile.contentDirectory !== `posts/${site.slug}`) {
      return `A pasta de conteúdo do site "${site.slug}" deve ser posts/${site.slug}.`;
    }
  }
  return null;
}

export async function GET() {
  if (!checkAdminAuth()) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    if (process.env.VERCEL === "1" && process.env.GITHUB_TOKEN && process.env.GITHUB_REPO) {
      const remote = await getFile(REGISTRY_PATH);
      if (remote) {
        const registry = JSON.parse(remote.content);
        return NextResponse.json({
          sites: registry.sites.filter((site) => site.profile),
          revision: remote.sha,
        });
      }
    }

    const registry = readLocalRegistry();
    return NextResponse.json({
      sites: registry.sites.filter((site) => site.profile),
      revision: null,
    });
  } catch (error) {
    console.error("[admin/sites][GET]", error);
    return NextResponse.json({ error: error.message || "Não foi possível carregar os sites." }, { status: 500 });
  }
}

export async function POST(request) {
  if (!checkAdminAuth()) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const { action, slug, profile: submittedProfile, active, revision } = await request.json();
    const slugError = validateSiteSlug(slug);
    if (slugError) return NextResponse.json({ error: slugError }, { status: 400 });
    if (!["save", "set-active"].includes(action)) {
      return NextResponse.json({ error: "Ação de administração inválida." }, { status: 400 });
    }

    let registry;
    let currentRevision = revision || undefined;
    if (process.env.VERCEL === "1" && process.env.GITHUB_TOKEN && process.env.GITHUB_REPO) {
      const remote = await getFile(REGISTRY_PATH);
      if (remote) {
        if (revision && remote.sha !== revision) {
          return NextResponse.json(
            { error: "O cadastro mudou desde que você abriu o painel. Atualize a página antes de salvar novamente." },
            { status: 409 }
          );
        }
        registry = JSON.parse(remote.content);
        currentRevision = remote.sha;
      } else {
        registry = readLocalRegistry();
      }
    } else {
      registry = readLocalRegistry();
    }

    const existingIndex = registry.sites.findIndex((site) => site.slug === slug);
    if (action === "save") {
      if (!submittedProfile || typeof submittedProfile !== "object" || Array.isArray(submittedProfile)) {
        return NextResponse.json({ error: "Envie o perfil completo do site." }, { status: 400 });
      }
      const baseProfile = existingIndex >= 0
        ? registry.sites[existingIndex].profile || createGenericSiteProfile({ slug })
        : createGenericSiteProfile({ slug });
      const profile = mergeProfile(baseProfile, submittedProfile);
      const profileError = validateSiteProfile(profile);
      if (profileError) return NextResponse.json({ error: profileError }, { status: 400 });
      if (profile.contentDirectory !== `posts/${slug}`) {
        return NextResponse.json({ error: `A pasta de conteúdo deve ser posts/${slug}.` }, { status: 400 });
      }

      const site = {
        slug,
        active: typeof active === "boolean"
          ? active
          : existingIndex >= 0 && registry.sites[existingIndex].active === true,
        profile,
      };
      if (existingIndex >= 0) registry.sites[existingIndex] = site;
      else registry.sites.push(site);
    } else {
      if (typeof active !== "boolean") {
        return NextResponse.json({ error: "Informe se o site deve ficar visível ao público." }, { status: 400 });
      }
      if (existingIndex < 0) {
        return NextResponse.json({ error: "Site não encontrado." }, { status: 404 });
      }
      registry.sites[existingIndex] = { ...registry.sites[existingIndex], active };
    }

    const validationError = validateRegistry(registry);
    if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });
    const content = `${JSON.stringify(registry, null, 2)}\n`;

    if (process.env.VERCEL === "1") {
      const result = await commitFile(
        REGISTRY_PATH,
        content,
        `hub: ${action === "set-active" ? (active ? "exibir" : "ocultar") : "salvar"} site ${slug}`,
        currentRevision
      );
      const deployment = await triggerVercelDeploy();
      return NextResponse.json({
        ok: true,
        revision: result.fileSha,
        commitUrl: result.htmlUrl,
        deploymentTriggered: deployment.triggered,
        active: registry.sites.find((site) => site.slug === slug).active,
      });
    }

    fs.writeFileSync(LOCAL_REGISTRY_PATH, content, "utf8");
    return NextResponse.json({
      ok: true,
      revision: null,
      active: registry.sites.find((site) => site.slug === slug).active,
    });
  } catch (error) {
    console.error("[admin/sites][POST]", error);
    const status = error.code === "STALE_FILE" || error.code === "GITHUB_CONFLICT" ? 409 : 500;
    return NextResponse.json({ error: error.message || "Não foi possível salvar o site." }, { status });
  }
}
