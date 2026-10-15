# DocuSignIsDead

Free, open-source DocuSign alternative. Part of the [IsDead series](https://yourappisdead.com). Served at `https://yourappisdead.com/docusignisdead`.

**Parity work in progress.** The public deployment is at the URL above. Local review branches are not merged or deployed. See [the parity report](docs/PARITY_REPORT.md) for implementation status, verification evidence, blockers and outstanding work. Public routes include `/`, `/pricing`, `/compare`, `/login`, `/free-trial` and product/help/legal pages; the signing app is at `/app`.

## What works
- **Prepare:** upload a PDF (≤4 MB, ≤60 pages, validated server-side) or start from a sample (NDA, services agreement, offer letter, generated with pdf-lib). Pages render in the browser with pdf.js. Add up to 10 recipients, place signature / initials / date / text / checkbox fields per recipient (click to drop, drag, resize, required toggle, reassign), autosave, optional sequential signing order and a message.
- **Send:** validates (names, emails, a signature field per signer). Each signer gets a private token link (copy from the status panel). Sent documents are locked.
- **Sign:** no account needed. Type or draw a signature once and it fills all signature/initials fields; the date is stamped by the server. Required fields gate the Finish button; the server re-validates only that signer's fields. Signing out of order is blocked (409).
- **Complete:** when the last signer finishes, signatures are flattened into the PDF with pdf-lib and a certificate-of-completion page (signers, timestamps, activity log) is appended. Owner and signers can download it.
- **Track:** per-signer status, activity log (viewed, signed, voided), void with reason (signer links then show 'voided').
- **Dashboard** with status filters, delete. Unit tests (16 for sanitising, routing, validation, PDF flatten) plus a Playwright end-to-end smoke test in `npm run shots`.

## Known gaps
- **No email delivery:** the owner shares signing links by hand. Next step is a mail provider plus reminders.
- **Storage:** Firestore when `FIREBASE_SERVICE_ACCOUNT_JSON` is configured; JSON files under `.data/` for local development. Serverless files are ephemeral. Signing links are bearer tokens with no expiry.
- **Legal:** simple electronic signatures with an audit page; not an advanced/qualified signature, no ID verification, no tamper-evident digital certificate.
- No templates library, bulk send, in-person signing, decline reason, or reordering recipients after adding.

## Auth
Shared Firebase project `yourappisdead` (email/password + Google), helpers in `lib/isdead-auth` (vendored from `isdead-design/auth`). The session cookie `isdead_session` has path `/`, so one sign-in covers every IsDead app. Env: `NEXT_PUBLIC_FIREBASE_*`, `FIREBASE_SERVICE_ACCOUNT_JSON`. Without them, `/login` shows "Sign-in not configured". Signed-out visits to `/app` go to login. Guest sessions are available only through the explicit guest endpoint. The single demo account ("Use the demo account") is available outside production or with `DEMO_MODE=1`.

## Develop
```
npm install
npm run dev        # http://localhost:3000/docusignisdead
npm test           # unit tests
npm run lint
npm run typecheck
npm run build
npm run start -- --hostname 127.0.0.1 --port 3218
# In another terminal:
npm run test:browser  # desktop + 390px marketing/auth checks; screenshots in test-results
```
Theme and font: `vendor/isdead-design` (OFL fonts, see `fonts/*/OFL-*.txt`). Not affiliated with DocuSign; all trademarks belong to their owners. Apache-2.0.

## Environment setup

Use Node 24.12 or later (required by the installed Firebase SDK). No environment file is committed. Put local values in an ignored `.env.local`; do not commit it. The following names are supported:

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_BASE_PATH` | URL prefix; defaults to `/docusignisdead`. |
| `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase browser configuration. |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`, `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Optional Firebase browser settings. |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Private server credential for Firebase authentication and Firestore. |
| `AUTH_SECRET` | Private signing key required for guest sessions in production; also used for demo cookies. |
| `DEMO_MODE` | Set to `1` only for an isolated demo/testing deployment. |
| `GUESTS` | Set to `0` to disable guest entry. |
| `ISDEAD_COOKIE_DOMAIN` | Optional shared cookie domain. |
| `ISDEAD_DATA_DIR` | Local test data directory; defaults to `.data`. |

`NODE_OPTIONS=--unhandled-rejections=warn npm run dev` follows the supplied QA setup. On systems with file-watcher limits, `WATCHPACK_POLLING=true` can be added. Do not run development and production builds simultaneously in the same checkout. Use separate test accounts and synthetic PDFs; do not send real envelopes during QA.

The existing `npm run shots` script exercises the legacy signing flow and writes to its original screenshot destination. Its browser run remains pending; see the report before treating it as acceptance evidence.
