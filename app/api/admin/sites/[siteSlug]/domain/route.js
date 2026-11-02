import { NextResponse } from "next/server";
import { checkAdminAuth } from "../../../../../../lib/admin-auth";
import { getFile } from "../../../../../../lib/github-commit";
import { getRegisteredSite } from "../../../../../../lib/site-registry";

export const runtime = "nodejs";

function vercelApiUrl(pathname) {
  const url = new URL(`https://api.vercel.com${pathname}`);
  const teamId = process.env.VERCEL_TEAM_ID?.trim();
  if (teamId) url.searchParams.set("teamId", teamId);
  return url;
}

export async function POST(_request, { params }) {
  if (!checkAdminAuth()) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const { siteSlug } = await params;
    let site = getRegisteredSite(siteSlug);
    if (process.env.VERCEL === "1" && process.env.GITHUB_TOKEN && process.env.GITHUB_REPO) {
      const remoteRegistry = await getFile("data/sites.json");
      if (remoteRegistry?.content) {
        const registry = JSON.parse(remoteRegistry.content);
        site = registry.sites.find((entry) => entry.slug === siteSlug && entry.profile) || null;
      }
    }
    if (!site) return NextResponse.json({ error: "Site não encontrado." }, { status: 404 });

    const domain = site.profile.customDomain?.trim().toLowerCase();
    if (!domain) {
      return NextResponse.json({ error: "Salve um domínio personalizado no perfil antes de conectá-lo." }, { status: 400 });
    }

    const token = process.env.VERCEL_TOKEN?.trim();
    const projectId = process.env.VERCEL_PROJECT_ID?.trim();
    if (!token || !projectId) {
      return NextResponse.json({
        error: "Configure VERCEL_TOKEN e VERCEL_PROJECT_ID nas variáveis de ambiente do hub.",
      }, { status: 503 });
    }

    const response = await fetch(vercelApiUrl(`/v10/projects/${encodeURIComponent(projectId)}/domains`), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: domain }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = data.error?.message || `A API da Vercel respondeu com HTTP ${response.status}.`;
      return NextResponse.json({ error: message }, { status: response.status >= 500 ? 502 : response.status });
    }

    return NextResponse.json({
      ok: true,
      domain,
      verified: data.verified === true,
      verification: Array.isArray(data.verification) ? data.verification : [],
      message: data.verified
        ? "Domínio conectado e verificado na Vercel."
        : "Domínio adicionado à Vercel. Conclua a configuração DNS indicada no painel de domínios da Vercel.",
    });
  } catch (error) {
    console.error("[admin/sites/domain][POST]", error);
    return NextResponse.json({ error: error.message || "Não foi possível conectar o domínio." }, { status: 500 });
  }
}
