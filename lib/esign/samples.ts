import { PDFDocument, StandardFonts, rgb, type PDFFont } from "pdf-lib";
import { SAMPLES, type Sample } from "./sample-data";
export { SAMPLES, type Sample };
function wrap(text: string, font: PDFFont, size: number, max: number): string[] {
  const out: string[] = []; let line = "";
  for (const word of text.split(/\s+/)) { const t = line ? line + " " + word : word; if (font.widthOfTextAtSize(t, size) > max && line) { out.push(line); line = word; } else line = t; }
  if (line) out.push(line); return out;
}
/** Builds a real multi-page US-Letter PDF for a sample document. The last page has signature blocks. */
export async function buildSamplePdf(s: Sample): Promise<Uint8Array> {
  const pdf = await PDFDocument.create(); const body = await pdf.embedFont(StandardFonts.TimesRoman); const bold = await pdf.embedFont(StandardFonts.TimesRomanBold);
  const W = 612, H = 792, M = 72; let page = pdf.addPage([W, H]); let y = H - M;
  page.drawText(s.title, { x: M, y, size: 20, font: bold, color: rgb(0.07, 0, 0.2) }); y -= 36;
  const ensure = (need: number) => { if (y - need < M) { page = pdf.addPage([W, H]); y = H - M; } };
  for (const sec of s.sections) {
    ensure(60); page.drawText(sec.h, { x: M, y, size: 13, font: bold }); y -= 20;
    for (const ln of wrap(sec.p, body, 11.5, W - 2 * M)) { ensure(18); page.drawText(ln, { x: M, y, size: 11.5, font: body }); y -= 17; } y -= 12;
  }
  page = pdf.addPage([W, H]); y = H - M; page.drawText("Signatures", { x: M, y, size: 16, font: bold }); y -= 24;
  page.drawText("By signing below, each party agrees to the terms above.", { x: M, y, size: 11.5, font: body });
  s.parties.forEach((p, i) => { const by = H - 230 - i * 200; page.drawText(p, { x: M, y: by + 70, size: 12, font: bold });
    page.drawLine({ start: { x: M, y: by + 20 }, end: { x: M + 230, y: by + 20 }, thickness: 0.8 }); page.drawText("Signature", { x: M, y: by + 6, size: 9, font: body, color: rgb(0.4, 0.4, 0.4) });
    page.drawLine({ start: { x: M + 290, y: by + 20 }, end: { x: M + 440, y: by + 20 }, thickness: 0.8 }); page.drawText("Date", { x: M + 290, y: by + 6, size: 9, font: body, color: rgb(0.4, 0.4, 0.4) }); });
  pdf.setTitle(s.title); return pdf.save();
}
/** Default field layout for the sample's signature page (fractions of the page). */
export function sampleFieldLayout(s: Sample, pageIndex: number, recipientIds: string[]) {
  const H = 792, W = 612;
  return s.parties.flatMap((_, i) => { const by = H - 230 - i * 200; const rid = recipientIds[i] ?? recipientIds[0]!; return [
    { type: "signature" as const, recipientId: rid, page: pageIndex, x: 72 / W, y: (H - (by + 20 + 36)) / H, w: 0.37, h: 36 / H },
    { type: "date" as const, recipientId: rid, page: pageIndex, x: (72 + 290) / W, y: (H - (by + 20 + 22)) / H, w: 150 / W, h: 22 / H } ]; });
}
