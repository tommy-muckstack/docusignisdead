import Link from "next/link";
import { Logo } from "@/components/Logo";
import { site } from "@/site.config";
import "@/app/marketing-chrome.css";
const links = [["Products", "/products"], ["Solutions", "/solutions"], ["Resources", "/resources"], ["Plans & Pricing", "/pricing"]] as const;
export function MarketingHeader() {
  return <header className="marketing-header">
    <div className="marketing-utility"><Link href="/support">Support</Link><Link href="/login">Access Documents</Link><Link href="/login">Log In</Link></div>
    <div className="marketing-nav"><Link href="/" aria-label="DocuSignIsDead home"><Logo size={30} /></Link>
      <nav aria-label="Main navigation">{links.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}</nav>
      <Link className="ids-btn ids-btn--primary" href="/free-trial">Try for free</Link>
    </div>
  </header>;
}
export function MarketingFooter() {
  return <footer className="marketing-footer"><div className="marketing-footer-links">
    <section><h2>Explore</h2>{links.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}</section>
    <section><h2>Help</h2><Link href="/support">Support</Link><Link href="/contact">Contact Us</Link><Link href="/trust">Trust</Link><a href="https://github.com/tommy-muckstack/docusignisdead">Source code</a></section>
    <section><h2>Legal</h2><Link href="/terms">Terms of Use</Link><Link href="/privacy">Privacy</Link><Link href="/intellectual-property">Intellectual Property</Link><a href="https://github.com/tommy-muckstack/docusignisdead/blob/main/LICENSE">Open Source License</a></section>
    </div><p>{site.trademark}</p><small>© 2026 DocuSignIsDead · Apache-2.0</small></footer>;
}
