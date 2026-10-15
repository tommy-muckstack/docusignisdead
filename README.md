# DocuSignIsDead

Free, open-source DocuSign alternative. Part of the [IsDead series](https://yourappisdead.com). Served at `https://yourappisdead.com/docusignisdead`.

**Status: local only** (not pushed, not deployed). Surfaces follow `templates/marketing-site.md` in `@isdead/design`: one marketing page (`/`, price comparison at `#pricing`), `/login`, and the app at `/app`.

## What works
- **Prepare:** upload a PDF (≤4 MB, ≤60 pages, validated server-side) or start from a sample (NDA, services agreement, offer letter, generated with pdf-lib). Pages render in the browser with pdf.js. Add up to 10 recipients, place signature / initials / date / text / checkbox fields per recipient (click to drop, drag, resize, required toggle, reassign), autosave, optional sequential signing order and a message.
- **Send:** validates (names, emails, a signature field per signer). Each signer gets a private token link (copy from the status panel). Sent documents are locked.
- **Sign:** no account needed. Type or draw a signature once and it fills all signature/initials fields; the date is stamped by the server. Required fields gate the Finish button; the server re-validates only that signer's fields. Signing out of order is blocked (409).
- **Complete:** when the last signer finishes, signatures are flattened into the PDF with pdf-lib and a certificate-of-completion page (signers, timestamps, activity log) is appended. Owner and signers can download it.
- **Track:** per-signer status, activity log (viewed, signed, voided), void with reason (signer links then show 'voided').
- **Dashboard** with status filters, delete. Unit tests (16 for sanitising, routing, validation, PDF flatten) plus a Playwright end-to-end smoke test in `npm run shots`.

## Known gaps
- **No email delivery:** the owner shares signing links by hand. Next step is a mail provider plus reminders.
- **Storage:** JSON files under `.data/` (`lib/store.ts`); on Vercel this must move to Firestore + Cloud Storage before it is deployed. Signing links are bearer tokens with no expiry.
- **Legal:** simple electronic signatures with an audit page; not an advanced/qualified signature, no ID verification, no tamper-evident digital certificate.
- No templates library, bulk send, in-person signing, decline reason, or reordering recipients after adding.

## Auth
Shared Firebase project `yourappisdead` (email/password + Google), helpers in `lib/isdead-auth` (vendored from `isdead-design/auth`). The session cookie `isdead_session` has path `/`, so one sign-in covers every IsDead app. Env: `NEXT_PUBLIC_FIREBASE_*`, `FIREBASE_SERVICE_ACCOUNT_JSON`. Without them, `/login` shows "Sign-in not configured". The single demo account ("Use the demo account") is available outside production or with `DEMO_MODE=1`.

## Develop
```
npm install
npm run dev        # http://localhost:3000/docusignisdead
npm test           # unit tests
npm run typecheck
npm run build && npm run shots   # product screenshots + end-to-end smoke test (Playwright)
```
Theme and font: `vendor/isdead-design` (OFL fonts, see `fonts/*/OFL-*.txt`). Not affiliated with DocuSign; all trademarks belong to their owners. Apache-2.0.
