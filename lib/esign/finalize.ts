import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { createHash } from "node:crypto";
import { DISCLOSURE_TEXT, DISCLOSURE_VERSION } from "./disclosure";
import type { Envelope } from "./types";
/** Flatten every signed field into the original PDF and append a completion certificate page. Pure: bytes in, bytes out. */
export async function finalizePdf(original: Uint8Array, e: Envelope, values: Record<string, string>): Promise<Uint8Array> {
  const pdf = await PDFDocument.load(original); const pages = pdf.getPages();
  const ital = await pdf.embedFont(StandardFonts.TimesRomanItalic); const sans = await pdf.embedFont(StandardFonts.Helvetica); const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  for (const f of e.fields) {
    const v = values[f.id]; if (!v) continue; const pg = pages[f.page]; if (!pg) continue; const { width: W, height: H } = pg.getSize();
    const x = f.x * W, w = f.w * W, h = f.h * H, y = H - f.y * H - h;
    if (f.type === "signature" && v.startsWith("data:image/png")) { const img = await pdf.embedPng(Buffer.from(v.split(",")[1]!, "base64")); const s = Math.min(w / img.width, h / img.height); pg.drawImage(img, { x, y: y + (h - img.height * s) / 2, width: img.width * s, height: img.height * s }); }
    else if (f.type === "signature") { const t = v.replace(/^typed:/, ""); const size = Math.min(h * 0.8, (w / Math.max(t.length, 1)) * 1.9); pg.drawText(t, { x, y: y + h * 0.2, size, font: ital, color: rgb(0.05, 0.1, 0.45) }); }
    else if (f.type === "checkbox") { pg.drawRectangle({ x, y, width: w, height: h, borderColor: rgb(0.1, 0.1, 0.1), borderWidth: 0.8 }); pg.drawText("X", { x: x + w * 0.2, y: y + h * 0.15, size: h * 0.8, font: bold }); }
    else { const size = Math.min(h * 0.7, 12); pg.drawText(v.replace(/[^\x20-\x7E]/g, "?"), { x, y: y + (h - size) / 2 + 1, size, font: f.type === "initials" ? ital : sans, color: rgb(0.05, 0.1, 0.45) }); }
  }
  const certificateStart = pdf.getPageCount(); let c = pdf.addPage([612, 792]); let y = 730; const M = 48, lineHeight = 13;
  const ascii = (s: string) => s.replace(/[^\x20-\x7E]/g, "?");
  const addLine = (text: string, heading = false) => {
    if (y < 70) { c = pdf.addPage([612, 792]); y = 730; }
    c.drawText(text, { x: M, y, size: heading ? 12 : 9, font: heading ? bold : sans, color: rgb(.08, .03, .16) }); y -= heading ? 20 : lineHeight;
  };
  const paragraph = (text: string, heading = false) => {
    const font = heading ? bold : sans, size = heading ? 12 : 9; let line = "";
    for (const character of ascii(text)) { if (font.widthOfTextAtSize(line + character, size) > 516) { addLine(line, heading); line = ""; } line += character; }
    if (line) addLine(line, heading); y -= 4;
  };
  paragraph("Certificate of completion", true); paragraph("DocuSignIsDead | " + e.title); paragraph("Envelope " + e.id);
  paragraph("Original PDF SHA-256: " + createHash("sha256").update(original).digest("hex"));
  paragraph("Recipients", true);
  for (const r of e.recipients) {
    paragraph(`${r.name} <${r.email}> | ${r.role ?? "signer"} | ${r.status}`);
    if (r.consentedAt) paragraph(`Disclosure ${r.consentVersion}: agreed ${new Date(r.consentedAt).toISOString()}`);
    if (r.signedAt || r.viewedAt) paragraph(`${r.role === "viewer" ? "Review confirmed" : "Signed"}: ${new Date((r.signedAt ?? r.viewedAt)!).toISOString()}`);
  }
  paragraph("Activity (UTC)", true);
  for (const ev of [...e.events].sort((a, b) => a.at - b.at)) paragraph(`${new Date(ev.at).toISOString()} | ${ev.who}: ${ev.what}`);
  if (e.recipients.some(r => r.consentedAt)) { paragraph(`Electronic record and signature disclosure (${DISCLOSURE_VERSION})`, true); for (const text of DISCLOSURE_TEXT) paragraph(text); }
  const certificates = pdf.getPages().slice(certificateStart);
  certificates.forEach((page, i) => { page.drawText(`DocuSignIsDead | Simple electronic signature | Certificate ${i + 1} of ${certificates.length}`, { x: M, y: 38, size: 8, font: sans, color: rgb(.4, .4, .4) }); });
  return pdf.save();
}
