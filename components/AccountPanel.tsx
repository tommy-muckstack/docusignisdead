"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Account, Contact } from "@/lib/account";
import type { SessionUser } from "@/lib/session";
import type { FirebaseClientConfig } from "@/lib/isdead-auth/config";
import { resetPassword, authErrorMessage } from "@/lib/isdead-auth/client";
import { BP } from "@/lib/basepath";
export function AccountPanel({ initial, user, section, config }: { initial: Account; user: SessionUser; section: "profile" | "settings" | "contacts"; config: FirebaseClientConfig | null }) {
  const router = useRouter(); const [account, setAccount] = useState(initial); const [busy, setBusy] = useState(false); const [error, setError] = useState(""); const [message, setMessage] = useState("");
  const [contact, setContact] = useState<Contact>({ id: "", name: "", email: "" }); const [query, setQuery] = useState("");
  async function save(body: object) {
    setBusy(true); setError(""); setMessage("");
    try { const r = await fetch(`${BP}/api/account`, { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }); const j = await r.json(); if (!r.ok) throw new Error(j.error); setAccount(j.account); setContact({ id: "", name: "", email: "" }); setMessage("Saved"); router.refresh(); }
    catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }
  async function password() {
    if (!config) return; setBusy(true); setError(""); setMessage("");
    try { await resetPassword(config, user.email); setMessage("Check your inbox for a password reset link. If you use Google sign-in, manage your password with Google."); }
    catch (e) { setError(authErrorMessage(e)); } finally { setBusy(false); }
  }
  return <main className="workspace-page"><h1>{section === "profile" ? "My profile" : section === "contacts" ? "Contacts" : "Account settings"}</h1>
    <nav className="workspace-tabs" aria-label="Account"><Link href="/app/profile">My profile</Link><Link href="/app/settings">Sending defaults</Link><Link href="/app/contacts">Contacts</Link></nav>
    {section === "profile" && <><form className="workspace-form" onSubmit={e => { e.preventDefault(); save({ name: account.name, company: account.company }); }}>
      <label>Name<input required maxLength={80} value={account.name} onChange={e => setAccount({ ...account, name: e.target.value })} /></label>
      <label>Email<input readOnly value={user.email || "Guest session"} /></label><label>Company<input maxLength={120} value={account.company} onChange={e => setAccount({ ...account, company: e.target.value })} /></label>
      <button className="ids-btn ids-btn--primary" disabled={busy}>Save profile</button></form>
      <section className="workspace-section" id="password"><h2>Password</h2><p>Send a reset link to your account email.</p><button className="ids-btn" disabled={busy || !config || user.demo || user.guest} onClick={password}>Send password reset email</button>{(user.demo || user.guest || !config) && <p className="ids-muted">Password changes require a configured, signed-in account.</p>}</section></>}
    {section === "settings" && <form className="workspace-form" onSubmit={e => { e.preventDefault(); save({ sequential: account.sequential, expireDays: account.expireDays, reminderDays: account.reminderDays }); }}><p>Defaults for new agreements. Existing agreements keep their own settings.</p>
      <label className="workspace-check"><input type="checkbox" checked={account.sequential} onChange={e => setAccount({ ...account, sequential: e.target.checked })} />Recipients act in order</label>
      <label>Expire after (days)<input type="number" min={1} max={365} required value={account.expireDays} onChange={e => setAccount({ ...account, expireDays: Number(e.target.value) })} /></label>
      <label>Reminder interval (days)<input type="number" min={1} max={30} required value={account.reminderDays} onChange={e => setAccount({ ...account, reminderDays: Number(e.target.value) })} /></label>
      <button className="ids-btn ids-btn--primary" disabled={busy}>Save defaults</button></form>}
    {section === "contacts" && <><form className="workspace-form" onSubmit={e => { e.preventDefault(); save({ contact }); }}><h2>{contact.id ? "Edit contact" : "Add contact"}</h2><label>Name<input required maxLength={80} value={contact.name} onChange={e => setContact({ ...contact, name: e.target.value })} /></label><label>Email<input required type="email" maxLength={160} value={contact.email} onChange={e => setContact({ ...contact, email: e.target.value })} /></label><div><button disabled={busy} className="ids-btn ids-btn--primary">{contact.id ? "Save contact" : "Add contact"}</button>{contact.id && <button type="button" className="iconbtn" onClick={() => setContact({ id: "", name: "", email: "" })}>Cancel</button>}</div></form>
      <label className="workspace-search">Search contacts<input type="search" value={query} onChange={e => setQuery(e.target.value)} /></label><ul className="workspace-list">{account.contacts.filter(c => `${c.name} ${c.email}`.toLowerCase().includes(query.toLowerCase())).map(c => <li key={c.id}><div><b>{c.name}</b><p>{c.email}</p></div><button className="iconbtn" onClick={() => setContact(c)}>Edit<span className="sr-only"> {c.name}</span></button><button className="iconbtn" disabled={busy} onClick={() => { if (confirm(`Delete ${c.name} from your contacts?`)) save({ deleteContact: c.id }); }}>Delete<span className="sr-only"> {c.name}</span></button></li>)}</ul>{!account.contacts.length && <p>No contacts yet. Add someone above to use them in an agreement.</p>}</>}
    {error && <p role="alert" className="ds-err">{error}</p>}<p role="status">{message}</p>
  </main>;
}
