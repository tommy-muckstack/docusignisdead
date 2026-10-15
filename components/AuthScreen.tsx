"use client";
// Docusign-style account login: header bar, centred card, footer bar.
import Link from "next/link";
import type { FirebaseClientConfig } from "@/lib/isdead-auth/config";
import { useAuth } from "@/components/useAuth";

function Mark({ s = 20 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 20 20" aria-hidden><path d="M7 0h6.500a6.500 6.500 0 0 1 0 13H12V6.500A6.500 6.500 0 0 0 7 0z" fill="#ff2e5b" /><rect x="0" y="6" width="13" height="14" rx="2" fill="#4a1bff" /><rect x="6.500" y="6.500" width="6.500" height="6.500" rx="1" fill="#130032" /></svg>;
}
function Word({ h = 26 }: { h?: number }) {
  return <span className="dsa-word" style={{ fontSize: h }}>docusign</span>;
}
export function AuthScreen({ config, demo, to, signup = false }: { config: FirebaseClientConfig | null; demo: boolean; to: string; signup?: boolean }) {
  const a = useAuth({ config, demo, to, signup });
  const su = a.mode === "signup", reset = a.mode === "reset";
  return <main className="dsa">
    <header className="dsa-head"><Link href="/" aria-label="Home" className="dsa-logo"><Mark /><Word /></Link></header>
    <div className="dsa-stage">
      <div className="dsa-card">
        <form onSubmit={a.submit(true)}>
          <h1>{reset ? "Reset your password" : su ? "Sign up for Docusign" : "Log in to Docusign"}</h1>
          <p>{reset ? "Enter your email and we’ll send a reset link." : su ? "Create your free account." : a.step === 2 ? "Enter your password to log in." : "Enter your email to log in."}</p>
          <label htmlFor="dsa-e">Email <em>*</em></label>
          <input id="dsa-e" type="email" required autoComplete="email" placeholder="Enter email" autoFocus={a.step === 1} value={a.email} onChange={e => a.setEmail(e.target.value)} readOnly={a.step === 2} className="dsa-in" />
          {a.step === 2 && !reset && <><label htmlFor="dsa-p" className="p">Password <em>*</em></label><input id="dsa-p" type="password" required minLength={6} autoFocus placeholder="Enter password" value={a.password} onChange={e => a.setPassword(e.target.value)} autoComplete={su ? "new-password" : "current-password"} className="dsa-in" /></>}
          <button className="dsa-next" disabled={a.busy}>{reset ? "Send reset link" : a.step === 2 && su ? "Create account" : a.step === 2 ? "Log in" : "Next"}</button>
          {a.err && <p role="alert" className="dsa-err">{a.err}</p>}{a.note && <p role="status" className="dsa-ok">{a.note}</p>}
          {reset ? <button type="button" className="dsa-up" onClick={a.go("signin")}>Back to log in</button> : su ? <button type="button" className="dsa-up" onClick={a.go("signin")}>Log in instead</button> : <button type="button" className="dsa-up" onClick={a.go("signup")}>Sign Up for Free</button>}
        </form>
      </div>
      <div className="dsa-alt">
        {!reset && <button type="button" onClick={a.google} disabled={a.busy}>Continue with Google</button>}
        {!su && !reset && <button type="button" onClick={a.go("reset")}>Forgot password?</button>}
        {a.demo && <button type="button" onClick={a.useDemo}>Use the demo account</button>}
      </div>
    </div>
    <footer className="dsa-foot">
      <span className="dsa-pw">Powered by <Mark s={9} /><b>docusign</b></span>
      <span className="dsa-mid"><span className="dsa-sel">English (US) <svg width="8" height="5" viewBox="0 0 8 5" aria-hidden><path d="M1 1l3 3 3-3" stroke="#130032" strokeWidth="1.300" fill="none" /></svg></span>
        <a href="#" onClick={a.off}>Contact Us</a><a href="#" onClick={a.off}>Terms of Use</a><a href="#" onClick={a.off}>Privacy</a><a href="#" onClick={a.off}>Intellectual Property</a><a href="#" onClick={a.off}>Trust</a></span>
      <span className="dsa-copy">Copyright © 2026 Docusign, Inc. All rights reserved</span>
    </footer>
    {!a.configured && <p className="dsa-cfg" role="status">Sign-in isn’t configured on this deployment yet.</p>}
  </main>;
}
