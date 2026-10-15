import { createHash } from "node:crypto";
import { mutateDoc } from "@/lib/store";
import { getEnvelope, getPdf, mutateEnvelope } from "./server";
import { canSign, expired, recipientAccess } from "./logic";
import type { Envelope } from "./types";
export function mailConfiguration() {
  const key = process.env.RESEND_API_KEY, from = process.env.EMAIL_FROM, base = process.env.APP_URL;
  if (!key || !from || !base) return null;
  try { const u = new URL(base); if (u.protocol !== "https:" || u.username || u.password || u.search || u.hash) return null; return { key, from, base: base.replace(/\/$/, "") }; } catch { return null; }
}
type Delivery = { status: "sending" | "accepted" | "failed"; at: number; claim?: string };
/** A durable claim plus the provider's idempotency key prevents duplicate requests on retries. */
async function sendOnce(key: string, mail: object, config: NonNullable<ReturnType<typeof mailConfiguration>>) {
  const claim = crypto.randomUUID(); const id = createHash("sha256").update(key).digest("hex");
  const record = await mutateDoc<Delivery>("delivery", id, current => current?.status === "accepted" || (current?.status === "sending" && current.at > Date.now() - 60_000) ? current : { status: "sending", at: Date.now(), claim });
  if (record?.status === "accepted") return true;
  if (record?.claim !== claim) return false;
  let ok = false;
  try { const r = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${config.key}`, "Content-Type": "application/json", "Idempotency-Key": id }, body: JSON.stringify({ from: config.from, ...mail }), signal: AbortSignal.timeout(15_000) }); const response = await r.json().catch(() => null); ok = r.ok && typeof response?.id === "string"; }
  catch { /* The signing action remains committed; the owner can retry delivery. */ }
  await mutateDoc<Delivery>("delivery", id, current => current?.claim === claim ? { status: ok ? "accepted" : "failed", at: Date.now() } : current); return ok;
}
export async function deliverEnvelope(id: string, reminderKey = "") {
  const env = await getEnvelope(id); if (!env) return null;
  const config = mailConfiguration();
  if (!env.mailAllowed || !config) {
    return mutateEnvelope(id, e => ({ ...e, deliveryMessage: "Email is unavailable for this agreement. Share each recipient’s private link; completed copies can be downloaded here." }));
  }
  if ((env.status !== "sent" && env.status !== "completed") || expired(env)) return env;
  const completed = env.status === "completed"; const pdf = completed ? await getPdf("signed", id) : null;
  const targets = completed ? [...env.recipients.map(r => ({ id: r.id, email: r.email, token: r.token })), ...(env.senderEmail && !env.recipients.some(r => r.email === env.senderEmail) ? [{ id: "owner", email: env.senderEmail, token: "" }] : [])] : env.recipients.filter(r => r.role === "cc" ? !reminderKey && recipientAccess(env, r).ok : canSign(env, r).ok);
  let failed = 0;
  for (const r of targets) {
    // Recheck cancellations before each external send. Recipient links independently enforce revocation.
    const latest = await getEnvelope(id); if (!latest || latest.status !== env.status || expired(latest)) break;
    if (completed && !pdf) { failed++; continue; }
    const link = r.token ? `${config.base}/sign/${r.token}` : `${config.base}/app/envelopes/${id}`;
    const subject = `${completed ? "Completed: " : reminderKey ? "Reminder: " : ""}${env.subject || env.title}`;
    const text = completed ? `Your agreement “${env.title}” is complete. The signed PDF and certificate are attached.\n\n${link}\n\nDocuSignIsDead` : `${env.message || "Please review this agreement."}\n\n${link}\n\nThis private link is for you only.${env.expiresAt ? `\nExpires: ${new Date(env.expiresAt).toISOString()}` : ""}\n\nDocuSignIsDead`;
    const ok = await sendOnce(`${id}:${completed ? "completed" : reminderKey || "request"}:${r.id}`, { to: [r.email], subject, text, ...(completed && pdf ? { attachments: [{ filename: "agreement-signed.pdf", content: Buffer.from(pdf).toString("base64") }] } : {}) }, config);
    if (!ok) failed++;
  }
  return mutateEnvelope(id, e => ({ ...e, deliveryMessage: failed ? `${failed} email request(s) could not be confirmed. Retry email delivery or share the private links below.` : completed ? "Completion emails accepted by the email provider. Copies include the signed PDF and certificate." : "Emails accepted by the email provider for eligible recipients. Later recipients are notified when their turn begins." }));
}
export async function remindEnvelope(env: Envelope) {
  if (env.status !== "sent" || expired(env)) throw new Error("This agreement is not open for reminders");
  if (!env.mailAllowed || !mailConfiguration()) throw new Error("Email is unavailable. Copy the recipient links instead.");
  const now = Date.now();
  const next = await mutateEnvelope(env.id, e => {
    if (e.status !== "sent" || expired(e)) throw new Error("This agreement is not open for reminders");
    const since = e.lastReminderAt ?? e.events.find(ev => ev.what.startsWith("Sent to "))?.at ?? e.createdAt;
    if (now - since < (e.reminderDays ?? 3) * 86_400_000) throw new Error("The reminder interval has not elapsed yet");
    return { ...e, lastReminderAt: now, events: [...e.events, { at: now, who: "You", what: "Requested a reminder" }] };
  });
  return deliverEnvelope(env.id, `reminder-${next!.lastReminderAt}`);
}
