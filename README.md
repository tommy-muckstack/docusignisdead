# DocuSignIsDead

Free, open-source PDF agreements and electronic signatures. Part of the [IsDead series](https://yourappisdead.com). Served at `https://yourappisdead.com/docusignisdead`.

**Parity work in progress.** The public deployment is at the URL above. Local review branches are not merged or deployed. See [the parity report](docs/PARITY_REPORT.md) for implementation status, verification evidence, blockers and outstanding work. Public routes include `/`, `/pricing`, `/compare`, `/login`, `/free-trial` and product/help/legal pages; the signing app is at `/app`.

## Features

- Upload PDFs (4 MB / 60 pages), use original samples, or reuse templates with placeholder roles and fields.
- Add up to 10 recipients with Signer, CC or Needs to view actions. Reorder recipients, choose sequential routing, set subject/message, expiry and a manual reminder interval.
- Place, drag and resize signature, initials, date, text and checkbox fields. Autosaves serialize; sending awaits the latest save.
- Send requests and completed PDF copies through a configured Resend account, or share private recipient links when email is unavailable. Provider failures remain visible and retryable.
- Record disclosure consent, guide recipients through required fields, adopt Type/Draw signatures, save progress to finish later, or decline. Ordered recipients cannot access the document before their turn.
- Complete a flattened PDF with a paginated certificate containing consent, recipients, timestamps, the original document hash and the full activity history.
- Organize agreements into folders; search/filter/status views; move, rename drafts, download, Void and Delete. Contacts, profile and sending defaults persist per account; Reports uses actual agreement events.

## Limits and verification

- Simple electronic signatures with an audit certificate; no independent identity verification, advanced/qualified signature or cryptographic PDF signing is claimed.
- Firestore is the durable production store. Local JSON storage is a single-process development fallback; serverless local files are ephemeral.
- Reminders are manual, after the chosen interval. Bulk send and in-person signing are outside this change.
- Typed signatures use the PDF's standard font; unsupported characters require Draw. Uploaded PDFs preserve their original fonts.
- See [PARITY_REPORT.md](docs/PARITY_REPORT.md) for exact verification status, CI evidence and the outstanding live reference/auth/inbox checks.

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
npm run test:browser  # desktop + 390px full app checks; screenshots in test-results
```
Theme and font: `vendor/isdead-design` (OFL fonts, see `fonts/*/OFL-*.txt`). An independent project, unaffiliated with the reference platform; all trademarks belong to their owners. Apache-2.0.

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
| `RESEND_API_KEY` | Optional transactional email provider key. |
| `EMAIL_FROM` | Verified sender address for transactional email. |
| `APP_URL` | Full HTTPS app base, including `/docusignisdead`, for email links. |

`NODE_OPTIONS=--unhandled-rejections=warn npm run dev` follows the supplied QA setup. On systems with file-watcher limits, `WATCHPACK_POLLING=true` can be added. Do not run development and production builds simultaneously in the same checkout. Use separate test accounts and synthetic PDFs; do not send real envelopes during QA.

`npm run shots` runs the same current browser acceptance suite against the running test server. Use `PARITY_BASE_URL` to select an isolated preview. The GitHub workflow provisions fresh Chromium, runs the suite and captures baseline/after screenshots without production credentials. For local full-app tests, start an isolated server with `DEMO_MODE=1`, `GUESTS=0`, a test-only `AUTH_SECRET` and a temporary `ISDEAD_DATA_DIR`.
