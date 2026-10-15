import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/session";
import { getEnvelope } from "@/lib/esign/server";
import { deliverEnvelope, remindEnvelope } from "@/lib/esign/email";
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const u = await currentUser(); const e = await getEnvelope((await params).id); if (!u || !e || u.id !== e.ownerId) return NextResponse.json({ error: "Not found" }, { status: 404 });
  try { const body = await req.json().catch(() => ({})); return NextResponse.json({ envelope: body.reminder ? await remindEnvelope(e) : await deliverEnvelope(e.id) }); }
  catch (error) { return NextResponse.json({ error: (error as Error).message }, { status: 422 }); }
}
