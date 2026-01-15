import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { getClientIp } from "@/lib/ip";
import { getQuotaStatus } from "@/lib/quota";
import { SECURITY_HEADERS } from "@/lib/security";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    const ip = getClientIp(request);
    const status = await getQuotaStatus({ user, ip });
    return NextResponse.json({ quota: status }, { headers: SECURITY_HEADERS });
  } catch (error) {
    console.error(
      "[Quota API Error]",
      error instanceof Error ? error.message : "Unknown error",
    );
    return NextResponse.json(
      { error: "Unable to fetch quota status." },
      { status: 500, headers: SECURITY_HEADERS },
    );
  }
}
