import { NextResponse } from "next/server";
import { getMedicationSummaryEnabled } from "../../../../lib/feature-flags";
import siteConfig from "../../../../site.config";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!siteConfig.modules?.health || !siteConfig.modules?.medicationSummary) {
    return NextResponse.json(
      { enabled: false },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  }
  try {
    const enabled = await getMedicationSummaryEnabled();
    return NextResponse.json(
      { enabled },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  } catch (error) {
    console.error("[medication-summary/status][GET]", error.message);
    return NextResponse.json({ error: "Resumo da bula indisponível no momento." }, { status: 503 });
  }
}
