"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Envelope } from "@/lib/esign/types";
import { BP } from "@/lib/basepath";
export function Templates() {
  const router = useRouter(); const file = useRef<HTMLInputElement>(null); const [list, setList] = useState<Envelope[] | null>(null); const [query, setQuery] = useState(""); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  const load = useCallback(async () => { try { const r = await fetch(`${BP}/api/envelopes?kind=template`); if (!r.ok) throw new Error("Could not load templates"); setList((await r.json()).envelopes); } catch (e) { setError((e as Error).message); } }, []);
  useEffect(() => { load(); }, [load]);
  async function action(url: string, options: RequestInit, destination?: "template" | "envelope") { setError(""); setBusy(true); try { const r = await fetch(BP + url, options); if (!r.ok) throw new Error((await r.json()).error); if (destination) { const j = await r.json(); router.push(`/app/${destination === "template" ? "templates" : "envelopes"}/${j.envelope.id}`); } else await load(); } catch (e) { setError((e as Error).message); } finally { setBusy(false); } }
  const shown = (list ?? []).filter(e => e.title.toLowerCase().includes(query.toLowerCase()));
  return <main className="workspace-page"><div className="tfd__head"><h1>Templates</h1><button disabled={busy} className="ids-btn ids-btn--primary" onClick={() => file.current?.click()}>Create template</button></div><p>Upload a PDF once, add placeholder roles and fields, then reuse it for new agreements.</p>
    <input type="file" ref={file} hidden aria-label="Template PDF" accept="application/pdf" onChange={e => { const f = e.target.files?.[0]; if (f) { const body = new FormData(); body.set("file", f); body.set("kind", "template"); action("/api/envelopes", { method: "POST", body }, "template"); } e.target.value = ""; }} />
    <label className="workspace-search">Search templates<input type="search" value={query} onChange={e => setQuery(e.target.value)} /></label>{error && <p role="alert" className="ds-err">{error} <button onClick={load}>Retry loading</button></p>}
    {list === null && !error && <p>Loading templates…</p>}{list && !shown.length && <div className="ids-card workspace-empty"><h2>{list.length ? "No matching templates" : "No templates yet"}</h2><p>{list.length ? "Try another title." : "Choose Create template to upload your first PDF."}</p></div>}
    <ul className="workspace-list">{shown.map(e => <li key={e.id}><div><Link href={`/app/templates/${e.id}`}>{e.title}</Link><p>{e.recipients.map(r => r.roleName).filter(Boolean).join(", ") || "No roles added"} · {e.fields.length} fields</p></div><div className="workspace-row-buttons"><button className="ids-btn ids-btn--primary" disabled={busy} onClick={() => action(`/api/templates/${e.id}/use`, { method: "POST" }, "envelope")}>Use template</button><Link className="iconbtn" href={`/app/templates/${e.id}`}>Edit</Link><button className="iconbtn" disabled={busy} onClick={() => { if (confirm(`Delete template “${e.title}”? Agreements already created from it will stay.`)) action(`/api/envelopes/${e.id}`, { method: "DELETE" }); }}>Delete</button></div></li>)}</ul>
  </main>;
}
