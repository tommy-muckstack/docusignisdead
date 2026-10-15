import { getDoc, putDoc, delDoc } from "@/lib/store";
import type { Envelope, SignPayload } from "./types";
import { canSign, expired, findByToken, resolveSubmission, sendProblems } from "./logic";
import { getEnvelope, getPdf, putPdf, mutateEnvelope } from "./server";
import { finalizePdf } from "./finalize";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { DISCLOSURE_VERSION } from "./disclosure";
import { deliverEnvelope } from "./email";
type TokenDoc = { envelopeId: string };
export async function sendEnvelope(e: Envelope, sender?: { email: string; demo: boolean; guest: boolean }): Promise<{ error: string } | { envelope: Envelope }> {
  try {
    const next = await mutateEnvelope(e.id, async current => {
      const problems = sendProblems(current); if (problems.length) throw new Error(problems[0]);
      for (const r of current.recipients) await putDoc<TokenDoc>("tokens", r.token, { envelopeId: e.id });
      const now = Date.now(); return { ...current, status: "sent", updatedAt: now, expiresAt: now + (current.expireDays ?? 30) * 86_400_000, senderEmail: sender?.email, mailAllowed: !!sender && !sender.demo && !sender.guest, events: [...current.events, { at: now, who: "You", what: `Sent to ${current.recipients.map(r => r.name).join(", ")}` }] };
    });

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
    const r = e.recipients.find(x => x.id === recipientId); if (!r || !canSign(e, r).ok || !r.consentedAt || e.events.some(ev => ev.what === "Viewed" && ev.who === r.email)) return e;
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
      if ((e.status === "voided" || e.status === "declined") || expired(e)) throw new SigningError("This agreement was voided or has expired", 410);
      if (!c.ok) throw new SigningError(c.waitingFor ? `Waiting for ${c.waitingFor} to finish first` : "This agreement is not open for your signature", 409);
      if (!r.consentedAt || r.consentVersion !== DISCLOSURE_VERSION) throw new SigningError("Agree to the electronic record and signature disclosure first", 422);
      await validateSignature(pl);
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
    await delDoc("signing-progress", `${env.id}_${recipientId}`);
    const delivered = await deliverEnvelope(env.id); return { envelope: delivered ?? next!, completed: next!.status === "completed" };
  } catch (error) { return { error: error instanceof SigningError ? error.message : "Could not finish signing. Please retry.", status: error instanceof SigningError ? error.status : 500 }; }
}

async function validateSignature(pl: SignPayload) {
  if (!pl.signature) return;
  const doc = await PDFDocument.create();
  if (pl.signature.kind === "drawn") {
    if (typeof pl.signature.png !== "string" || pl.signature.png.length > 400_000 || !/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(pl.signature.png)) throw new SigningError("Draw your signature again", 422);
    const bytes = Buffer.from(pl.signature.png.split(",")[1], "base64");
    if (bytes.length < 24 || bytes.readUInt32BE(16) > 2048 || bytes.readUInt32BE(20) > 1024) throw new SigningError("Signature image is invalid or too large", 422);
    try { await doc.embedPng(bytes); } catch { throw new SigningError("Draw your signature again", 422); }
  } else if (pl.signature.kind === "typed") {
    if (typeof pl.signature.text !== "string" || pl.signature.text.trim().length < 2 || pl.signature.text.length > 80) throw new SigningError("Enter your full name", 422);
    try { (await doc.embedFont(StandardFonts.TimesRomanItalic)).encodeText(pl.signature.text); } catch { throw new SigningError("Please use Draw for characters this signature font cannot display", 422); }
  } else throw new SigningError("Choose Type or Draw", 422);
}
export async function signingAction(env: Envelope, recipientId: string, action: "consent" | "decline" | "later", input: { version?: string; reason?: string; progress?: SignPayload }) {
  try {
    const next = await mutateEnvelope(env.id, async e => {
      const r = e.recipients.find(x => x.id === recipientId); if (!r || !canSign(e, r).ok) throw new SigningError("This agreement is not open for your action", 409);
      const at = Date.now();
      if (action === "consent") {
        if (input.version !== DISCLOSURE_VERSION) throw new SigningError("Refresh the disclosure before continuing", 422);
        if (!r.consentedAt || r.consentVersion !== DISCLOSURE_VERSION) { r.consentedAt = at; r.consentVersion = DISCLOSURE_VERSION; e.events.push({ at, who: r.email, what: `Agreed to electronic records and signatures; disclosure ${DISCLOSURE_VERSION}` }); }
      } else if (action === "decline") {
        e.status = "declined"; e.declineReason = (input.reason ?? "").trim().slice(0, 500); r.status = "declined";
        e.events.push({ at, who: r.email, what: `Declined${e.declineReason ? ": " + e.declineReason : ""}` });
      } else {
        if (!r.consentedAt) throw new SigningError("Agree to the disclosure first", 422);
        const progress = input.progress ?? { values: {} }; await validateSignature(progress);
        const values: Record<string, string> = {};
        for (const f of e.fields.filter(f => f.recipientId === r.id && (f.type === "text" || f.type === "checkbox"))) { const value = progress.values?.[f.id]; if (typeof value === "string") values[f.id] = value.slice(0, 500); }
        await putDoc<SignPayload>("signing-progress", `${e.id}_${r.id}`, { values, ...(progress.signature ? { signature: progress.signature } : {}) });
        if (!e.events.some(event => event.who === r.email && event.what === "Saved progress to finish later")) e.events.push({ at, who: r.email, what: "Saved progress to finish later" });
      }
      e.updatedAt = at; return e;
    }); return { envelope: next! };
  } catch (error) { return { error: error instanceof SigningError ? error.message : "Could not save your action. Please retry.", status: error instanceof SigningError ? error.status : 500 }; }
}
export const signingProgress = (env: Envelope, recipientId: string) => getDoc<SignPayload>("signing-progress", `${env.id}_${recipientId}`);
