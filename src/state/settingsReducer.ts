// The single source of truth for editor settings.
//
// Every update returns fresh objects: React compares by reference, so mutating
// the previous state (as the pre-React editor did) would silently skip renders.

import {
  defaultSettings,
  type CanvasRatio,
  type FrameSettings,
  type FrameType,
  type PlacementSettings,
  type Settings,
} from "../lib/beautifier.ts";
import type { Gradient } from "../lib/colors.ts";
import { clamp } from "../lib/format.ts";

export type Action =
  | { type: "setGradient"; gradient: Gradient }
  | { type: "setGradientColor"; key: "from" | "to"; value: string }
  | { type: "setAngle"; value: number }
  | { type: "setTransparentBackground"; value: boolean }
  | { type: "setPadding"; value: number }
  | { type: "setRadius"; value: number }
  | { type: "setShadow"; value: number }
  | { type: "setTiltX"; value: number }
  | { type: "setTiltY"; value: number }
  | { type: "setRotation"; value: number }
  | { type: "setPanelZoom"; value: number }
  | { type: "setPerspective"; value: number }
  | { type: "setShadowDistance"; value: number }
  | { type: "setShadowBlur"; value: number }
  | { type: "setDirectionalShadow"; value: boolean }
  | { type: "setShadowColor"; value: string }
  | { type: "resetTiltShadow" }
  | { type: "setCanvasRatio"; value: CanvasRatio }
  | { type: "setFrameType"; value: FrameType }
  | { type: "patchFrame"; patch: Partial<FrameSettings> }
  | { type: "setPlacement"; patch: Partial<PlacementSettings> }
  | { type: "resetPlacement" }
  | { type: "setScale"; value: number }
  | { type: "resetAll"; gradient?: Gradient };

/** Zoom and focal point after a reset, or after a change that invalidates them. */
export const neutralPlacement: PlacementSettings = {
  mode: defaultSettings.placement.mode,
  zoom: 1,
  x: 0,
  y: 0,
};

/** Clear the crop while keeping the Fit/Fill choice, which stays valid across any frame. */
function resetCrop(placement: PlacementSettings): PlacementSettings {
  return { ...neutralPlacement, mode: placement.mode };
}

export function initialSettings(): Settings {
  return structuredClone(defaultSettings);
}

export function settingsReducer(state: Settings, action: Action): Settings {
  switch (action.type) {
    case "setGradient":
      return { ...state, gradient: { ...action.gradient } };

    case "setGradientColor":
      return { ...state, gradient: { ...state.gradient, [action.key]: action.value } };

    case "setAngle":
      return { ...state, gradient: { ...state.gradient, angle: action.value } };

    case "setTransparentBackground":
      return { ...state, transparentBackground: action.value };

    case "setPadding":
      return { ...state, padding: action.value };

    case "setRadius":
      return { ...state, radius: action.value };

    case "setShadow":
      return { ...state, shadow: action.value };

    case "setTiltX":
      return { ...state, tiltX: action.value };

    case "setTiltY":
      return { ...state, tiltY: action.value };

    case "setRotation":
      return { ...state, rotation: action.value };

    case "setPanelZoom":
      return { ...state, panelZoom: action.value };

    case "setPerspective":
      return { ...state, perspective: action.value };

    case "setShadowDistance":
      return { ...state, shadowDistance: action.value };

    case "setShadowBlur":
      return { ...state, shadowBlur: action.value };

    case "setDirectionalShadow":
      return { ...state, directionalShadow: action.value };

    case "setShadowColor":
      return { ...state, shadowColor: action.value };

    case "resetTiltShadow":
      return {
        ...state,
        shadow: defaultSettings.shadow,
        tiltX: defaultSettings.tiltX,
        tiltY: defaultSettings.tiltY,
        rotation: defaultSettings.rotation,
        panelZoom: defaultSettings.panelZoom,
        perspective: defaultSettings.perspective,
        shadowDistance: defaultSettings.shadowDistance,
        shadowBlur: defaultSettings.shadowBlur,
        directionalShadow: defaultSettings.directionalShadow,
        shadowColor: defaultSettings.shadowColor,
      };

    // Changing the canvas shape or the frame changes what "fully zoomed out"
    // means, so the previous crop no longer describes anything meaningful.
    case "setCanvasRatio":
      return { ...state, canvasRatio: action.value, placement: resetCrop(state.placement) };

    case "setFrameType":
      return {
        ...state,
        frame: { ...state.frame, type: action.value },
        placement: resetCrop(state.placement),
      };

    case "patchFrame":
      return { ...state, frame: { ...state.frame, ...action.patch } };

    case "setPlacement": {
      const placement = { ...state.placement, ...action.patch };
      return {
        ...state,
        placement: {
          mode: placement.mode,
          zoom: placement.zoom,
          x: clamp(placement.x, -1, 1),
          y: clamp(placement.y, -1, 1),
        },
      };
    }

    case "resetPlacement":
      return { ...state, placement: resetCrop(state.placement) };

    case "setScale":
      return { ...state, scale: action.value };

    // A reset keeps the palette extracted from the loaded screenshot — throwing
    // it away would force the user to hit Auto tint again every time.
    case "resetAll": {
      const clean = initialSettings();
      return action.gradient ? { ...clean, gradient: { ...action.gradient } } : clean;
    }
  }
}
