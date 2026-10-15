"use client";
// Shared auth state/actions for the bespoke login/signup screens.
import { useState } from "react";
import type { FirebaseClientConfig } from "@/lib/isdead-auth/config";
import { signInWithEmail, signUpWithEmail, signInWithGoogle, resetPassword, authErrorMessage } from "@/lib/isdead-auth/client";
import { BP } from "@/lib/basepath";

export function useAuth({ config, demo, to, signup }: { config: FirebaseClientConfig | null; demo: boolean; to: string; signup: boolean }) {
  const [mode, setMode] = useState<"signin" | "signup" | "reset">(signup ? "signup" : "signin");
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState(""), [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false), [err, setErr] = useState(""), [note, setNote] = useState("");
  const session = `${BP}/api/session`;
  const run = async (f: () => Promise<void>) => { setBusy(true); setErr(""); setNote(""); try { await f(); } catch (e) { setErr(authErrorMessage(e)); } finally { setBusy(false); } };
  // emailFirst: email step, then password step. Otherwise both fields at once.
  const submit = (emailFirst: boolean) => (e: React.FormEvent) => {
    e.preventDefault();
    if (!config) { setErr("Sign-in isn't configured on this deployment yet."); return; }
    if (mode === "reset") return run(async () => { await resetPassword(config, email); setNote("If that email has an account, a reset link is on its way."); setMode("signin"); setStep(1); });
    if (emailFirst && step === 1) { setStep(2); return; }
    run(async () => { if (mode === "signup") await signUpWithEmail(config, session, email, password); else await signInWithEmail(config, session, email, password); window.location.assign(to); });
  };
  const google = () => { if (!config) { setErr("Sign-in isn't configured on this deployment yet."); return; } run(async () => { await signInWithGoogle(config, session); window.location.assign(to); }); };
  const useDemo = async () => { const r = await fetch(`${BP}/api/session/demo`, { method: "POST" }); if (r.ok) window.location.assign(to); };
  const go = (m: "signin" | "signup" | "reset") => (e?: React.MouseEvent) => { e?.preventDefault(); setMode(m); setStep(1); setErr(""); setNote(""); };
  const off = (e: React.MouseEvent) => e.preventDefault();
  return { mode, step, setStep, email, setEmail, password, setPassword, busy, err, note, submit, google, useDemo, go, off, demo, configured: !!config };
}
