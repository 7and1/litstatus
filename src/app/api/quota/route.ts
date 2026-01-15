import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { getClientIp } from "@/lib/ip";
import { getQuotaStatus } from "@/lib/quota";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    const ip = getClientIp(request);
    const status = await getQuotaStatus({ user, ip });
    return NextResponse.json({ quota: status });
  } catch {
    return NextResponse.json({ error: "无法获取配额状态。" }, { status: 500 });
  }
}
