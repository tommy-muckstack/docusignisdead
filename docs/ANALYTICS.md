# Analytics (PostHog)

One PostHog project (US cloud, project **666931**) collects the hub and every IsDead sub-app. The contract is the hub's
`yourappisdead/ANALYTICS.md`; this file is how DocuSignIsDead follows it.

## Setup
- `NEXT_PUBLIC_POSTHOG_KEY` = the project's publishable token (safe in the browser); `NEXT_PUBLIC_POSTHOG_HOST=https://us.posthog.com`. Both are set on the Vercel project. No key → analytics is a no-op.
- Reverse proxy through the app's own origin: `/docusignisdead/ingest/*` → `us.i.posthog.com` (rewrites in `next.config.mjs`, with `skipTrailingSlashRedirect: true`).
- `<Analytics />` is mounted once in `app/layout.tsx`; it boots the client and sends PostHog's built-in `$pageview` per route change. Autocapture and session replay are off.
- posthog-js drops automated browsers. In dev, `localStorage.isdead_ph_debug = "1"` turns on verbose logs and lets Playwright capture; production keeps the bot filter.

## Super properties (every event)
| property | value | meaning |
| --- | --- | --- |
| `product` | `docusignisdead` | the one property to filter by |
| `surface` | `landing` \| `app` | `landing` = marketing pages, pricing, login/sign-up; `app` = the workspace `/app/*` and the public signing page `/sign/<token>` |
| `platform` | `web` | |
| `env` | `production` \| `development` | |
| `account_type` | `firebase` \| `guest` \| `demo` | registered once the workspace loads |

Signing links are bearer credentials: the client's `scrub` (`before_send` in `lib/analytics/posthog.tsx`) masks `/sign/<token>` to `/sign/:id` in every URL property (`$current_url`, `$pathname`, `$referrer`, `$session_entry_url`, …) via `PRIVATE_PATHS`, so tokens never reach PostHog.

All IsDead apps share the yourappisdead.com cookie, so the client unregisters other apps' legacy super properties at boot and re-registers ours after `reset()`.

## Privacy (scrub)
`scrub` in `lib/analytics/posthog.tsx` runs as `before_send` on every event, automatic ones included:
- URL properties (`$current_url`, `$referrer`, `$pathname`, initial/prev variants) keep only origin + path; query strings and hashes are dropped (they can carry user content such as prefilled links).
- The page `title` is dropped (it can be a user's own document or page name).
- `PRIVATE_PATHS` masks `/sign/<token>` as `/sign/:id` (signing links are bearer credentials).
- Heatmaps, web-vitals/performance capture, autocapture and session replay are all off in `init`.
Property names `source`, `app`, `app_id`, `site_id` and `environment` are reserved (legacy shared super properties); use `via` / `origin` instead.

## Identity
Signed-in users are identified by Firebase uid (`account_type: "firebase"`) from `components/AppShell.tsx`. Guests and the demo account are never identified. Sign-out sends `app_signed_out`, then `reset()`. Recipients on the public signing page are anonymous.

## Events
| event | properties | where |
| --- | --- | --- |
| `app_signed_up` | `method` (`password`) | `components/useAuth.ts` |
| `app_signed_in` | `method` (`password` \| `google`) | `components/useAuth.ts` |
| `app_signed_out` | | `components/AppShell.tsx` |
| `app_envelope_created` | `kind` (`upload` \| `sample`), `mode` (`send` \| `sign`), `template` (bool) | `Dashboard.tsx`, `Templates.tsx` (new template) |
| `app_envelope_sent` | `recipients`, `fields` (counts) | `Editor.tsx` |
| `app_envelope_voided` | `from` (`list` \| `editor`) | `Dashboard.tsx`, `Editor.tsx` |
| `app_envelope_deleted` | | `Dashboard.tsx` |
| `app_reminder_sent` | `reminder` (bool; false = resend after a failed delivery) | `Editor.tsx` |
| `app_shared` | `method` (`link`): copied a recipient's signing link | `Editor.tsx` |
| `app_template_used` | `from` (`list` \| `editor`) | `Templates.tsx`, `Editor.tsx` |
| `app_folder_created` | | `Dashboard.tsx` |
| `app_signing_consented` | | `SignFlow.tsx` (public signer) |
| `app_document_signed` | `role`, `signature` (`typed` \| `drawn` \| `none`), `fields` (count) | `SignFlow.tsx` (public signer) |
| `app_document_declined` | | `SignFlow.tsx` (public signer) |

`landing_cta_clicked` (`target`) is reserved in the taxonomy; the marketing pages are server components and are measured by `$pageview` for now.

Rules: properties are snake_case kinds, counts, ids and booleans; never titles, names, emails, field values, file names or signing tokens. Event names are defined only in `lib/analytics/taxonomy.ts`; `tests/unit/analytics.test.ts` rejects names outside `app_` / `landing_` or containing the product name.
