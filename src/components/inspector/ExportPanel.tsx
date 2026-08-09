import { useEffect, useState, type RefObject } from "react";
import {
  EXPORT_SCALES,
  exportSize,
  isExportSizeSafe,
  largestSafeScale,
  type Size,
} from "../../lib/beautifier.ts";
import { copyPngToClipboard, downloadPng } from "../../lib/exportImage.ts";
import { formatNumber } from "../../lib/format.ts";
import { useSettings, useSettingsDispatch } from "../../state/SettingsContext.tsx";
import {
  buttonPrimary,
  buttonSecondary,
  classes,
  eyebrow,
  optionButton,
  optionButtonSelected,
} from "../styles.ts";

export const OVERSIZED_WARNING =
  "Even a 1× export of this screenshot exceeds the safe 8K / 32 MP browser limit. Reduce the padding, or use a smaller source image.";

export const scaleCapNotice = (scale: number) =>
  `${scale}× is the largest export this screenshot fits inside the safe 8K / 32 MP limit.`;

interface ExportPanelProps {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  sourceSize: Size;
  fileName: string;
  onNotify: (message: string, isError: boolean) => void;
}

export function ExportPanel({ canvasRef, sourceSize, fileName, onNotify }: ExportPanelProps) {
  const settings = useSettings();
  const dispatch = useSettingsDispatch();
  const [busy, setBusy] = useState(false);

  const size = exportSize(sourceSize, settings);
  const selectedIsSafe = isExportSizeSafe(size);
  const safest = largestSafeScale(sourceSize, settings);
  const dimensions = `${formatNumber(size.width)} × ${formatNumber(size.height)} px`;
  // Explain the ceiling whenever the top scale is out of reach, not only right after a change.
  const cappedAt =
    safest !== null && safest < EXPORT_SCALES[EXPORT_SCALES.length - 1] ? safest : null;

  // A frame or ratio change can push the chosen scale past what the browser can allocate.
  // Rather than stranding the editor with Download disabled, fall back to the largest scale
  // that still works.
  useEffect(() => {
    if (safest !== null && !selectedIsSafe) dispatch({ type: "setScale", value: safest });
  }, [dispatch, safest, selectedIsSafe]);

  const run = async (
    action: (canvas: HTMLCanvasElement) => Promise<{ message: string; isError: boolean }>,
  ) => {
    const canvas = canvasRef.current;
    if (!canvas || busy) return;
    setBusy(true);
    try {
      const result = await action(canvas);
      onNotify(result.message, result.isError);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="bg-surface p-[22px] max-sm:px-4
        max-lg:mx-auto max-lg:mb-6 max-lg:w-[min(680px,calc(100%-32px))] max-lg:rounded-b-panel
        max-lg:border max-lg:border-line max-sm:w-[calc(100%-28px)]"
    >
      <div className="mb-3.5 flex items-center justify-between">
        <div className="flex flex-col gap-1.5">
          <span className={eyebrow}>Export PNG</span>
          <strong className="font-mono text-[10px] font-medium text-muted-strong">
            {dimensions}
          </strong>
        </div>
        <div className="flex items-center gap-1" aria-label="Export scale">
          {EXPORT_SCALES.map((scale) => {
            // A scale is offered only if the canvas it would need is allocatable.
            const safe = isExportSizeSafe(exportSize(sourceSize, { ...settings, scale }));
            return (
              <button
                key={scale}
                type="button"
                disabled={!safe}
                aria-pressed={scale === settings.scale}
                title={
                  safe ? `${scale}× export` : "This scale exceeds the safe browser canvas limit"
                }
                onClick={() => dispatch({ type: "setScale", value: scale })}
                className={classes(
                  optionButton,
                  "h-[29px] w-[33px]",
                  scale === settings.scale && optionButtonSelected,
                )}
              >
                {scale}×
              </button>
            );
          })}
        </div>
      </div>

      {!selectedIsSafe && (
        <p role="status" className="mt-[-2px] mb-3 text-[9px] leading-[1.45] text-danger">
          {OVERSIZED_WARNING}
        </p>
      )}

      {cappedAt !== null && (
        <p role="status" className="mt-[-2px] mb-3 text-[9px] leading-[1.45] text-muted-strong">
          {scaleCapNotice(cappedAt)}
        </p>
      )}

      <div className="flex items-center gap-[7px]">
        <button
          type="button"
          disabled={!selectedIsSafe}
          onClick={() => run((canvas) => downloadPng(canvas, fileName))}
          className={`${buttonPrimary} flex flex-1 items-center justify-between`}
        >
          Download PNG <span>↓</span>
        </button>
        <button
          type="button"
          disabled={!selectedIsSafe}
          onClick={() => run(copyPngToClipboard)}
          className={buttonSecondary}
        >
          Copy <span className="ml-[7px] font-mono text-[8px] font-medium text-faint">⌘C</span>
        </button>
      </div>
    </div>
  );
}
