import { getDoc, putDoc } from "@/lib/store";
import type { Envelope, SignPayload } from "./types";
import { canSign, findByToken, resolveSubmission, sendProblems } from "./logic";
import { getEnvelope, getPdf, putPdf, saveEnvelope } from "./server";
import { finalizePdf } from "./finalize";
type TokenDoc = { envelopeId: string };
/** Mark a draft as sent and index each recipient's signing token. No email is sent: the owner shares the links. */
export async function sendEnvelope(e: Envelope): Promise<{ error: string } | { envelope: Envelope }> {
  const problems = sendProblems(e); if (problems.length) return { error: problems[0]! };
  const now = Date.now(); e.status = "sent"; e.updatedAt = now; e.events.push({ at: now, who: "You", what: `Sent to ${e.recipients.map(r => r.name).join(", ")}` });
  for (const r of e.recipients) await putDoc<TokenDoc>("tokens", r.token, { envelopeId: e.id });
  await saveEnvelope(e); return { envelope: e };
}
export async function voidEnvelope(e: Envelope, reason: string) {
  if (e.status !== "sent") return { error: "Only sent documents can be voided" } as const;
  e.status = "voided"; e.voidReason = reason.slice(0, 200); e.updatedAt = Date.now(); e.events.push({ at: e.updatedAt, who: "You", what: `Voided${reason ? `: ${reason.slice(0, 200)}` : ""}` });
  await saveEnvelope(e); return { envelope: e } as const;
}
export async function loadByToken(token: string) {
  if (!/^[A-Za-z0-9_-]{10,80}$/.test(token)) return null;
  const t = await getDoc<TokenDoc>("tokens", token); if (!t) return null;
  const env = await getEnvelope(t.envelopeId); const r = env && findByToken(env, token); return env && r ? { env, r } : null;
}
export async function markViewed(env: Envelope, rid: string) {
  const r = env.recipients.find(x => x.id === rid)!; if (env.events.some(ev => ev.what === "Viewed" && ev.who === r.name)) return;
  env.events.push({ at: Date.now(), who: r.name, what: "Viewed" }); await saveEnvelope(env);
}
export async function submitSignature(env: Envelope, rid: string, pl: SignPayload): Promise<{ error: string; status: number } | { envelope: Envelope; completed: boolean }> {
  const r = env.recipients.find(x => x.id === rid)!; const c = canSign(env, r);
  if (env.status === "voided") return { error: "This document was voided by the sender", status: 410 };
  if (!c.ok) return { error: r.status === "signed" ? "You already signed this document" : c.waitingFor ? `Waiting for ${c.waitingFor} to sign first` : "This document is not open for signing", status: 409 };
  const res = resolveSubmission(env, r, pl); if ("error" in res) return { error: res.error, status: 422 };
  const all = (await getDoc<Record<string, string>>("values", env.id)) ?? {}; Object.assign(all, res.values); await putDoc("values", env.id, all);
  const now = Date.now(); r.status = "signed"; r.signedAt = now; env.updatedAt = now; env.events.push({ at: now, who: r.name, what: "Signed" });
  const completed = env.recipients.every(x => x.status === "signed");
  if (completed) { env.status = "completed"; env.events.push({ at: now, who: "System", what: "All parties signed. Document completed" });
    const orig = await getPdf("original", env.id); if (orig) await putPdf("signed", env.id, await finalizePdf(orig, env, all)); }
  await saveEnvelope(env); return { envelope: env, completed };
}
