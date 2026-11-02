import { NextResponse } from "next/server";
import { checkAdminAuth } from "../../../../../lib/admin-auth";
import siteConfig from "../../../../../site.config";
import { isOfficialUrl } from "../../../../../lib/source-validation";

export async function GET(request) {
  if (!checkAdminAuth()) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  if (siteConfig.modules?.health !== true) {
    const category = searchParams.get("category") || "";
    if (!siteConfig.generation?.categories?.includes(category)) {
      return NextResponse.json({ error: "Selecione uma categoria configurada para este site." }, { status: 400 });
    }

    const doubts = (siteConfig.generation?.topicSeeds || [])
      .filter((entry) => entry.category === category)
      .flatMap((entry) => entry.topics || []);
    if (doubts.length === 0) {
      return NextResponse.json(
        { error: `Cadastre pautas para "${category}" no assistente do site antes de carregar sugestões.` },
        { status: 409 }
      );
    }
    return NextResponse.json({ doubts, total: doubts.length });
  }

  const sourceUrl = searchParams.get("url") || "";
  if (!isOfficialUrl(sourceUrl, siteConfig.officialSourceDomains)) {
    return NextResponse.json(
      { error: "Informe uma URL HTTPS de domínio oficial permitido." },
      { status: 400 }
    );
  }

  const { default: healthTopics } = await import("../../../../../lib/health-topics");
  const doubts = Object.values(healthTopics).flat();
  if (doubts.length === 0) {
    return NextResponse.json(
      { error: "Cadastre ideias de pauta por categoria no assistente do site antes de carregar sugestões." },
      { status: 409 }
    );
  }
  return NextResponse.json({ doubts, total: doubts.length });
}
