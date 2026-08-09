// Small shared value helpers used by both the editor state and the UI.

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

/** Strip the extension from a file name, falling back to a usable stem. */
export function fileStem(name: string): string {
  const stem = name.replace(/\.[^.]+$/, "").trim();
  return stem || "screenshot";
}
