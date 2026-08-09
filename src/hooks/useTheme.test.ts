import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useTheme } from "./useTheme.ts";

const STORAGE_KEY = "tintshot:theme";

/**
 * A `matchMedia` stand-in whose match state can be flipped mid-test, standing in
 * for the user changing their OS appearance while the app is open.
 */
function stubPrefersLight(matches: boolean) {
  const listeners = new Set<(event: MediaQueryListEvent) => void>();

  const query = {
    matches,
    media: "(prefers-color-scheme: light)",
    addEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => {
      listeners.add(listener);
    },
    removeEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => {
      listeners.delete(listener);
    },
  };

  window.matchMedia = (() => query) as unknown as typeof window.matchMedia;

  return {
    /** Simulate the OS switching appearance. */
    set(next: boolean) {
      query.matches = next;
      for (const listener of listeners) {
        listener({ matches: next } as MediaQueryListEvent);
      }
    },
    get listenerCount() {
      return listeners.size;
    },
  };
}

describe("useTheme", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
    document.documentElement.style.colorScheme = "";
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("follows the OS preference when nothing has been chosen", () => {
    stubPrefersLight(true);

    const { result } = renderHook(() => useTheme());

    expect(result.current.mode).toBe("system");
    expect(result.current.resolved).toBe("light");
    expect(document.documentElement.dataset.theme).toBe("light");
    expect(document.documentElement.style.colorScheme).toBe("light");
  });

  it("persists an explicit choice and restores it on remount", () => {
    stubPrefersLight(true);

    const { result, unmount } = renderHook(() => useTheme());
    act(() => result.current.setMode("dark"));

    expect(localStorage.getItem(STORAGE_KEY)).toBe("dark");
    expect(document.documentElement.dataset.theme).toBe("dark");

    unmount();
    const remounted = renderHook(() => useTheme());

    // The OS still prefers light; the stored choice has to win.
    expect(remounted.result.current.mode).toBe("dark");
    expect(remounted.result.current.resolved).toBe("dark");
  });

  it("clears the stored choice when handed back to the system", () => {
    stubPrefersLight(false);
    localStorage.setItem(STORAGE_KEY, "light");

    const { result } = renderHook(() => useTheme());
    expect(result.current.mode).toBe("light");

    act(() => result.current.setMode("system"));

    // Absent, not "system": that is how a user who never chose is recorded too.
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(result.current.resolved).toBe("dark");
  });

  it("tracks OS changes while in system mode", () => {
    const media = stubPrefersLight(false);

    const { result } = renderHook(() => useTheme());
    expect(result.current.resolved).toBe("dark");

    act(() => media.set(true));

    expect(result.current.resolved).toBe("light");
    expect(document.documentElement.dataset.theme).toBe("light");
  });

  it("ignores OS changes once a theme is pinned", () => {
    const media = stubPrefersLight(false);

    const { result } = renderHook(() => useTheme());
    act(() => result.current.setMode("dark"));

    act(() => media.set(true));

    expect(result.current.resolved).toBe("dark");
    expect(document.documentElement.dataset.theme).toBe("dark");
  });

  it("stops listening to the OS after unmount", () => {
    const media = stubPrefersLight(false);

    const { unmount } = renderHook(() => useTheme());
    expect(media.listenerCount).toBe(1);

    unmount();

    expect(media.listenerCount).toBe(0);
  });
});
