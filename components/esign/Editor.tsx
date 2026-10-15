"use client";
import { useCallback, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Envelope, Field, FieldType } from "@/lib/esign/types";
import { FIELD_META } from "@/lib/esign/types";
import { rid, sendProblems, statusSummary } from "@/lib/esign/logic";
import { BP } from "@/lib/basepath";
import { PdfPages } from "./PdfPages";
import { useDraftSave } from "./useDraftSave";
import { rcolor } from "./colors";
const PAGE_W = 680;
const FT: FieldType[] = ["signature", "initials", "date", "text", "checkbox"];
const GLYPH: Record<FieldType, string> = { signature: "✍", initials: "AB", date: "📅", text: "T", checkbox: "☑" };
export function Editor({ initial }: { initial: Envelope }) {
  const [env, setEnv] = useState<Envelope>(initial); const router = useRouter();
  const [armed, setArmed] = useState<FieldType | null>(null); const [sel, setSel] = useState<string | null>(null); const [active, setActive] = useState(initial.recipients[0]?.id ?? "");
  const { state: save, flush } = useDraftSave(env); const [err, setErr] = useState(""); const [busy, setBusy] = useState(false); const [copied, setCopied] = useState("");
  const draft = env.status === "draft"; const template = env.kind === "template";
  const base = typeof window === "undefined" ? "" : window.location.origin + BP;
  const patch = useCallback((f: (e: Envelope) => Envelope) => setEnv(e => f(e)), []);
  const addRecipient = () => { const id = rid("r_"); patch(e => ({ ...e, recipients: [...e.recipients, { id, name: "", email: "", order: e.recipients.length + 1, token: "", status: "pending" }] })); setActive(id); };
  const delRecipient = (id: string) => { patch(e => ({ ...e, recipients: e.recipients.filter(r => r.id !== id).map((r, i) => ({ ...r, order: i + 1 })), fields: e.fields.filter(f => f.recipientId !== id) })); setActive(a => (a === id ? "" : a)); };
  const upd = (id: string, p: Partial<Field>) => patch(e => ({ ...e, fields: e.fields.map(f => (f.id === id ? { ...f, ...p } : f)) }));
  const place = (page: number, fx: number, fy: number) => {
    if (!armed || !draft || busy) return; const rec = env.recipients.find(r => r.id === active) ?? env.recipients[0]; if (!rec) { setErr("Add a recipient first"); return; }
    const m = FIELD_META[armed]; const f: Field = { id: rid("f_"), recipientId: rec.id, type: armed, page, x: Math.min(1 - m.w, Math.max(0, fx - m.w / 2)), y: Math.min(1 - m.h, Math.max(0, fy - m.h / 2)), w: m.w, h: m.h, required: armed !== "checkbox" };
    patch(e => ({ ...e, fields: [...e.fields, f] })); setSel(f.id); setArmed(null); setErr("");
  };
  const drag = (f: Field, mode: "move" | "size") => (e: React.PointerEvent<HTMLDivElement>) => {
    if (!draft || busy) return; e.stopPropagation(); const el = e.currentTarget; const pg = el.closest(".dsp__page") as HTMLElement; const r = pg.getBoundingClientRect(); const sx = e.clientX, sy = e.clientY; const o = { ...f }; setSel(f.id); el.setPointerCapture(e.pointerId);
    const move = (ev: PointerEvent) => { const dx = (ev.clientX - sx) / r.width, dy = (ev.clientY - sy) / r.height;
      if (mode === "move") upd(f.id, { x: Math.min(1 - o.w, Math.max(0, o.x + dx)), y: Math.min(1 - o.h, Math.max(0, o.y + dy)) }); else upd(f.id, { w: Math.min(1 - o.x, Math.max(0.03, o.w + dx)), h: Math.min(1 - o.y, Math.max(0.02, o.h + dy)) }); };
    const up = () => { el.removeEventListener("pointermove", move as any); el.removeEventListener("pointerup", up); }; el.addEventListener("pointermove", move as any); el.addEventListener("pointerup", up);
  };
  const problems = sendProblems(env);
  const send = async () => { setBusy(true); setErr(""); try { await flush(); const r = await fetch(`${BP}/api/envelopes/${env.id}/send`, { method: "POST" }); const j = await r.json(); if (!r.ok) throw new Error(j.error); setEnv(j.envelope); router.refresh(); } catch (error) { setErr((error as Error).message); } finally { setBusy(false); } };
  const saveTemplate = async (use: boolean) => { setBusy(true); setErr(""); try { await flush(); if (use) { const r = await fetch(`${BP}/api/templates/${env.id}/use`, { method: "POST" }); const j = await r.json(); if (!r.ok) throw new Error(j.error); router.push(`/app/envelopes/${j.envelope.id}`); } else router.push("/app/templates"); } catch (error) { setErr((error as Error).message); } finally { setBusy(false); } };
  const voidIt = async () => { const reason = prompt("Why are you voiding this document? (optional)") ; if (reason === null) return; const r = await fetch(`${BP}/api/envelopes/${env.id}/void`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ reason }) }); if (r.ok) setEnv((await r.json()).envelope); };
  const copy = async (token: string) => { await navigator.clipboard.writeText(`${base}/sign/${token}`).catch(() => {}); setCopied(token); setTimeout(() => setCopied(""), 1800); };
  const selField = env.fields.find(f => f.id === sel);
  const overlay = (page: number) => <>{env.fields.filter(f => f.page === page).map(f => { const r = env.recipients.find(x => x.id === f.recipientId); const c = rcolor(r?.order ?? 1);
    return <div key={f.id} className={"dsf" + (sel === f.id ? " dsf--sel" : "")} data-testid="field" data-type={f.type} role="button" aria-label={`${FIELD_META[f.type].label} for ${r?.name || "recipient " + r?.order}`} tabIndex={0}
      style={{ left: `${f.x * 100}%`, top: `${f.y * 100}%`, width: `${f.w * 100}%`, height: `${f.h * 100}%`, borderColor: c, background: c + "1F", color: c, cursor: draft ? "move" : "default" }} onPointerDown={drag(f, "move")} onClick={e => { e.stopPropagation(); setSel(f.id); }}
      onKeyDown={e => { if ((e.key === "Delete" || e.key === "Backspace") && draft) patch(x => ({ ...x, fields: x.fields.filter(q => q.id !== f.id) })); }}>
      <span className="dsf__tag" style={{ background: c }}>{GLYPH[f.type]} {f.label || FIELD_META[f.type].label}{f.required ? " *" : ""}</span>
      {draft && sel === f.id && <div className="dsf__grip" aria-label="Resize" onPointerDown={drag(f, "size")} style={{ background: c }} />}</div>; })}</>;
  return <div className="dse">
    <div className="dse__top"><Link href={template ? "/app/templates" : "/app/envelopes"} className="iconbtn" style={{ textDecoration: "none", color: "inherit" }}>← {template ? "Templates" : "Agreements"}</Link>
      <input className="dse__title" aria-label="Document title" value={env.title} disabled={!draft || busy} onChange={e => patch(x => ({ ...x, title: e.target.value }))} />
      <span className={"ds-chip ds-chip--" + env.status} data-testid="status">{env.status === "sent" ? "Out for signature" : env.status[0]!.toUpperCase() + env.status.slice(1)}</span>
      {draft && <span className="ids-muted" style={{ fontSize: 13 }} aria-live="polite">{save === "saved" ? "Saved" : save === "saving" ? "Saving…" : "Save failed"}</span>}
      <span style={{ flex: 1 }} />
      {draft && !template && <button className="ids-btn ids-btn--primary" disabled={busy || problems.length > 0} title={problems[0] ?? ""} onClick={send}>{busy ? "Sending…" : "Send for signature"}</button>}
      {template && <><button className="ids-btn" disabled={busy} onClick={() => saveTemplate(false)}>Save template</button><button className="ids-btn ids-btn--primary" disabled={busy} onClick={() => saveTemplate(true)}>Use template</button></>}
      {env.status === "sent" && <button className="iconbtn" onClick={voidIt}>Void</button>}
      {env.status === "completed" && <a className="ids-btn ids-btn--primary" href={`${BP}/api/envelopes/${env.id}/pdf?signed=1&dl=1`}>Download signed PDF</a>}</div>
    <div className="dse__body">
      <aside className="dse__side">
        {draft ? <fieldset className="editor-controls" disabled={busy}>
          <h3>{template ? "Placeholder roles" : "Recipients"}</h3>
          {env.recipients.map(r => <div key={r.id} className={"dsr" + (active === r.id ? " dsr--on" : "")} style={{ borderLeftColor: rcolor(r.order) }} onClick={() => setActive(r.id)}>
            <div className="dsr__row"><b style={{ color: rcolor(r.order) }}>{r.order}</b>
              <input aria-label={template ? `Role ${r.order} name` : `Recipient ${r.order} name`} placeholder={template ? "Role, e.g. Client" : r.roleName || "Full name"} value={template ? r.roleName ?? "" : r.name} onChange={e => patch(x => ({ ...x, recipients: x.recipients.map(q => (q.id === r.id ? { ...q, ...(template ? { roleName: e.target.value } : { name: e.target.value }) } : q)) }))} />
              <button className="iconbtn" aria-label={`Remove recipient ${r.order}`} onClick={() => delRecipient(r.id)}>×</button></div>
            {!template && <input aria-label={`Recipient ${r.order} email`} placeholder="Email" value={r.email} onChange={e => patch(x => ({ ...x, recipients: x.recipients.map(q => (q.id === r.id ? { ...q, email: e.target.value } : q)) }))} />}</div>)}
          <button className="iconbtn" onClick={addRecipient}>+ Add {template ? "role" : "recipient"}</button>
          <label className="dse__chk"><input type="checkbox" checked={env.sequential} onChange={e => patch(x => ({ ...x, sequential: e.target.checked }))} /> Sign in order</label>
          <h3>Fields <span className="ids-muted" style={{ fontWeight: 400, fontSize: 12 }}>for {env.recipients.find(r => r.id === active)?.name || "selected recipient"}</span></h3>
          <div className="dse__pal">{FT.map(t => <button key={t} className={"dse__pbtn" + (armed === t ? " on" : "")} aria-pressed={armed === t} onClick={() => setArmed(a => (a === t ? null : t))}><span>{GLYPH[t]}</span>{FIELD_META[t].label}</button>)}</div>
          <p className="ids-muted" style={{ fontSize: 13, margin: "8px 0" }}>{armed ? `Click on the page to drop a ${FIELD_META[armed].label.toLowerCase()} field.` : "Pick a field, then click on the page. Drag to move; Delete removes the selected field."}</p>
          <label className="dse__lbl">Message to recipients<textarea rows={3} value={env.message} onChange={e => patch(x => ({ ...x, message: e.target.value }))} placeholder="Please review and sign." /></label>
          {selField && <div className="ids-card dse__prop"><b>{FIELD_META[selField.type].label} field</b>
            {(selField.type === "text" || selField.type === "checkbox") && <label className="dse__lbl">Label<input value={selField.label ?? ""} onChange={e => upd(selField.id, { label: e.target.value })} /></label>}
            <label className="dse__chk"><input type="checkbox" checked={selField.required} onChange={e => upd(selField.id, { required: e.target.checked })} /> Required</label>
            <label className="dse__lbl">Assigned to<select value={selField.recipientId} onChange={e => upd(selField.id, { recipientId: e.target.value })}>{env.recipients.map(r => <option key={r.id} value={r.id}>{r.name || `Recipient ${r.order}`}</option>)}</select></label>
            <button className="iconbtn" onClick={() => { patch(x => ({ ...x, fields: x.fields.filter(f => f.id !== selField.id) })); setSel(null); }}>Delete field</button></div>}
          {!template && problems.length > 0 && <ul className="dse__todo" data-testid="todo">{problems.slice(0, 3).map(p => <li key={p}>{p}</li>)}</ul>}
          {err && <p role="alert" className="ds-err">{err}</p>}
        </fieldset> : <>
          <h3>Status <span className="ids-muted" style={{ fontWeight: 400 }}>· {statusSummary(env)}</span></h3>
          {env.status === "voided" && <p className="ds-err">Voided{env.voidReason ? `: ${env.voidReason}` : ""}</p>}
          {env.recipients.map(r => <div key={r.id} className="dsr dsr--static" style={{ borderLeftColor: rcolor(r.order) }}>
            <div className="dsr__row"><b style={{ color: rcolor(r.order) }}>{r.order}</b><div style={{ flex: 1, minWidth: 0 }}><div style={{ fontWeight: 600 }}>{r.name}</div><div className="ids-muted" style={{ fontSize: 13, overflow: "hidden", textOverflow: "ellipsis" }}>{r.email}</div></div>
              <span className={"ds-chip ds-chip--" + (r.status === "signed" ? "completed" : "sent")} data-testid={`rstatus-${r.order}`}>{r.status === "signed" ? "Signed" : "Waiting"}</span></div>
            {env.status === "sent" && r.status === "pending" && <button className="iconbtn" onClick={() => copy(r.token)} data-testid={`copy-${r.order}`}>{copied === r.token ? "Copied!" : "Copy signing link"}</button>}
            {env.status === "sent" && r.status === "pending" && <input readOnly className="ds-link" aria-label={`Signing link for ${r.name}`} value={`${base}/sign/${r.token}`} onFocus={e => e.currentTarget.select()} />}</div>)}
          {env.status === "sent" && <p className="ids-muted" style={{ fontSize: 13 }}>Emails aren’t sent from this demo. Share each recipient’s link yourself.</p>}
          <h3>Activity</h3><ol className="dse__log" data-testid="activity">{[...env.events].reverse().map((ev, i) => <li key={i}><b>{ev.who}</b> {ev.what}<span className="ids-muted">{new Date(ev.at).toLocaleString()}</span></li>)}</ol>
        </>}
      </aside>
      <main className={"dse__doc" + (armed ? " dse__doc--armed" : "")} data-testid="doc"><PdfPages url={`${BP}/api/envelopes/${env.id}/pdf${env.status === "completed" ? "?signed=1" : ""}`} pages={env.pages} width={PAGE_W} overlay={env.status === "completed" ? undefined : overlay} onPageClick={(p, x, y) => { place(p, x, y); if (!armed) setSel(null); }} /></main>
    </div></div>;
}
