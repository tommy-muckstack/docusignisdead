import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/session";
import { createEnvelope, listEnvelopes } from "@/lib/esign/server";
export const runtime = "nodejs";
export async function GET(req: NextRequest) {
  const u = await currentUser(); if (!u) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  return NextResponse.json({ envelopes: await listEnvelopes(u.id, req.nextUrl.searchParams.get("kind") === "template" ? "template" : undefined) });
}
export async function POST(req: NextRequest) {
  const u = await currentUser(); if (!u) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const ct = req.headers.get("content-type") ?? "";
  try {
    if (ct.startsWith("multipart/form-data")) {
      const fd = await req.formData(); const file = fd.get("file"); if (!(file instanceof File)) return NextResponse.json({ error: "Choose a PDF" }, { status: 400 });
      const title = file.name.replace(/\.pdf$/i, "").slice(0, 120) || "Untitled document";
      return NextResponse.json({ envelope: await createEnvelope(u.id, { title, pdf: new Uint8Array(await file.arrayBuffer()), self: fd.get("mode") === "sign" ? { name: u.name, email: u.email } : undefined, kind: fd.get("kind") === "template" ? "template" : undefined }) }, { status: 201 });
    }
    const body = await req.json().catch(() => ({}));
    return NextResponse.json({ envelope: await createEnvelope(u.id, { sample: String(body?.sample ?? "nda"), self: body?.mode === "sign" ? { name: u.name, email: u.email } : undefined, kind: body?.kind === "template" ? "template" : undefined }) }, { status: 201 });
  } catch (e) { return NextResponse.json({ error: (e as Error).message }, { status: 422 }); }
}
