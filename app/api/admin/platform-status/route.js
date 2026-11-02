import { NextResponse } from "next/server";
import { checkAdminAuth } from "../../../../lib/admin-auth";
import { getRegisteredSites } from "../../../../lib/site-registry";

export const runtime = "nodejs";

const AI_PROVIDERS = [
  ["Cerebras", "CEREBRAS_API_KEY"],
  ["Grok", "GROK_API_KEY"],
  ["Groq", "GROQ_API_KEY"],
  ["OpenRouter", "OPENROUTER_API_KEY"],
  ["Gemini", "GEMINI_API_KEY"],
];

export async function GET() {
  if (!checkAdminAuth()) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const sites = getRegisteredSites();
    return NextResponse.json({
      runtime: process.env.VERCEL === "1" ? "vercel" : "local",
      publicUrl: process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL
        ? process.env.NEXT_PUBLIC_SITE_URL || `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
        : "",
      security: {
        adminPassword: Boolean(process.env.ADMIN_PASSWORD?.trim()),
        sessionSecret: Boolean(process.env.ADMIN_SESSION_SECRET?.trim()),
      },
      aiProviders: AI_PROVIDERS.map(([name, envName]) => ({
        name,
        configured: Boolean(process.env[envName]?.trim()),
      })),
      github: {
        configured: Boolean(process.env.GITHUB_TOKEN?.trim() && process.env.GITHUB_REPO?.trim()),
        repository: process.env.GITHUB_REPO?.trim() || "",
        branch: process.env.GITHUB_BRANCH?.trim() || "main",
      },
      vercel: {
        deployed: process.env.VERCEL === "1",
        projectConfigured: Boolean(process.env.VERCEL_PROJECT_ID?.trim()),
        domainApiConfigured: Boolean(process.env.VERCEL_TOKEN?.trim() && process.env.VERCEL_PROJECT_ID?.trim()),
      },
      search: {
        googleAnalyticsConfigured: sites.some((site) => Boolean(site.profile.seo?.googleAnalyticsId)),
        googleVerificationConfigured: sites.some((site) => Boolean(site.profile.seo?.googleSiteVerification)),
      },
      sites: {
        total: sites.length,
        active: sites.filter((site) => site.active === true).length,
      },
    });
  } catch (error) {
    console.error("[admin/platform-status][GET]", error);
    return NextResponse.json({ error: "Não foi possível verificar as integrações." }, { status: 500 });
  }
}
