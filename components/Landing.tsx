import Link from "next/link";
import { PricingBody } from "@/components/PricingBody";
import { pricingCfg } from "@/components/pricingCfg";
import "@/app/landing.css";

// Home page in the layout, type scale and palette of docusign.com. Copy, marks and artwork are our own.
const REPO = "https://github.com/tommy-muckstack/docusignisdead";
const Arrow = () => <svg width="8" height="12" viewBox="0 0 8 12" aria-hidden><path d="M1.5 1.5L6 6l-4.5 4.5" fill="none" stroke="currentColor" strokeWidth="1.6" /></svg>;
const Chev = () => <svg width="9" height="6" viewBox="0 0 9 6" aria-hidden style={{ marginLeft: 6 }}><path d="M1 1l3.5 3.5L8 1" fill="none" stroke="currentColor" strokeWidth="1.4" /></svg>;
const Check = () => <svg width="40" height="40" viewBox="0 0 40 40" aria-hidden><circle cx="20" cy="20" r="12" fill="none" stroke="#fff" strokeWidth="1.6" opacity=".9" /><path d="M14.5 20.5l4 4 7-8" fill="none" stroke="#fff" strokeWidth="1.8" /></svg>;
const Mark = () => <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden><rect width="24" height="24" rx="6" fill="#4c00ff" /><path d="M6 17C9 8 11 8 12 13c1 4 3-1 6-6M5 19h14" fill="none" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>;
/** Original UI illustration: a clipped product window. */
const Shot = ({ kind }: { kind: "search" | "phone" | "flow" | "code" | "hub" | "clm" }) => <div className={`ds-shot ds-shot--${kind}`} aria-hidden>
  <div className="ds-win"><i className="b1" /><i className="b2" /><i className="b3" /><i className="l1" /><i className="l2" /><i className="l3" /><i className="l4" /><i className="pill" /></div>
  <div className="ds-win ds-win--2"><i className="l1" /><i className="l2" /><i className="pill" /></div></div>;
const Wordmark = ({ n, c = "" }: { n: string; c?: string }) => <span className={"ds-wm " + c}>{n}</span>;
const logos = ["NORTHWIND", "Harborline", "Brightcell", "ARCHWAY", "Kestrel", "Meridian&Co", "VANTAGE", "Fieldstone", "NORTHWIND", "Harborline"];
const foot: [string, string[]][][] = [
  [["APPLICATIONS", ["Intelligent agreement hub", "Contract core", "Agreement hub for support teams", "Agreement hub for sales", "Every application"]], ["PRODUCTS", ["eSign", "Contract lifecycle", "Identity checks", "Document prep", "Web forms", "Every product"]]],
  [["PRICING", ["Hub plans", "eSign plans", "Property plans", "API plans", "Offers"]], ["INDUSTRIES", ["Finance", "Insurance", "Property", "Public sector", "All industries"]], ["BUSINESS SIZE", ["Enterprise", "Small and medium teams", "Individuals"]]],
  [["SUPPORT", ["Help center", "Customer success", "Community", "Trust portal"]], ["DEVELOPERS", ["Developer center", "Free sandbox account", "API overview"]], ["PARTNERS", ["Partner portal", "Partner login", "Embedded signing"]]],
  [["RESOURCES", ["Resource center", "Learn hub", "Templates", "Blog", "Customer stories", "Events", "Webinars", "University", "Legality guide", "Trust and status", "Safety center", "Try a sample agreement"]], ["FREE TOOLS", ["Invoice maker", "Online signature maker"]]],
  [["COMPANY", ["About us", "Product releases", "Open-source roadmap", "Careers", "Leadership", "News", "Investors", "Contact us", "Accessibility"]]],
];

export function Landing({ page }: { page?: "pricing" } = {}) {
  return <div className={"ds" + (page === "pricing" ? " is-pr" : "")}>
    <div className="ds-util"><a className="ds-util__l" href={REPO}><b>NEW</b>Open source and self-hostable, with unlimited envelopes <Arrow /></a>
      <nav><span>Sales 1-800-555-0100</span><button>Search</button><a href={REPO}>Support</a><Link href="/login">Access Documents</Link><Link href="/login">Log In</Link></nav></div>
    <header className="ds-nav"><Link href="/" className="ds-logo"><Mark /><span>docusign<b>isdead</b></span></Link>
      <nav className="ds-menu"><button>Products<Chev /></button><button>Solutions<Chev /></button><button>Resources<Chev /></button><Link href="/pricing">Enterprise</Link><Link href="/pricing">Plans &amp; Pricing</Link></nav>
      <div className="ds-nav__cta"><Link href="/pricing" className="ds-btn ds-btn--ghost">CONTACT SALES</Link><Link href="/pricing" className="ds-btn ds-btn--ghost">BUY NOW</Link><Link href="/login" className="ds-btn ds-btn--solid">TRY FOR FREE</Link></div></header>
    <section className="ds-hero">
      <Link className="ds-banner" href="/pricing">Introducing the in-browser PDF editor. Read the announcement <Arrow /></Link>
      <h1>Everything you need to sign</h1>
      <p className="ds-hero__sub">Send, sign and track all of your agreements for free.</p>
      <p className="ds-hero__terms">By clicking the Get Started button, you agree to our <Link href="/pricing">Terms &amp; Conditions</Link> and <Link href="/pricing">Privacy Policy</Link>.</p>
      <form className="ds-hero__form" action="/login"><input name="email" type="email" placeholder="name@company.com" aria-label="Email" /><button>Get Started</button></form>
      <p className="ds-hero__country">Country/region: United States<Chev /></p></section>
    <section className="ds-logos"><div>{logos.map((l, i) => <Wordmark key={i} n={l} c={"w" + (i % 5)} />)}</div></section>
    <section className="ds-ai"><h2>AI-assisted agreement management</h2>
      <p className="ds-lede">Analyze agreements with AI, sign documents electronically, and automate the workflow around them from one open platform.</p>
      <Link className="ds-more" href="/login">Explore the platform <Arrow /></Link>
      <div className="ds-tabs"><span>View solutions</span><button className="on">Featured</button><button>Sales</button><button>Customer Experience</button><button>Procurement</button><button>Human Resources</button><button>Legal</button><button>⋮ More</button></div></section>
    <section className="ds-grid">
      <article className="ds-c ds-c--half"><h3>Find, analyze, and act on agreements with AI</h3><p>Turn signed agreements into searchable data so you can cut busywork, surface key terms, and act on them early.</p><Link className="ds-more" href="/login">Explore agreement search <Arrow /></Link><Shot kind="search" /></article>
      <article className="ds-c ds-c--half"><h3>Send, sign, and track documents</h3><p>Collect signatures from anywhere on almost any device. Finish agreements faster with shared templates, reminders and delivery inside the apps your signers already use.</p><Link className="ds-more" href="/login">Explore eSign <Arrow /></Link><Shot kind="phone" /></article>
      <article className="ds-c ds-c--wide"><div><h3>Automate agreement processes</h3><p>Design workflows that move each agreement through its steps on its own, so your team can build and change them without writing any code at all.</p><Link className="ds-more" href="/login">Explore the workflow builder <Arrow /></Link></div><Shot kind="flow" /></article>
      <article className="ds-c ds-c--half"><h3>Build and scale with developer tools and APIs</h3><p>Plug signing into your own product with a clean API and sample code that fits your stack.</p><Link className="ds-more" href={REPO}>Explore the developer center <Arrow /></Link><Shot kind="code" /></article>
      <article className="ds-c ds-c--half"><h3>Bring people, agreements, and data together</h3><p>Keep every agreement in one secure hub so teams can work through tasks and reviews in real time.</p><Link className="ds-more" href="/login">Explore workspaces <Arrow /></Link><Shot kind="hub" /></article>
      <article className="ds-c ds-c--wide"><div><h3>Optimize your contract lifecycle</h3><p>Shorten cycle times and get more from every deal by removing needless steps.</p><Link className="ds-more" href="/login">Explore contracts <Arrow /></Link></div><Shot kind="clm" /></article></section>
    <section className="ds-more2"><h2>Do much more with one platform</h2>
      <p className="ds-lede">Save time and unlock value from your agreements. With ready-made apps you can automate workflows, manage agreement data with AI, and connect it all across your systems.</p>
      <div className="ds-row"><Link className="ds-btn ds-btn--solid ds-btn--lg" href="/pricing">View Plans and Pricing</Link><Link className="ds-more" href="/pricing">Explore all products <Arrow /></Link></div>
      <div className="ds-video" aria-hidden><span><svg width="28" height="28" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" fill="#4c00ff" /></svg></span></div></section>
    <section className="ds-int"><h2>Build custom contract workflows</h2>
      <p>Extend your workflows with an open App Center, plenty of partner integrations, a clean API, and links into your cloud storage.</p>
      <Link className="ds-btn ds-btn--outline ds-btn--lg" href="/pricing">Explore Integrations</Link>
      <div className="ds-tiles" aria-hidden>{Array.from({ length: 14 }, (_, i) => <i key={i} />)}<em /></div>
      <button className="ds-pause" aria-label="Pause">⏸</button></section>
    <section className="ds-trust"><div className="ds-trust__l"><h2>Trusted the world over</h2><p>We handle your agreements as seriously as you do, which is why this project follows strict, well-documented security practice.</p><Link className="ds-more ds-more--w" href={REPO}>Explore the Trust Center <Arrow /></Link></div>
      <div className="ds-stats"><div><i /><p><b>1 billion</b> people and <b>1.9 million</b> customers could use it</p></div><div><i /><p><b>95%</b> of teams get a signed copy back the same day.</p></div><div><i /><p><b>44 languages</b> are on the roadmap for signers, with 14 for senders.</p></div><div><i /><p><b>The No. 1</b> most open signing tool in this lineup, by license.</p></div></div></section>
    <section className="ds-comp"><small>OPEN COMPLIANCE &amp; GOOD PRACTICE</small><ul>{["ISO 27001 aware", "Audit trail", "Secure links", "Void anytime", "PDF/A output", "SSAE-ready docs"].map(x => <li key={x}><Check />{x}</li>)}</ul></section>
    <section className="ds-co"><h2>Teams do better with simple tools</h2>
      <p className="ds-lede">Real teams, one open tool. Learn how people save time and money, tidy their processes, and serve their users.</p>
      <Link className="ds-more" href="/pricing">Browse stories <Arrow /></Link>
      <div className="ds-co__logos">{["Northwind", "Vestlight", "Primeway", "Flowforge"].map((l, i) => <button key={l}><Wordmark n={l} c={"w" + i} /></button>)}</div></section>
    <section className="ds-story"><div className="ds-story__card"><div className="ds-story__cover" aria-hidden /><div className="ds-story__t"><small>Customer story</small><h3>How a small team went paperless in a weekend</h3></div>
      <ul><li><b>5 minutes</b> to build a signing packet, down from 75</li><li><b>23%</b> less paper to process</li><li><b>50%</b> shorter time to a signed contract</li></ul></div></section>
    <section className="ds-rec"><h2>Recommended for you</h2>
      <div className="ds-mom"><div><small>Community call</small><h3>Open-source signing office hours are back, on the first Friday each month</h3><p>Bring your questions about self-hosting and templates.</p><Link className="ds-btn ds-btn--white" href={REPO}>Save the Date</Link></div><div className="ds-mom__art" aria-hidden><i /><i /></div></div>
      <div className="ds-dots"><i className="on" /><i /></div>
      <div className="ds-posts">{[["3 Practical Ways AI Can Smooth Out Customer Paperwork"], ["Meet the In-Browser PDF Editor and a Better Connected Signing Flow"], ["How to Build Signing Confidence Across Your Legal Team"]].map(([t], i) => <Link href="/pricing" key={i}><div className={"ds-post__img p" + i} aria-hidden><i /></div><small><b>Blog</b></small><h4>{t}</h4></Link>)}</div></section>
    <section className="ds-cta"><div><div><h2>DocuSignIsDead is the open agreement platform your business needs</h2><div className="ds-row"><Link className="ds-btn ds-btn--white ds-btn--lg" href="/login">Start for Free</Link><Link className="ds-btn ds-btn--solid2 ds-btn--lg" href="/pricing">Explore the platform</Link></div></div><div className="ds-cta__art" aria-hidden><i /></div></div></section>
    {page === "pricing" && <PricingBody cfg={pricingCfg} />}
    <footer className="ds-foot"><div className="ds-foot__cols">{foot.map((col, i) => <div key={i}>{col.map(([h, ls]) => <section key={h}><p>{h}</p>{ls.map(l => <Link key={l} href={l.startsWith("Open-source") ? REPO : "/pricing"}>{l}</Link>)}</section>)}</div>)}</div></footer>
    <div className="ds-bar"><button className="ds-ctry">United States<Chev /></button><span className="ds-soc">{["f", "X", "▶", "in"].map(x => <a key={x} href={REPO} aria-label={x}>{x}</a>)}</span><span className="ds-apps"><a href={REPO}><i>GET IT ON</i><b>Google Play</b><small>★ 4.4</small></a><a href={REPO}><i>Download on the</i><b>App Store</b><small>★ 4.9</small></a></span></div>
    <div className="ds-legal"><nav><Link href="/pricing">Terms of Use</Link><Link href="/pricing">Privacy Notice</Link><Link href="/pricing">Notice to California Residents</Link><Link href="/pricing">Your Privacy Choices</Link><Link href="/pricing">Intellectual Property</Link><Link href="/pricing">Open Source License</Link></nav><span>© DocuSignIsDead 2026</span></div>
    <button className="ds-assist"><svg width="18" height="18" viewBox="0 0 24 24"><path d="M12 3l2.2 5.8L20 11l-5.8 2.2L12 19l-2.2-5.8L4 11l5.8-2.2z" fill="none" stroke="#fff" strokeWidth="1.8" /></svg>Signing Assistant</button>
  </div>;
}
