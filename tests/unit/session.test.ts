import { afterEach, expect, it, vi } from "vitest";
import { entryRedirect } from "../../lib/session";
afterEach(() => vi.unstubAllEnvs());
it("signed-out app entry requires login even when explicit guest sessions are enabled", () => {
  vi.stubEnv("GUESTS", "1");
  vi.stubEnv("AUTH_SECRET", "test-only-key");
  expect(entryRedirect("/app/templates")).toBe("/login?callbackUrl=%2Fapp%2Ftemplates");
});
