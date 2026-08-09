import { useSettings, useSettingsDispatch } from "../../state/SettingsContext.tsx";
import { fieldLabel } from "../styles.ts";
import { ColorField } from "./ColorField.tsx";
import { ControlSection } from "./ControlSection.tsx";
import { RangeField } from "./RangeField.tsx";
import { Toggle } from "./Toggle.tsx";

export function TiltShadowPanel() {
  const settings = useSettings();
  const dispatch = useSettingsDispatch();

  return (
    <ControlSection index="04" title="3D Tilt & Shadow">
      <div className="flex flex-col gap-[9px]">
        <div className={fieldLabel}>
          <span>Transform</span>
          <button
            type="button"
            aria-label="Reset 3D tilt and shadow"
            onClick={() => dispatch({ type: "resetTiltShadow" })}
            className="cursor-pointer border-0 bg-none p-0 text-[11px] text-accent-ink"
          >
            Reset
          </button>
        </div>
        <RangeField
          compact
          label="Tilt X"
          min={-30}
          max={30}
          step={1}
          value={settings.tiltX}
          display={`${settings.tiltX}°`}
          onChange={(value) => dispatch({ type: "setTiltX", value })}
        />
        <RangeField
          compact
          label="Tilt Y"
          min={-30}
          max={30}
          step={1}
          value={settings.tiltY}
          display={`${settings.tiltY}°`}
          onChange={(value) => dispatch({ type: "setTiltY", value })}
        />
        <RangeField
          compact
          label="Rotate"
          min={-15}
          max={15}
          step={1}
          value={settings.rotation}
          display={`${settings.rotation}°`}
          onChange={(value) => dispatch({ type: "setRotation", value })}
        />
        <RangeField
          compact
          label="3D Zoom"
          min={1}
          max={2}
          step={0.01}
          value={settings.panelZoom}
          display={`${Math.round(settings.panelZoom * 100)}%`}
          onChange={(value) => dispatch({ type: "setPanelZoom", value })}
        />
        <RangeField
          compact
          label="Perspective"
          min={0}
          max={1}
          step={0.01}
          value={settings.perspective}
          display={`${Math.round(settings.perspective * 100)}%`}
          onChange={(value) => dispatch({ type: "setPerspective", value })}
        />
      </div>

      <RangeField
        label="Shadow"
        min={0}
        max={1}
        step={0.02}
        value={settings.shadow}
        display={`${Math.round(settings.shadow * 100)}%`}
        onChange={(value) => dispatch({ type: "setShadow", value })}
      />
      <RangeField
        label="Distance"
        min={0}
        max={80}
        step={1}
        value={settings.shadowDistance}
        display={`${settings.shadowDistance}px`}
        onChange={(value) => dispatch({ type: "setShadowDistance", value })}
      />
      <RangeField
        label="Blur"
        min={0}
        max={80}
        step={1}
        value={settings.shadowBlur}
        display={`${settings.shadowBlur}px`}
        onChange={(value) => dispatch({ type: "setShadowBlur", value })}
      />
      <Toggle
        label="Follow tilt"
        checked={settings.directionalShadow}
        onChange={(value) => dispatch({ type: "setDirectionalShadow", value })}
      />
      <ColorField
        label="Shadow"
        ariaLabel="Shadow color"
        value={settings.shadowColor}
        onChange={(value) => dispatch({ type: "setShadowColor", value })}
      />
    </ControlSection>
  );
}
