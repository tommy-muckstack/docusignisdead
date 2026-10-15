import type { Site } from "@/lib/site-types";
const GH = "https://github.com/tommy-muckstack/docusignisdead";
export const site: Site = {
  slug: "docusignisdead", name: "DocuSignIsDead", replaces: "paid e-signature software", theme: "docusign",
  glyph: "M6 17 C9 8 11 8 12 13 C13 17 15 12 18 7 M5 19 H19",
  nav: [{ label: "Products", id: "product" }, { label: "Solutions", id: "solutions" }, { label: "Resources", id: "resources" }, { label: "Pricing", id: "pricing" }],
  cta: "Get started, it's free",
  hero: { variant: "split", eyebrow: "Free · Open source · Unlimited envelopes", title: ["Agree on it.", "Sign it. Done."], subtitle: "Upload a PDF, drop signature fields where they belong, and send each signer a link. No envelope caps, no per-seat bill, and a certificate of completion on every finished document.",
    primary: { label: "Send your first document", href: "/login" }, secondary: { label: "See pricing", href: "/#pricing" }, shot: "editor.png", shotAlt: "The DocuSignIsDead editor with a mutual NDA and two color-coded signature fields" },
  audience: "Used for NDAs, offer letters, contractor agreements, consent forms, leases and anything else that ends with a signature line",
  stepsTitle: "From PDF to signed in four steps",
  steps: [{ t: "Upload", d: "Drop in a PDF or start from a sample agreement. Pages render right in the browser." }, { t: "Prepare", d: "Add signers, then place signature, initials, date, text and checkbox fields for each of them." }, { t: "Send", d: "Each signer gets a private link. Sign in order, or let everyone sign at once." }, { t: "Complete", d: "When the last person signs, you get one flattened PDF with a certificate page." }],
  rows: [
    { id: "product", k: "Prepare", h: "Put every field exactly where it belongs", p: "Color-coded fields for each signer: signature, initials, date, text and checkbox. Click to drop, drag to move, resize to fit the line. Required or optional, your call.", img: "editor.png", alt: "The prepare view with a recipients panel, a field palette and a PDF page with signature fields", cta: "Open the editor" },
    { id: "sign", k: "Sign", h: "Signing that works on a phone, with no account", p: "Signers open their link, type or draw a signature once, and it fills every signature field. Required fields guide them, and the server checks the rest.", img: "sign.png", alt: "The signing view with highlighted fields to complete and a Finish button", cta: "Try signing a document" },
    { id: "status", k: "Track", h: "Know who has signed and who hasn't", p: "A live status per signer, an activity log of views and signatures, and a one-click void if the deal changes. Sequential routing keeps the second signer waiting for the first.", img: "status.png", alt: "The status panel showing two signers, one signed and one waiting, with an activity log", cta: "See the status panel" },
    { id: "done", k: "Complete", h: "One signed PDF, plus the paper trail", p: "Signatures are flattened into the original pages and a certificate of completion lists every signer and event. Download it from the document or from the signing link.", img: "completed.png", alt: "A completed document with a Download signed PDF button and all signers marked signed", cta: "Download a signed PDF" },
  ],
  statsTitle: "Real numbers, no fine print",
  stats: [{ b: "$0", s: "for every plan we replace" }, { b: "No caps", s: "unlimited documents, signers and fields" }, { b: "5 fields", s: "signature, initials, date, text, checkbox" }, { b: "Apache-2.0", s: "self-host it, fork it, change it" }],
  integrations: { title: "Fits the way you already work", text: "Share signing links in email, chat or a text message, and download a standard PDF at the end. Email delivery, templates and an API are on the roadmap." },
  pricing: { title: "What you'd pay for an e-signature tool", vendor: "Reference plans", asOf: "October 2026", plans: [{ name: "Personal", perSeatMonth: 10, note: "5 envelopes a month, 1 user" }, { name: "Standard", perSeatMonth: 25, note: "100 envelopes a year per user" }, { name: "Business Pro", perSeatMonth: 40, note: "100 envelopes a year per user" }], seats: 3,
    footnote: "Reference prices are per user, per month, billed yearly (monthly billing is $15, $45 and $65). Envelopes beyond your allowance cost extra. Self-hosting has your own hosting costs; a small instance fits in free tiers.", featuresTitle: "Every feature, no plan gates",
    features: [{ name: "Unlimited documents and signers", plan: "Standard" }, { name: "Sequential signing order", plan: "Standard" }, { name: "Reusable templates", plan: "Standard" }, { name: "Certificate of completion", plan: "Personal" }, { name: "Status tracking and void", plan: "Personal" }, { name: "Bulk send and branding", plan: "Business Pro" }] },
  finalCta: { title: "Your next signature takes two minutes.", sub: "Upload, place fields, send the links. No card, no envelope counter." },
  footer: [
    { title: "Product", links: [{ label: "Prepare", href: "/#product" }, { label: "Sign", href: "/#sign" }, { label: "Track", href: "/#status" }, { label: "Pricing", href: "/#pricing" }] },
    { title: "Get started", links: [{ label: "Log in", href: "/login" }, { label: "Try the demo account", href: "/login" }, { label: "Price comparison", href: "/#pricing" }] },
    { title: "Open source", links: [{ label: "GitHub", href: GH }, { label: "Apache-2.0 license", href: GH + "/blob/main/LICENSE" }] },
    { title: "More IsDead apps", links: [{ label: "CalendlyIsDead", href: "/calendlyisdead" }, { label: "CanvaIsDead", href: "/canvaisdead" }, { label: "TypeformIsDead", href: "/typeformisdead" }, { label: "GrammarlyIsDead", href: "/grammarlyisdead" }] },
  ],
  trademark: "DocuSignIsDead is an independent open-source project. It is not affiliated with, endorsed by or sponsored by the original platform. All third-party trademarks belong to their respective owners. Signatures made with this software are simple electronic signatures, not qualified or advanced ones.",
  repo: GH,
};
