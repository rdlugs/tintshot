import { useLayoutEffect, useRef, type RefObject } from "react";
import {
  computeLayout,
  exportSize,
  isExportSizeSafe,
  render,
  type ComputedLayout,
  type Settings,
} from "../lib/beautifier.ts";

// The preview never needs to be as large as the export. When the requested
// export exceeds the safe browser limits we still show something, just drawn at
// a scale the canvas can actually allocate.
const PREVIEW_MAX_EDGE = 4096;
const PREVIEW_MAX_PIXELS = 16_000_000;

/**
 * Draw the composition into the canvas whenever the image or settings change.
 * The resulting layout is kept in a ref rather than state: only the pointer
 * drag math reads it, and storing it in state would loop back into a re-render.
 */
export function useCanvasRender(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  image: HTMLImageElement | null,
  settings: Settings,
): RefObject<ComputedLayout | null> {
  const layoutRef = useRef<ComputedLayout | null>(null);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !image) {
      layoutRef.current = null;
      return;
    }

    const sourceSize = { width: image.naturalWidth, height: image.naturalHeight };
    const renderSettings = { ...settings };

    if (!isExportSizeSafe(exportSize(sourceSize, settings))) {
      const logical = computeLayout(sourceSize, settings).canvas;
      const edgeScale = Math.min(1, PREVIEW_MAX_EDGE / Math.max(logical.width, logical.height));
      const areaScale = Math.min(
        1,
        Math.sqrt(PREVIEW_MAX_PIXELS / (logical.width * logical.height)),
      );
      renderSettings.scale = Math.max(0.1, Math.min(edgeScale, areaScale));
    }

    layoutRef.current = render(canvas, image, renderSettings);
  }, [canvasRef, image, settings]);

  return layoutRef;
}
