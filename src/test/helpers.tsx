import { render } from "@testing-library/react";
import type { ReactElement } from "react";
import { App } from "../App.tsx";
import { SettingsProvider } from "../state/SettingsContext.tsx";

/**
 * jsdom never actually decodes an image, so `onload` would never fire and the
 * editor would never open. Patch the loading step to resolve immediately at a
 * fixed intrinsic size.
 */
export function stubImageDecoding(width: number, height: number): void {
  Object.defineProperty(HTMLImageElement.prototype, "naturalWidth", {
    configurable: true,
    get: () => width,
  });
  Object.defineProperty(HTMLImageElement.prototype, "naturalHeight", {
    configurable: true,
    get: () => height,
  });
  Object.defineProperty(HTMLImageElement.prototype, "src", {
    configurable: true,
    set(this: HTMLImageElement) {
      queueMicrotask(() => this.onload?.(new Event("load")));
    },
  });
}

export function screenshotFile(name = "shot.png", type = "image/png"): File {
  return new File(["binary"], name, { type });
}

export function renderApp(ui: ReactElement = <App />) {
  return render(<SettingsProvider>{ui}</SettingsProvider>);
}
