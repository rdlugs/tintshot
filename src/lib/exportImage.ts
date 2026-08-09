// PNG export side effects, kept out of the components so they stay declarative.
// Each function reports back with the exact message the editor should surface,
// rather than reaching for the toast itself.

import { toPngBlob } from "./beautifier.ts";
import { fileStem } from "./format.ts";

export interface ExportResult {
  message: string;
  isError: boolean;
}

export async function downloadPng(
  canvas: HTMLCanvasElement,
  sourceName: string,
): Promise<ExportResult> {
  try {
    const blob = await toPngBlob(canvas);
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${fileStem(sourceName)}-tintshot.png`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
    return { message: "PNG downloaded", isError: false };
  } catch {
    return { message: "PNG export failed. Try a lower scale.", isError: true };
  }
}

export async function copyPngToClipboard(canvas: HTMLCanvasElement): Promise<ExportResult> {
  if (!("ClipboardItem" in window) || !navigator.clipboard?.write) {
    return {
      message: "Clipboard images are not supported here. Download is still available.",
      isError: true,
    };
  }
  try {
    const blob = await toPngBlob(canvas);
    await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
    return { message: "PNG copied to clipboard", isError: false };
  } catch {
    return { message: "Clipboard access was blocked. Download is still available.", isError: true };
  }
}
