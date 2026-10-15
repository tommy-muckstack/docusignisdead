import { describe, expect, it, vi } from "vitest";
const { reset } = vi.hoisted(() => ({ reset: vi.fn() }));
vi.mock("firebase/app", () => ({ getApps: () => [{ name: "isdead" }], initializeApp: vi.fn() }));
vi.mock("firebase/auth", () => ({ getAuth: () => ({}), inMemoryPersistence: {}, setPersistence: vi.fn(), sendPasswordResetEmail: reset }));
import { authErrorMessage, resetPassword } from "../../lib/isdead-auth/client";
const config = { apiKey: "test", appId: "test", projectId: "test", authDomain: "test.invalid" };
describe("account recovery privacy", () => {
  it("does not reveal an unknown email during reset", async () => { reset.mockRejectedValueOnce({ code: "auth/user-not-found" }); await expect(resetPassword(config, "qa@example.com")).resolves.toBeUndefined(); });
  it("does not show success on a network failure", async () => { reset.mockRejectedValueOnce({ code: "auth/network-request-failed" }); await expect(resetPassword(config, "qa@example.com")).rejects.toEqual({ code: "auth/network-request-failed" }); });
  it("uses the same login error for unknown users and wrong passwords", () => { expect(authErrorMessage({ code: "auth/user-not-found" })).toBe(authErrorMessage({ code: "auth/wrong-password" })); });
});
