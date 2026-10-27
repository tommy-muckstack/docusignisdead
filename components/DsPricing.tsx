"use client";
import Link from "next/link";
import { MarketingHeader, MarketingFooter } from "./MarketingChrome";
import { useState } from "react";
import data from "@/lib/dsPricingData.json";
import "@/app/ds-pricing.css";

// Pricing page laid out like docusign.com/products-and-pricing. Copy and feature rows follow the original; art is CSS and generic.
const Chk = () => <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
const Down = ({ s = 20 }: { s?: number }) => <svg width={s} height={s} viewBox="0 0 24 24" aria-hidden><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
const Ico = ({ k }: { k: number }) => {
  const p = [
    <path key="a" d="M4 7h16v10H4zM4 8l8 6 8-6" />, <path key="b" d="M4 6h16v12H4zM4 14h5l1 2h4l1-2h5" />, <path key="c" d="M4 6h16v12H4zM8 10h8M8 14h5" />,
    <path key="d" d="M5 19l1-4 10-10 3 3-10 10zM14 7l3 3" />, <path key="e" d="M12 4a8 8 0 100 16 8 8 0 000-16zM4 12h16M12 4c3 3 3 13 0 16M12 4c-3 3-3 13 0 16" />,
    <path key="f" d="M4 5h16v14H4zM4 10h16M10 10v9" />, <path key="g" d="M5 5h14v10H8l-3 3zM9 9h6" />, <path key="h" d="M12 4a8 8 0 100 16 8 8 0 000-16zM12 8v4l3 2" />,
    <path key="i" d="M5 8h14v10H5zM5 12h14M9 8V5h6v3" />, <path key="j" d="M4 12l16-7-5 14-3-6z" />, <path key="k" d="M8 3h8v6a4 4 0 01-8 0zM6 21c1-5 3-7 6-7s5 2 6 7" />,
    <path key="l" d="M12 3l8 3v6c0 5-3 8-8 9-5-1-8-4-8-9V6zM9 12l2 2 4-4" />, <path key="m" d="M7 10V8a5 5 0 0110 0v2M5 10h14v10H5z" />,
  ];
  return <i className="dp-ico"><svg width="18" height="18" viewBox="0 0 24 24" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">{p[k % p.length]}</svg></i>;
};
type P = { name: string; best?: boolean; blurb: string; price?: string; per?: string; commit?: string; cta: string; lead: string; feats: React.ReactNode[]; light?: boolean };
const plans: P[] = [
  { name: "Personal", blurb: "For individuals and sole proprietors with basic e-signature needs.", price: "11", per: "/month", commit: "$132", cta: "Buy Now", lead: "Core benefits include:", feats: ["Send 5 envelopes per month", "Securely store and access all your agreements in one place", "Speed up agreement completion with AI-assisted summary", "Save hours of manual setup with reusable templates", "Stay in the tools you already use with 1000+ integrations"] },
  { name: "Standard", best: true, blurb: "For small to medium teams that need to send, sign and collaborate.", price: "30", per: "/user/month", commit: "$360", cta: "Buy Now", lead: "All Personal benefits, plus:", feats: ["Send a total of 100 envelopes per user per year", "Standardize agreements by sharing templates with your team", "Increase collaboration with real-time commenting", "Use your own branding to build trust and brand awareness", "Avoid delays by enabling delegated signing", <>Collect signatures faster with 5 SMS deliveries (<b>one-time bonus</b>)</>, <>Reduce fraud risk with 5 identity verifications (<b>one-time bonus</b>)</>] },
  { name: "Business Pro", blurb: "For automating and optimizing agreements with advanced features.", price: "45", per: "/user/month", commit: "$540", cta: "Buy Now", lead: "All Standard benefits, plus:", feats: ["Send a total of 100 envelopes per user per year", "Simplify data collection with mobile-friendly web forms", "Collect payments during the signing process", "Enable intuitive signing with interactive form fields", "Increase accuracy with real-time data verification as signers type", "Save time by bulk sending to multiple recipients at one time"] },
  { name: "Enhanced plans", blurb: "Speak with an expert to customize an eSignature or IAM plan that meets your exact business needs.", cta: "Contact Sales", lead: "Additional benefits include:", light: true, feats: ["Customize your envelope limits to fit your exact business needs", "Maintain oversight with centralized org management", "Get 24/7 live technical support", "Ensure compliance with all security configurations", "Secure and simplify user logins with single sign-on (SSO)", "Generate documents from within Salesforce"] },
];
const faqs: [string, string][] = [
  ["How do Intelligent Agreement Management (IAM) applications differ from eSignature plans?", "This project covers eSignature only: prepare a PDF, send it, collect signatures and get a completion certificate. IAM-style workflow and AI features are not part of it."],
  ["What are ‘envelopes’ and how do they relate to my service subscription plan?", "An envelope is one package of documents sent for signature. There are no envelope limits here."],
  ["How do I purchase add-ons and how much do they cost?", "There are no add-ons to buy. The prices shown mirror the plans this project replaces, for comparison."],
  ["How many envelopes can I send for signatures each month or year?", "As many as the server hosting the app can store."],
  ["How do I upgrade, downgrade, or cancel my plan?", "There are no plans to change."],
  ["Will my subscription renew automatically?", "There is no subscription."],
  ["Does everyone signing an agreement need to have an account?", "No. Signers open a link and sign without creating an account."],
  ["How does DocuSignIsDead protect my data?", "Documents are stored in your own deployment and every signing link is unguessable. The code is open so you can inspect it."],
  ["Does DocuSignIsDead offer a money-back guarantee?", "Everything is free, so there is nothing to refund."],
  ["What is \"Annual | Billed monthly\"?", "A billing option on the original plans: an annual commitment paid in monthly installments. It does not apply here."],
];
const groups = data as [string, string, string[][]][];
const cell = (v: string) => v === "Y" ? <span className="dp-y"><Chk /></span> : v === "N" ? <span className="dp-sr">Does not include</span> : <span>{v}</span>;

export function DsPricing() {
  const [open, setOpen] = useState<Record<number, boolean>>({ 0: true });
  const [faq, setFaq] = useState<number | null>(null);
  return <div className="dp" id="top">
    <MarketingHeader />
    <section className="dp-hero">
      <h1>Agreements made effortless</h1><p className="dp-comparison-note">DocuSignIsDead is free. Paid plans below are reference comparisons; no subscription is sold here.</p>
      <div className="dp-bar">
        <div className="dp-tabs"><button type="button"><small>IAM + ESIGNATURE PLANS</small><span>Unlimited envelopes + AI</span></button><button type="button" className="on"><small>ESIGNATURE PLANS</small><span>eSignature essentials</span></button></div>
        <div className="dp-sel"><em>You’re saving up to 33%</em><button type="button"><small>Subscription Type</small><span>Annual | Billed monthly</span><Down /></button></div>
      </div>
      <div className="dp-plans">{plans.map(p => <section key={p.name} className={"dp-plan" + (p.best ? " is-best" : "") + (p.light ? " is-light" : "")}>
        {p.best && <b className="dp-pop">MOST POPULAR</b>}
        <div className="dp-top"><h3>{p.name}</h3><p className="dp-blurb">{p.blurb}</p>
          {p.price ? <div className="dp-price"><sup>$</sup><b>{p.price}</b><span><i>{p.per}</i><small>Annual | Billed monthly</small></span></div> : <span className="dp-tel">Contact the project</span>}
          <Link href={p.light ? "/contact" : "/login"} className={"dp-buy" + (p.light ? " dp-buy--dark" : "")}>{p.cta}</Link>
          {p.commit && <p className="dp-commit"><b>This is an annual commitment of {p.commit}.*</b><span>Additional tax may apply</span></p>}</div>
        <div className="dp-bot"><h4>{p.lead}</h4><ul>{p.feats.map((f, i) => <li key={i}><Ico k={i + (p.best ? 2 : 0) + (p.name === "Business Pro" ? 5 : p.light ? 8 : 0)} /><span>{f}</span></li>)}</ul>
          <a className="dp-all" href="#features">See All Features</a></div></section>)}</div>
    </section>
    <section className="dp-unlock"><div><h2>Unlock (much) more agreement value with IAM</h2>
      <p>Commercial Intelligent Agreement Management (IAM) is an AI-assisted platform that connects and optimizes every step of your agreement process. With an IAM plan, you can automate workflows without code, manage and analyze documents with AI, and seamlessly connect agreement data across systems.</p>
      <Link href="/products" className="dp-iam">View IAM plans</Link>
      <div className="dp-flow" aria-hidden><div className="n n1"><i /><b>Generate document</b><u /></div><div className="n n2"><i /><b>Collect information</b><u /></div><div className="n n3"><i /><b>Participants sign document</b><u /></div></div></div></section>
    <section className="dp-cmp" id="features"><h2>Compare eSignature plan features</h2>
      <div className="dp-head"><div /><>{plans.map(p => <div key={p.name}><h5>{p.name}</h5>{p.price ? <p><b>${p.price}</b>{p.per}</p> : <p />}<Link href={p.light ? "/contact" : "/login"} className={"dp-buy dp-buy--s" + (p.light ? " dp-buy--dark" : "")}>{p.cta}</Link></div>)}</></div>
      {groups.map(([g, sub, rows], gi) => <div key={g} className={"dp-grp" + (open[gi] ? " is-open" : "")}>
        <button type="button" className="dp-grp__h" aria-expanded={!!open[gi]} onClick={() => setOpen({ ...open, [gi]: !open[gi] })}>
          <span className="dp-grp__t"><Ico k={gi * 3} /><h4>{g}</h4><Down s={24} /></span><span className="dp-grp__s">{sub}</span></button>
        {open[gi] && <div className="dp-rows">{rows.map(([n, ...vs], ri) => <div key={n} className="dp-row"><span className="dp-rn"><u>{n}</u>{gi === 7 && <em>NEW</em>}</span>{vs.map((v, i) => <div key={i} className={v === "N" ? "n" : ""}>{cell(v)}</div>)}</div>)}</div>}</div>)}</section>
    <section className="dp-addon"><div><h2>Enhance your plan with these add-ons</h2><p>These can be added to your subscription once you purchase a Standard or Business Pro plan.</p>
      <div className="dp-cards"><article><i className="a1" /><h3>Send with SMS</h3><p>Send real-time signing notifications to your signers’ phones.</p><p className="s">Starting at $0.36/delivery (additional tax may apply)</p><Link href="/products">Learn More <svg width="6" height="10" viewBox="0 0 6 10" aria-hidden><path d="M1 1l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.5" /></svg></Link></article>
        <article><i className="a2" /><h3>Verify recipient identity</h3><p>Enhance security and reduce risk by requiring recipients to confirm their identity.</p><p className="s">Starting at $2.40/ID verification attempt (additional tax may apply)</p><Link href="/products">Learn More <svg width="6" height="10" viewBox="0 0 6 10" aria-hidden><path d="M1 1l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.5" /></svg></Link></article></div></div></section>
    <section className="dp-faq"><div><h2>eSignature plans and pricing FAQ</h2>
      <div className="dp-fq">{faqs.map(([q, a], i) => <div key={q} className={faq === i ? "is-open" : ""}><button type="button" aria-expanded={faq === i} onClick={() => setFaq(faq === i ? null : i)}><span>{q}</span><Down s={22} /></button>{faq === i && <p>{a}</p>}</div>)}</div></div></section>
    <section className="dp-curious"><div><div><h2>Curious about IAM plans?</h2><p>View our IAM plan line-up for unlimited envelopes, AI capabilities, and code-free custom workflows.</p>
      <div className="dp-cbtn"><Link href="/products" className="w">View IAM Plans</Link><a href="#top" className="o">Back To Top</a></div></div><div className="dp-curious__art" aria-hidden><i /></div></div></section>
    <div className="marketing-content"><p>DocuSignIsDead is free. These reference plans describe the paid product this project replaces, for comparison only. There is no subscription or payment collection here.</p></div>
    <MarketingFooter />
  </div>;
}
