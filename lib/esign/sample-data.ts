export type Sample = { id: string; name: string; blurb: string; title: string; sections: { h: string; p: string }[]; parties: string[] };
export const SAMPLES: Sample[] = [
  { id: "nda", name: "Mutual NDA", blurb: "Two parties, one page of promises to keep quiet.", title: "Mutual Non-Disclosure Agreement", parties: ["Disclosing party", "Receiving party"], sections: [
    { h: "1. Purpose", p: "The parties wish to explore a business relationship and may share confidential information for that purpose only. This sample agreement is placeholder text for demonstrating e-signature and is not legal advice." },
    { h: "2. Confidential information", p: "Confidential information means non-public information disclosed in any form that a reasonable person would understand to be confidential, including product plans, customer lists and financial data." },
    { h: "3. Obligations", p: "Each party will use the other's confidential information only for the purpose above, protect it with at least reasonable care, and not disclose it to anyone who does not need to know it." },
    { h: "4. Term", p: "This agreement lasts two years from the date of the last signature. The duty to protect trade secrets continues for as long as they remain secret." },
    { h: "5. General", p: "This is the entire agreement on the subject. Changes must be in writing and signed by both parties. Each party may sign a counterpart, and a signed PDF is as good as ink." } ] },
  { id: "services", name: "Freelance services agreement", blurb: "Scope, fees and payment terms for a contractor.", title: "Independent Contractor Services Agreement", parties: ["Client", "Contractor"], sections: [
    { h: "1. Services", p: "The Contractor will perform the services described in each written statement of work agreed by both parties. This sample agreement is placeholder text for demonstrating e-signature and is not legal advice." },
    { h: "2. Fees", p: "The Client will pay the fees stated in the statement of work within thirty days of receiving an invoice. Late amounts accrue simple interest of one percent per month." },
    { h: "3. Ownership", p: "On full payment, the Contractor assigns to the Client the work product created specifically for the Client. The Contractor keeps pre-existing tools and general know-how." },
    { h: "4. Independence", p: "The Contractor is an independent contractor, chooses how to do the work, supplies their own equipment, and is responsible for their own taxes and insurance." },
    { h: "5. Termination", p: "Either party may end this agreement with fourteen days' written notice. The Client pays for services performed up to the end date." } ] },
  { id: "offer", name: "Offer letter", blurb: "A friendly offer for the candidate to accept.", title: "Offer of Employment", parties: ["Employer", "Candidate"], sections: [
    { h: "Position", p: "We are delighted to offer you the position described in our conversations, reporting to your hiring manager. This sample letter is placeholder text for demonstrating e-signature and is not legal advice." },
    { h: "Compensation", p: "Your annual base salary will be as discussed, paid on the company's regular payroll schedule, less required withholdings." },
    { h: "Start date", p: "Your employment will begin on the start date we agree. This offer is contingent on completing the usual background and work-authorization checks." },
    { h: "At-will", p: "Employment is at will, which means either you or the company may end it at any time, with or without cause or notice." },
    { h: "Accepting", p: "To accept, sign and date below. We would be thrilled to have you on the team." } ] },
];
