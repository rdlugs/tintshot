import type { CanvasRatio, PlacementMode } from "../../lib/beautifier.ts";
import { useSettings, useSettingsDispatch } from "../../state/SettingsContext.tsx";
import { fieldLabel } from "../styles.ts";
import { ControlSection } from "./ControlSection.tsx";
import { OptionGrid, type Option } from "./OptionGrid.tsx";
import { RangeField } from "./RangeField.tsx";

const RATIOS: readonly Option<CanvasRatio>[] = [
  { value: "original", label: "Original" },
  { value: "1:1", label: "1:1" },
  { value: "4:5", label: "4:5" },
  { value: "16:9", label: "16:9" },
  { value: "9:16", label: "9:16" },
];

const PLACEMENT_MODES: readonly Option<PlacementMode>[] = [
  { value: "fit", label: "Fit" },
  { value: "fill", label: "Fill" },
];

export function LayoutPanel() {
  const settings = useSettings();
  const dispatch = useSettingsDispatch();
  const { placement } = settings;

  return (
    <ControlSection index="03" title="Layout">
      <div className={fieldLabel}>
        <span>Canvas ratio</span>
      </div>
      <OptionGrid
        columns="grid-cols-[1.3fr_repeat(4,1fr)] max-sm:grid-cols-5"
        buttonClassName="max-sm:text-[11px]"
        options={RATIOS}
        selected={settings.canvasRatio}
        ariaLabel="Canvas ratio"
        onSelect={(value) => dispatch({ type: "setCanvasRatio", value })}
      />

      <RangeField
        label="Padding"
        min={0}
        max={0.4}
        step={0.01}
        value={settings.padding}
        display={`${Math.round(settings.padding * 100)}%`}
        onChange={(value) => dispatch({ type: "setPadding", value })}
      />
      <RangeField
        label="Corners"
        min={0}
        max={48}
        step={1}
        value={settings.radius}
        display={`${settings.radius}px`}
        onChange={(value) => dispatch({ type: "setRadius", value })}
      />
      <div className="flex flex-col gap-[9px] pt-0.5">
        <div className={fieldLabel}>
          <span>Image</span>
          <button
            type="button"
            onClick={() => dispatch({ type: "resetPlacement" })}
            className="cursor-pointer border-0 bg-none p-0 text-[11px] text-accent-ink"
          >
            Reset
          </button>
        </div>
        <OptionGrid
          columns="grid-cols-2"
          options={PLACEMENT_MODES}
          selected={placement.mode}
          ariaLabel="Image placement"
          onSelect={(mode) => dispatch({ type: "setPlacement", patch: { mode } })}
        />
        <RangeField
          compact
          label="Zoom"
          min={1}
          max={3}
          step={0.01}
          value={placement.zoom}
          display={`${placement.zoom.toFixed(2)}×`}
          onChange={(zoom) => dispatch({ type: "setPlacement", patch: { zoom } })}
        />
        <RangeField
          compact
          label="Horizontal"
          min={-1}
          max={1}
          step={0.01}
          value={placement.x}
          onChange={(x) => dispatch({ type: "setPlacement", patch: { x } })}
        />
        <RangeField
          compact
          label="Vertical"
          min={-1}
          max={1}
          step={0.01}
          value={placement.y}
          onChange={(y) => dispatch({ type: "setPlacement", patch: { y } })}
        />
      </div>
    </ControlSection>
  );
}
