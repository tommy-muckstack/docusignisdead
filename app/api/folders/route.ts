import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/session";
import { listFolders, changeFolder } from "@/lib/esign/folders";
export async function GET() { const u = await currentUser(); return u ? NextResponse.json({ folders: await listFolders(u.id) }) : NextResponse.json({ error: "Sign in required" }, { status: 401 }); }
export async function POST(req: NextRequest) {
  const u = await currentUser(); if (!u) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  try { const raw = await req.text(); if (raw.length > 2000) throw new Error("Request too large"); return NextResponse.json({ folders: await changeFolder(u.id, JSON.parse(raw)) }); }
  catch (e) { return NextResponse.json({ error: (e as Error).message }, { status: 422 }); }
}
