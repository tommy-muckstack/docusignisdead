"use client";
import { useEffect, useRef, useState } from "react";
type Page = { w: number; h: number };
/** Renders each PDF page to a canvas with pdf.js (client only) and lets the caller draw an overlay on top of every page.
 *  Overlay coordinates are fractions of the page, so the layout is the same at any width. */
export function PdfPages({ url, pages, width, overlay, onPageClick, onReady }: { url: string; pages: Page[]; width: number; overlay?: (page: number) => React.ReactNode; onPageClick?: (page: number, fx: number, fy: number) => void; onReady?: (ready: boolean) => void }) {
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const canvases = useRef<(HTMLCanvasElement | null)[]>([]);
  useEffect(() => {
    let dead = false; let doc: any; setState("loading"); onReady?.(false);
    (async () => {
      try {
        const pdfjs: any = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
        doc = await pdfjs.getDocument({ url, withCredentials: true }).promise;
        const dpr = Math.min(2, window.devicePixelRatio || 1);
        for (let i = 0; i < doc.numPages && !dead; i++) {
          const pg = await doc.getPage(i + 1); const c = canvases.current[i]; if (!c) continue;
          const vp = pg.getViewport({ scale: (width / pg.getViewport({ scale: 1 }).width) * dpr });
          c.width = Math.floor(vp.width); c.height = Math.floor(vp.height);
          await pg.render({ canvasContext: c.getContext("2d")!, viewport: vp }).promise;
          c.dataset["rendered"] = "1";
        }
        if (!dead) { setState("ready"); onReady?.(true); }
      } catch { if (!dead) setState("error"); }
    })();
    return () => { dead = true; doc?.destroy?.(); };
  }, [url, width, onReady]);
  return <div className="dsp" data-state={state} data-testid="pdf-pages">
    {state === "error" && <p className="ids-muted" role="alert">Could not display this PDF.</p>}
    {pages.map((p, i) => <div key={i} className="dsp__page" data-page={i} style={{ width, height: Math.round(width * p.h / p.w) }}
      onClick={e => { if (!onPageClick || e.target !== e.currentTarget && !(e.target as HTMLElement).classList.contains("dsp__canvas")) return; const r = e.currentTarget.getBoundingClientRect(); onPageClick(i, (e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height); }}>
      <canvas ref={el => { canvases.current[i] = el; }} className="dsp__canvas" style={{ width: "100%", height: "100%" }} />
      {overlay?.(i)}
      <span className="dsp__num">Page {i + 1} of {pages.length}</span></div>)}
  </div>;
}
