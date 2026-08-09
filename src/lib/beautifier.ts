// Canvas renderer and layout model for Tintshot.

import type { Gradient } from "./colors.ts";

export type FrameType = "none" | "browser" | "window" | "phone";
export type CanvasRatio = "original" | "1:1" | "4:5" | "16:9" | "9:16";

export interface FrameSettings {
  type: FrameType;
  url: string;
  title: string;
  showUrl: boolean;
  showTitle: boolean;
}

export type PlacementMode = "fit" | "fill";

export interface PlacementSettings {
  mode: PlacementMode; // "fill" covers and crops, "fit" shows the complete source
  zoom: number; // 1 is the minimum fit/cover scale, up to 3
  x: number; // focal position, -1 (left) to 1 (right)
  y: number; // focal position, -1 (top) to 1 (bottom)
}

export interface Settings {
  gradient: Gradient;
  transparentBackground: boolean;
  canvasRatio: CanvasRatio;
  frame: FrameSettings;
  placement: PlacementSettings;
  padding: number; // fraction of the shorter source side, 0–0.4
  radius: number; // corner radius in source pixels
  shadow: number; // 0–1 shadow strength
  tiltX: number; // pitch in degrees, -30–30
  tiltY: number; // yaw in degrees, -30–30
  rotation: number; // in-plane roll in degrees, -15–15
  panelZoom: number; // complete projected panel scale, 1–2
  perspective: number; // 0–1 strength of pitch/yaw projection
  shadowDistance: number; // logical canvas pixels, 0–80
  shadowBlur: number; // logical canvas pixels, 0–80
  directionalShadow: boolean;
  shadowColor: string;
  scale: number; // export multiplier, 1–3
}

export interface Size {
  width: number;
  height: number;
}

export interface Rect extends Size {
  x: number;
  y: number;
}

export interface Point {
  x: number;
  y: number;
}

export type ProjectiveMatrix = readonly [
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
];

export interface PanelTransform {
  active: boolean;
  corners: readonly [Point, Point, Point, Point];
  forward: ProjectiveMatrix;
  inverse: ProjectiveMatrix;
  scale: number;
}

export interface ComputedLayout {
  canvas: Size;
  frame: Rect;
  viewport: Rect;
  source: Rect;
  headerHeight: number;
  padding: number;
  panelTransform: PanelTransform;
}

export const MAX_EXPORT_EDGE = 8192;
export const MAX_EXPORT_PIXELS = 32_000_000;

/** Export multipliers offered in the UI, ascending. */
export const EXPORT_SCALES = [1, 2, 3] as const;

const PHONE_ASPECT = 19.5 / 9;
// The phone shell is a device, not a container: its logical size is normalized instead of
// growing with the source. An 8000 px wide screenshot would otherwise demand a 17000 px tall
// canvas that no browser can allocate.
const PHONE_MIN_SCREEN_HEIGHT = 800;
const PHONE_MAX_SCREEN_HEIGHT = 2800;

export const defaultSettings: Settings = {
  gradient: { from: "#4f5bd5", to: "#28304d", angle: 135 },
  transparentBackground: false,
  canvasRatio: "original",
  frame: {
    type: "none",
    url: "example.com",
    title: "Screenshot",
    showUrl: true,
    showTitle: true,
  },
  placement: { mode: "fit", zoom: 1, x: 0, y: 0 },
  padding: 0.14,
  radius: 16,
  shadow: 0.5,
  tiltX: 0,
  tiltY: 0,
  rotation: 0,
  panelZoom: 1,
  perspective: 0.65,
  shadowDistance: 11,
  shadowBlur: 21,
  directionalShadow: true,
  shadowColor: "#000000",
  scale: 2,
};

const RATIOS: Record<Exclude<CanvasRatio, "original">, number> = {
  "1:1": 1,
  "4:5": 4 / 5,
  "16:9": 16 / 9,
  "9:16": 9 / 16,
};

/** Compute every rectangle used by both the preview and exported image. */
export function computeLayout(image: Size, settings: Settings): ComputedLayout {
  const imageWidth = Math.max(1, image.width);
  const imageHeight = Math.max(1, image.height);
  const chromeHeight =
    settings.frame.type === "browser" || settings.frame.type === "window"
      ? clamp(Math.round(Math.min(imageWidth, imageHeight) * 0.055), 34, 68)
      : 0;

  let naturalFrameW = imageWidth;
  let naturalFrameH = imageHeight + chromeHeight;
  let phoneBezel = 0;

  if (settings.frame.type === "phone") {
    // Big enough to hold the source at native density, but bounded so an arbitrarily wide
    // screenshot cannot demand an unexportable canvas.
    const screenHeight = clamp(
      Math.round(Math.max(imageHeight, imageWidth * PHONE_ASPECT)),
      PHONE_MIN_SCREEN_HEIGHT,
      PHONE_MAX_SCREEN_HEIGHT,
    );
    const screenWidth = Math.round(screenHeight / PHONE_ASPECT);
    phoneBezel = clamp(Math.round(screenWidth * 0.035), 14, 34);
    naturalFrameW = screenWidth + phoneBezel * 2;
    naturalFrameH = screenHeight + phoneBezel * 2;
  }

  // Padding follows the shell for a phone and the source everywhere else, so the phone canvas
  // stays bounded on every side.
  const padding = Math.round(
    (settings.frame.type === "phone"
      ? Math.min(naturalFrameW, naturalFrameH)
      : Math.min(imageWidth, imageHeight)) * settings.padding,
  );

  let canvasW = naturalFrameW + padding * 2;
  let canvasH = naturalFrameH + padding * 2;

  if (settings.canvasRatio !== "original") {
    const ratio = RATIOS[settings.canvasRatio];
    if (settings.frame.type === "phone") {
      // A device shell always stays intact; extend the background to reach the ratio.
      if (canvasW / canvasH > ratio) canvasH = canvasW / ratio;
      else canvasW = canvasH * ratio;
    } else {
      canvasH = canvasW / ratio;
      const minimumHeight = padding * 2 + chromeHeight + 120;
      if (canvasH < minimumHeight) {
        canvasH = minimumHeight;
        canvasW = canvasH * ratio;
      }
    }
  }

  let frame: Rect;
  let viewport: Rect;

  if (settings.frame.type === "phone") {
    const availableW = Math.max(80, canvasW - padding * 2);
    const availableH = Math.max(160, canvasH - padding * 2);
    const phoneRatio = naturalFrameW / naturalFrameH;
    let frameW = availableW;
    let frameH = frameW / phoneRatio;
    if (frameH > availableH) {
      frameH = availableH;
      frameW = frameH * phoneRatio;
    }
    frame = {
      x: (canvasW - frameW) / 2,
      y: (canvasH - frameH) / 2,
      width: frameW,
      height: frameH,
    };
    const bezel = frameW * (phoneBezel / naturalFrameW);
    viewport = {
      x: frame.x + bezel,
      y: frame.y + bezel,
      width: frame.width - bezel * 2,
      height: frame.height - bezel * 2,
    };
  } else {
    let frameW = Math.max(80, canvasW - padding * 2);
    let frameH = Math.max(chromeHeight + 80, canvasH - padding * 2);

    // A bare panel has no chrome to letterbox against, so instead of leaving empty bands the
    // panel itself shrinks to the source aspect — corners and shadow keep hugging the image.
    if (settings.placement.mode === "fit" && settings.frame.type === "none") {
      const imageRatio = imageWidth / imageHeight;
      if (frameW / frameH > imageRatio) frameW = frameH * imageRatio;
      else frameH = frameW / imageRatio;
    }

    frame = {
      x: (canvasW - frameW) / 2,
      y: (canvasH - frameH) / 2,
      width: frameW,
      height: frameH,
    };
    viewport = {
      x: frame.x,
      y: frame.y + chromeHeight,
      width: frame.width,
      height: Math.max(1, frame.height - chromeHeight),
    };
  }

  const zoom = clamp(settings.placement.zoom, 1, 3);
  // "fill" covers the viewport and crops the overflow; "fit" contains the complete source.
  const baseScale =
    settings.placement.mode === "fill"
      ? Math.max(viewport.width / imageWidth, viewport.height / imageHeight)
      : Math.min(viewport.width / imageWidth, viewport.height / imageHeight);
  const sourceW = imageWidth * baseScale * zoom;
  const sourceH = imageHeight * baseScale * zoom;
  const focalX = (clamp(settings.placement.x, -1, 1) + 1) / 2;
  const focalY = (clamp(settings.placement.y, -1, 1) + 1) / 2;
  // Overflow pans to the focal point; underflow (letterboxing) centers instead.
  const deltaX = sourceW - viewport.width;
  const deltaY = sourceH - viewport.height;
  const offsetX = deltaX > 0 ? deltaX * focalX : deltaX / 2;
  const offsetY = deltaY > 0 ? deltaY * focalY : deltaY / 2;

  return {
    canvas: { width: Math.round(canvasW), height: Math.round(canvasH) },
    frame,
    viewport,
    source: {
      x: viewport.x - offsetX,
      y: viewport.y - offsetY,
      width: sourceW,
      height: sourceH,
    },
    headerHeight: chromeHeight,
    padding,
    panelTransform: computePanelTransform(frame, settings),
  };
}

/** Map a point through a 3×3 projective matrix. Invalid near-plane mappings return null. */
export function mapProjectivePoint(matrix: ProjectiveMatrix, point: Point): Point | null {
  const denominator = matrix[6] * point.x + matrix[7] * point.y + matrix[8];
  if (!Number.isFinite(denominator) || Math.abs(denominator) < 1e-9) return null;
  const x = (matrix[0] * point.x + matrix[1] * point.y + matrix[2]) / denominator;
  const y = (matrix[3] * point.x + matrix[4] * point.y + matrix[5]) / denominator;
  return Number.isFinite(x) && Number.isFinite(y) ? { x, y } : null;
}

/** Build the fitted homography used by rendering and inverse-mapped crop dragging. */
export function computePanelTransform(frame: Rect, settings: Settings): PanelTransform {
  const pitch = degreesToRadians(clamp(settings.tiltX, -30, 30));
  const yaw = degreesToRadians(clamp(settings.tiltY, -30, 30));
  const roll = degreesToRadians(clamp(settings.rotation, -15, 15));
  const panelZoom = clamp(settings.panelZoom, 1, 2);
  const perspective = clamp(settings.perspective, 0, 1);
  const active =
    Math.abs(panelZoom - 1) > 1e-9 ||
    Math.abs(roll) > 1e-9 ||
    (perspective > 0 && (Math.abs(pitch) > 1e-9 || Math.abs(yaw) > 1e-9));

  const center = { x: frame.x + frame.width / 2, y: frame.y + frame.height / 2 };
  const halfWidth = frame.width / 2;
  const halfHeight = frame.height / 2;
  const cameraDistance = Math.max(frame.width, frame.height) * 3;
  const cosPitch = Math.cos(pitch);
  const sinPitch = Math.sin(pitch);
  const cosYaw = Math.cos(yaw);
  const sinYaw = Math.sin(yaw);
  const cosRoll = Math.cos(roll);
  const sinRoll = Math.sin(roll);

  const project = (x: number, y: number): Point => {
    const pitchedY = y * cosPitch;
    const pitchedZ = y * sinPitch;
    const rotatedX = x * cosYaw + pitchedZ * sinYaw;
    const rotatedZ = -x * sinYaw + pitchedZ * cosYaw;
    const cameraScale = cameraDistance / Math.max(1, cameraDistance + rotatedZ);
    const projectedX = rotatedX * cameraScale;
    const projectedY = pitchedY * cameraScale;
    const blendedX = x + (projectedX - x) * perspective;
    const blendedY = y + (projectedY - y) * perspective;
    return {
      x: center.x + blendedX * cosRoll - blendedY * sinRoll,
      y: center.y + blendedX * sinRoll + blendedY * cosRoll,
    };
  };

  const rawCorners = [
    project(-halfWidth, -halfHeight),
    project(halfWidth, -halfHeight),
    project(halfWidth, halfHeight),
    project(-halfWidth, halfHeight),
  ] as const;
  const bounds = pointBounds(rawCorners);
  const fitScale = Math.min(
    1,
    frame.width / Math.max(1e-9, bounds.width),
    frame.height / Math.max(1e-9, bounds.height),
  );
  const finalScale = fitScale * panelZoom;
  const boundsCenter = { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 };
  const corners = rawCorners.map((point) => ({
    x: center.x + (point.x - boundsCenter.x) * finalScale,
    y: center.y + (point.y - boundsCenter.y) * finalScale,
  })) as unknown as readonly [Point, Point, Point, Point];
  const forward = rectToQuadMatrix(frame, corners);
  const inverse = invertProjectiveMatrix(forward) ?? IDENTITY_MATRIX;

  return { active, corners, forward, inverse, scale: finalScale };
}

export function exportSize(image: Size, settings: Settings): Size {
  const { canvas } = computeLayout(image, settings);
  return {
    width: Math.round(canvas.width * settings.scale),
    height: Math.round(canvas.height * settings.scale),
  };
}

export function isExportSizeSafe(size: Size): boolean {
  return (
    size.width <= MAX_EXPORT_EDGE &&
    size.height <= MAX_EXPORT_EDGE &&
    size.width * size.height <= MAX_EXPORT_PIXELS
  );
}

/** Largest offered scale the browser can still allocate, or null when even 1× is too big. */
export function largestSafeScale(image: Size, settings: Settings): number | null {
  for (let index = EXPORT_SCALES.length - 1; index >= 0; index -= 1) {
    const scale = EXPORT_SCALES[index];
    if (isExportSizeSafe(exportSize(image, { ...settings, scale }))) return scale;
  }
  return null;
}

/** Draw the full composition onto a single export-ready canvas. */
export function render(
  canvas: HTMLCanvasElement,
  image: HTMLImageElement,
  settings: Settings,
): ComputedLayout {
  const layout = computeLayout(
    { width: image.naturalWidth || image.width, height: image.naturalHeight || image.height },
    settings,
  );
  const scale = settings.scale;
  canvas.width = Math.round(layout.canvas.width * scale);
  canvas.height = Math.round(layout.canvas.height * scale);

  const ctx = canvas.getContext("2d")!;
  ctx.save();
  ctx.scale(scale, scale);

  if (!settings.transparentBackground) {
    drawBackground(ctx, layout.canvas, settings.gradient);
  }
  drawFrameShadow(ctx, layout, settings);

  if (layout.panelTransform.active) {
    drawProjectedPanel(ctx, image, layout, settings, scale);
  } else {
    drawPanel(ctx, image, layout, settings);
  }

  ctx.restore();
  return layout;
}

export function toPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("PNG export failed"))),
      "image/png",
    );
  });
}

function drawBackground(ctx: CanvasRenderingContext2D, canvas: Size, gradient: Gradient): void {
  const rad = (gradient.angle * Math.PI) / 180;
  const x = Math.cos(rad);
  const y = Math.sin(rad);
  const fill = ctx.createLinearGradient(
    canvas.width / 2 - (x * canvas.width) / 2,
    canvas.height / 2 - (y * canvas.height) / 2,
    canvas.width / 2 + (x * canvas.width) / 2,
    canvas.height / 2 + (y * canvas.height) / 2,
  );
  fill.addColorStop(0, gradient.from);
  fill.addColorStop(1, gradient.to);
  ctx.fillStyle = fill;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawFrameShadow(
  ctx: CanvasRenderingContext2D,
  layout: ComputedLayout,
  settings: Settings,
): void {
  if (settings.shadow <= 0) return;
  const { frame, panelTransform } = layout;
  const radius = frameRadius(settings, frame);
  const color = parseHexColor(settings.shadowColor);
  const direction = shadowOffset(settings);
  ctx.save();
  ctx.shadowColor = `rgba(${color.r},${color.g},${color.b},${0.5 * settings.shadow})`;
  ctx.shadowBlur = clamp(settings.shadowBlur, 0, 80);
  ctx.shadowOffsetX = direction.x;
  ctx.shadowOffsetY = direction.y;
  if (panelTransform.active) projectedRoundedRectPath(ctx, frame, radius, panelTransform.forward);
  else roundedRectPath(ctx, frame.x, frame.y, frame.width, frame.height, radius);
  ctx.fillStyle = `rgba(${color.r},${color.g},${color.b},0.92)`;
  ctx.fill();
  ctx.restore();
}

function drawPanel(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  layout: ComputedLayout,
  settings: Settings,
): void {
  if (settings.frame.type === "phone") {
    drawPhoneFrame(ctx, image, layout, settings);
  } else if (settings.frame.type === "browser" || settings.frame.type === "window") {
    drawDesktopFrame(ctx, image, layout, settings);
  } else {
    drawImageInViewport(ctx, image, layout, settings.radius);
  }
}

function drawProjectedPanel(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  layout: ComputedLayout,
  settings: Settings,
  outputScale: number,
): void {
  const { frame, panelTransform } = layout;
  const panel = document.createElement("canvas");
  // Round outward so fractional logical frame sizes never lose their last row
  // or column before the projection is applied.
  panel.width = Math.max(1, Math.ceil(frame.width * outputScale));
  panel.height = Math.max(1, Math.ceil(frame.height * outputScale));
  const panelContext = panel.getContext("2d")!;
  panelContext.scale(outputScale, outputScale);
  drawPanel(panelContext, image, localizeLayout(layout), settings);
  drawWarpedPanel(ctx, panel, frame, panelTransform.forward, outputScale);
}

function drawImageInViewport(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  layout: ComputedLayout,
  radius: number,
): void {
  ctx.save();
  roundedRectPath(
    ctx,
    layout.viewport.x,
    layout.viewport.y,
    layout.viewport.width,
    layout.viewport.height,
    radius,
  );
  ctx.clip();
  ctx.drawImage(image, layout.source.x, layout.source.y, layout.source.width, layout.source.height);
  ctx.restore();
}

function drawDesktopFrame(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  layout: ComputedLayout,
  settings: Settings,
): void {
  const { frame, viewport, headerHeight } = layout;
  const radius = frameRadius(settings, frame);
  ctx.save();
  roundedRectPath(ctx, frame.x, frame.y, frame.width, frame.height, radius);
  ctx.clip();
  ctx.fillStyle = "#16181d";
  ctx.fillRect(frame.x, frame.y, frame.width, frame.height);
  ctx.fillStyle = "#202329";
  ctx.fillRect(frame.x, frame.y, frame.width, headerHeight);
  ctx.strokeStyle = "rgba(255,255,255,.1)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(frame.x, frame.y + headerHeight - 0.5);
  ctx.lineTo(frame.x + frame.width, frame.y + headerHeight - 0.5);
  ctx.stroke();

  const controlR = clamp(headerHeight * 0.095, 3.5, 6.5);
  const controlX = frame.x + headerHeight * 0.42;
  const controlY = frame.y + headerHeight / 2;
  ["#ff5f57", "#febc2e", "#28c840"].forEach((color, index) => {
    ctx.beginPath();
    ctx.fillStyle = color;
    ctx.arc(controlX + index * controlR * 2.7, controlY, controlR, 0, Math.PI * 2);
    ctx.fill();
  });

  if (settings.frame.type === "browser" && settings.frame.showUrl) {
    const pillW = Math.min(frame.width * 0.54, 460);
    const pillH = headerHeight * 0.56;
    const pillX = frame.x + (frame.width - pillW) / 2;
    const pillY = frame.y + (headerHeight - pillH) / 2;
    roundedRectPath(ctx, pillX, pillY, pillW, pillH, pillH / 2);
    ctx.fillStyle = "#14161a";
    ctx.fill();
    drawChromeText(
      ctx,
      settings.frame.url,
      pillX + pillH * 0.55,
      controlY,
      pillH * 0.34,
      pillW - pillH,
    );
  }

  if (settings.frame.type === "window" && settings.frame.showTitle) {
    const maxWidth = Math.max(40, frame.width - headerHeight * 4.5);
    drawChromeText(
      ctx,
      settings.frame.title,
      frame.x + frame.width / 2,
      controlY,
      headerHeight * 0.25,
      maxWidth,
      "center",
    );
  }

  ctx.save();
  ctx.beginPath();
  ctx.rect(viewport.x, viewport.y, viewport.width, viewport.height);
  ctx.clip();
  ctx.drawImage(image, layout.source.x, layout.source.y, layout.source.width, layout.source.height);
  ctx.restore();

  ctx.strokeStyle = "rgba(255,255,255,.14)";
  ctx.lineWidth = 1;
  roundedRectPath(ctx, frame.x + 0.5, frame.y + 0.5, frame.width - 1, frame.height - 1, radius);
  ctx.stroke();
  ctx.restore();
}

function drawPhoneFrame(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  layout: ComputedLayout,
  settings: Settings,
): void {
  const { frame, viewport } = layout;
  const outerRadius = frameRadius(settings, frame);
  const innerRadius = Math.max(12, outerRadius * 0.76);
  ctx.save();
  roundedRectPath(ctx, frame.x, frame.y, frame.width, frame.height, outerRadius);
  ctx.fillStyle = "#111318";
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,.22)";
  ctx.lineWidth = Math.max(1, frame.width * 0.006);
  ctx.stroke();

  ctx.save();
  roundedRectPath(ctx, viewport.x, viewport.y, viewport.width, viewport.height, innerRadius);
  ctx.clip();
  ctx.drawImage(image, layout.source.x, layout.source.y, layout.source.width, layout.source.height);
  ctx.restore();

  const pillW = viewport.width * 0.28;
  const pillH = Math.max(8, viewport.width * 0.075);
  roundedRectPath(
    ctx,
    viewport.x + (viewport.width - pillW) / 2,
    viewport.y + pillH * 0.45,
    pillW,
    pillH,
    pillH / 2,
  );
  ctx.fillStyle = "#08090b";
  ctx.fill();
  ctx.restore();
}

function drawChromeText(
  ctx: CanvasRenderingContext2D,
  value: string,
  x: number,
  y: number,
  size: number,
  maxWidth: number,
  align: CanvasTextAlign = "left",
): void {
  ctx.save();
  ctx.font = `500 ${Math.max(8, size)}px ui-sans-serif, system-ui, sans-serif`;
  ctx.textBaseline = "middle";
  ctx.textAlign = align;
  ctx.fillStyle = "rgba(255,255,255,.68)";
  ctx.fillText(value || " ", x, y, maxWidth);
  ctx.restore();
}

function frameRadius(settings: Settings, frame: Rect): number {
  if (settings.frame.type === "phone") return Math.min(frame.width * 0.115, 58);
  if (settings.frame.type === "browser" || settings.frame.type === "window") {
    return Math.max(12, Math.min(settings.radius, 30));
  }
  return settings.radius;
}

function roundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void {
  const r = Math.max(0, Math.min(radius, width / 2, height / 2));
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function projectedRoundedRectPath(
  ctx: CanvasRenderingContext2D,
  frame: Rect,
  radius: number,
  matrix: ProjectiveMatrix,
): void {
  const points = roundedRectPoints(frame, radius).map((point) => mapProjectivePoint(matrix, point));
  const first = points[0];
  if (!first) return;
  ctx.beginPath();
  ctx.moveTo(first.x, first.y);
  for (const point of points.slice(1)) {
    if (point) ctx.lineTo(point.x, point.y);
  }
  ctx.closePath();
}

function roundedRectPoints(frame: Rect, radius: number): Point[] {
  const r = Math.max(0, Math.min(radius, frame.width / 2, frame.height / 2));
  if (r === 0) {
    return [
      { x: frame.x, y: frame.y },
      { x: frame.x + frame.width, y: frame.y },
      { x: frame.x + frame.width, y: frame.y + frame.height },
      { x: frame.x, y: frame.y + frame.height },
    ];
  }
  const points: Point[] = [];
  const corners = [
    { x: frame.x + frame.width - r, y: frame.y + r, start: -Math.PI / 2 },
    { x: frame.x + frame.width - r, y: frame.y + frame.height - r, start: 0 },
    { x: frame.x + r, y: frame.y + frame.height - r, start: Math.PI / 2 },
    { x: frame.x + r, y: frame.y + r, start: Math.PI },
  ];
  for (const corner of corners) {
    for (let step = 0; step <= 8; step += 1) {
      const angle = corner.start + (Math.PI / 2) * (step / 8);
      points.push({ x: corner.x + Math.cos(angle) * r, y: corner.y + Math.sin(angle) * r });
    }
  }
  return points;
}

function shadowOffset(settings: Settings): Point {
  const distance = clamp(settings.shadowDistance, 0, 80);
  if (!settings.directionalShadow) return { x: 0, y: distance };
  const depth = clamp(settings.perspective, 0, 1);
  const pitch = degreesToRadians(clamp(settings.tiltX, -30, 30) * depth);
  const yaw = degreesToRadians(clamp(settings.tiltY, -30, 30) * depth);
  return {
    x: Math.sin(yaw) * distance,
    y: (Math.cos(yaw) - Math.sin(pitch)) * distance,
  };
}

function drawWarpedPanel(
  ctx: CanvasRenderingContext2D,
  panel: HTMLCanvasElement,
  frame: Rect,
  matrix: ProjectiveMatrix,
  outputScale: number,
): void {
  const columns = Math.round(clamp(Math.ceil(frame.width / 64), 8, 32));
  const rows = Math.round(clamp(Math.ceil(frame.height / 64), 8, 32));
  const cellWidth = frame.width / columns;
  const cellHeight = frame.height / rows;

  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const x0 = column * cellWidth;
      const y0 = row * cellHeight;
      const x1 = column === columns - 1 ? frame.width : x0 + cellWidth;
      const y1 = row === rows - 1 ? frame.height : y0 + cellHeight;
      const source = [
        { x: x0 * outputScale, y: y0 * outputScale },
        { x: x1 * outputScale, y: y0 * outputScale },
        { x: x1 * outputScale, y: y1 * outputScale },
        { x: x0 * outputScale, y: y1 * outputScale },
      ] as const;
      const destination = [
        mapProjectivePoint(matrix, { x: frame.x + x0, y: frame.y + y0 }),
        mapProjectivePoint(matrix, { x: frame.x + x1, y: frame.y + y0 }),
        mapProjectivePoint(matrix, { x: frame.x + x1, y: frame.y + y1 }),
        mapProjectivePoint(matrix, { x: frame.x + x0, y: frame.y + y1 }),
      ] as const;
      if (destination.some((point) => point === null)) continue;
      const points = destination as readonly [Point, Point, Point, Point];
      drawTexturedTriangle(
        ctx,
        panel,
        [source[0], source[1], source[2]],
        [points[0], points[1], points[2]],
        outputScale,
      );
      drawTexturedTriangle(
        ctx,
        panel,
        [source[0], source[2], source[3]],
        [points[0], points[2], points[3]],
        outputScale,
      );
    }
  }
}

function drawTexturedTriangle(
  ctx: CanvasRenderingContext2D,
  panel: HTMLCanvasElement,
  source: readonly [Point, Point, Point],
  destination: readonly [Point, Point, Point],
  outputScale: number,
): void {
  const [s0, s1, s2] = source;
  const [d0, d1, d2] = destination;
  const determinant = s0.x * (s1.y - s2.y) + s1.x * (s2.y - s0.y) + s2.x * (s0.y - s1.y);
  if (Math.abs(determinant) < 1e-9) return;
  const a = (d0.x * (s1.y - s2.y) + d1.x * (s2.y - s0.y) + d2.x * (s0.y - s1.y)) / determinant;
  const c = (d0.x * (s2.x - s1.x) + d1.x * (s0.x - s2.x) + d2.x * (s1.x - s0.x)) / determinant;
  const e =
    (d0.x * (s1.x * s2.y - s2.x * s1.y) +
      d1.x * (s2.x * s0.y - s0.x * s2.y) +
      d2.x * (s0.x * s1.y - s1.x * s0.y)) /
    determinant;
  const b = (d0.y * (s1.y - s2.y) + d1.y * (s2.y - s0.y) + d2.y * (s0.y - s1.y)) / determinant;
  const d = (d0.y * (s2.x - s1.x) + d1.y * (s0.x - s2.x) + d2.y * (s1.x - s0.x)) / determinant;
  const f =
    (d0.y * (s1.x * s2.y - s2.x * s1.y) +
      d1.y * (s2.x * s0.y - s0.x * s2.y) +
      d2.y * (s0.x * s1.y - s1.x * s0.y)) /
    determinant;
  // Canvas antialiases each clipped triangle independently. A one-pixel overlap
  // keeps the background from showing through their shared edges.
  const clip = expandTriangle(destination, 1.25 / Math.max(0.1, outputScale));

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(clip[0].x, clip[0].y);
  ctx.lineTo(clip[1].x, clip[1].y);
  ctx.lineTo(clip[2].x, clip[2].y);
  ctx.closePath();
  ctx.clip();
  ctx.transform(a, b, c, d, e, f);
  ctx.drawImage(panel, 0, 0);
  ctx.restore();
}

function expandTriangle(
  points: readonly [Point, Point, Point],
  amount: number,
): [Point, Point, Point] {
  const center = {
    x: (points[0].x + points[1].x + points[2].x) / 3,
    y: (points[0].y + points[1].y + points[2].y) / 3,
  };
  return points.map((point) => {
    const dx = point.x - center.x;
    const dy = point.y - center.y;
    const length = Math.hypot(dx, dy) || 1;
    return { x: point.x + (dx / length) * amount, y: point.y + (dy / length) * amount };
  }) as [Point, Point, Point];
}

function localizeLayout(layout: ComputedLayout): ComputedLayout {
  const offsetX = layout.frame.x;
  const offsetY = layout.frame.y;
  const translate = (rect: Rect): Rect => ({ ...rect, x: rect.x - offsetX, y: rect.y - offsetY });
  return {
    ...layout,
    canvas: { width: layout.frame.width, height: layout.frame.height },
    frame: translate(layout.frame),
    viewport: translate(layout.viewport),
    source: translate(layout.source),
  };
}

function rectToQuadMatrix(
  frame: Rect,
  quad: readonly [Point, Point, Point, Point],
): ProjectiveMatrix {
  const [topLeft, topRight, bottomRight, bottomLeft] = quad;
  const dx1 = topRight.x - bottomRight.x;
  const dx2 = bottomLeft.x - bottomRight.x;
  const dx3 = topLeft.x - topRight.x + bottomRight.x - bottomLeft.x;
  const dy1 = topRight.y - bottomRight.y;
  const dy2 = bottomLeft.y - bottomRight.y;
  const dy3 = topLeft.y - topRight.y + bottomRight.y - bottomLeft.y;
  const denominator = dx1 * dy2 - dx2 * dy1;
  const g = Math.abs(denominator) < 1e-9 ? 0 : (dx3 * dy2 - dx2 * dy3) / denominator;
  const h = Math.abs(denominator) < 1e-9 ? 0 : (dx1 * dy3 - dx3 * dy1) / denominator;
  const unitToQuad: ProjectiveMatrix = [
    topRight.x - topLeft.x + g * topRight.x,
    bottomLeft.x - topLeft.x + h * bottomLeft.x,
    topLeft.x,
    topRight.y - topLeft.y + g * topRight.y,
    bottomLeft.y - topLeft.y + h * bottomLeft.y,
    topLeft.y,
    g,
    h,
    1,
  ];
  const rectToUnit: ProjectiveMatrix = [
    1 / frame.width,
    0,
    -frame.x / frame.width,
    0,
    1 / frame.height,
    -frame.y / frame.height,
    0,
    0,
    1,
  ];
  return multiplyProjectiveMatrices(unitToQuad, rectToUnit);
}

function multiplyProjectiveMatrices(a: ProjectiveMatrix, b: ProjectiveMatrix): ProjectiveMatrix {
  const result: number[] = [];
  for (let row = 0; row < 3; row += 1) {
    for (let column = 0; column < 3; column += 1) {
      result.push(
        a[row * 3] * b[column] + a[row * 3 + 1] * b[column + 3] + a[row * 3 + 2] * b[column + 6],
      );
    }
  }
  return result as unknown as ProjectiveMatrix;
}

function invertProjectiveMatrix(matrix: ProjectiveMatrix): ProjectiveMatrix | null {
  const [a, b, c, d, e, f, g, h, i] = matrix;
  const determinant = a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g);
  if (Math.abs(determinant) < 1e-12) return null;
  return [
    (e * i - f * h) / determinant,
    (c * h - b * i) / determinant,
    (b * f - c * e) / determinant,
    (f * g - d * i) / determinant,
    (a * i - c * g) / determinant,
    (c * d - a * f) / determinant,
    (d * h - e * g) / determinant,
    (b * g - a * h) / determinant,
    (a * e - b * d) / determinant,
  ];
}

function pointBounds(points: readonly Point[]): Rect {
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  return { x, y, width: Math.max(...xs) - x, height: Math.max(...ys) - y };
}

function parseHexColor(value: string): { r: number; g: number; b: number } {
  const match = /^#([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(value);
  if (!match) return { r: 0, g: 0, b: 0 };
  return {
    r: Number.parseInt(match[1], 16),
    g: Number.parseInt(match[2], 16),
    b: Number.parseInt(match[3], 16),
  };
}

function degreesToRadians(value: number): number {
  return (value * Math.PI) / 180;
}

const IDENTITY_MATRIX: ProjectiveMatrix = [1, 0, 0, 0, 1, 0, 0, 0, 1];

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
