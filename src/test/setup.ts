// Test environment shims. jsdom implements the DOM but none of the graphics or
// clipboard APIs Tintshot depends on, so we stub just enough for the render and
// export paths to run without throwing.

import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

afterEach(cleanup);

/**
 * A 2D context that accepts every drawing call and records nothing. Property
 * writes (fillStyle, font, …) are stored so reads round-trip, and unknown
 * methods return undefined rather than crashing.
 */
function createStubContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const known: Record<string, unknown> = {
    canvas,
    createLinearGradient: () => ({ addColorStop() {} }),
    getImageData: (_x: number, _y: number, width: number, height: number) => ({
      data: new Uint8ClampedArray(width * height * 4),
      width,
      height,
      colorSpace: "srgb",
    }),
    measureText: (text: string) => ({ width: text.length * 6 }),
  };

  return new Proxy(known, {
    get(target, property) {
      if (property in target) return target[property as string];
      return () => undefined;
    },
    set(target, property, value) {
      target[property as string] = value;
      return true;
    },
  }) as unknown as CanvasRenderingContext2D;
}

const contexts = new WeakMap<HTMLCanvasElement, CanvasRenderingContext2D>();

HTMLCanvasElement.prototype.getContext = function getContext(this: HTMLCanvasElement) {
  let context = contexts.get(this);
  if (!context) {
    context = createStubContext(this);
    contexts.set(this, context);
  }
  return context;
} as unknown as HTMLCanvasElement["getContext"];

HTMLCanvasElement.prototype.toBlob = function toBlob(callback: BlobCallback, type?: string) {
  callback(new Blob(["png"], { type: type ?? "image/png" }));
};

// jsdom has no media query engine at all, so `matchMedia` is simply absent.
// The theme hook reads `prefers-color-scheme` on mount; without this every test
// that renders <App /> would throw. Tests that care about the OS preference
// override this stub themselves.
if (typeof window.matchMedia !== "function") {
  Object.defineProperty(window, "matchMedia", {
    value: (query: string): MediaQueryList =>
      ({
        media: query,
        matches: false,
        onchange: null,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        addListener: () => undefined,
        removeListener: () => undefined,
        dispatchEvent: () => false,
      }) as unknown as MediaQueryList,
    writable: true,
    configurable: true,
  });
}

if (typeof URL.createObjectURL !== "function") {
  URL.createObjectURL = () => "blob:tintshot/test";
  URL.revokeObjectURL = () => undefined;
}

if (!("ClipboardItem" in globalThis)) {
  class StubClipboardItem {
    constructor(readonly items: Record<string, Blob>) {}
  }
  Object.defineProperty(globalThis, "ClipboardItem", {
    value: StubClipboardItem,
    writable: true,
    configurable: true,
  });
}

if (!navigator.clipboard) {
  Object.defineProperty(navigator, "clipboard", {
    value: { write: async () => undefined },
    writable: true,
    configurable: true,
  });
}
