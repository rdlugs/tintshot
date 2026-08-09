import { describe, expect, it, vi } from "vitest";
import {
  computeLayout,
  computePanelTransform,
  defaultSettings,
  exportSize,
  isExportSizeSafe,
  largestSafeScale,
  mapProjectivePoint,
  render,
  type CanvasRatio,
  type FrameType,
  type Settings,
} from "./beautifier.ts";

const FRAME_TYPES: readonly FrameType[] = ["none", "browser", "window", "phone"];

function makeSettings(change: Partial<Settings> = {}): Settings {
  const settings = structuredClone(defaultSettings);
  return { ...settings, ...change };
}

describe("computeLayout", () => {
  it("preserves the source viewport for the original clean frame", () => {
    const layout = computeLayout({ width: 1200, height: 800 }, makeSettings());

    expect(layout.padding).toBe(112);
    expect(layout.canvas).toEqual({ width: 1424, height: 1024 });
    expect(layout.viewport).toEqual({ x: 112, y: 112, width: 1200, height: 800 });
    expect(layout.source).toEqual({ x: 112, y: 112, width: 1200, height: 800 });
  });

  it("uses cover scaling for a fixed ratio without exposing empty space", () => {
    const settings = makeSettings({
      canvasRatio: "1:1",
      placement: { mode: "fill", zoom: 1, x: 0, y: 0 },
    });
    const layout = computeLayout({ width: 1200, height: 800 }, settings);

    expect(layout.canvas).toEqual({ width: 1424, height: 1424 });
    expect(layout.viewport).toEqual({ x: 112, y: 112, width: 1200, height: 1200 });
    expect(layout.source.width).toBe(1800);
    expect(layout.source.height).toBe(1200);
    expect(layout.source.x).toBe(-188);
  });

  it("maps focal position across the full valid crop range", () => {
    const left = makeSettings({
      canvasRatio: "1:1",
      placement: { mode: "fill", zoom: 1, x: -1, y: 0 },
    });
    const right = makeSettings({
      canvasRatio: "1:1",
      placement: { mode: "fill", zoom: 1, x: 1, y: 0 },
    });

    expect(computeLayout({ width: 1200, height: 800 }, left).source.x).toBe(112);
    expect(computeLayout({ width: 1200, height: 800 }, right).source.x).toBe(-488);
  });

  it("reserves desktop chrome without changing the original content viewport", () => {
    const settings = makeSettings({
      frame: { ...defaultSettings.frame, type: "browser" },
    });
    const layout = computeLayout({ width: 1200, height: 800 }, settings);

    expect(layout.headerHeight).toBe(44);
    expect(layout.canvas).toEqual({ width: 1424, height: 1068 });
    expect(layout.viewport).toEqual({ x: 112, y: 156, width: 1200, height: 800 });
  });

  it("keeps a phone shell centered and intact on landscape canvases", () => {
    const settings = makeSettings({
      canvasRatio: "16:9",
      frame: { ...defaultSettings.frame, type: "phone" },
    });
    const layout = computeLayout({ width: 1080, height: 1920 }, settings);

    expect(layout.frame.x).toBeGreaterThanOrEqual(layout.padding);
    expect(layout.frame.y).toBeGreaterThanOrEqual(layout.padding);
    expect(layout.frame.width / layout.frame.height).toBeCloseTo(0.47, 1);
    expect(layout.viewport.x).toBeGreaterThan(layout.frame.x);
    expect(layout.viewport.height).toBeLessThan(layout.frame.height);
  });

  it("keeps default panel geometry on the identity transform", () => {
    const layout = computeLayout({ width: 1200, height: 800 }, makeSettings());

    expect(layout.panelTransform.active).toBe(false);
    expect(layout.panelTransform.scale).toBe(1);
    expect(layout.panelTransform.corners).toEqual([
      { x: layout.frame.x, y: layout.frame.y },
      { x: layout.frame.x + layout.frame.width, y: layout.frame.y },
      { x: layout.frame.x + layout.frame.width, y: layout.frame.y + layout.frame.height },
      { x: layout.frame.x, y: layout.frame.y + layout.frame.height },
    ]);
  });

  it("maps transformed corners forward and back through the homography", () => {
    const frame = { x: 100, y: 80, width: 900, height: 600 };
    const transform = computePanelTransform(
      frame,
      makeSettings({ tiltX: 24, tiltY: -28, rotation: 11, perspective: 0.9 }),
    );
    const sourceCorners = [
      { x: frame.x, y: frame.y },
      { x: frame.x + frame.width, y: frame.y },
      { x: frame.x + frame.width, y: frame.y + frame.height },
      { x: frame.x, y: frame.y + frame.height },
    ];

    sourceCorners.forEach((source, index) => {
      const projected = mapProjectivePoint(transform.forward, source)!;
      const restored = mapProjectivePoint(transform.inverse, projected)!;
      expect(projected.x).toBeCloseTo(transform.corners[index].x, 6);
      expect(projected.y).toBeCloseTo(transform.corners[index].y, 6);
      expect(restored.x).toBeCloseTo(source.x, 6);
      expect(restored.y).toBeCloseTo(source.y, 6);
    });
  });

  it("scales the complete fitted panel around its center with 3D zoom", () => {
    const frame = { x: 100, y: 80, width: 900, height: 600 };
    const settings = makeSettings({ tiltX: 24, tiltY: -28, rotation: 11, perspective: 0.9 });
    const fitted = computePanelTransform(frame, settings);
    const zoomed = computePanelTransform(frame, { ...settings, panelZoom: 1.5 });
    const center = { x: frame.x + frame.width / 2, y: frame.y + frame.height / 2 };

    expect(zoomed.active).toBe(true);
    expect(zoomed.scale).toBeCloseTo(fitted.scale * 1.5, 8);
    zoomed.corners.forEach((corner, index) => {
      expect(corner.x).toBeCloseTo(center.x + (fitted.corners[index].x - center.x) * 1.5, 6);
      expect(corner.y).toBeCloseTo(center.y + (fitted.corners[index].y - center.y) * 1.5, 6);
    });
  });

  it("clamps 3D zoom calculations to the supported 100–200% range", () => {
    const frame = { x: 20, y: 30, width: 400, height: 260 };
    const below = computePanelTransform(frame, makeSettings({ panelZoom: 0.2 }));
    const maximum = computePanelTransform(frame, makeSettings({ panelZoom: 2 }));
    const above = computePanelTransform(frame, makeSettings({ panelZoom: 8 }));

    expect(below.active).toBe(false);
    expect(below.scale).toBe(1);
    expect(above.corners).toEqual(maximum.corners);
    expect(above.scale).toBe(2);
  });

  it("makes perspective zero flatten pitch and yaw", () => {
    const frame = { x: 20, y: 30, width: 400, height: 260 };
    const transform = computePanelTransform(
      frame,
      makeSettings({ tiltX: 30, tiltY: -30, perspective: 0 }),
    );

    expect(transform.active).toBe(false);
    expect(mapProjectivePoint(transform.forward, { x: 200, y: 140 })).toEqual({ x: 200, y: 140 });
  });

  it("fits extreme transformed corners inside every frame and canvas ratio", () => {
    const ratios: CanvasRatio[] = ["original", "1:1", "4:5", "16:9", "9:16"];

    for (const type of FRAME_TYPES) {
      for (const canvasRatio of ratios) {
        const layout = computeLayout(
          { width: 1200, height: 800 },
          makeSettings({
            canvasRatio,
            frame: { ...defaultSettings.frame, type },
            tiltX: 30,
            tiltY: -30,
            rotation: 15,
            perspective: 1,
          }),
        );
        for (const corner of layout.panelTransform.corners) {
          expect(corner.x).toBeGreaterThanOrEqual(layout.frame.x - 1e-6);
          expect(corner.y).toBeGreaterThanOrEqual(layout.frame.y - 1e-6);
          expect(corner.x).toBeLessThanOrEqual(layout.frame.x + layout.frame.width + 1e-6);
          expect(corner.y).toBeLessThanOrEqual(layout.frame.y + layout.frame.height + 1e-6);
          expect(corner.x).toBeGreaterThanOrEqual(-1e-6);
          expect(corner.y).toBeGreaterThanOrEqual(-1e-6);
          expect(corner.x).toBeLessThanOrEqual(layout.canvas.width + 1e-6);
          expect(corner.y).toBeLessThanOrEqual(layout.canvas.height + 1e-6);
        }
      }
    }
  });

  it("allows 3D zoom to intentionally cross the fixed canvas edges", () => {
    const layout = computeLayout({ width: 1200, height: 800 }, makeSettings({ panelZoom: 2 }));

    expect(
      layout.panelTransform.corners.some(
        (corner) =>
          corner.x < 0 ||
          corner.y < 0 ||
          corner.x > layout.canvas.width ||
          corner.y > layout.canvas.height,
      ),
    ).toBe(true);
  });
});

describe("export sizing", () => {
  it("applies the selected export multiplier", () => {
    expect(exportSize({ width: 1200, height: 800 }, makeSettings())).toEqual({
      width: 2848,
      height: 2048,
    });
  });

  it("does not change export dimensions when tilt is enabled", () => {
    const source = { width: 1200, height: 800 };
    const flat = exportSize(source, makeSettings({ scale: 3 }));
    const tilted = exportSize(
      source,
      makeSettings({
        scale: 3,
        tiltX: 30,
        tiltY: -30,
        rotation: 15,
        panelZoom: 2,
        perspective: 1,
      }),
    );

    expect(tilted).toEqual(flat);
  });

  it("rejects exports beyond the edge or pixel budget", () => {
    expect(isExportSizeSafe({ width: 8192, height: 3906 })).toBe(true);
    expect(isExportSizeSafe({ width: 8193, height: 100 })).toBe(false);
    expect(isExportSizeSafe({ width: 8000, height: 5000 })).toBe(false);
  });

  it("picks the largest scale the browser can still allocate", () => {
    expect(largestSafeScale({ width: 1200, height: 800 }, makeSettings())).toBe(3);
    expect(largestSafeScale({ width: 2000, height: 1400 }, makeSettings())).toBe(2);
    expect(largestSafeScale({ width: 3000, height: 2000 }, makeSettings())).toBe(1);
    expect(largestSafeScale({ width: 7000, height: 7000 }, makeSettings())).toBeNull();
  });

  it("keeps every frame exportable at 2x for a landscape source", () => {
    for (const type of FRAME_TYPES) {
      const settings = makeSettings({
        scale: 2,
        frame: { ...defaultSettings.frame, type },
      });
      expect(isExportSizeSafe(exportSize({ width: 2560, height: 1440 }, settings))).toBe(true);
    }
  });
});

describe("image placement", () => {
  const landscape = { width: 2560, height: 1440 };

  it("contains the complete source in every frame without distorting it", () => {
    for (const type of FRAME_TYPES) {
      const settings = makeSettings({
        frame: { ...defaultSettings.frame, type },
        placement: { mode: "fit", zoom: 1, x: 0, y: 0 },
      });
      const { viewport, source } = computeLayout(landscape, settings);

      expect(source.width).toBeLessThanOrEqual(viewport.width + 0.001);
      expect(source.height).toBeLessThanOrEqual(viewport.height + 0.001);
      expect(source.width / source.height).toBeCloseTo(landscape.width / landscape.height, 5);
      // Letterboxed bands are even on both sides.
      expect(source.x - viewport.x).toBeCloseTo(viewport.x + viewport.width - source.x - source.width, 5); // prettier-ignore
      expect(source.y - viewport.y).toBeCloseTo(viewport.y + viewport.height - source.y - source.height, 5); // prettier-ignore
    }
  });

  it("still covers the viewport in every frame when filling", () => {
    for (const type of FRAME_TYPES) {
      const settings = makeSettings({
        frame: { ...defaultSettings.frame, type },
        placement: { mode: "fill", zoom: 1, x: 0, y: 0 },
      });
      const { viewport, source } = computeLayout(landscape, settings);

      expect(source.width).toBeGreaterThanOrEqual(viewport.width - 0.001);
      expect(source.height).toBeGreaterThanOrEqual(viewport.height - 0.001);
      expect(source.width / source.height).toBeCloseTo(landscape.width / landscape.height, 5);
    }
  });

  it("shrinks a bare panel to the source instead of letterboxing it", () => {
    const settings = makeSettings({
      canvasRatio: "1:1",
      placement: { mode: "fit", zoom: 1, x: 0, y: 0 },
    });
    const layout = computeLayout({ width: 1200, height: 800 }, settings);

    expect(layout.frame.width / layout.frame.height).toBeCloseTo(1.5, 5);
    expect(layout.frame.height).toBeLessThan(layout.canvas.height - layout.padding * 2);
    expect(layout.frame).toEqual(layout.viewport);
    expect(layout.source).toEqual(layout.frame);
  });

  it("bounds the phone shell so a wide source cannot inflate the canvas", () => {
    const settings = makeSettings({ frame: { ...defaultSettings.frame, type: "phone" } });
    const wide = computeLayout({ width: 6000, height: 1400 }, settings);
    const tall = computeLayout({ width: 1080, height: 1920 }, settings);

    // Both land on the same normalized device, and the shell keeps its 19.5:9 proportions.
    expect(wide.canvas.height).toBeLessThan(3600);
    expect(wide.frame.width / wide.frame.height).toBeCloseTo(0.47, 1);
    expect(tall.frame.width / tall.frame.height).toBeCloseTo(0.47, 1);
    expect(tall.canvas.height).toBeLessThan(wide.canvas.height);
  });
});

describe("render", () => {
  it("skips only the Tintshot gradient when the background is transparent", () => {
    const canvas = document.createElement("canvas");
    const image = document.createElement("img");
    Object.defineProperties(image, {
      naturalWidth: { value: 1200, configurable: true },
      naturalHeight: { value: 800, configurable: true },
    });

    const context = canvas.getContext("2d")!;
    const createLinearGradient = vi.fn(
      () => ({ addColorStop: vi.fn() }) as unknown as CanvasGradient,
    );
    const drawImage = vi.fn();
    context.createLinearGradient = createLinearGradient;
    context.drawImage = drawImage;

    render(canvas, image, makeSettings({ scale: 1 }));
    expect(createLinearGradient).toHaveBeenCalledOnce();
    const opaqueImageCall = drawImage.mock.calls[0];

    createLinearGradient.mockClear();
    drawImage.mockClear();
    render(canvas, image, makeSettings({ scale: 1, transparentBackground: true }));

    expect(createLinearGradient).not.toHaveBeenCalled();
    expect(drawImage).toHaveBeenCalledOnce();
    expect(drawImage.mock.calls[0]).toEqual(opaqueImageCall);
  });

  it("uses the direct panel path by default and the mesh path for active tilt", () => {
    const canvas = document.createElement("canvas");
    const image = document.createElement("img");
    Object.defineProperties(image, {
      naturalWidth: { value: 1200, configurable: true },
      naturalHeight: { value: 800, configurable: true },
    });
    const drawImage = vi.fn();
    canvas.getContext("2d")!.drawImage = drawImage;

    render(canvas, image, makeSettings({ scale: 1 }));
    expect(drawImage).toHaveBeenCalledOnce();

    drawImage.mockClear();
    render(canvas, image, makeSettings({ scale: 1, tiltX: 20, tiltY: -18 }));
    expect(drawImage.mock.calls.length).toBeGreaterThan(100);
  });

  it("uses the projected mesh for flat 3D zoom", () => {
    const canvas = document.createElement("canvas");
    const image = document.createElement("img");
    Object.defineProperties(image, {
      naturalWidth: { value: 1200, configurable: true },
      naturalHeight: { value: 800, configurable: true },
    });
    const drawImage = vi.fn();
    canvas.getContext("2d")!.drawImage = drawImage;

    const layout = render(canvas, image, makeSettings({ scale: 1, panelZoom: 1.5 }));

    expect(layout.panelTransform.active).toBe(true);
    expect(drawImage.mock.calls.length).toBeGreaterThan(100);
  });

  it.each<FrameType>(["none", "browser", "window", "phone"])(
    "renders an actively tilted %s frame",
    (type) => {
      const canvas = document.createElement("canvas");
      const image = document.createElement("img");
      Object.defineProperties(image, {
        naturalWidth: { value: 1200, configurable: true },
        naturalHeight: { value: 800, configurable: true },
      });
      const drawImage = vi.fn();
      canvas.getContext("2d")!.drawImage = drawImage;

      const layout = render(
        canvas,
        image,
        makeSettings({
          scale: 1,
          frame: { ...defaultSettings.frame, type },
          tiltX: 30,
          tiltY: -30,
          rotation: 15,
          perspective: 1,
        }),
      );

      expect(layout.panelTransform.active).toBe(true);
      expect(drawImage.mock.calls.length).toBeGreaterThan(100);
    },
  );

  it("applies independent fixed shadow controls and color", () => {
    const canvas = document.createElement("canvas");
    const image = document.createElement("img");
    Object.defineProperties(image, {
      naturalWidth: { value: 1200, configurable: true },
      naturalHeight: { value: 800, configurable: true },
    });
    const context = canvas.getContext("2d")!;

    render(
      canvas,
      image,
      makeSettings({
        scale: 1,
        shadow: 0.8,
        shadowDistance: 37,
        shadowBlur: 54,
        directionalShadow: false,
        shadowColor: "#123456",
      }),
    );

    expect(context.shadowColor).toBe("rgba(18,52,86,0.4)");
    expect(context.shadowBlur).toBe(54);
    expect(context.shadowOffsetX).toBe(0);
    expect(context.shadowOffsetY).toBe(37);
  });
});
