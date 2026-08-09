// Class strings shared by more than one component. Keeping them here means a
// button restyle happens in one place instead of five JSX files.

export const button =
  "min-h-10 cursor-pointer rounded-[10px] border border-transparent px-4 text-[13px] font-[650] " +
  "transition-[transform,border-color,background-color] duration-150 enabled:active:translate-y-px";

// The accent border is load-bearing in light mode: yellow on a white surface
// has no usable edge contrast on its own.
export const buttonPrimary = `${button} border-accent-line bg-accent text-accent-dark enabled:hover:bg-accent-hover`;

export const buttonSecondary =
  `${button} border-line bg-surface-raised text-text ` +
  "enabled:hover:border-line-strong enabled:hover:bg-surface-soft";

/** The small bordered buttons used by the frame, ratio, and scale pickers. */
export const optionButton =
  "h-[34px] min-w-0 cursor-pointer rounded-lg border border-line bg-surface-raised px-[5px] " +
  "text-[12px] text-muted enabled:hover:border-line-strong enabled:hover:text-text";

export const optionButtonSelected = "border-accent-line bg-accent/8 text-accent-ink";

/** Uppercase micro-label above a control or panel. */
export const eyebrow =
  "block text-[12px] leading-[1.2] font-[760] tracking-[0.17em] text-accent-ink uppercase";

/** Row holding a control's name and its current value. */
export const fieldLabel =
  "flex min-h-4 items-center justify-between text-[12px] font-[650] tracking-[0.03em] text-muted";

export const fieldLabelOutput = "font-mono text-faint";

export function classes(...values: (string | false | null | undefined)[]): string {
  return values.filter(Boolean).join(" ");
}
