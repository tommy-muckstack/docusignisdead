import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/session";
import { getEnvelope, mutateEnvelope, sanitizeDraft, deleteEnvelope } from "@/lib/esign/server";
import { listFolders } from "@/lib/esign/folders";
export const runtime = "nodejs";
type Ctx = { params: Promise<{ id: string }> };
async function own(ctx: Ctx) { const { id } = await ctx.params; const u = await currentUser(); const e = await getEnvelope(id); return u && e && e.ownerId === u.id ? e : null; }
export async function GET(_: NextRequest, ctx: Ctx) { const e = await own(ctx); return e ? NextResponse.json({ envelope: e }) : NextResponse.json({ error: "Not found" }, { status: 404 }); }
export async function PUT(req: NextRequest, ctx: Ctx) {
  const e = await own(ctx); if (!e) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (e.status !== "draft") return NextResponse.json({ error: "Only drafts can be edited" }, { status: 409 });
  const raw = await req.text(); if (raw.length > 300_000) return NextResponse.json({ error: "Too large" }, { status: 413 });
  try { const input = JSON.parse(raw || "{}"); const next = await mutateEnvelope(e.id, latest => { if (latest.status !== "draft") throw new Error("Only drafts can be edited"); return sanitizeDraft(input, latest); }); return NextResponse.json({ envelope: next }); }
  catch (error) { return NextResponse.json({ error: error instanceof SyntaxError ? "Invalid request" : (error as Error).message }, { status: 409 }); }
}
export async function PATCH(req: NextRequest, ctx: Ctx) {
  const e = await own(ctx); if (!e) return NextResponse.json({ error: "Not found" }, { status: 404 });
  try {
    const raw = await req.text(); if (raw.length > 2000) throw new Error("Request too large"); const body = JSON.parse(raw);
    const folders = await listFolders(e.ownerId);
    if (body.folderId && !folders.some(f => f.id === body.folderId)) throw new Error("Folder not found");
    const envelope = await mutateEnvelope(e.id, latest => {
      if ("folderId" in body) { if (body.folderId) latest.folderId = body.folderId; else delete latest.folderId; }
      if ("title" in body) { if (latest.status !== "draft") throw new Error("Only draft titles can be changed"); const title = typeof body.title === "string" ? body.title.trim().slice(0,120) : ""; if (!title) throw new Error("Enter a title"); latest.title = title; }
      latest.updatedAt = Date.now(); return latest;
    }); return NextResponse.json({ envelope });
  } catch (error) { return NextResponse.json({ error: (error as Error).message }, { status: 422 }); }
}
export async function DELETE(_: NextRequest, ctx: Ctx) { const e = await own(ctx); if (!e) return NextResponse.json({ error: "Not found" }, { status: 404 }); await deleteEnvelope(e.id); return new NextResponse(null, { status: 204 }); }
