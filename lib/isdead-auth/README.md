# isdead-auth

Shared sign-in for every IsDead app on yourappisdead.com: Firebase Authentication (email/password + Google).

- `config.ts`: env → Firebase web config; cookie name/options (`isdead_session`, path `/`).
- `server.ts`: firebase-admin; `createSessionFromIdToken`, `verifySessionCookie`, demo cookie signing.
- `client.ts`: browser helpers (sign up, sign in, reset password, Google popup) that POST the ID token to the app's session endpoint.

Each app exposes `POST <basePath>/api/session` that calls `createSessionFromIdToken`, maps the Firebase uid to its own users table, and sets the cookie. Because the cookie has path `/` on yourappisdead.com, one sign-in covers every app; each app verifies the same cookie with the same Firebase project.

Env: `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_FIREBASE_APP_ID`, `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`, `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`, `FIREBASE_SERVICE_ACCOUNT_JSON` (and optional `ISDEAD_COOKIE_DOMAIN`). Without them, `firebaseConfigured()` is false and apps show "Sign-in not configured".

## Guest sessions (no sign-up)

Signed-out app visits redirect to login. An explicitly requested guest session can be created through `GET <basePath>/api/session/guest?next=<path>` when guest support is configured. Guest cookies are HMAC-signed with `AUTH_SECRET`. Set `GUESTS=0` to disable new guest entry. Guest/demo envelopes use private links, never transactional email. Signing in clears the guest cookie; the shared helper migrates per-user settings documents only. Agreement ownership migration is not implemented by that shared helper.
