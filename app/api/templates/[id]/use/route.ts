import { NextResponse } from "next/server";
import { currentUser } from "@/lib/session";
import { instantiateTemplate } from "@/lib/esign/server";
export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const u = await currentUser(); if (!u) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  try { return NextResponse.json({ envelope: await instantiateTemplate(u.id, (await params).id) }, { status: 201 }); }
  catch (e) { return NextResponse.json({ error: (e as Error).message }, { status: 422 }); }
}
