import { getDoc, putDoc } from "@/lib/store";
import type { Envelope, SignPayload } from "./types";
import { canSign, expired, findByToken, resolveSubmission, sendProblems } from "./logic";
import { getEnvelope, getPdf, putPdf, mutateEnvelope } from "./server";
import { finalizePdf } from "./finalize";
import { deliverEnvelope } from "./email";
type TokenDoc = { envelopeId: string };
export async function sendEnvelope(e: Envelope, sender?: { email: string; demo: boolean; guest: boolean }): Promise<{ error: string } | { envelope: Envelope }> {
  try {
    const next = await mutateEnvelope(e.id, current => {
      const problems = sendProblems(current); if (problems.length) throw new Error(problems[0]);
      const now = Date.now(); return { ...current, status: "sent", updatedAt: now, expiresAt: now + (current.expireDays ?? 30) * 86_400_000, senderEmail: sender?.email, mailAllowed: !!sender && !sender.demo && !sender.guest, events: [...current.events, { at: now, who: "You", what: `Sent to ${current.recipients.map(r => r.name).join(", ")}` }] };
    });
    for (const r of next!.recipients) await putDoc<TokenDoc>("tokens", r.token, { envelopeId: e.id });
    return { envelope: (await deliverEnvelope(e.id))! };
  } catch (error) { return { error: (error as Error).message }; }
}
export async function voidEnvelope(e: Envelope, reason: string) {
  try { const envelope = await mutateEnvelope(e.id, current => {
    if (current.status !== "sent") throw new Error("Only sent documents can be voided");
    const now = Date.now(); return { ...current, status: "voided", voidReason: reason.slice(0, 200), updatedAt: now, events: [...current.events, { at: now, who: "You", what: `Voided${reason ? `: ${reason.slice(0, 200)}` : ""}` }] };
  }); return { envelope: envelope! }; } catch (error) { return { error: (error as Error).message }; }
}
export async function loadByToken(token: string) {
  if (!/^[A-Za-z0-9_-]{10,80}$/.test(token)) return null;
  const t = await getDoc<TokenDoc>("tokens", token); if (!t) return null;
  const env = await getEnvelope(t.envelopeId); const r = env && findByToken(env, token); return env && r ? { env, r } : null;
}
export async function markViewed(env: Envelope, recipientId: string) {
  return mutateEnvelope(env.id, e => {
    const r = e.recipients.find(x => x.id === recipientId); if (!r || !canSign(e, r).ok || e.events.some(ev => ev.what === "Viewed" && ev.who === r.email)) return e;
    return { ...e, events: [...e.events, { at: Date.now(), who: r.email, what: "Viewed" }] };
  });
}
class SigningError extends Error { constructor(message: string, public status: number) { super(message); } }
export async function submitSignature(env: Envelope, recipientId: string, pl: SignPayload): Promise<{ error: string; status: number } | { envelope: Envelope; completed: boolean }> {
  try {
    const legacyValues = await getDoc<Record<string, string>>("values", env.id);
    const next = await mutateEnvelope(env.id, async e => {
      const r = e.recipients.find(x => x.id === recipientId); if (!r) throw new SigningError("Recipient not found", 404);
      const c = canSign(e, r);
      if (e.status === "voided" || expired(e)) throw new SigningError("This agreement was voided or has expired", 410);
      if (!c.ok) throw new SigningError(c.waitingFor ? `Waiting for ${c.waitingFor} to finish first` : "This agreement is not open for your signature", 409);
      const res = r.role === "viewer" ? { values: {} } : resolveSubmission(e, r, pl); if ("error" in res) throw new SigningError(res.error, 422);
      const values = { ...legacyValues, ...e.signedValues, ...res.values }; e.signedValues = values;
      const now = Date.now(); r.status = r.role === "viewer" ? "viewed" : "signed"; if (r.role === "viewer") r.viewedAt = now; else r.signedAt = now;
      e.updatedAt = now; e.events.push({ at: now, who: r.email, what: r.role === "viewer" ? "Confirmed review" : "Signed" });
      if (e.recipients.every(x => x.role === "cc" || x.status !== "pending")) {
        e.status = "completed"; for (const copy of e.recipients.filter(x => x.role === "cc")) copy.status = "copied";
        e.events.push({ at: now, who: "System", what: "All required recipients finished. Agreement completed" });
        const orig = await getPdf("original", e.id); if (!orig) throw new SigningError("Original PDF is unavailable", 500);
        await putPdf("signed", e.id, await finalizePdf(orig, e, values));
      }
      return e;
    });
    const delivered = await deliverEnvelope(env.id); return { envelope: delivered ?? next!, completed: next!.status === "completed" };
  } catch (error) { return { error: error instanceof SigningError ? error.message : "Could not finish signing. Please retry.", status: error instanceof SigningError ? error.status : 500 }; }
}
