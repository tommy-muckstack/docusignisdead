# DocuSignIsDead parity report

Updated 2026-10-15. Source baseline: `a02d30e` (local `main`). GitHub connector verified remote main is still `a02d30e`; command-line DNS remains unavailable.

## Evidence and limits

- The supplied QA report is the starting point. Its app findings (#9–#18) remain hypotheses until a real signed-in trial walkthrough is available, as the prompt explicitly requires before app implementation.
- Public reference pages inspected: [homepage](https://www.docusign.com/) and [trial signup](https://www.docusign.com/free-trial). The trial page confirms email and country before Get Started. The homepage is dynamic and the extracted current version differs from the supplied QA capture; no claim of exact pixel parity is made.
- A throwaway trial inbox and an inspectable browser session were requested. No account credentials or personal documents have been used. No emails or envelopes have been sent.
- Chromium cannot launch: macOS `bootstrap_check_in … MachPortRendezvousServer … (141)`. Firefox exits with SIGABRT. These failures persist after permission escalation. The automated browser tests fail before any page interaction. Desktop/mobile screenshots have **not** been captured, and browser verification has **not** passed.
- Local production HTTP checks pass for landing, pricing, login, signup, all nine new information pages, comparison, favicon, PNG icon, Apple touch icon, web manifest and both app icon sizes. Rendered public-page text contains no standalone original product name.
- `npm run lint`, `npm run typecheck`, production build, and 20 unit tests passed during this work. Final checks must be repeated after further changes. Three new unit checks cover reset email enumeration and failure handling; they do not prove delivery or actual Firebase authentication.
- No environment files or secrets were read, changed or committed. Payment behavior remains unchanged.
- In accordance with the new prompt, signed-out `/app` entry now redirects to login even when guest support is configured. Existing guest sessions remain valid; creating a new guest requires explicitly visiting the guest endpoint. A regression test protects this behavior. Production HTTP inspection confirmed the login redirect.

## Finding status

“Implemented” below means code is present, not that the required real-browser acceptance has passed. Pending items are not treated as justified product exceptions.

| # | Status | Change / remaining evidence |
|---|---|---|
| 1 | Implemented; browser pending | One responsive landing page, inline email + Get Started, country picker, extra announcement strips removed. Email/country carry to signup. |
| 2 | Implemented; browser pending | Single shared header/footer; real original product, solutions, resources, support, contact, terms, privacy, IP and trust pages. Fake app-store/social links and unsupported customer/AI/statistical filler removed. Legacy comparison route uses shared chrome. |
| 3 | Implemented; browser pending | Sales numbers removed. This project has no verified sales phone line. Contact page states the real project support channel. |
| 4 | Implemented; browser pending | Pricing shares the full project navigation, real legal footer and original project brand. Pricing remains comparison-only with existing login CTAs and no payments. |
| 5 | Implemented; browser pending | Account footer links reach real contact/terms/privacy/IP/trust pages. |
| 6 | Implemented; Firebase/browser pending | Separate `/free-trial` email/country page, then password; old `/login?mode=signup` redirects. Uses DocuSignIsDead branding per later instruction. No live signup completed. |
| 7 | Implemented; live inbox/browser pending | Dedicated Check your inbox confirmation; unknown accounts use the same response, network errors remain errors. Actual reset delivery unverified. |
| 8 | Implemented; live auth/browser pending | Wrong-credential message remains generic; short wrong passwords reach authentication; Use a different email clears password. Unit validation passed; live re-login and Google popup unverified. |
| 9 | Pending real-app walkthrough | Folders, filter/search/row action work not started. |
| 10 | Pending real-app walkthrough | Source confirms Agreements route is absent. |
| 11 | Pending real-app walkthrough | Source confirms hash navigation and missing sections. |
| 12 | Existing implementation; pending browser | PDF upload and samples exist. No new UI claim. |
| 13 | Existing implementation; pending browser | Recipient fields, autosave, drag and resize exist. Full interaction checks pending. |
| 14 | Pending real-app walkthrough/provider | No delivery provider configured or changed; send remains link-based. |
| 15 | Pending real-app walkthrough | Source already appends a completion certificate (`lib/esign/finalize.ts`); actual PDF QA, disclosure, guidance, decline, routing tests remain. |
| 16 | Implemented; browser pending | Shared project nav/footer, tombstone branding, Page not found help block and working home/login/support recovery links. Production HTTP confirms status 404 and the help text. |
| 17 | Partially implemented; browser pending | Real icon/favicon routes now exist. This does not establish which resource caused the original 404. Signed-out entry requires login (unit regression + production HTTP check). Mobile layout and console acceptance pending. |
| 18 | Pending real-app walkthrough | Avatar menu/profile work not started. |

## Branding instruction (added during work)

Use **DocuSignIsDead** for visible branding, headings, metadata, comparison labels and legal footer text. Keep the independent-project and simple-signature disclaimer without standalone original product naming. Reference URLs and technical theme identifiers may still name the compared platform; they are not product branding.

The user supplied `Black Tombstone with Transparent X.png`. Built-in imagegen recolored the tombstone in purple `#4C00FF`, preserving the silhouette and transparent X/background. The selected project asset is `public/brand/tombstone-purple.png`; shared UI uses `public/brand/icon-192.png`; favicon, Apple touch icon and install icons derive from the same asset. Sharp was used only for resizing/format conversion.

Final image-edit prompt: “Precise cleanup of this website icon. Keep exactly the tombstone silhouette, round top, base, and X hole shape and placement. Make the tombstone one flat solid purple #4C00FF with no gradients, no noise or texture. Completely remove every stray purple speck in the transparent background and inside the X-shaped hole: both must be perfectly empty transparent regions. Use crisp antialiased edges only around the silhouette. No glow, no shadow, no text, no additions. This is a clean UI/favicon asset.”

## Review branches and PRs

- `fix/parity-marketing-auth`: findings #1–#8, shared branding/icons, and reproducible lint/browser-check setup. PR not open: GitHub access is unavailable, and required screenshot/browser evidence is pending. Nothing merged or deployed.
- `fix/parity-public-hygiene` (stacked on marketing/auth): public branded 404 (#16), explicit login entry (#17), removal of obsolete duplicate mobile files (#2), accurate setup documentation and bounded build tracing. PR not open for the same access/evidence blockers.
- Remaining logical areas will be separate branches/PRs after reference access. No empty PRs or unsupported claims of completion.

## Browser acceptance procedure

Run `npm run build`, then `npm run start -- --hostname 127.0.0.1 --port 3218` in a separate terminal. Run `npm run test:browser`. Desktop is 1440×900; mobile is 390×844. Set `PARITY_BASE_URL` to test an isolated deployed preview. Tests capture screenshots in `test-results` and check actual click/fill/select interactions, duplicate navigation, branding, links, icon responses and viewport overflow.

Capture equivalent baseline shots from `a02d30e` in an isolated checkout before attaching before/after pairs to the PR. Never call HTTP response inspection a real-browser check. Live Firebase signup/reset/Google login, transactional delivery, real signed-in trial comparison, and the full signing matrix still require separate completion evidence.

## App shell implementation

Findings #10, #11 (Templates follows in its own PR), #18: Agreements, Reports, Contacts, Profile, and Account Settings now have real routes. Reports use actual account events and counts. Contacts and profile/default settings persist per account. The avatar opens profile/settings/password/sign-out actions; password reset uses the existing Firebase provider with an explicit unavailable state for guest/demo/unconfigured accounts. The app navigation remains available at 390px. No payment or credential configuration changed.

Validation: lint, typecheck, 20 unit tests and production build passed. Browser interactions/screenshots remain pending because of the host browser launch failure. The functional specification is implemented from the supplied requests; signed-in reference parity has not been established.

## Agreements implementation

Finding #9: owner-scoped folders now support create/rename/delete and moving agreements; deleting a folder keeps its documents. Search matches titles and recipient names/emails, with status/date/folder filters and explicit empty results. Row actions include edit/view, PDF download, rename drafts, Void, and Delete with confirmation. Deletion removes recipient token indices and saved values too. Atomic file replacement, serialized local mutations, and Firestore transactions protect concurrent edits. The local server is a single-process development store; production uses Firestore transactions.

Validation: 23 tests passed, including concurrent mutations, folder ownership and delete semantics, plus lint/typecheck/build. Exact reference columns/empty states and real-browser screenshots remain unverified.
