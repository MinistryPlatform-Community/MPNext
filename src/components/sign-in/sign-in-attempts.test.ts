import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  ATTEMPT_WINDOW_MS,
  MAX_AUTOMATIC_SIGN_IN_ATTEMPTS,
  clearSignInAttempts,
  recordAutomaticSignInAttempt,
} from "./sign-in-attempts";

/**
 * The per-tab cap on `/signin`'s automatic navigations. The rendered
 * behaviour is in sign-in.test.tsx; these pin the counter itself — the
 * window, the reset, and that unusable storage never blocks sign-in.
 */
const KEY = "mpnext.signin.autoAttempts";
const T0 = 1_800_000_000_000;

describe("sign-in attempt counter", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it(`allows ${MAX_AUTOMATIC_SIGN_IN_ATTEMPTS} attempts, then refuses`, () => {
    for (let i = 0; i < MAX_AUTOMATIC_SIGN_IN_ATTEMPTS; i++) {
      expect(recordAutomaticSignInAttempt(T0 + i)).toBe(true);
    }
    expect(recordAutomaticSignInAttempt(T0 + 10)).toBe(false);
    // A refusal records nothing.
    expect(JSON.parse(window.sessionStorage.getItem(KEY)!)).toHaveLength(
      MAX_AUTOMATIC_SIGN_IN_ATTEMPTS
    );
  });

  it("forgets attempts older than the window", () => {
    for (let i = 0; i < MAX_AUTOMATIC_SIGN_IN_ATTEMPTS; i++) {
      recordAutomaticSignInAttempt(T0);
    }

    expect(recordAutomaticSignInAttempt(T0 + ATTEMPT_WINDOW_MS)).toBe(true);
  });

  it("ignores timestamps from the future (a skewed or tampered entry)", () => {
    window.sessionStorage.setItem(KEY, JSON.stringify([T0 + 60_000, T0 + 60_000]));

    expect(recordAutomaticSignInAttempt(T0)).toBe(true);
  });

  it("uses the current time by default", () => {
    vi.spyOn(Date, "now").mockReturnValue(T0);

    recordAutomaticSignInAttempt();

    expect(JSON.parse(window.sessionStorage.getItem(KEY)!)).toEqual([T0]);
  });

  it("clears the count", () => {
    for (let i = 0; i < MAX_AUTOMATIC_SIGN_IN_ATTEMPTS; i++) {
      recordAutomaticSignInAttempt(T0);
    }

    clearSignInAttempts();

    expect(window.sessionStorage.getItem(KEY)).toBeNull();
    expect(recordAutomaticSignInAttempt(T0)).toBe(true);
  });

  it.each([
    ["malformed JSON", "{not json"],
    ["a non-array", JSON.stringify({ count: 99 })],
    ["non-numeric entries", JSON.stringify(["a", null, {}])],
  ])("treats %s as no attempts", (_label, stored) => {
    window.sessionStorage.setItem(KEY, stored);

    expect(recordAutomaticSignInAttempt(T0)).toBe(true);
  });

  it("never blocks sign-in when storage throws", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("denied", "SecurityError");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("denied", "SecurityError");
    });
    vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
      throw new DOMException("denied", "SecurityError");
    });

    for (let i = 0; i < MAX_AUTOMATIC_SIGN_IN_ATTEMPTS + 2; i++) {
      expect(recordAutomaticSignInAttempt(T0)).toBe(true);
    }
    expect(() => clearSignInAttempts()).not.toThrow();
  });
});
