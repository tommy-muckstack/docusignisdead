// Signing links (/sign/<token>) are bearer credentials: never let the token reach PostHog in a URL property.
const URL_PROPS = ["$current_url", "$pathname", "$referrer", "$initial_current_url", "$initial_pathname", "$prev_pageview_pathname", "$session_entry_url", "$session_entry_pathname"] as const;
export const redactUrl = (url: string) => url.replace(/\/sign\/[^/?#]+/g, "/sign/:token");
export function redactProps<T extends Record<string, unknown>>(props: T): T {
  const out: Record<string, unknown> = { ...props };
  for (const k of URL_PROPS) if (typeof out[k] === "string") out[k] = redactUrl(out[k] as string);
  for (const k of Object.keys(out)) if (k.startsWith("$set") && out[k] && typeof out[k] === "object") out[k] = redactProps(out[k] as Record<string, unknown>);
  return out as T;
}
