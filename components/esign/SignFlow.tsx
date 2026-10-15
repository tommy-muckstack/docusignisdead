"use client";
import { useEffect, useRef, useState } from "react";
import type { Field, SignatureValue, SignerView } from "@/lib/esign/types";
import { initialsOf, todayStr } from "@/lib/esign/logic";
import { BP } from "@/lib/basepath";
import { PdfPages } from "./PdfPages";
import { Logo } from "@/components/Logo";
function DrawPad({ onChange }: { onChange: (png: string | null) => void }) {
  const ref = useRef<HTMLCanvasElement>(null); const drawing = useRef(false); const dirty = useRef(false);
  const pos = (e: React.PointerEvent) => { const r = ref.current!.getBoundingClientRect(); return [(e.clientX - r.left) * (ref.current!.width / r.width), (e.clientY - r.top) * (ref.current!.height / r.height)] as const; };
  return <div><canvas ref={ref} width={560} height={180} className="dss__pad" aria-label="Draw your signature" data-testid="pad"
    onPointerDown={e => { drawing.current = true; e.currentTarget.setPointerCapture(e.pointerId); const c = ref.current!.getContext("2d")!; const [x, y] = pos(e); c.lineWidth = 3; c.lineCap = "round"; c.strokeStyle = "#0B1F6B"; c.beginPath(); c.moveTo(x, y); }}
    onPointerMove={e => { if (!drawing.current) return; const c = ref.current!.getContext("2d")!; const [x, y] = pos(e); c.lineTo(x, y); c.stroke(); dirty.current = true; }}
    onPointerUp={() => { drawing.current = false; if (dirty.current) onChange(ref.current!.toDataURL("image/png")); }} />
    <button type="button" className="iconbtn" onClick={() => { const c = ref.current!; c.getContext("2d")!.clearRect(0, 0, c.width, c.height); dirty.current = false; onChange(null); }}>Clear</button></div>;
}
export function SignFlow({ token }: { token: string }) {
  const [view, setView] = useState<SignerView | null>(null); const [err, setErr] = useState(""); const [fatal, setFatal] = useState("");
  const [sig, setSig] = useState<SignatureValue | null>(null); const [vals, setVals] = useState<Record<string, string>>({}); const [adopt, setAdopt] = useState(false);
  const [busy, setBusy] = useState(false); const [done, setDone] = useState<null | { completed: boolean }>(null);
  const [tab, setTab] = useState<"type" | "draw">("type"); const [typed, setTyped] = useState(""); const [drawn, setDrawn] = useState<string | null>(null);
  useEffect(() => { (async () => { const r = await fetch(`${BP}/api/sign/${token}`); const j = await r.json(); if (!r.ok) { setFatal(j.error ?? "This link is not valid"); return; } setView(j.view); setTyped(j.view.me.name); })(); }, [token]);
  if (fatal) return <div className="dss dss--msg"><div className="ids-card" style={{ padding: 32, maxWidth: 480, textAlign: "center" }}><Logo size={28} /><h1 className="ids-h1" style={{ fontSize: 28 }}>Link unavailable</h1><p className="ids-muted">{fatal}</p></div></div>;
  if (!view) return <div className="dss dss--msg"><p className="ids-muted">Loading document…</p></div>;
  const mine = view.fields; const initials = initialsOf(view.me.name);
  const valueOf = (f: Field) => f.type === "signature" ? (sig ? (sig.kind === "typed" ? sig.text : "drawn") : "") : f.type === "initials" ? (sig ? initials : "") : f.type === "date" ? (sig ? todayStr() : "") : (vals[f.id] ?? "");
  const missing = mine.filter(f => f.required && !valueOf(f) || (f.type === "checkbox" && f.required && vals[f.id] !== "1"));
  const submit = async () => { setBusy(true); setErr(""); const r = await fetch(`${BP}/api/sign/${token}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ signature: sig ?? undefined, initials, values: vals }) }); const j = await r.json(); setBusy(false); if (!r.ok) { setErr(j.error); return; } setView(j.view); setDone({ completed: j.completed }); };
  const adoptIt = () => { if (tab === "type" && typed.trim().length >= 2) setSig({ kind: "typed", text: typed.trim() }); else if (tab === "draw" && drawn) setSig({ kind: "drawn", png: drawn }); else return; setAdopt(false); };
  if (done || view.me.status === "signed") return <div className="dss dss--msg"><div className="ids-card" style={{ padding: 36, maxWidth: 520, textAlign: "center" }} data-testid="signed-done"><Logo size={28} />
    <h1 className="ids-h1" style={{ fontSize: 30 }}>{view.status === "completed" ? "Everyone has signed" : "You’ve signed"}</h1>
    <p className="ids-muted">{view.status === "completed" ? `“${view.title}” is complete. Download your copy with the certificate of completion.` : `Thanks, ${view.me.name}. We’ll let the others finish: ${view.others.filter(o => o.status === "pending").map(o => o.name).join(", ") || "nobody left"}.`}</p>
    {view.status === "completed" && <a className="ids-btn ids-btn--primary" href={`${BP}/api/sign/${token}/pdf?dl=1`}>Download signed PDF</a>}</div></div>;
  if (view.status === "voided") return <div className="dss dss--msg"><div className="ids-card" style={{ padding: 32, maxWidth: 480, textAlign: "center" }}><Logo size={28} /><h1 className="ids-h1" style={{ fontSize: 28 }}>This document was voided</h1><p className="ids-muted">The sender cancelled “{view.title}”. Nothing more is needed from you.</p></div></div>;
  if (!view.myTurn) return <div className="dss dss--msg"><div className="ids-card" style={{ padding: 32, maxWidth: 480, textAlign: "center" }}><Logo size={28} /><h1 className="ids-h1" style={{ fontSize: 28 }}>Not your turn yet</h1><p className="ids-muted">{view.waitingFor ? `${view.waitingFor} needs to sign “${view.title}” first. This link will work as soon as they do.` : "This document is not open for signing."}</p></div></div>;
  const overlay = (page: number) => <>{mine.filter(f => f.page === page).map(f => { const v = valueOf(f); const style = { left: `${f.x * 100}%`, top: `${f.y * 100}%`, width: `${f.w * 100}%`, height: `${f.h * 100}%` };
    const need = f.required && !v && !(f.type === "checkbox");
    if (f.type === "signature") return <button key={f.id} data-testid="sig-field" className={"dss__f dss__f--sig" + (v ? " done" : "")} style={style} onClick={() => setAdopt(true)}>{sig ? (sig.kind === "typed" ? <span className="dss__typed">{sig.text}</span> : <img src={sig.png} alt="Your drawn signature" />) : "✍ Click to sign"}</button>;
    if (f.type === "initials") return <button key={f.id} className={"dss__f" + (v ? " done" : "")} style={style} onClick={() => setAdopt(true)}>{sig ? <span className="dss__typed">{initials}</span> : "Initial"}</button>;
    if (f.type === "date") return <div key={f.id} className={"dss__f dss__f--static" + (v ? " done" : "")} style={style}>{v || "Date signed"}</div>;
    if (f.type === "checkbox") return <label key={f.id} className={"dss__f dss__f--chk" + (vals[f.id] === "1" ? " done" : "")} style={style}><input type="checkbox" aria-label={f.label || "Checkbox"} checked={vals[f.id] === "1"} onChange={e => setVals(x => ({ ...x, [f.id]: e.target.checked ? "1" : "" }))} /></label>;
    return <input key={f.id} className={"dss__f dss__f--text" + (need ? " need" : v ? " done" : "")} style={style} aria-label={f.label || "Text"} placeholder={f.label || "Type here"} value={vals[f.id] ?? ""} onChange={e => setVals(x => ({ ...x, [f.id]: e.target.value }))} />; })}</>;
  return <div className="dss">
    <header className="dss__hd"><Logo size={26} /><div className="dss__ttl"><b>{view.title}</b><span className="ids-muted">for {view.me.name} · {view.me.email}</span></div><span style={{ flex: 1 }} />
      <span className="ids-muted" data-testid="remaining">{missing.length ? `${missing.length} to complete` : "Ready to finish"}</span>
      <button className="ids-btn ids-btn--primary" disabled={busy || missing.length > 0} onClick={submit} data-testid="finish">{busy ? "Finishing…" : "Finish"}</button></header>
    {view.message && <div className="dss__msg"><b>Message:</b> {view.message}</div>}
    {err && <p role="alert" className="ds-err" style={{ textAlign: "center" }}>{err}</p>}
    <main className="dss__doc"><PdfPages url={`${BP}/api/sign/${token}/pdf`} pages={view.pages} width={Math.min(760, typeof window === "undefined" ? 760 : window.innerWidth - 24)} overlay={overlay} /></main>
    {adopt && <div className="tfd__modal" role="dialog" aria-label="Adopt your signature" onClick={e => { if (e.target === e.currentTarget) setAdopt(false); }}><div className="ids-card dss__sheet">
      <h2 style={{ margin: 0 }}>Adopt your signature</h2><div className="tb" role="tablist" style={{ margin: "14px 0" }}>{(["type", "draw"] as const).map(t => <button key={t} role="tab" aria-selected={tab === t} className={"iconbtn" + (tab === t ? " on" : "")} onClick={() => setTab(t)}>{t === "type" ? "Type" : "Draw"}</button>)}</div>
      {tab === "type" ? <><label className="dse__lbl">Full name<input value={typed} onChange={e => setTyped(e.target.value)} /></label><div className="dss__preview" data-testid="typed-preview">{typed || "Your signature"}</div></> : <DrawPad onChange={setDrawn} />}
      <p className="ids-muted" style={{ fontSize: 12.5 }}>By selecting Adopt and sign, I agree that this is my legal signature and is as valid as a handwritten one.</p>
      <div className="tb" style={{ justifyContent: "flex-end" }}><button className="iconbtn" onClick={() => setAdopt(false)}>Cancel</button><button className="ids-btn ids-btn--primary" onClick={adoptIt} disabled={tab === "type" ? typed.trim().length < 2 : !drawn}>Adopt and sign</button></div></div></div>}
  </div>;
}
