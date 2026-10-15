// Server-side JSON document store shared by the IsDead apps.
// Production (FIREBASE_SERVICE_ACCOUNT_JSON set): Firestore, collection "<app>__<col>", one doc per id (JSON string,
// chunked above ~900 KB because Firestore docs are capped at 1 MiB). Dev/demo (no Firebase env): files under
// $ISDEAD_DATA_DIR (default .data/). Same API either way: getDoc / putDoc / listDocs / delDoc.
import fs from "node:fs/promises";
import path from "node:path";

const safe = (s: string) => s.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 80);
const firestoreEnabled = () => !!process.env["FIREBASE_SERVICE_ACCOUNT_JSON"];
const appName = () => safe((process.env["NEXT_PUBLIC_BASE_PATH"] ?? "/app").replace(/\//g, "")) || "app";
const CHUNK = 250_000; // Keep even non-ASCII JSON below the Firestore byte limit.

// ---- Firestore ----
let dbP: Promise<import("firebase-admin/firestore").Firestore> | null = null;
function db() {
  if (!dbP) dbP = (async () => {
    const { initializeApp, getApps, cert } = await import("firebase-admin/app");
    const { getFirestore } = await import("firebase-admin/firestore");
    const sa = JSON.parse(process.env["FIREBASE_SERVICE_ACCOUNT_JSON"]!);
    const app = getApps().find(a => a.name === "isdead") ?? initializeApp({ credential: cert(sa), projectId: sa.project_id }, "isdead");
    return getFirestore(app);
  })().catch(e => { dbP = null; throw e; });
  return dbP;
}
const colName = (col: string) => `${appName()}__${safe(col)}`;

async function fsGet<T>(col: string, id: string): Promise<T | null> {
  const database = await db(); const c = database.collection(colName(col));
  return database.runTransaction(async tx => {
    const snap = await tx.get(c.doc(safe(id))); if (!snap.exists) return null;
    const m = snap.data() as { d?: string; n?: number }; let json = m.d ?? "";
    for (let i = 1; i < (m.n ?? 1); i++) json += (await tx.get(c.doc(`${safe(id)}~c${i}`))).data()?.d ?? "";
    return JSON.parse(json) as T;
  }, { readOnly: true });
}
async function fsList<T>(col: string): Promise<T[]> {
  const c = (await db()).collection(colName(col)); const snaps = await c.where("main", "==", true).get(); const out: T[] = [];
  for (const s of snaps.docs) { const v = await fsGet<T>(col, s.id); if (v !== null) out.push(v); }
  return out;
}
// ---- local files (dev) ----
const dir = () => process.env["ISDEAD_DATA_DIR"] ?? path.join(process.env["VERCEL"] ? "/tmp" : process.cwd(), ".data");
async function fileGet<T>(col: string, id: string): Promise<T | null> {
  try { return JSON.parse(await fs.readFile(path.join(dir(), safe(col), safe(id) + ".json"), "utf8")) as T; } catch { return null; }
}
async function filePut<T>(col: string, id: string, doc: T) {
  const d = path.join(dir(), safe(col)); await fs.mkdir(d, { recursive: true });
  const target = path.join(d, safe(id) + ".json"); const temp = target + "." + crypto.randomUUID() + ".tmp";
  await fs.writeFile(temp, JSON.stringify(doc)); await fs.rename(temp, target);
}
async function fileList<T>(col: string): Promise<T[]> {
  const d = path.join(dir(), safe(col));
  let names: string[] = []; try { names = await fs.readdir(d); } catch { return []; }
  const out: T[] = []; for (const n of names) if (n.endsWith(".json")) { try { out.push(JSON.parse(await fs.readFile(path.join(d, n), "utf8"))); } catch { /* skip */ } }
  return out;
}
async function fileDel(col: string, id: string) { try { await fs.unlink(path.join(dir(), safe(col), safe(id) + ".json")); } catch { /* ok */ } }

export const getDoc = <T>(col: string, id: string): Promise<T | null> => (firestoreEnabled() ? fsGet<T>(col, id) : fileGet<T>(col, id));
export const putDoc = async <T>(col: string, id: string, doc: T): Promise<void> => { await mutateDoc<T>(col, id, () => doc); };
export const listDocs = <T>(col: string): Promise<T[]> => (firestoreEnabled() ? fsList<T>(col) : fileList<T>(col));
export const delDoc = async (col: string, id: string): Promise<void> => { await mutateDoc(col, id, () => null); };

/** After a guest signs in: move every per-user doc (docs keyed by the user id) from the guest id to the account, once. */
export async function adoptGuestDocs(fromId: string, toId: string): Promise<number> {
  if (!fromId || !toId || fromId === toId) return 0;
  let moved = 0;
  if (firestoreEnabled()) {
    const d = await db(); const prefix = `${appName()}__`;
    for (const col of await d.listCollections()) {
      if (!col.id.startsWith(prefix)) continue;
      const src = await col.doc(safe(fromId)).get(); if (!src.exists) continue;
      const dstRef = col.doc(safe(toId)); if ((await dstRef.get()).exists) continue;
      await dstRef.set(src.data()!); await src.ref.delete(); moved++;
    }
  } else {
    const root = dir();
    let cols: string[] = []; try { cols = await fs.readdir(root); } catch { return 0; }
    for (const col of cols) {
      const from = path.join(root, col, `${safe(fromId)}.json`), to = path.join(root, col, `${safe(toId)}.json`);
      try { await fs.access(from); } catch { continue; }
      try { await fs.access(to); continue; } catch { /* no account doc yet */ }
      await fs.rename(from, to); moved++;
    }
  }
  return moved;
}

// Transformations may retry on Firestore contention: keep them deterministic and idempotent.
const queues = new Map<string, Promise<unknown>>();
export async function mutateDoc<T>(col: string, id: string, change: (current: T | null) => T | null | Promise<T | null>): Promise<T | null> {
  if (firestoreEnabled()) {
    const database = await db(); const collection = database.collection(colName(col)); const ref = collection.doc(safe(id));
    return database.runTransaction(async tx => {
      const head = (await tx.get(ref)).data() as { d?: string; n?: number } | undefined;
      const oldN = head?.n ?? 1; let json = head?.d ?? "";
      for (let i = 1; i < oldN; i++) json += (await tx.get(collection.doc(`${safe(id)}~c${i}`))).data()?.d ?? "";
      const next = await change(head ? JSON.parse(json) as T : null);
      if (next === null) { for (let i = 1; i < oldN; i++) tx.delete(collection.doc(`${safe(id)}~c${i}`)); tx.delete(ref); return null; }
      const encoded = JSON.stringify(next), n = Math.max(1, Math.ceil(encoded.length / CHUNK));
      for (let i = 1; i < n; i++) tx.set(collection.doc(`${safe(id)}~c${i}`), { d: encoded.slice(i * CHUNK, (i + 1) * CHUNK), part: true });
      for (let i = n; i < oldN; i++) tx.delete(collection.doc(`${safe(id)}~c${i}`));
      tx.set(ref, { d: encoded.slice(0, CHUNK), n, main: true, updatedAt: Date.now() }); return next;
    });
  }
  const key = `${dir()}/${safe(col)}/${safe(id)}`; const previous = queues.get(key) ?? Promise.resolve();
  const task = previous.catch(() => {}).then(async () => { const next = await change(await fileGet<T>(col, id)); if (next === null) await fileDel(col, id); else await filePut(col, id, next); return next; });
  queues.set(key, task);
  try { return await task; } finally { if (queues.get(key) === task) queues.delete(key); }
}
