import { describe, expect, it } from "vitest";
import { computeLayout, defaultSettings, mapProjectivePoint } from "../lib/beautifier.ts";
import { inversePanelDelta } from "./useCropDrag.ts";

describe("inversePanelDelta", () => {
  it("restores pre-tilt movement from projected pointer positions", () => {
    const layout = computeLayout(
      { width: 1200, height: 800 },
      {
        ...structuredClone(defaultSettings),
        tiltX: 22,
        tiltY: -26,
        rotation: 9,
        panelZoom: 1.7,
      },
    );
    const previous = { x: 420, y: 360 };
    const current = { x: 475, y: 328 };
    const projectedPrevious = mapProjectivePoint(layout.panelTransform.forward, previous)!;
    const projectedCurrent = mapProjectivePoint(layout.panelTransform.forward, current)!;

    const delta = inversePanelDelta(layout, projectedPrevious, projectedCurrent)!;

    expect(delta.x).toBeCloseTo(55, 6);
    expect(delta.y).toBeCloseTo(-32, 6);
  });

  it("preserves ordinary canvas deltas for the neutral transform", () => {
    const layout = computeLayout({ width: 1200, height: 800 }, structuredClone(defaultSettings));

    expect(inversePanelDelta(layout, { x: 10, y: 20 }, { x: 34, y: 52 })).toEqual({
      x: 24,
      y: 32,
    });
  });
});
