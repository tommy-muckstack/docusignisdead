import { getDoc } from "@/lib/store";
import { isEmail, rid } from "@/lib/esign/logic";
export type Contact = { id: string; name: string; email: string };
export type Account = { name: string; company: string; sequential: boolean; expireDays: number; reminderDays: number; contacts: Contact[] };
export const emptyAccount = (): Account => ({ name: "", company: "", sequential: true, expireDays: 30, reminderDays: 3, contacts: [] });
export const getAccount = async (id: string) => (await getDoc<Account>("accounts", id)) ?? emptyAccount();
const text = (v: unknown, n: number) => typeof v === "string" ? v.trim().slice(0, n) : "";
export function updateAccount(base: Account, input: Record<string, unknown>): Account {
  const next = { ...base };
  if ("name" in input) { next.name = text(input.name, 80); if (!next.name) throw new Error("Enter your name"); }
  if ("company" in input) next.company = text(input.company, 120);
  if ("sequential" in input) next.sequential = input.sequential !== false;
  for (const key of ["expireDays", "reminderDays"] as const) if (key in input) {
    const n = Number(input[key]); if (!Number.isInteger(n) || n < 1 || n > (key === "expireDays" ? 365 : 30)) throw new Error("Choose a valid number of days"); next[key] = n;
  }
  if (input.contact && typeof input.contact === "object") {
    const c = input.contact as Record<string, unknown>; const name = text(c.name, 80), email = text(c.email, 160).toLowerCase();
    if (!name || !isEmail(email)) throw new Error("Enter a name and valid email");
    const existing = base.contacts.find(x => x.id === c.id);
    if (base.contacts.some(x => x.email === email && x.id !== existing?.id)) throw new Error("That email is already in your contacts");
    if (!existing && base.contacts.length >= 500) throw new Error("Contact limit reached (500)");
    const contact = { id: existing?.id ?? rid("c_"), name, email };
    next.contacts = existing ? base.contacts.map(x => x.id === existing.id ? contact : x) : [...base.contacts, contact];
  }
  if (typeof input.deleteContact === "string") next.contacts = base.contacts.filter(c => c.id !== input.deleteContact);
  return next;
}
