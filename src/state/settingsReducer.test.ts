import { describe, expect, it } from "vitest";
import { defaultSettings, type Settings } from "../lib/beautifier.ts";
import { initialSettings, settingsReducer, type Action } from "./settingsReducer.ts";

function stateWith(change: Partial<Settings> = {}): Settings {
  return { ...initialSettings(), ...change };
}

function croppedState(): Settings {
  return stateWith({ placement: { mode: "fill", zoom: 2.4, x: -0.6, y: 0.3 } });
}

describe("settingsReducer", () => {
  it("never mutates the previous state", () => {
    const state = croppedState();
    const snapshot = structuredClone(state);
    const actions: Action[] = [
      { type: "setAngle", value: 20 },
      { type: "setTransparentBackground", value: true },
      { type: "setPadding", value: 0.3 },
      { type: "setGradientColor", key: "from", value: "#123456" },
      { type: "patchFrame", patch: { url: "changed.example" } },
      { type: "setPlacement", patch: { zoom: 1.5 } },
      { type: "setCanvasRatio", value: "16:9" },
      { type: "setTiltX", value: 18 },
      { type: "setPanelZoom", value: 1.5 },
      { type: "setShadowColor", value: "#123456" },
      { type: "resetTiltShadow" },
    ];

    for (const action of actions) {
      const next = settingsReducer(state, action);
      expect(state).toEqual(snapshot);
      expect(next).not.toBe(state);
    }
  });

  it("resets the crop when the canvas ratio changes", () => {
    const next = settingsReducer(croppedState(), { type: "setCanvasRatio", value: "4:5" });

    expect(next.canvasRatio).toBe("4:5");
    expect(next.placement).toEqual({ mode: "fill", zoom: 1, x: 0, y: 0 });
  });

  it("resets the crop when the frame type changes but keeps the frame text", () => {
    const state = { ...croppedState(), frame: { ...defaultSettings.frame, title: "Kept" } };
    const next = settingsReducer(state, { type: "setFrameType", value: "window" });

    expect(next.frame.type).toBe("window");
    expect(next.frame.title).toBe("Kept");
    expect(next.placement).toEqual({ mode: "fill", zoom: 1, x: 0, y: 0 });
  });

  it("clamps the focal point to the -1..1 range", () => {
    const pushedRight = settingsReducer(stateWith(), { type: "setPlacement", patch: { x: 4 } });
    const pushedUp = settingsReducer(stateWith(), { type: "setPlacement", patch: { y: -9 } });

    expect(pushedRight.placement.x).toBe(1);
    expect(pushedUp.placement.y).toBe(-1);
  });

  it("merges a partial placement without dropping the other axes", () => {
    const next = settingsReducer(croppedState(), { type: "setPlacement", patch: { zoom: 1.8 } });

    expect(next.placement).toEqual({ mode: "fill", zoom: 1.8, x: -0.6, y: 0.3 });
  });

  it("restores defaults on reset", () => {
    const state = stateWith({ padding: 0.4, radius: 48, shadow: 0, scale: 3, canvasRatio: "1:1" });

    expect(settingsReducer(state, { type: "resetAll" })).toEqual(defaultSettings);
  });

  it("keeps the extracted palette on reset when one is supplied", () => {
    const gradient = { from: "#101010", to: "#909090", angle: 90 };
    const next = settingsReducer(stateWith({ padding: 0.4 }), { type: "resetAll", gradient });

    expect(next.gradient).toEqual(gradient);
    expect(next.padding).toBe(defaultSettings.padding);
  });

  it("toggles transparency without changing the selected gradient", () => {
    const state = stateWith({
      gradient: { from: "#101010", to: "#909090", angle: 90 },
    });
    const transparent = settingsReducer(state, {
      type: "setTransparentBackground",
      value: true,
    });
    const restored = settingsReducer(transparent, {
      type: "setTransparentBackground",
      value: false,
    });

    expect(transparent.transparentBackground).toBe(true);
    expect(transparent.gradient).toEqual(state.gradient);
    expect(restored.transparentBackground).toBe(false);
    expect(restored.gradient).toEqual(state.gradient);
  });

  it("applies each scalar setter", () => {
    expect(settingsReducer(stateWith(), { type: "setPadding", value: 0.22 }).padding).toBe(0.22);
    expect(settingsReducer(stateWith(), { type: "setRadius", value: 30 }).radius).toBe(30);
    expect(settingsReducer(stateWith(), { type: "setShadow", value: 0.1 }).shadow).toBe(0.1);
    expect(settingsReducer(stateWith(), { type: "setScale", value: 3 }).scale).toBe(3);
    expect(settingsReducer(stateWith(), { type: "setAngle", value: 200 }).gradient.angle).toBe(200);
    expect(settingsReducer(stateWith(), { type: "setTiltX", value: 24 }).tiltX).toBe(24);
    expect(settingsReducer(stateWith(), { type: "setTiltY", value: -19 }).tiltY).toBe(-19);
    expect(settingsReducer(stateWith(), { type: "setRotation", value: 12 }).rotation).toBe(12);
    expect(settingsReducer(stateWith(), { type: "setPanelZoom", value: 1.75 }).panelZoom).toBe(
      1.75,
    );
    expect(settingsReducer(stateWith(), { type: "setPerspective", value: 0.8 }).perspective).toBe(
      0.8,
    );
    expect(
      settingsReducer(stateWith(), { type: "setShadowDistance", value: 38 }).shadowDistance,
    ).toBe(38);
    expect(settingsReducer(stateWith(), { type: "setShadowBlur", value: 55 }).shadowBlur).toBe(55);
  });

  it("applies directional and color shadow setters", () => {
    const fixed = settingsReducer(stateWith(), { type: "setDirectionalShadow", value: false });
    const colored = settingsReducer(fixed, { type: "setShadowColor", value: "#abcdef" });

    expect(colored.directionalShadow).toBe(false);
    expect(colored.shadowColor).toBe("#abcdef");
  });

  it("resets only the 3D tilt and shadow section", () => {
    const state = stateWith({
      padding: 0.31,
      shadow: 0.9,
      tiltX: 20,
      tiltY: -18,
      rotation: 10,
      panelZoom: 1.8,
      perspective: 1,
      shadowDistance: 42,
      shadowBlur: 60,
      directionalShadow: false,
      shadowColor: "#abcdef",
    });
    const next = settingsReducer(state, { type: "resetTiltShadow" });

    expect(next.padding).toBe(0.31);
    expect(next.shadow).toBe(defaultSettings.shadow);
    expect(next.tiltX).toBe(defaultSettings.tiltX);
    expect(next.tiltY).toBe(defaultSettings.tiltY);
    expect(next.rotation).toBe(defaultSettings.rotation);
    expect(next.panelZoom).toBe(defaultSettings.panelZoom);
    expect(next.perspective).toBe(defaultSettings.perspective);
    expect(next.shadowDistance).toBe(defaultSettings.shadowDistance);
    expect(next.shadowBlur).toBe(defaultSettings.shadowBlur);
    expect(next.directionalShadow).toBe(defaultSettings.directionalShadow);
    expect(next.shadowColor).toBe(defaultSettings.shadowColor);
  });

  it("replaces only the requested gradient stop", () => {
    const next = settingsReducer(stateWith(), {
      type: "setGradientColor",
      key: "to",
      value: "#abcdef",
    });

    expect(next.gradient.to).toBe("#abcdef");
    expect(next.gradient.from).toBe(defaultSettings.gradient.from);
  });

  it("hands out an independent copy of the defaults", () => {
    const first = initialSettings();
    first.placement.zoom = 3;

    expect(initialSettings().placement.zoom).toBe(1);
    expect(defaultSettings.placement.zoom).toBe(1);
  });
});
