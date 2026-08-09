import type { FrameType } from "../../lib/beautifier.ts";
import { useSettings, useSettingsDispatch } from "../../state/SettingsContext.tsx";
import { ControlSection } from "./ControlSection.tsx";
import { OptionGrid, type Option } from "./OptionGrid.tsx";
import { Toggle } from "./Toggle.tsx";

const FRAMES: readonly Option<FrameType>[] = [
  { value: "none", label: "None" },
  { value: "browser", label: "Browser" },
  { value: "window", label: "Window" },
  { value: "phone", label: "Phone" },
];

const FIELD_GROUP =
  "flex flex-col gap-[11px] rounded-[10px] border border-line bg-surface-tint p-3";

const TEXT_INPUT =
  "h-[35px] w-full rounded-[7px] border border-line bg-surface px-2.5 text-[11px] text-text " +
  "outline-none focus:border-accent-line";

export function FramePanel() {
  const { frame } = useSettings();
  const dispatch = useSettingsDispatch();

  return (
    <ControlSection index="02" title="Frame">
      <OptionGrid
        columns="grid-cols-4 max-sm:grid-cols-2"
        options={FRAMES}
        selected={frame.type}
        ariaLabel="Frame style"
        onSelect={(value) => dispatch({ type: "setFrameType", value })}
      />

      {frame.type === "browser" && (
        <div className={FIELD_GROUP}>
          <label className="flex flex-col gap-[7px] text-[11px] text-muted">
            <span>Browser URL</span>
            <input
              type="text"
              maxLength={80}
              className={TEXT_INPUT}
              value={frame.url}
              onChange={(event) =>
                dispatch({ type: "patchFrame", patch: { url: event.target.value } })
              }
            />
          </label>
          <Toggle
            label="Show address"
            checked={frame.showUrl}
            onChange={(showUrl) => dispatch({ type: "patchFrame", patch: { showUrl } })}
          />
        </div>
      )}

      {frame.type === "window" && (
        <div className={FIELD_GROUP}>
          <label className="flex flex-col gap-[7px] text-[11px] text-muted">
            <span>Window title</span>
            <input
              type="text"
              maxLength={80}
              className={TEXT_INPUT}
              value={frame.title}
              onChange={(event) =>
                dispatch({ type: "patchFrame", patch: { title: event.target.value } })
              }
            />
          </label>
          <Toggle
            label="Show title"
            checked={frame.showTitle}
            onChange={(showTitle) => dispatch({ type: "patchFrame", patch: { showTitle } })}
          />
        </div>
      )}
    </ControlSection>
  );
}
