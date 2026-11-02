import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { checkAdminAuth } from "../../../../lib/admin-auth";
import { commitFile, getFile, triggerVercelDeploy } from "../../../../lib/github-commit";
import { mergeProfile, validateSiteProfile } from "../../../../lib/site-profile";

export const runtime = "nodejs";

const PROFILE_PATH = "data/site-profile.json";
const LOCAL_PROFILE_PATH = path.join(process.cwd(), PROFILE_PATH);

function readLocalProfile() {
  return JSON.parse(fs.readFileSync(LOCAL_PROFILE_PATH, "utf8"));
}

export async function GET() {
  if (!checkAdminAuth()) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    if (process.env.VERCEL === "1" && process.env.GITHUB_TOKEN && process.env.GITHUB_REPO) {
      const remote = await getFile(PROFILE_PATH);
      if (remote) {
        return NextResponse.json({
          profile: JSON.parse(remote.content),
          revision: remote.sha,
        });
      }
    }

    return NextResponse.json({ profile: readLocalProfile(), revision: null });
  } catch (error) {
    console.error("[admin/config][GET]", error);
    return NextResponse.json({ error: error.message || "Erro ao carregar configuração." }, { status: 500 });
  }
}

export async function POST(request) {
  if (!checkAdminAuth()) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const { profile: submittedProfile, revision } = await request.json();
    const validationError = validateSiteProfile(submittedProfile);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const profile = mergeProfile(readLocalProfile(), submittedProfile);
    const content = `${JSON.stringify(profile, null, 2)}\n`;

    if (process.env.VERCEL === "1") {
      const result = await commitFile(
        PROFILE_PATH,
        content,
        `⚙️ Atualizar perfil do site: ${profile.name}`,
        revision || undefined
      );
      const deployment = await triggerVercelDeploy();
      return NextResponse.json({
        ok: true,
        persisted: true,
        deploymentTriggered: deployment.triggered,
        revision: result.fileSha,
        commitUrl: result.htmlUrl,
      });
    }

    fs.writeFileSync(LOCAL_PROFILE_PATH, content, "utf8");
    return NextResponse.json({ ok: true, persisted: true, deploymentTriggered: false });
  } catch (error) {
    console.error("[admin/config][POST]", error);
    const status = error.code === "STALE_FILE" || error.code === "GITHUB_CONFLICT" ? 409 : 500;
    return NextResponse.json({ error: error.message || "Erro ao salvar configuração." }, { status });
  }
}
