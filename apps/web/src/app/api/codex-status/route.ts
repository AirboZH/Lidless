import { NextResponse } from "next/server";
import { getVerdict } from "@/lib/codex-reset";

// Same-origin proxy for the verdict. Upstream (hascodexratelimitreset.today)
// sends no CORS headers, so the browser can't poll it cross-origin — it polls
// this instead. getVerdict() already caches the upstream fetch (revalidate 60),
// and the response carries a short CDN cache so we don't hammer either side.
export const revalidate = 60;

export async function GET() {
  const verdict = await getVerdict();
  return NextResponse.json(verdict, {
    headers: {
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
    },
  });
}
