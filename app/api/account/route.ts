import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/session";
import { getAccount, updateAccount, emptyAccount } from "@/lib/account";
import { mutateDoc } from "@/lib/store";
export async function GET() {
  const u = await currentUser(); if (!u) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  return NextResponse.json({ account: await getAccount(u.id) });
}
export async function PUT(req: NextRequest) {
  const u = await currentUser(); if (!u) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  try {
    const raw = await req.text(); if (raw.length > 10_000) return NextResponse.json({ error: "Too large" }, { status: 413 });
    const body = JSON.parse(raw); if (!body || typeof body !== "object") throw new Error("Invalid request");
    const account = await mutateDoc<import("@/lib/account").Account>("accounts", u.id, a => updateAccount(a ?? emptyAccount(), body));
    return NextResponse.json({ account });
  } catch (e) { return NextResponse.json({ error: e instanceof SyntaxError ? "Invalid request" : (e as Error).message }, { status: 422 }); }
}
