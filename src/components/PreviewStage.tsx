import type { RefObject } from "react";
import { exportSize, type Size } from "../lib/beautifier.ts";
import { formatNumber } from "../lib/format.ts";
import { useCanvasRender } from "../hooks/useCanvasRender.ts";
import { useCropDrag } from "../hooks/useCropDrag.ts";
import { useSettings, useSettingsDispatch } from "../state/SettingsContext.tsx";
import { classes, eyebrow } from "./styles.ts";

interface PreviewStageProps {
  image: HTMLImageElement;
  sourceSize: Size;
  fileName: string;
  canvasRef: RefObject<HTMLCanvasElement | null>;
}

export function PreviewStage({ image, sourceSize, fileName, canvasRef }: PreviewStageProps) {
  const settings = useSettings();
  const dispatch = useSettingsDispatch();
  const layoutRef = useCanvasRender(canvasRef, image, settings);
  const { isDragging, canvasHandlers } = useCropDrag(layoutRef, settings.placement, dispatch);

  const size = exportSize(sourceSize, settings);

  return (
    <div
      className="flex min-w-0 flex-col p-[clamp(22px,3vw,42px)] lg:min-h-0
        max-lg:min-h-[72vh] max-sm:min-h-[auto] max-sm:px-[14px] max-sm:pt-[18px] max-sm:pb-6"
    >
      <div className="mb-4 flex min-h-[42px] items-end justify-between max-sm:items-start">
        <div className="flex flex-col gap-2">
          <span className={eyebrow}>Live preview</span>
          <span className="max-w-[380px] truncate text-[13px] text-muted-strong">{fileName}</span>
        </div>
        <div className="flex items-center gap-[13px] text-[10px] text-faint">
          <span className="max-sm:hidden">Drag image to reposition</span>
          <span className="rounded-md border border-line px-2 py-1.5 font-mono text-muted">
            {formatNumber(size.width)} × {formatNumber(size.height)} px
          </span>
        </div>
      </div>

      <div
        className="stage-checkerboard relative flex-1 overflow-hidden rounded-card border border-line-soft
          min-h-[520px] max-h-[calc(100vh-180px)] lg:min-h-0 lg:max-h-none
          max-lg:min-h-[54vh] max-lg:max-h-[70vh]
          max-sm:min-h-[430px] max-sm:max-h-[62vh] max-sm:rounded-[15px]"
      >
        <div className="absolute inset-[clamp(24px,4vw,64px)] max-sm:inset-[18px] min-h-0 min-w-0">
          <canvas
            ref={canvasRef}
            tabIndex={0}
            aria-label="Image preview. Drag or use arrow keys to reposition the crop."
            className={classes(
              `transparency-checkerboard absolute inset-0 m-auto block h-auto max-h-full w-auto max-w-full touch-none
               rounded-[2px] shadow-[0_22px_70px_var(--color-shadow)]`,
              isDragging ? "cursor-grabbing" : "cursor-grab",
            )}
            {...canvasHandlers}
          />
        </div>
      </div>
    </div>
  );
}
