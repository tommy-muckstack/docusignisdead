import { NextRequest, NextResponse } from "next/server";
import { loadByToken, signingAction, signingProgress, submitSignature } from "@/lib/esign/flow";
import { signerView } from "@/lib/esign/logic";
export const runtime = "nodejs";
type Ctx = { params: Promise<{ token: string }> };
export async function GET(_: NextRequest, { params }: Ctx) {
  const x = await loadByToken((await params).token); if (!x) return NextResponse.json({ error: "This link is not valid" }, { status: 404 });
  const view = signerView(x.env, x.r); if (view.myTurn && x.r.consentedAt) view.progress = (await signingProgress(x.env, x.r.id)) ?? undefined; return NextResponse.json({ view });
}
export async function POST(req: NextRequest, { params }: Ctx) {
  const x = await loadByToken((await params).token); if (!x) return NextResponse.json({ error: "This link is not valid" }, { status: 404 });
  const raw = await req.text(); if (raw.length > 600_000) return NextResponse.json({ error: "Too large" }, { status: 413 });
  let body: any; try { body = JSON.parse(raw); } catch { return NextResponse.json({ error: "Bad request" }, { status: 400 }); }
  if (["consent", "decline", "later"].includes(body?.action)) {
    const result = await signingAction(x.env, x.r.id, body.action, { version: typeof body.version === "string" ? body.version : undefined, reason: typeof body.reason === "string" ? body.reason : undefined, progress: body.progress });
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json({ view: signerView(result.envelope, result.envelope.recipients.find(r => r.id === x.r.id)!) });
  }
  const r = await submitSignature(x.env, x.r.id, { signature: body?.signature, initials: typeof body?.initials === "string" ? body.initials : undefined, values: body?.values && typeof body.values === "object" ? body.values : {} });
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });
  const me = r.envelope.recipients.find(q => q.id === x.r.id)!; return NextResponse.json({ view: signerView(r.envelope, me), completed: r.completed });
}
