import type { Envelope, Field, FieldType, Recipient, SignPayload, SignerView } from "./types";
const FTYPES = new Set<FieldType>(["signature", "initials", "date", "text", "checkbox"]);
export const rid = (p = "") => p + Array.from(crypto.getRandomValues(new Uint8Array(9)), b => "abcdefghijkmnpqrstuvwxyz23456789"[b % "abcdefghijkmnpqrstuvwxyz23456789".length]).join("");
export const newToken = () => rid("t_") + rid();
const str = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max).trim() : "");
const clamp = (n: unknown, lo: number, hi: number) => Math.min(hi, Math.max(lo, Number.isFinite(Number(n)) ? Number(n) : lo));
export const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s);
/** Clamp client-supplied draft content. Keeps tokens/status/owner from the stored envelope; never trusts the client for them. */
export function sanitizeDraft(input: any, base: Envelope): Envelope {
  const old = new Map(base.recipients.map(r => [r.id, r])); const seen = new Set<string>();
  const recipients: Recipient[] = (Array.isArray(input?.recipients) ? input.recipients : []).slice(0, 10).map((r: any, i: number): Recipient => {
    const prev = typeof r?.id === "string" ? old.get(r.id) : undefined;
    const cid = typeof r?.id === "string" && /^r_[a-z0-9]{3,20}$/.test(r.id) && !seen.has(r.id) ? r.id : rid("r_"); seen.add(cid);
    return { id: prev?.id ?? cid, name: str(r?.name, 80), email: str(r?.email, 160).toLowerCase(), order: i + 1, token: prev?.token ?? newToken(), status: prev?.status ?? "pending", ...(prev?.signedAt ? { signedAt: prev.signedAt } : {}) };
  });
  const rids = new Set(recipients.map(r => r.id));
  const fields: Field[] = (Array.isArray(input?.fields) ? input.fields : []).slice(0, 200).flatMap((f: any): Field[] => {
    if (!FTYPES.has(f?.type) || !rids.has(f?.recipientId)) return [];
    const page = Math.round(clamp(f.page, 0, Math.max(0, base.pages.length - 1))); const w = clamp(f.w, 0.01, 1), h = clamp(f.h, 0.01, 1);
    return [{ id: /^[A-Za-z0-9_-]{3,40}$/.test(f?.id ?? "") ? f.id : rid("f_"), recipientId: f.recipientId, type: f.type, page, x: clamp(f.x, 0, 1 - w), y: clamp(f.y, 0, 1 - h), w, h, required: f.type === "checkbox" ? !!f.required : f.required !== false, ...(f.label ? { label: str(f.label, 60) } : {}) }];
  });
  return { ...base, title: str(input?.title, 120) || "Untitled document", message: str(input?.message, 600), sequential: input?.sequential !== false, recipients, fields, updatedAt: Date.now() };
}
/** Problems that stop a draft from being sent. Empty array = ready. */
export function sendProblems(e: Envelope): string[] {
  const p: string[] = [];
  if (e.status !== "draft") return ["Only drafts can be sent"];
  if (!e.recipients.length) p.push("Add at least one recipient");
  for (const r of e.recipients) { if (!r.name) p.push(`Recipient ${r.order} needs a name`); if (!isEmail(r.email)) p.push(`Recipient ${r.order} needs a valid email`); }
  if (new Set(e.recipients.map(r => r.email)).size !== e.recipients.length) p.push("Each recipient needs a different email");
  for (const r of e.recipients) if (!e.fields.some(f => f.recipientId === r.id && f.type === "signature")) p.push(`${r.name || "Recipient " + r.order} needs a signature field`);
  return p;
}
/** Whose turn is it? Sequential: the first unsigned recipient. Parallel: everyone unsigned. */
export function canSign(e: Envelope, r: Recipient): { ok: boolean; waitingFor?: string } {
  if (e.status !== "sent" || r.status === "signed") return { ok: false };
  if (!e.sequential) return { ok: true };
  const blocker = e.recipients.find(x => x.order < r.order && x.status !== "signed"); return blocker ? { ok: false, waitingFor: blocker.name } : { ok: true };
}
export function findByToken(e: Envelope, token: string) { return e.recipients.find(r => r.token === token); }
export function signerView(e: Envelope, r: Recipient): SignerView {
  const c = canSign(e, r);
  return { title: e.title, status: e.status, me: { id: r.id, name: r.name, email: r.email, status: r.status }, myTurn: c.ok, ...(c.waitingFor ? { waitingFor: c.waitingFor } : {}), pages: e.pages,
    fields: e.fields.filter(f => f.recipientId === r.id), message: e.message, others: e.recipients.filter(x => x.id !== r.id).map(x => ({ name: x.name, status: x.status })) };
}
export const todayStr = (at = Date.now()) => new Date(at).toISOString().slice(0, 10);
/** Validate a signer's submission against THEIR fields only. Returns an error string or the resolved value for each field. */
export function resolveSubmission(e: Envelope, r: Recipient, pl: SignPayload): { error: string } | { values: Record<string, string> } {
  const out: Record<string, string> = {}; const mine = e.fields.filter(f => f.recipientId === r.id);
  for (const k of Object.keys(pl.values ?? {})) if (!mine.some(f => f.id === k)) return { error: "Unknown field" };
  const sig = pl.signature; const sigOk = sig && (sig.kind === "typed" ? str(sig.text, 80).length >= 2 : sig.kind === "drawn" && /^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(sig.png) && sig.png.length < 400_000);
  for (const f of mine) {
    const v = str(pl.values?.[f.id], 500);
    if (f.type === "signature") { if (!sigOk) { if (f.required) return { error: "Adopt your signature first" }; continue; } out[f.id] = sig!.kind === "typed" ? "typed:" + str(sig!.text, 80) : sig!.png; }
    else if (f.type === "initials") { const ini = str(pl.initials, 6) || initialsOf(r.name); if (!ini && f.required) return { error: "Initials are required" }; out[f.id] = ini; }
    else if (f.type === "date") out[f.id] = todayStr();
    else if (f.type === "checkbox") { if (f.required && v !== "1") return { error: `Please tick “${f.label || "the checkbox"}”` }; out[f.id] = v === "1" ? "1" : ""; }
    else { if (f.required && !v) return { error: `“${f.label || "Text"}” is required` }; out[f.id] = v; }
  }
  return { values: out };
}
export const initialsOf = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 3).map(w => w[0]!.toUpperCase()).join("");
export function statusSummary(e: Envelope) { const done = e.recipients.filter(r => r.status === "signed").length; return `${done} of ${e.recipients.length} signed`; }
