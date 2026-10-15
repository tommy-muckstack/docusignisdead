"use client";
import Link from "next/link";
import type { FirebaseClientConfig } from "@/lib/isdead-auth/config";
import { useAuth } from "@/components/useAuth";
import { Logo } from "@/components/Logo";
import { CountryPicker } from "@/components/CountryPicker";
import { site } from "@/site.config";
import "@/app/marketing-chrome.css";
export function AuthScreen({ config, demo, to, signup = false, initialEmail = "", country }: { config: FirebaseClientConfig | null; demo: boolean; to: string; signup?: boolean; initialEmail?: string; country?: string }) {
  const a = useAuth({ config, demo, to, signup, initialEmail });
  const reset = a.mode === "reset";
  return <main className="dsa">
    <header className="dsa-head"><Link href="/" aria-label="Home" className="dsa-logo"><Logo size={30} /></Link></header>
    <div className="dsa-stage"><div className="dsa-card">
      <form onSubmit={a.submit(true)}>
        <h1>{reset ? a.note ? "Check your inbox" : "Reset your password" : signup ? "Try DocuSignIsDead for free" : "Log in to DocuSignIsDead"}</h1>
        <p>{reset ? a.note ? "If a message arrives, follow its link to choose a new password. You can also check your spam folder." : "Enter your email and we’ll send a reset link." : signup ? "Create your free account. No payment details needed." : a.step === 2 ? "Enter your password to log in." : "Enter your email to log in."}</p>
        {!a.note && <><label htmlFor="dsa-e">Email <em>*</em></label>
          <input id="dsa-e" type="email" required autoComplete="email" placeholder="Enter email" autoFocus={a.step === 1} value={a.email} onChange={e => a.setEmail(e.target.value)} readOnly={a.step === 2 && !reset} className="dsa-in" />
          {a.step === 2 && !reset && <><button type="button" className="dsa-edit" onClick={() => { a.setStep(1); a.setPassword(""); }}>Use a different email</button><label htmlFor="dsa-p" className="p">Password <em>*</em></label><input id="dsa-p" type="password" required minLength={signup ? 6 : undefined} autoFocus placeholder="Enter password" value={a.password} onChange={e => a.setPassword(e.target.value)} autoComplete={signup ? "new-password" : "current-password"} className="dsa-in" /></>}
          {signup && a.step === 1 && <CountryPicker initial={country} />}
          {signup && <p className="dsa-terms">By creating an account, you agree to the <Link href="/terms">Terms of Use</Link> and <Link href="/privacy">Privacy Notice</Link>.</p>}
          <button className="dsa-next" disabled={a.busy}>{a.busy ? "Please wait…" : reset ? "Send reset link" : a.step === 2 && signup ? "Create account" : a.step === 2 ? "Log in" : signup ? "Get Started" : "Next"}</button>
        </>}
        {a.err && <p role="alert" className="dsa-err">{a.err}</p>}{a.note && <p role="status" className="dsa-ok">{a.note}</p>}
        {reset ? <button type="button" className="dsa-up" onClick={a.go("signin")}>Back to log in</button> : signup ? <Link className="dsa-up" href="/login">Log in instead</Link> : <Link className="dsa-up" href="/free-trial">Sign Up for Free</Link>}
      </form>
    </div>
    <div className="dsa-alt">
      {!reset && config && <button type="button" onClick={a.google} disabled={a.busy}>Continue with Google</button>}
      {!signup && !reset && a.step === 2 && <button type="button" onClick={a.go("reset")}>Forgot password?</button>}
      {demo && <button type="button" onClick={a.useDemo} disabled={a.busy}>Use the demo account</button>}
    </div>
    {!a.configured && <p className="dsa-cfg" role="status">Sign-in isn’t configured on this deployment yet.</p>}
    </div>
    <footer className="dsa-foot"><span className="dsa-pw">DocuSignIsDead</span>
      <nav className="dsa-mid" aria-label="Account links"><Link href="/contact">Contact Us</Link><Link href="/terms">Terms of Use</Link><Link href="/privacy">Privacy</Link><Link href="/intellectual-property">Intellectual Property</Link><Link href="/trust">Trust</Link></nav>
      <span className="dsa-copy">© 2026 DocuSignIsDead</span><p className="dsa-disclaimer">{site.trademark}</p></footer>
  </main>;
}
