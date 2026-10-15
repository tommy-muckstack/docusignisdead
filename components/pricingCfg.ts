import type { PBCfg } from "@/components/PricingBody";
export const pricingCfg: PBCfg = {
  vars: { "--plan-min": "640px", "--ink": "#130032", "--accent": "#4c00ff", "--accent-ink": "#fff", "--soft": "#f3efff", "--hero-bg": "linear-gradient(180deg,#26065d 0%,#4c00ff 100%)", "--hero-ink": "#fff", "--hero-pt": "70px", "--hero-pb": "40px", "--h1": "48px", "--h1-ls": "-.5px", "--h-weight": "500", "--card-r": "8px", "--btn-r": "4px", "--plan-h2": "28px", "--plan-h2-lh": "34px", "--row": "44px", "--faq-bg": "#fff", "--faq-card": "#fff", "--cta-bg": "#fff", "--max": "1100px" } as Record<string, string>,
  title: "Agreements made effortless", toggle: ["Annual Billing", "Monthly Billing"],
  plans: [
    { name: "Personal", price: "$0", per: "/month", desc: "For individuals who send up to five envelopes per month", cta: "Buy Now", lead: "Core benefits include:", feats: ["Send 5 envelopes per month", "Securely store and access documents", "Speed up agreement completion"] },
    { name: "Standard", price: "$0", per: "/user/month", desc: "For small to medium teams who send agreements in bulk", cta: "Buy Now", hot: true, tag: "Best value", lead: "All Personal benefits, plus:", feats: ["Send 100 envelopes per user per year", "Standardize and customize agreements", "Collect important data", "Reduce errors with reusable templates"] },
    { name: "Business Pro", price: "$0", per: "/user/month", desc: "For teams that need more advanced features", cta: "Buy Now", lead: "All Standard benefits, plus:", feats: ["Collect payments", "Advanced fields", "Bulk send", "Signer attachments"] },
    { name: "Enhanced plans", price: "Custom", desc: "Speak with sales for customized solutions", cta: "Contact Sales", lead: "Additional benefits include:", feats: ["Advanced workflow", "Single sign-on", "Custom branding", "Dedicated support"] },
  ],
  tableTitle: "Compare eSignature plan features", cols: ["Personal", "Standard", "Business Pro", "Enhanced"],
  groups: [["Accelerate your agreements with eSignature", ["Real-time audit trail", "Reusable templates", "Multiple languages", "Notifications and reminders", "Mobile signing", "Reporting"]], ["Deliver precise signing experiences", ["Conditional logic", "Custom fields"]], ["Manage access and permissions", ["Roles", "Groups", "SSO"]], ["Streamline workflows and documents", ["Bulk send", "Payments", "Forms"]], ["Drive trust and security", ["Audit logs", "Encryption", "Retention"]]],
  faqTitle: "eSignature plans and pricing FAQ", faqs: [["How do Intelligent Agreement Management (IAM) applications differ from eSignature plans?", "This project covers eSignature features for free."], ["What are ‘envelopes’ and how do they relate to my service subscription plan?", "An envelope is a package of documents sent for signature."], ["How do I purchase add-ons and how much do they cost?", "There is nothing to purchase."], ["How many envelopes can I send for signatures each month or year?", "As many as you host capacity for."], ["How do I upgrade, downgrade, or cancel my plan?", "No plans to change."], ["Will my subscription renew automatically?", "There is no subscription."], ["Does everyone signing an agreement need a DocuSign account?", "No. Signers only need the link."]],
  cta: { title: "Curious about IAM plans?", btn: "View IAM Plans" },
  fill: 64,
  fillMobile: 3,
};
