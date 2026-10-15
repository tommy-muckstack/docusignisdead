"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { Envelope } from "@/lib/esign/types";
import type { Folder } from "@/lib/esign/folders";
import { SAMPLES } from "@/lib/esign/sample-data";
import { statusSummary } from "@/lib/esign/logic";
import { StartMenu } from "./StartMenu";
import { BP } from "@/lib/basepath";
const LABEL: Record<string, string> = { draft: "Drafts", sent: "Waiting for others", completed: "Completed", voided: "Voided", declined: "Declined" };
export function Dashboard() {
  const [list, setList] = useState<Envelope[] | null>(null); const [folders, setFolders] = useState<Folder[]>([]);
  const [open, setOpen] = useState(false); const [busy, setBusy] = useState(false); const [err, setErr] = useState(""); const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState(""); const [folder, setFolder] = useState("all"); const [after, setAfter] = useState(""); const [before, setBefore] = useState("");
  const router = useRouter(); const params = useSearchParams(); const file = useRef<HTMLInputElement>(null);
  useEffect(() => { if (params.get("start")) setOpen(true); }, [params]);
  const load = useCallback(async () => {
    try { const [a, b] = await Promise.all([fetch(`${BP}/api/envelopes`), fetch(`${BP}/api/folders`)]); if (!a.ok || !b.ok) throw new Error("Could not load agreements. Please retry."); setList((await a.json()).envelopes); setFolders((await b.json()).folders); }
    catch (error) { setErr((error as Error).message); }
  }, []);
  useEffect(() => { load(); }, [load]);
  async function request(url: string, method: string, body?: object) {
    setBusy(true); setErr("");
    try { const r = await fetch(BP + url, { method, ...(body ? { headers: { "content-type": "application/json" }, body: JSON.stringify(body) } : {}) }); if (!r.ok) throw new Error((await r.json()).error || "Action failed"); await load(); return true; }
    catch (e) { setErr((e as Error).message); return false; } finally { setBusy(false); }
  }
  async function folderAction(action: "create" | "rename" | "delete") {
    const f = folders.find(x => x.id === folder); if (action !== "create" && !f) return;
    if (action === "delete" && !confirm(`Delete folder “${f!.name}”? Its agreements will stay in All agreements.`)) return;
    const name = action === "delete" ? "" : prompt(action === "create" ? "New folder name" : "Rename folder", f?.name ?? ""); if (name === null) return;
    if (await request("/api/folders", "POST", { action, id: f?.id, name }) && action === "delete") setFolder("all");
  }
  async function create(body: BodyInit, json: boolean) {
    setBusy(true); setErr("");
    try { const r = await fetch(`${BP}/api/envelopes`, { method: "POST", ...(json ? { headers: { "content-type": "application/json" } } : {}), body }); const j = await r.json(); if (!r.ok) throw new Error(j.error); router.push(`/app/envelopes/${j.envelope.id}`); }
    catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  }
  const shown = (list ?? []).filter(e => (filter === "all" || e.status === filter) && (folder === "all" || (folder === "unfiled" ? !folders.some(f => f.id === e.folderId) : e.folderId === folder)) && `${e.title} ${e.recipients.map(r => r.name + " " + r.email).join(" ")}`.toLowerCase().includes(query.toLowerCase()) && (!after || e.updatedAt >= new Date(after + "T00:00:00").getTime()) && (!before || e.updatedAt <= new Date(before + "T23:59:59.999").getTime()));
  return <main className="workspace-page"><div className="tfd__head"><h1>Agreements</h1><StartMenu /></div>
    <div className="workspace-toolbar" role="tablist" aria-label="Agreement status">{["all", "draft", "sent", "completed", "voided", "declined"].map(f => <button key={f} role="tab" aria-selected={filter === f} className={"iconbtn" + (filter === f ? " on" : "")} onClick={() => setFilter(f)}>{f === "all" ? "All agreements" : LABEL[f]} <span>{(list ?? []).filter(e => f === "all" || e.status === f).length}</span></button>)}</div>
    <div className="workspace-toolbar"><label>Search<input type="search" placeholder="Title, name or email" value={query} onChange={e => setQuery(e.target.value)} /></label><label>Updated from<input type="date" value={after} max={before || undefined} onChange={e => setAfter(e.target.value)} /></label><label>Updated through<input type="date" value={before} min={after || undefined} onChange={e => setBefore(e.target.value)} /></label><button className="iconbtn" onClick={() => { setQuery(""); setAfter(""); setBefore(""); setFilter("all"); setFolder("all"); }}>Clear filters</button></div>
    <div className="workspace-toolbar"><label>Folder<select value={folder} onChange={e => setFolder(e.target.value)}><option value="all">All folders</option><option value="unfiled">Unfiled</option>{folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}</select></label><button className="iconbtn" disabled={busy} onClick={() => folderAction("create")}>New folder</button>{folders.some(f => f.id === folder) && <><button className="iconbtn" disabled={busy} onClick={() => folderAction("rename")}>Rename folder</button><button className="iconbtn" disabled={busy} onClick={() => folderAction("delete")}>Delete folder</button></>}</div>
    {err && <div role="alert" className="ds-err">{err} <button className="iconbtn" onClick={load}>Retry loading</button></div>}
    {list === null && !err && <p role="status">Loading agreements…</p>}
    {list !== null && shown.length === 0 && <div className="ids-card workspace-empty" data-testid="empty"><h2>{list.length ? "No agreements match" : "Send your first agreement"}</h2><p>{list.length ? "Try another search, status or folder." : "Upload a PDF, add recipients and place the fields they need to complete."}</p>{!list.length && <StartMenu />}</div>}
    {shown.length > 0 && <div className="workspace-table"><table className="tfr__table" data-testid="envelopes"><thead><tr><th>Agreement</th><th>Status</th><th>Recipients</th><th>Last updated</th><th>Folder</th><th>Actions</th></tr></thead><tbody>{shown.map(e => <tr key={e.id}><td><Link href={`/app/envelopes/${e.id}`}>{e.title}</Link></td><td><span className={"ds-chip ds-chip--" + e.status}>{LABEL[e.status]}</span></td><td>{e.status === "draft" ? `${e.recipients.length} added` : statusSummary(e)}</td><td>{new Date(e.updatedAt).toLocaleDateString()}</td><td><select aria-label={`Move ${e.title} to folder`} disabled={busy} value={folders.some(f => f.id === e.folderId) ? e.folderId : ""} onChange={event => request(`/api/envelopes/${e.id}`, "PATCH", { folderId: event.target.value })}><option value="">Unfiled</option>{folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}</select></td><td><details className="workspace-actions"><summary>Actions</summary><div><Link href={`/app/envelopes/${e.id}`}>{e.status === "draft" ? "Edit" : "View details"}</Link><a href={`${BP}/api/envelopes/${e.id}/pdf?dl=1${e.status === "completed" ? "&signed=1" : ""}`}>Download PDF</a>{e.status === "draft" && <button disabled={busy} onClick={() => { const title = prompt("Rename agreement", e.title); if (title !== null) request(`/api/envelopes/${e.id}`, "PATCH", { title }); }}>Rename</button>}{e.status === "sent" && <button disabled={busy} onClick={() => { const reason = prompt("Reason for voiding (optional)"); if (reason !== null) request(`/api/envelopes/${e.id}/void`, "POST", { reason }); }}>Void</button>}<button disabled={busy} onClick={() => { if (confirm(`Permanently delete “${e.title}” and revoke every recipient link?`)) request(`/api/envelopes/${e.id}`, "DELETE"); }}>Delete</button></div></details></td></tr>)}</tbody></table></div>}
    {open && <div className="tfd__modal" role="dialog" aria-modal="true" aria-label="Start a document"><div className="ids-card tfd__sheet"><h2>{params.get("start") === "sign" ? "Sign a document" : "Send an envelope"}</h2><button className="tfd__tpl ds-upload" disabled={busy} onClick={() => file.current?.click()}><b>Upload a PDF</b><span className="ids-muted">Up to 4 MB and 60 pages.</span></button><input ref={file} type="file" accept="application/pdf" hidden aria-label="Upload a PDF" onChange={e => { const f = e.target.files?.[0]; if (f) { const fd = new FormData(); fd.set("file", f); fd.set("mode", params.get("start") ?? "send"); create(fd, false); } e.target.value = ""; }} /><p>Or start from a sample</p><div className="tfd__tpls">{SAMPLES.map(s => <button key={s.id} disabled={busy} className="tfd__tpl" onClick={() => create(JSON.stringify({ sample: s.id, mode: params.get("start") ?? "send" }), true)}><b>{s.name}</b><span>{s.blurb}</span></button>)}</div>{err && <p role="alert" className="ds-err">{err}</p>}<button className="iconbtn" onClick={() => { setOpen(false); router.replace("/app/envelopes"); }}>Cancel</button></div></div>}
  </main>;
}
