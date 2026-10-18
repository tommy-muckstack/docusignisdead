// Analytics taxonomy for the shared IsDead PostHog project 666931 (contract: yourappisdead/ANALYTICS.md, see docs/ANALYTICS.md).
// Super properties: product (this app's slug), surface ("landing" = logged-out marketing pages, "app" = the working product
// and anything it publishes), platform ("web"). Page views are PostHog's built-in $pageview.
// Events are `app_<object>_<action>` (or `landing_<object>_<action>` for marketing CTAs); the product name lives in
// `product`, never in an event name. Never send user content (titles, URLs, emails, text) as properties.
export const APP = "docusignisdead" as const;
export type Surface = "landing" | "app";
export const EVENTS = {
  app_signed_up: "app_signed_up",       // method ("password" | "google")
  app_signed_in: "app_signed_in",       // method ("password" | "google")
  app_signed_out: "app_signed_out",
  app_envelope_created: "app_envelope_created",   // kind ("upload" | "sample"), mode ("send" | "sign"), template (bool)
  app_envelope_sent: "app_envelope_sent",         // recipients (count), fields (count)
  app_envelope_voided: "app_envelope_voided",     // from ("list" | "editor")
  app_envelope_deleted: "app_envelope_deleted",
  app_reminder_sent: "app_reminder_sent",         // reminder (bool: false = resend failed delivery)
  app_shared: "app_shared",                       // method ("link") — copied a recipient's signing link
  app_template_used: "app_template_used",         // from ("list" | "editor")
  app_folder_created: "app_folder_created",
  app_signing_consented: "app_signing_consented", // public signer page: e-record disclosure accepted
  app_document_signed: "app_document_signed",     // role ("signer" | "viewer" | ...), signature ("typed" | "drawn" | "none"), fields (count)
  app_document_declined: "app_document_declined",
  landing_cta_clicked: "landing_cta_clicked", // target ("signup" | "app" | "pricing" | ...)
} as const;
export type EventName = (typeof EVENTS)[keyof typeof EVENTS];
export const EVENT_PREFIXES = ["app_", "landing_"] as const;
/** Super properties every event carries (yourappisdead/ANALYTICS.md §1). */
export const superProps = (surface: Surface) => ({ product: APP, surface, platform: "web" as const });
/** Super properties older IsDead taxonomies persisted in the shared yourappisdead.com cookie. Unregistered at boot. */
export const LEGACY_PROPS = ["app", "app_family", "base_path", "suite_id", "app_id", "schema_version", "source", "site_id", "environment", "ads_blocked", "account_type"] as const;
