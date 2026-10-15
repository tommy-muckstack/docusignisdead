import Link from "next/link";
import { BP } from "@/lib/basepath";
import { MarketingHeader, MarketingFooter } from "./MarketingChrome";
import { CountryPicker } from "./CountryPicker";
import "@/app/landing.css";
export function Landing() {
  return <div className="ds"><MarketingHeader /><main><section className="ds-hero">
    <h1>Everything you need to agree</h1>
    <p className="ds-hero__sub">Prepare, sign and track your agreements with an independent, open-source signing tool.</p>
    <form className="landing-signup" action={`${BP}/free-trial`} method="get">
      <div className="ds-hero__form"><input name="email" type="email" required autoComplete="email" placeholder="Enter your email" aria-label="Email" /><button>Get Started</button></div><CountryPicker />
    </form>
    <p className="ds-hero__terms">By creating an account, you agree to our <Link href="/terms">Terms of Use</Link> and <Link href="/privacy">Privacy Notice</Link>.</p>
    </section>
    <section className="landing-features"><h2>From a PDF to a signed agreement</h2><div className="landing-features-grid">
    <article><h3>Prepare your document</h3><p>Upload a PDF, add recipients, and place signature, initials, date, text and checkbox fields.</p><Link href="/products">Explore eSignature →</Link></article>
    <article><h3>Keep everyone in order</h3><p>Choose sequential signing, follow each recipient’s progress, and cancel a request when the agreement changes.</p><Link href="/solutions">Explore signing workflows →</Link></article>
    <article><h3>Keep a completed copy</h3><p>Download a PDF with the completed fields and a certificate containing the signing activity.</p><Link href="/trust">Understand signing and security →</Link></article>
    </div></section>
    <section className="ds-cta"><div><div><h2>Your agreements. Your workflow.</h2><Link className="ds-btn ds-btn--white ds-btn--lg" href="/free-trial">Start for free</Link></div></div></section></main><MarketingFooter /></div>;
}
