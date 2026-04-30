import { NextResponse } from "next/server";

import { getRuntimeStatus } from "@/lib/config/server-env";
import { siteConfig } from "@/lib/site-config";

export const runtime = "nodejs";

export function GET() {
  return NextResponse.json({
    ok: true,
    project: siteConfig.name,
    timestamp: new Date().toISOString(),
    services: getRuntimeStatus(),
  });
}
