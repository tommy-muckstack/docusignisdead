import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/session";
import { getEnvelope, getPdf } from "@/lib/esign/server";
export const runtime = "nodejs";
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const u = await currentUser(); const e = await getEnvelope((await params).id); if (!u || !e || e.ownerId !== u.id) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const signed = req.nextUrl.searchParams.get("signed") === "1" && e.status === "completed"; const bytes = await getPdf(signed ? "signed" : "original", e.id);
  if (!bytes) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const name = e.title.replace(/[^\w .-]/g, "_") + (signed ? " (signed)" : "") + ".pdf";
  return new NextResponse(Buffer.from(bytes), { headers: { "content-type": "application/pdf", "content-disposition": `${req.nextUrl.searchParams.get("dl") ? "attachment" : "inline"}; filename="${name}"`, "cache-control": "private, no-store" } });
}
