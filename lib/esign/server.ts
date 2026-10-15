import { getDoc, putDoc, listDocs, delDoc, mutateDoc } from "@/lib/store";
import { getAccount } from "@/lib/account";
import { PDFDocument } from "pdf-lib";
import type { Envelope } from "./types";
import { rid, newToken, sanitizeDraft } from "./logic";
import { SAMPLES, buildSamplePdf, sampleFieldLayout } from "./samples";
export const MAX_PDF = 4_000_000;
export const getEnvelope = (id: string) => getDoc<Envelope>("envelopes", id);
export const mutateEnvelope = (id: string, change: (e: Envelope) => Envelope | Promise<Envelope>) => mutateDoc<Envelope>("envelopes", id, e => { if (!e) throw new Error("Document not found"); return change(e); });
export const saveEnvelope = (e: Envelope) => putDoc("envelopes", e.id, e);
export async function listEnvelopes(ownerId: string, kind?: "template") { return (await listDocs<Envelope>("envelopes")).filter(e => e.ownerId === ownerId && (kind === "template" ? e.kind === "template" : e.kind !== "template")).sort((a, b) => b.updatedAt - a.updatedAt); }
type Blob = { b64: string };
export async function getPdf(kind: "original" | "signed", id: string): Promise<Uint8Array | null> { const d = await getDoc<Blob>(kind, id); return d ? new Uint8Array(Buffer.from(d.b64, "base64")) : null; }
export const putPdf = (kind: "original" | "signed", id: string, bytes: Uint8Array) => putDoc<Blob>(kind, id, { b64: Buffer.from(bytes).toString("base64") });
export async function deleteEnvelope(id: string) { const e = await getEnvelope(id); await delDoc("envelopes", id); await delDoc("original", id); await delDoc("signed", id); await delDoc("values", id); for (const r of e?.recipients ?? []) await delDoc("tokens", r.token); }
/** Validate + read page sizes from an uploaded PDF. Throws a user-readable error. */
export async function readPages(bytes: Uint8Array) {
  if (bytes.length > MAX_PDF) throw new Error("PDF is too large (4 MB max)");
  if (String.fromCharCode(...bytes.slice(0, 5)) !== "%PDF-") throw new Error("That file is not a PDF");
  let doc: PDFDocument; try { doc = await PDFDocument.load(bytes, { ignoreEncryption: false }); } catch { throw new Error("Could not read that PDF (is it password protected?)"); }
  if (doc.getPageCount() < 1) throw new Error("PDF must have at least one page");
  if (doc.getPageCount() > 60) throw new Error("PDFs are limited to 60 pages"); return doc.getPages().map(p => ({ w: p.getWidth(), h: p.getHeight() }));
}
export async function createEnvelope(ownerId: string, opts: { title?: string; pdf?: Uint8Array; sample?: string; kind?: "template"; self?: { name: string; email: string } }): Promise<Envelope> {
  const now = Date.now(); const id = rid("e_"); let bytes = opts.pdf; let title = opts.title ?? "Untitled document"; let sample = SAMPLES.find(s => s.id === opts.sample);
  if (!bytes) { sample ??= SAMPLES[0]!; bytes = await buildSamplePdf(sample); title = sample.title; }
  const pages = await readPages(bytes); const defaults = await getAccount(ownerId);
  const base: Envelope = { ...(opts.kind ? { kind: opts.kind } : {}), id, ownerId, title, status: "draft", createdAt: now, updatedAt: now, pages, recipients: [], fields: [], events: [{ at: now, who: "You", what: "Created the document" }], sequential: defaults.sequential, expireDays: defaults.expireDays, reminderDays: defaults.reminderDays, subject: title, message: "" };
  if (sample) {
    const recs = sample.parties.map((p, i) => ({ id: rid("r_"), name: "", email: "", order: i + 1, token: newToken(), status: "pending" as const, party: p }));
    base.recipients = recs.map(({ party, ...r }) => ({ ...r, roleName: party })); base.fields = sampleFieldLayout(sample, pages.length - 1, recs.map(r => r.id)).map(f => ({ ...f, id: rid("f_"), required: true }));
  }
  if (opts.self && !opts.kind) {
    const first = base.recipients[0] ?? { id: rid("r_"), token: newToken(), order: 1, status: "pending" as const, name: "", email: "" };
    base.recipients = [{ ...first, name: opts.self.name, email: opts.self.email, role: "signer" }]; base.fields = base.fields.filter(f => f.recipientId === first.id);
  }
  await putPdf("original", id, bytes); await saveEnvelope(base); return base;
}
export { sanitizeDraft };
export const ownerView = (e: Envelope) => e;
/** Strip tokens when exposing recipients to anyone but the owner. */
export const withoutTokens = (e: Envelope) => ({ ...e, recipients: e.recipients.map(({ token: _t, ...r }) => r) });

export async function instantiateTemplate(ownerId: string, id: string) {
  const template = await getEnvelope(id);
  if (!template || template.ownerId !== ownerId || template.kind !== "template") throw new Error("Template not found");
  if (!template.recipients.length || template.recipients.some(r => !r.roleName?.trim())) throw new Error("Give every placeholder a role name before using this template");
  const bytes = await getPdf("original", id); if (!bytes) throw new Error("Template PDF is unavailable");
  const draft = await createEnvelope(ownerId, { title: template.title, pdf: bytes });
  const mapping = new Map(template.recipients.map(r => [r.id, rid("r_")]));
  draft.recipients = template.recipients.map(r => ({ ...r, id: mapping.get(r.id)!, name: "", email: "", token: newToken(), status: "pending", signedAt: undefined }));
  draft.fields = template.fields.map(f => ({ ...f, id: rid("f_"), recipientId: mapping.get(f.recipientId)! }));
  draft.subject = template.subject; draft.expireDays = template.expireDays; draft.reminderDays = template.reminderDays; draft.message = template.message; draft.sequential = template.sequential;
  draft.events.push({ at: Date.now(), who: "You", what: "Created from template: " + template.title });
  await saveEnvelope(draft); return draft;
}
