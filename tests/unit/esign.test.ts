import { describe, it, expect } from "vitest";
import { PDFDocument } from "pdf-lib";
import type { Envelope } from "@/lib/esign/types";
import { sanitizeDraft, sendProblems, canSign, resolveSubmission, signerView, initialsOf, isEmail, rid } from "@/lib/esign/logic";
import { SAMPLES, buildSamplePdf, sampleFieldLayout } from "@/lib/esign/samples";
import { finalizePdf } from "@/lib/esign/finalize";
const base = (): Envelope => ({ id: "e_1", ownerId: "u", title: "T", status: "draft", createdAt: 1, updatedAt: 1, pages: [{ w: 612, h: 792 }, { w: 612, h: 792 }], recipients: [], fields: [], events: [], sequential: true, message: "" });
function draft() {
  const e = sanitizeDraft({ title: " Deal ", recipients: [{ name: "Ana Diaz", email: "ANA@x.com" }, { name: "Bo Li", email: "bo@x.com" }] }, base());
  const [a, b] = e.recipients; return sanitizeDraft({ ...e, fields: [
    { type: "signature", recipientId: a!.id, page: 1, x: .1, y: .1, w: .3, h: .05 }, { type: "date", recipientId: a!.id, page: 1, x: .5, y: .1, w: .2, h: .03 },
    { type: "signature", recipientId: b!.id, page: 1, x: .1, y: .3, w: .3, h: .05 }, { type: "text", recipientId: b!.id, page: 0, x: .1, y: .5, w: .3, h: .03, label: "Title" }] }, e);
}
describe("sanitizeDraft", () => {
  it("normalises recipients and clamps fields", () => {
    const e = draft(); expect(e.title).toBe("Deal"); expect(e.recipients.map(r => r.email)).toEqual(["ana@x.com", "bo@x.com"]); expect(e.recipients.map(r => r.order)).toEqual([1, 2]);
    const wild = sanitizeDraft({ recipients: e.recipients, fields: [{ type: "signature", recipientId: e.recipients[0]!.id, page: 99, x: 5, y: -2, w: 3, h: 0 }, { type: "signature", recipientId: "nope", page: 0, x: 0, y: 0, w: .1, h: .1 }, { type: "evil", recipientId: e.recipients[0]!.id }] }, e);
    expect(wild.fields).toHaveLength(1); const f = wild.fields[0]!; expect(f.page).toBe(1); expect(f.w).toBe(1); expect(f.x).toBe(0); expect(f.y).toBe(0); expect(f.h).toBeGreaterThan(0);
  });
  it("keeps tokens and status server-side", () => {
    const e = draft(); const t = e.recipients[0]!.token; const again = sanitizeDraft({ recipients: [{ ...e.recipients[0]!, token: "hacked", status: "signed" }], status: "completed" }, e);
    expect(again.recipients[0]!.token).toBe(t); expect(again.recipients[0]!.status).toBe("pending"); expect(again.status).toBe("draft");
  });
});
describe("sendProblems", () => {
  it("passes a complete draft", () => expect(sendProblems(draft())).toEqual([]));
  it("flags missing recipients, bad emails, duplicates and missing signature fields", () => {
    expect(sendProblems(base())[0]).toMatch(/at least one recipient/);
    const e = draft(); e.recipients[1]!.email = "nope"; expect(sendProblems(e).join()).toMatch(/valid email/);
    const d = draft(); d.recipients[1]!.email = d.recipients[0]!.email; expect(sendProblems(d).join()).toMatch(/different email/);
    const n = draft(); n.fields = n.fields.filter(f => !(f.type === "signature" && f.recipientId === n.recipients[1]!.id)); expect(sendProblems(n).join()).toMatch(/Bo Li needs a signature field/);
    const sent = draft(); sent.status = "sent"; expect(sendProblems(sent)[0]).toMatch(/Only drafts/);
  });
});
describe("routing", () => {
  it("sequential: second signer waits for the first", () => {
    const e = draft(); e.status = "sent"; const [a, b] = e.recipients as [any, any];
    expect(canSign(e, a).ok).toBe(true); expect(canSign(e, b)).toEqual({ ok: false, waitingFor: "Ana Diaz" }); a.status = "signed"; expect(canSign(e, b).ok).toBe(true); expect(canSign(e, a).ok).toBe(false);
    e.sequential = false; a.status = "pending"; expect(canSign(e, b).ok).toBe(true);
  });
  it("signerView only exposes this recipient's fields and no tokens", () => {
    const e = draft(); e.status = "sent"; const v = signerView(e, e.recipients[1]!); expect(v.fields.every(f => f.recipientId === e.recipients[1]!.id)).toBe(true); expect(JSON.stringify(v)).not.toContain(e.recipients[0]!.token);
  });
});
describe("resolveSubmission", () => {
  const typed = { kind: "typed" as const, text: "Ana Diaz" };
  it("requires a signature and resolves date server-side", () => {
    const e = draft(); e.status = "sent"; const a = e.recipients[0]!;
    expect(resolveSubmission(e, a, { values: {} })).toEqual({ error: "Adopt your signature first" });
    const r = resolveSubmission(e, a, { signature: typed, values: {} }); expect("values" in r && Object.keys(r.values)).toHaveLength(2);
    const dateId = e.fields.find(f => f.type === "date")!.id; expect("values" in r && r.values[dateId]).toBe(new Date().toISOString().slice(0, 10));
  });
  it("requires required text, rejects unknown field ids and other people's fields", () => {
    const e = draft(); e.status = "sent"; const b = e.recipients[1]!; const tf = e.fields.find(f => f.type === "text")!;
    expect(resolveSubmission(e, b, { signature: { kind: "typed", text: "Bo" }, values: {} })).toEqual({ error: "“Title” is required" });
    expect(resolveSubmission(e, b, { signature: { kind: "typed", text: "Bo" }, values: { [tf.id]: "CEO", zzz: "x" } })).toEqual({ error: "Unknown field" });
    expect(resolveSubmission(e, b, { signature: { kind: "typed", text: "Bo" }, values: { [e.fields[0]!.id]: "x", [tf.id]: "CEO" } })).toEqual({ error: "Unknown field" });
    expect("values" in resolveSubmission(e, b, { signature: { kind: "typed", text: "Bo" }, values: { [tf.id]: "CEO" } })).toBe(true);
  });
  it("rejects too-short typed signatures and malformed drawn PNGs", () => {
    const e = draft(); e.status = "sent"; const a = e.recipients[0]!;
    expect("error" in resolveSubmission(e, a, { signature: { kind: "typed", text: "A" }, values: {} })).toBe(true);
    expect("error" in resolveSubmission(e, a, { signature: { kind: "drawn", png: "data:text/html;base64,AAAA" }, values: {} })).toBe(true);
    expect("values" in resolveSubmission(e, a, { signature: { kind: "drawn", png: "data:image/png;base64,iVBORw0KGgo=" }, values: {} })).toBe(true);
  });
});
describe("helpers", () => {
  it("initials, emails, ids", () => { expect(initialsOf("ana maria diaz")).toBe("AMD"); expect(isEmail("a@b.co")).toBe(true); expect(isEmail("a@b")).toBe(false); expect(rid("x_")).toMatch(/^x_[a-z2-9]{9}$/); });
});
describe("samples + finalize", () => {
  it("builds real multi-page PDFs with a signature page", async () => {
    for (const s of SAMPLES) { const bytes = await buildSamplePdf(s); const doc = await PDFDocument.load(bytes); expect(doc.getPageCount()).toBeGreaterThanOrEqual(2); expect(sampleFieldLayout(s, doc.getPageCount() - 1, ["a", "b"])).toHaveLength(s.parties.length * 2); }
  });
  it("flattens signed fields and appends a certificate page", async () => {
    const orig = await buildSamplePdf(SAMPLES[0]!); const pages = (await PDFDocument.load(orig)).getPageCount();
    const e = draft(); e.pages = Array(pages).fill({ w: 612, h: 792 }); e.fields.forEach(f => { f.page = pages - 1; });
    const png = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
    const values: Record<string, string> = {}; for (const f of e.fields) values[f.id] = f.type === "signature" ? (f.recipientId === e.recipients[0]!.id ? "typed:Ana Diaz" : png) : f.type === "date" ? "2026-10-14" : "CEO";
    e.recipients.forEach(r => { r.status = "signed"; r.signedAt = 1_760_000_000_000; }); e.events.push({ at: 1_760_000_000_000, who: "Ana Diaz", what: "Signed" });
    const out = await finalizePdf(orig, e, values); const doc = await PDFDocument.load(out); expect(doc.getPageCount()).toBe(pages + 1); expect(out.length).toBeGreaterThan(orig.length);
  });
});

it("deduplicates client-supplied recipient and field identities", () => { const e = draft(); const r = e.recipients[0]; const f = e.fields[0]; const next = sanitizeDraft({ recipients: [r, r], fields: [f, f] }, e); expect(new Set(next.recipients.map(x => x.id)).size).toBe(2); expect(new Set(next.recipients.map(x => x.token)).size).toBe(2); expect(new Set(next.fields.map(x => x.id)).size).toBe(2); });
