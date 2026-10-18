import { describe, it, expect } from "vitest";
import { EVENTS, EVENT_PREFIXES, APP, superProps } from "@/lib/analytics/taxonomy";
describe("analytics taxonomy", () => {
  it("uses the shared prefixes and snake_case", () => { for (const e of Object.values(EVENTS)) { expect(e, e).toMatch(/^[a-z]+(_[a-z]+)+$/); expect(EVENT_PREFIXES.some(p => e.startsWith(p)), e).toBe(true); } });
  it("never puts the product name in an event name", () => { for (const e of Object.values(EVENTS)) expect(e.includes(APP.replace(/isdead$/, ""))).toBe(false); });
  it("sends the hub's super properties", () => { expect(superProps("app")).toEqual({ product: APP, surface: "app", platform: "web" }); });
});
import { redactUrl, redactProps } from "@/lib/analytics/redact";
describe("analytics redaction", () => {
  it("strips signing-link tokens from URL properties", () => {
    expect(redactUrl("https://yourappisdead.com/docusignisdead/sign/abc123?x=1")).toBe("https://yourappisdead.com/docusignisdead/sign/:token?x=1");
    const out = redactProps({ $current_url: "http://h/docusignisdead/sign/t0k", $pathname: "/docusignisdead/sign/t0k", $set: { $current_url: "http://h/docusignisdead/sign/t0k" }, fields: 2 });
    expect(JSON.stringify(out)).not.toContain("t0k"); expect(out.fields).toBe(2);
  });
});
