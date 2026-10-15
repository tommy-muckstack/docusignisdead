import { NextRequest, NextResponse } from "next/server";
import { loadByToken, markViewed, submitSignature } from "@/lib/esign/flow";
import { signerView } from "@/lib/esign/logic";
export const runtime = "nodejs";
type Ctx = { params: Promise<{ token: string }> };
export async function GET(_: NextRequest, { params }: Ctx) {
  const x = await loadByToken((await params).token); if (!x) return NextResponse.json({ error: "This link is not valid" }, { status: 404 });
  if (x.env.status === "sent") await markViewed(x.env, x.r.id); return NextResponse.json({ view: signerView(x.env, x.r) });
}
export async function POST(req: NextRequest, { params }: Ctx) {
  const x = await loadByToken((await params).token); if (!x) return NextResponse.json({ error: "This link is not valid" }, { status: 404 });
  const raw = await req.text(); if (raw.length > 600_000) return NextResponse.json({ error: "Too large" }, { status: 413 });
  let body: any; try { body = JSON.parse(raw); } catch { return NextResponse.json({ error: "Bad request" }, { status: 400 }); }
  const r = await submitSignature(x.env, x.r.id, { signature: body?.signature, initials: typeof body?.initials === "string" ? body.initials : undefined, values: body?.values && typeof body.values === "object" ? body.values : {} });
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });
  const me = r.envelope.recipients.find(q => q.id === x.r.id)!; return NextResponse.json({ view: signerView(r.envelope, me), completed: r.completed });
}
