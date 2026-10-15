"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { Envelope } from "@/lib/esign/types";
import { SAMPLES } from "@/lib/esign/sample-data";
import { statusSummary } from "@/lib/esign/logic";
import { BP } from "@/lib/basepath";
const LABEL = { draft: "Draft", sent: "Out for signature", completed: "Completed", voided: "Voided" } as const;
export function Dashboard() {
  const [list, setList] = useState<Envelope[] | null>(null); const [open, setOpen] = useState(false); const [busy, setBusy] = useState(false); const [err, setErr] = useState(""); const [filter, setFilter] = useState<"all" | Envelope["status"]>("all");
  const params = useSearchParams();
  useEffect(() => { if (params.get("start")) setOpen(true); }, [params]);
  const router = useRouter(); const file = useRef<HTMLInputElement>(null);
  const load = useCallback(async () => { const r = await fetch(`${BP}/api/envelopes`); setList(r.ok ? (await r.json()).envelopes : []); }, []);
  useEffect(() => { load(); }, [load]);
  const create = async (body: BodyInit, json: boolean) => { setBusy(true); setErr(""); const r = await fetch(`${BP}/api/envelopes`, { method: "POST", ...(json ? { headers: { "content-type": "application/json" } } : {}), body }); const j = await r.json(); setBusy(false); if (!r.ok) { setErr(j.error); return; } router.push(`/app/envelopes/${j.envelope.id}`); };
  const del = async (e: Envelope) => { if (!confirm(`Delete “${e.title}”?`)) return; await fetch(`${BP}/api/envelopes/${e.id}`, { method: "DELETE" }); load(); };
  const counts = { draft: 0, sent: 0, completed: 0, voided: 0 }; list?.forEach(e => counts[e.status]++);
  const shown = (list ?? []).filter(e => filter === "all" || e.status === filter);
  return <main className="tfd"><div className="tfd__head"><h1 className="ids-h1" style={{ fontSize: "var(--ids-type-3xl)" }}>Agreements</h1><button className="ids-btn ids-btn--primary" onClick={() => setOpen(true)}>Start</button></div>
    <div className="tb" style={{ marginBottom: 16 }} role="tablist">{(["all", "draft", "sent", "completed", "voided"] as const).map(f => <button key={f} role="tab" aria-selected={filter === f} className={"iconbtn" + (filter === f ? " on" : "")} onClick={() => setFilter(f)}>{f === "all" ? `All ${list?.length ?? 0}` : `${LABEL[f]} ${counts[f]}`}</button>)}</div>
    {list === null && <p className="ids-muted">Loading…</p>}
    {list?.length === 0 && <div className="ids-card" style={{ padding: 40, textAlign: "center" }} data-testid="empty"><h2>Send your first document</h2><p className="ids-muted">Upload a PDF or start from a sample, add the people who need to sign, and share their links.</p><button className="ids-btn ids-btn--primary" onClick={() => setOpen(true)}>Start</button></div>}
    {shown.length > 0 && <div className="ids-card" style={{ padding: 0, overflow: "hidden" }}><table className="tfr__table" data-testid="envelopes"><thead><tr><th>Document</th><th>Status</th><th>Signers</th><th>Updated</th><th /></tr></thead><tbody>
      {shown.map(e => <tr key={e.id}><td><Link href={`/app/envelopes/${e.id}`} style={{ fontWeight: 600, color: "inherit" }}>{e.title}</Link></td><td><span className={"ds-chip ds-chip--" + e.status}>{LABEL[e.status]}</span></td><td>{e.status === "draft" ? `${e.recipients.length} added` : statusSummary(e)}</td><td className="ids-muted">{new Date(e.updatedAt).toLocaleDateString()}</td><td style={{ textAlign: "right" }}><button className="iconbtn" aria-label={`Delete ${e.title}`} onClick={() => del(e)}>Delete</button></td></tr>)}</tbody></table></div>}
    {open && <div className="tfd__modal" role="dialog" aria-label="Start a document" onClick={ev => { if (ev.target === ev.currentTarget) setOpen(false); }}><div className="ids-card tfd__sheet"><h2 style={{ marginTop: 0 }}>Start with…</h2>
      <button className="tfd__tpl ds-upload" disabled={busy} onClick={() => file.current?.click()}><b>Upload a PDF</b><span className="ids-muted">Up to 4 MB and 60 pages. Everything stays on this server.</span></button>
      <input ref={file} type="file" accept="application/pdf" hidden aria-label="Upload a PDF" onChange={e => { const f = e.target.files?.[0]; if (f) { const fd = new FormData(); fd.set("file", f); create(fd, false); } }} />
      <p className="ids-muted" style={{ margin: "14px 0 6px" }}>or a sample document</p>
      <div className="tfd__tpls">{SAMPLES.map(s => <button key={s.id} disabled={busy} className="tfd__tpl" onClick={() => create(JSON.stringify({ sample: s.id }), true)}><b>{s.name}</b><span className="ids-muted">{s.blurb}</span></button>)}</div>
      {err && <p role="alert" className="ds-err">{err}</p>}<button className="iconbtn" onClick={() => setOpen(false)}>Cancel</button></div></div>}
  </main>;
}
