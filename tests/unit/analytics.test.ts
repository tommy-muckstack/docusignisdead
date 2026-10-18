import { describe, it, expect } from "vitest";
import { EVENTS, EVENT_PREFIXES, APP, superProps } from "@/lib/analytics/taxonomy";
describe("analytics taxonomy", () => {
  it("uses the shared prefixes and snake_case", () => { for (const e of Object.values(EVENTS)) { expect(e, e).toMatch(/^[a-z]+(_[a-z]+)+$/); expect(EVENT_PREFIXES.some(p => e.startsWith(p)), e).toBe(true); } });
  it("never puts the product name in an event name", () => { for (const e of Object.values(EVENTS)) expect(e.includes(APP.replace(/isdead$/, ""))).toBe(false); });
  it("sends the hub's super properties", () => { expect(superProps("app")).toEqual({ product: APP, surface: "app", platform: "web" }); });
});
import { scrub } from "@/lib/analytics/posthog";
describe("analytics privacy", () => {
  it("cleans every url/referrer/pathname key, including nested $set / $set_once", () => {
    const e = scrub({ event: "$pageview", properties: { $session_entry_url: "https://yourappisdead.com/x/?ref=secret#h", $set_once: { $initial_current_url: "https://yourappisdead.com/x/?url=https://secret.example", $initial_referrer: "$direct" } }, $set: { $current_url: "https://yourappisdead.com/x/app?q=1" } });
    expect(e.properties.$session_entry_url).toBe("https://yourappisdead.com/x/"); expect(e.properties.$set_once.$initial_current_url).toBe("https://yourappisdead.com/x/"); expect(e.properties.$set_once.$initial_referrer).toBe("$direct"); expect(e.$set.$current_url).toBe("https://yourappisdead.com/x/app");
  });
  it("strips query strings, hashes and titles", () => {
    const e = scrub({ event: "$pageview", properties: { $current_url: "https://yourappisdead.com/x/app?url=https://secret.example#frag", $referrer: "https://google.com/search?q=me", title: "My private doc" } });
    expect(e.properties.$current_url).toBe("https://yourappisdead.com/x/app"); expect(e.properties.$referrer).toBe("https://google.com/search"); expect("title" in e.properties).toBe(false);
  });
  it("masks signing-link tokens in every URL property", () => {
    const e = scrub({ event: "$pageview", properties: { $current_url: "http://h/docusignisdead/sign/t0k?x=1", $pathname: "/docusignisdead/sign/t0k", $session_entry_url: "http://h/docusignisdead/sign/t0k", fields: 2 }, $set: { $current_url: "http://h/docusignisdead/sign/t0k" } });
    expect(JSON.stringify(e)).not.toContain("t0k"); expect(e.properties.$current_url).toBe("http://h/docusignisdead/sign/:id"); expect(e.properties.fields).toBe(2);
  });
});
