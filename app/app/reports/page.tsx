import Link from "next/link";
import { currentUser, entryRedirect } from "@/lib/session";
import { redirect } from "next/navigation";
import { listEnvelopes } from "@/lib/esign/server";
export default async function ReportsPage() {
  const user = await currentUser(); if (!user) redirect(entryRedirect("/app/reports"));
  const envelopes = await listEnvelopes(user.id);
  return <main className="workspace-page"><h1>Reports</h1><p>Agreement activity for your account, across all dates.</p><div className="workspace-stats">{(["draft", "sent", "completed", "voided"] as const).map(status => <div className="ids-card" key={status}><h2>{status === "sent" ? "Awaiting action" : status[0].toUpperCase() + status.slice(1)}</h2><strong>{envelopes.filter(e => e.status === status).length}</strong></div>)}</div><h2>Recent activity</h2><ul className="workspace-list">{envelopes.flatMap(e => e.events.map(event => ({ ...event, id: e.id, title: e.title }))).sort((a,b) => b.at-a.at).slice(0, 50).map((event, i) => <li key={i}><div><Link href={`/app/envelopes/${event.id}`}>{event.title}</Link><p>{event.who}: {event.what}</p><time dateTime={new Date(event.at).toISOString()}>{new Date(event.at).toLocaleString("en-US", { timeZone: "UTC" })} UTC</time></div></li>)}</ul>{!envelopes.length && <p>No agreement activity yet.</p>}</main>;
}
