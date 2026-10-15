# DocuSignIsDead parity report

Updated 2026-10-15. Baseline: `a02d30e523745265869dde45fe374e85a0a97ac4`, verified against remote main through the connected GitHub tool. Seven stacked review branches. After implementation, the user authorized review and merging suitable PRs into main.

## Evidence and scope

The supplied QA findings are implemented as functional requirements. The real signed-in reference walkthrough is **not complete**: this host cannot launch Chromium (MachPortRendezvousServer error 141) or Firefox (SIGABRT), the requested isolated Chrome debugging session is unavailable, and no throwaway reference inbox was supplied. Findings #9–#18 therefore do not establish exact signed-in visual parity. Public reference homepage/trial pages and official documentation were inspected; all implementation/assets are original.

Local validation: lint, typecheck, production build and **36 unit/integration tests pass**. Tests use isolated temporary storage and synthetic `.test` addresses. Email provider calls are mocked. No actual email, real envelope or real person’s document has been sent/signed. No environment files or secrets were read, changed or committed. Payment behavior is unchanged.

A real-browser suite covers desktop 1440×900 and mobile 390×844, including actual click/fill/select/pointer events. [GitHub Actions run 38797692714](https://github.com/tommy-muckstack/docusignisdead/actions/runs/38797692714) passed lint, typecheck, production build, **36 unit/integration tests and all 22 browser tests**, testing commit `532bf749b7d191b91e0253143ffa0e95b149dd5f`. Coverage includes public routes/assets/overflow, contacts/settings, folders, template persistence, field drag/resize, Type/Draw and required fields, saved progress, ordered signer/CC/viewer routing, PDF completion, Void, decline and Delete. The initial run exposed ambiguous selectors and a stale template editor view; both were corrected before this passing run.

Desktop and mobile contact sheets were visually reviewed for the landing/login/pricing pages, agreements, template/send editors, disclosure, drawn signature and completion screen. Permanent sheets are included: desktop [before](evidence/parity-desktop-before.png) / [after](evidence/parity-desktop.png), and mobile [before](evidence/parity-mobile-before.png) / [after](evidence/parity-mobile.png). The baseline capture includes the send editor, sent state, signature adoption and completion. Full-resolution before/after screenshots, the HTML browser report and server logs are in the [parity-browser-evidence artifact](https://github.com/tommy-muckstack/docusignisdead/actions/runs/38797692714/artifacts/12002164154), retained until 2026-10-29. Screenshots named `*-before.png` use baseline `a02d30e`; `*-after.png` use the tested implementation. These compare the old clone with the new clone, not with the signed-in reference product. Workspace captures reset scroll position to keep sticky navigation at the top.

## Findings

"Implemented" means the code and relevant local/CI checks pass; the reference-account and live-service limits above still apply.

| # | Status | Result |
|---|---|---|
| 1 | Implemented | Responsive hero with email, Get Started and country; carries both values to separate signup. Extra announcement strips removed. |
| 2 | Implemented | One shared header/footer with actual product, solutions, resources, contact, support, trust, terms, privacy and IP routes. Duplicate mobile markup and fake customer/social/store filler removed. |
| 3 | Fixed | Fake sales phone removed; support points to the real project channel. No invented sales number. |
| 4 | Implemented | Pricing uses shared full navigation/footer and project branding; comparison-only payments behavior retained. |
| 5 | Fixed | Auth footer links reach actual contact/legal/trust pages. |
| 6 | Implemented; live Firebase pending | Separate email/country signup then password; previous signup query redirects. Uses the existing Firebase provider. |
| 7 | Implemented; live inbox pending | Dedicated inbox confirmation, enumeration-safe unknown-account response, network failures remain errors. |
| 8 | Implemented; live Firebase pending | Generic wrong-credentials feedback; short wrong passwords reach the provider; changing email clears password. Live re-login and Google sign-in still need a configured throwaway account. |
| 9 | Implemented | Owner-scoped folders create/rename/delete; move agreements; title/recipient search; status/date/folder filters; empty results; edit/view/rename/download/Void/Delete actions. Deleting a folder preserves its agreements. |
| 10 | Fixed | `/app/envelopes` is a real Agreements page. |
| 11 | Implemented | Real Templates, Reports, Contacts and Settings routes. Reports show actual events/counts; profile/contacts/sending defaults persist per account. Templates upload PDFs, save placeholder roles/fields, list/search/edit/delete, and instantiate independent drafts with fresh tokens. |
| 12 | Implemented | PDF uploads and original samples retained, file validation tightened, self-sign upload mode added. |
| 13 | Implemented | Signer/CC/Needs to view roles, recipient ordering, saved contacts, field palette, drag/resize, required fields, subject/message and awaited serialized autosaves. |
| 14 | Implemented; live provider pending | Resend requests and completion PDF copies; durable idempotent retries; clear unavailable/failed delivery text and private-link fallback. Manual reminders after the chosen interval; expiry enforced on signing/PDF access. |
| 15 | Implemented | Versioned server-recorded consent before PDF access, Start/Next guidance, Type/Draw, required text/checkbox/initials/date, saved progress/Resume, decline, completion PDF and complete paginated certificate/audit trail. Sequential and parallel submissions preserve every signature. |
| 16 | Fixed | Branded 404 with navigation, tombstone, Page not found help and working recovery links. HTTP status remains 404. |
| 17 | Fixed in tested routes | Icons/manifests exist; signed-out app entry redirects to login, even if guests are configured. Responsive navigation/editor/PDF layout. Public resource/page-error checks and desktop/mobile flows pass. The report did not identify the original missing resource; live deployment and reference-site console checks remain external verification. |
| 18 | Implemented | Avatar opens profile, settings, password-reset and sign-out actions. Guest/demo/unconfigured password behavior is explicit. |

## Delivery and reminders

Runtime configuration names: `RESEND_API_KEY`, `EMAIL_FROM` (verified sender), `APP_URL` (full HTTPS app base, including `/docusignisdead`). Configuration is intentionally not provisioned or changed. Guest/demo envelopes always use links. Requests go only to eligible recipients; later recipients are notified when routing advances. All recipients and the authenticated sender receive a completed PDF/certificate. Provider acceptance is not an inbox-delivery claim. Failed delivery can be retried; signatures stay committed.

Reminder basics are **manual**, using Send reminder after the configured interval; no automatic scheduler is claimed. Expiry blocks pending recipient actions and PDF access. Completed copies remain downloadable. Deleting agreements removes PDFs, tokens and saved signing progress. Folder/account and signing mutations use Firestore transactions; the local fallback serializes mutations within one process and uses atomic file replacement.

## Branding and assets

Visible UI, metadata, PDF certificates and email templates use **DocuSignIsDead**. Independence/simple-signature disclosures are retained. Reference URLs and technical filenames may identify the reference platform.

The supplied `Black Tombstone with Transparent X.png` was recolored through imagegen to purple `#4C00FF`, preserving the silhouette and transparent X/background. `public/brand/tombstone-purple.png` is the master; shared UI, favicon, Apple icon and install icons derive from it. Sharp was used only for resizing/format conversion. Final image-edit instruction: preserve the exact silhouette/X, use flat purple, remove background specks, keep transparent regions and crisp antialiased edges, add no text/shadow.

## Review branches

| Branch | Base | Area / findings |
|---|---|---|
| `fix/parity-marketing-auth` | `main` | #1–#8, shared branding and icons |
| `fix/parity-public-hygiene` | marketing/auth | #16–#17, duplicate mobile cleanup |
| `fix/parity-app-shell` | public hygiene | #10–#11, #18 |
| `fix/parity-agreements` | app shell | #9, ownership and mutation integrity |
| `fix/parity-templates` | agreements | #11–#13, reusable templates and save flushing |
| `fix/parity-send-flow` | templates | #12–#14, roles/delivery/reminders/expiry |
| `fix/parity-signing` | send flow | #15, signing integrity and browser acceptance suite |

All review branches are published: [Marketing/auth #3](https://github.com/tommy-muckstack/docusignisdead/pull/3), [Hygiene #4](https://github.com/tommy-muckstack/docusignisdead/pull/4), [App shell #5](https://github.com/tommy-muckstack/docusignisdead/pull/5), [Agreements #6](https://github.com/tommy-muckstack/docusignisdead/pull/6), [Templates #7](https://github.com/tommy-muckstack/docusignisdead/pull/7), [Send #8](https://github.com/tommy-muckstack/docusignisdead/pull/8), [Signing/verification #2](https://github.com/tommy-muckstack/docusignisdead/pull/2). The complete-stack acceptance suite is green. The PR links record their current merge status. External reference/account/inbox checks below remain unverified and are not represented as completed by a merge.

Pre-merge review checked authentication/ownership boundaries, draft persistence, routing, consent, cancellation, PDF finalization and email retries. It found an autosave/navigation race: following an in-app link could unmount the editor before its debounce fired. Draft navigation now flushes pending edits before leaving and stays in the editor on save failure. The browser suite adds desktop/mobile regression coverage for both failure and successful retry.

## Remaining external verification

- Signed-in reference trial walkthrough and original/reference screenshot pairs. Until available, exact app parity remains unverified.
- Live Firebase signup, correct/incorrect re-login, reset email receipt and Google sign-in on this project using a throwaway account.
- Actual transactional inbox delivery with an explicitly configured verified sender and throwaway recipients. The specified no-provider fallback is implemented and tested.
- Cloud Firestore transaction integration (local concurrency behavior is tested; credentials were not used).
- Live deployment and reference-site console checks. Isolated Chromium CI checks pass; no production credentials or deployment settings were changed.

## Sources and reproduction

- [Reference signing process](https://support.docusign.com/s/document-item?_LANG=en_US&bundleId=yca1573855023892&language=en_US&topicId=lou1573854977109.html): disclosure and guided signing concepts.
- [Reference recipient actions](https://support.docusign.com/s/document-item?_LANG=enus&bundleId=wtn1643071711000&language=ko&rsc_301=&topicId=cfi1718042055824.html): signer/copy/viewer roles.
- [Reference completion certificate](https://support.docusign.com/s/document-item?_LANG=dede&bundleId=oeq1643226594604&language=en_US&rsc_301=&topicId=gpa1578456339545.html): consent/activity records.
- [Resend sending API](https://resend.com/docs/api-reference/emails/send-email) and [idempotency](https://resend.com/docs/dashboard/emails/idempotency-keys).

Run `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`. Start an isolated test server with demo mode and test-only auth secret at port 3218, then `npm run test:browser`. Never enable demo mode to test real users/documents. The workflow records the exact test environment and exports screenshots/traces as `parity-browser-evidence`.
