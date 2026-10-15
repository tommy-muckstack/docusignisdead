"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Envelope } from "@/lib/esign/types";
import { BP } from "@/lib/basepath";
/** Serialize saves and explicitly flush the latest snapshot before a send/use action. */
export function useDraftSave(env: Envelope) {
  const [state, setState] = useState<"saved" | "saving" | "error">("saved");
  const content = JSON.stringify({ title: env.title, message: env.message, sequential: env.sequential, recipients: env.recipients, fields: env.fields });
  const latest = useRef(content); latest.current = content;
  const saved = useRef(content); const queue = useRef<Promise<unknown>>(Promise.resolve()); const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const flush = useCallback(async () => {
    clearTimeout(timer.current); const snapshot = latest.current; setState("saving");
    const task = queue.current.catch(() => {}).then(async () => {
      const r = await fetch(`${BP}/api/envelopes/${env.id}`, { method: "PUT", headers: { "content-type": "application/json" }, body: snapshot }); const j = await r.json(); if (!r.ok) throw new Error(j.error ?? "Save failed"); saved.current = snapshot; if (latest.current === snapshot) setState("saved"); return j.envelope as Envelope;
    }); queue.current = task;
    try { return await task; } catch (e) { setState("error"); throw e; }
  }, [env.id]);
  useEffect(() => { if (env.status !== "draft" || content === saved.current) return; setState("saving"); timer.current = setTimeout(() => { flush().catch(() => {}); }, 600); return () => clearTimeout(timer.current); }, [content, env.status, flush]);
  useEffect(() => { const warn = (e: BeforeUnloadEvent) => { if (env.status === "draft" && latest.current !== saved.current) { e.preventDefault(); e.returnValue = ""; } }; window.addEventListener("beforeunload", warn); return () => window.removeEventListener("beforeunload", warn); }, [env.status]);
  return { state, flush };
}
