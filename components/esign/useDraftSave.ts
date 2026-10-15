"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Envelope } from "@/lib/esign/types";
import { BP } from "@/lib/basepath";
/** Serialize saves and explicitly flush the latest snapshot before a send/use action. */
export function useDraftSave(env: Envelope) {
  const [state, setState] = useState<"saved" | "saving" | "error">("saved");
  const content = JSON.stringify({ title: env.title, subject: env.subject, expireDays: env.expireDays, reminderDays: env.reminderDays, message: env.message, sequential: env.sequential, recipients: env.recipients, fields: env.fields });
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
  useEffect(() => {
    if (env.status !== "draft") return;
    let navigating = false;
    const navigate = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || latest.current === saved.current) return;
      const link = event.target instanceof Element ? event.target.closest("a[href]") : null;
      if (!(link instanceof HTMLAnchorElement) || link.hasAttribute("download") || (link.target && link.target !== "_self")) return;
      const target = new URL(link.href);
      if (target.origin !== window.location.origin || (target.pathname === window.location.pathname && target.search === window.location.search)) return;
      // Run before Next's Link handler can unmount this editor and cancel its save timer.
      event.preventDefault(); event.stopImmediatePropagation();
      if (navigating) return; navigating = true;
      (async () => {
        try {
          do { await flush(); } while (latest.current !== saved.current);
          window.location.assign(target.href);
        } catch { navigating = false; /* flush exposes Save failed; leave the draft open for retry. */ }
      })();
    };
    document.addEventListener("click", navigate, true);
    return () => document.removeEventListener("click", navigate, true);
  }, [env.status, flush]);
  return { state, flush };
}
