import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/session";
import { getEnvelope } from "@/lib/esign/server";
import { sendEnvelope } from "@/lib/esign/flow";
export const runtime = "nodejs";
export async function POST(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const u = await currentUser(); const e = await getEnvelope((await params).id); if (!u || !e || e.ownerId !== u.id) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const r = await sendEnvelope(e, u); return "error" in r ? NextResponse.json({ error: r.error }, { status: 422 }) : NextResponse.json(r);
}
