import { NextRequest, NextResponse } from "next/server";
import { loadByToken } from "@/lib/esign/flow";
import { canSign, expired } from "@/lib/esign/logic";
import { getPdf } from "@/lib/esign/server";
export const runtime = "nodejs";
export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const x = await loadByToken((await params).token); if (!x || x.env.status === "voided" || expired(x.env) || (x.env.status !== "completed" && x.r.role !== "cc" && x.r.status === "pending" && !canSign(x.env, x.r).ok)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const signed = x.env.status === "completed"; const bytes = await getPdf(signed ? "signed" : "original", x.env.id); if (!bytes) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return new NextResponse(Buffer.from(bytes), { headers: { "content-type": "application/pdf", "content-disposition": `${req.nextUrl.searchParams.get("dl") ? "attachment" : "inline"}; filename="document${signed ? "-signed" : ""}.pdf"`, "cache-control": "private, no-store" } });
}
