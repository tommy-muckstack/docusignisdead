import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/session";
import { getEnvelope, saveEnvelope, sanitizeDraft, deleteEnvelope } from "@/lib/esign/server";
export const runtime = "nodejs";
type Ctx = { params: Promise<{ id: string }> };
async function own(ctx: Ctx) { const { id } = await ctx.params; const u = await currentUser(); const e = await getEnvelope(id); return u && e && e.ownerId === u.id ? e : null; }
export async function GET(_: NextRequest, ctx: Ctx) { const e = await own(ctx); return e ? NextResponse.json({ envelope: e }) : NextResponse.json({ error: "Not found" }, { status: 404 }); }
export async function PUT(req: NextRequest, ctx: Ctx) {
  const e = await own(ctx); if (!e) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (e.status !== "draft") return NextResponse.json({ error: "Only drafts can be edited" }, { status: 409 });
  const raw = await req.text(); if (raw.length > 300_000) return NextResponse.json({ error: "Too large" }, { status: 413 });
  const next = sanitizeDraft(JSON.parse(raw || "{}"), e); await saveEnvelope(next); return NextResponse.json({ envelope: next });
}
export async function DELETE(_: NextRequest, ctx: Ctx) { const e = await own(ctx); if (!e) return NextResponse.json({ error: "Not found" }, { status: 404 }); await deleteEnvelope(e.id); return new NextResponse(null, { status: 204 }); }
