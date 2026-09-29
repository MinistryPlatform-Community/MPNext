import { describe, it, expect, vi, afterEach } from "vitest";
import {
  SIGN_OUT_CHANNEL,
  broadcastSignOut,
  subscribeToSignOut,
} from "./sign-out-broadcast";

/**
 * Cross-tab sign-out signal. A tiny in-memory BroadcastChannel stands in for
 * the browser's, delivering to every OTHER open channel of the same name, as
 * the real one does.
 */
class FakeChannel {
  static open = new Set<FakeChannel>();
  onmessage: ((event: MessageEvent) => void) | null = null;
  closed = false;
  constructor(public name: string) {
    FakeChannel.open.add(this);
  }
  postMessage(data: unknown) {
    for (const other of FakeChannel.open) {
      if (other !== this && other.name === this.name && !other.closed) {
        other.onmessage?.({ data } as MessageEvent);
      }
    }
  }
  close() {
    this.closed = true;
    FakeChannel.open.delete(this);
  }
}

describe("sign-out broadcast", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    FakeChannel.open.clear();
  });

  it("delivers a sign-out to a subscriber in another tab", () => {
    vi.stubGlobal("BroadcastChannel", FakeChannel);
    const onSignOut = vi.fn();
    const unsubscribe = subscribeToSignOut(onSignOut);

    broadcastSignOut();

    expect(onSignOut).toHaveBeenCalledTimes(1);
    unsubscribe();
  });

  it("uses a dedicated channel name and closes the sender afterwards", () => {
    vi.stubGlobal("BroadcastChannel", FakeChannel);
    const unsubscribe = subscribeToSignOut(() => {});
    const [listener] = FakeChannel.open;

    broadcastSignOut();

    expect(listener.name).toBe(SIGN_OUT_CHANNEL);
    // Only the subscriber's channel is still open.
    expect(FakeChannel.open.size).toBe(1);
    unsubscribe();
    expect(FakeChannel.open.size).toBe(0);
  });

  it("ignores unrelated messages on the channel", () => {
    vi.stubGlobal("BroadcastChannel", FakeChannel);
    const onSignOut = vi.fn();
    const unsubscribe = subscribeToSignOut(onSignOut);

    new FakeChannel(SIGN_OUT_CHANNEL).postMessage({ event: "something-else" });

    expect(onSignOut).not.toHaveBeenCalled();
    unsubscribe();
  });

  it("stops delivering after unsubscribe", () => {
    vi.stubGlobal("BroadcastChannel", FakeChannel);
    const onSignOut = vi.fn();
    subscribeToSignOut(onSignOut)();

    broadcastSignOut();

    expect(onSignOut).not.toHaveBeenCalled();
  });

  it("is a no-op without BroadcastChannel", () => {
    vi.stubGlobal("BroadcastChannel", undefined);

    expect(() => broadcastSignOut()).not.toThrow();
    const unsubscribe = subscribeToSignOut(() => {});
    expect(() => unsubscribe()).not.toThrow();
  });

  it("is a no-op when the channel cannot be opened", () => {
    vi.stubGlobal(
      "BroadcastChannel",
      class {
        constructor() {
          throw new DOMException("denied", "SecurityError");
        }
      }
    );

    expect(() => broadcastSignOut()).not.toThrow();
    expect(() => subscribeToSignOut(() => {})()).not.toThrow();
  });

  it("never fails a sign-out because posting failed, and still closes", () => {
    const close = vi.fn();
    vi.stubGlobal(
      "BroadcastChannel",
      class {
        postMessage() {
          throw new DOMException("closed", "InvalidStateError");
        }
        close = close;
      }
    );

    expect(() => broadcastSignOut()).not.toThrow();
    expect(close).toHaveBeenCalledTimes(1);
  });
});
