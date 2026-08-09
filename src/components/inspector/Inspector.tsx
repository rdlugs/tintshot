import type { RefObject } from "react";
import type { Size } from "../../lib/beautifier.ts";
import { gradientFromImage } from "../../lib/colors.ts";
import { useSettingsDispatch } from "../../state/SettingsContext.tsx";
import { eyebrow } from "../styles.ts";
import { BackgroundPanel } from "./BackgroundPanel.tsx";
import { ExportPanel } from "./ExportPanel.tsx";
import { FramePanel } from "./FramePanel.tsx";
import { LayoutPanel } from "./LayoutPanel.tsx";
import { TiltShadowPanel } from "./TiltShadowPanel.tsx";

interface InspectorProps {
  image: HTMLImageElement;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  sourceSize: Size;
  fileName: string;
  onNotify: (message: string, isError?: boolean) => void;
}

export function Inspector({ image, canvasRef, sourceSize, fileName, onNotify }: InspectorProps) {
  const dispatch = useSettingsDispatch();

  const resetAll = () => {
    dispatch({ type: "resetAll", gradient: gradientFromImage(image) });
    onNotify("Editor settings reset");
  };

  return (
    <aside
      aria-label="Editing controls"
      // On desktop the inspector is the only scrolling pane, so the preview
      // stays put while the controls move.
      className="min-w-0 border-l border-line bg-surface-sunken
        lg:min-h-0 lg:overflow-x-hidden lg:overflow-y-auto lg:overscroll-y-contain
        max-lg:border-t max-lg:border-l-0"
    >
      <div
        className="flex h-[91px] items-center justify-between border-b border-line px-[22px] pt-6 pb-[18px]
          max-lg:mx-auto max-lg:w-[min(680px,calc(100%-32px))] max-lg:px-0
          max-sm:w-[calc(100%-28px)]"
      >
        <div>
          <span className={eyebrow}>Inspector</span>
          <h2 className="mt-[5px] text-[17px] tracking-[-0.02em]">Make it yours</h2>
        </div>
        <button
          type="button"
          title="Reset all settings"
          aria-label="Reset all settings"
          onClick={resetAll}
          className="size-[34px] cursor-pointer rounded-[9px] border border-line bg-surface-raised
            text-muted hover:border-line-strong hover:text-text"
        >
          ↺
        </button>
      </div>

      <BackgroundPanel image={image} onNotify={onNotify} />
      <FramePanel />
      <LayoutPanel />
      <TiltShadowPanel />
      <ExportPanel
        canvasRef={canvasRef}
        sourceSize={sourceSize}
        fileName={fileName}
        onNotify={onNotify}
      />
    </aside>
  );
}
