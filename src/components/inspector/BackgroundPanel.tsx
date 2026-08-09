import { gradientFromImage } from "../../lib/colors.ts";
import { PRESETS } from "../../lib/presets.ts";
import { useSettings, useSettingsDispatch } from "../../state/SettingsContext.tsx";
import { fieldLabel, fieldLabelOutput } from "../styles.ts";
import { ColorField } from "./ColorField.tsx";
import { ControlSection } from "./ControlSection.tsx";
import { RangeField } from "./RangeField.tsx";
import { Toggle } from "./Toggle.tsx";

interface BackgroundPanelProps {
  image: HTMLImageElement | null;
  onNotify: (message: string) => void;
}

export function BackgroundPanel({ image, onNotify }: BackgroundPanelProps) {
  const settings = useSettings();
  const dispatch = useSettingsDispatch();
  const { gradient, transparentBackground } = settings;
  const preview = `linear-gradient(${gradient.angle}deg, ${gradient.from}, ${gradient.to})`;

  const autoTint = () => {
    if (!image) return;
    dispatch({ type: "setGradient", gradient: gradientFromImage(image) });
    onNotify("Palette refreshed from screenshot");
  };

  return (
    <ControlSection index="01" title="Background">
      <Toggle
        label="Remove background color"
        checked={transparentBackground}
        onChange={(value) => dispatch({ type: "setTransparentBackground", value })}
      />

      <fieldset
        disabled={transparentBackground}
        className="flex min-w-0 flex-col gap-[15px] transition-opacity disabled:opacity-40"
      >
        <button
          type="button"
          onClick={autoTint}
          className="flex min-h-[58px] w-full cursor-pointer items-center gap-2.5 rounded-[11px]
            border border-accent-line/60 bg-linear-[100deg,rgba(220,231,90,0.12),rgba(220,231,90,0.035)]
            px-[11px] py-[9px] text-left text-text hover:border-accent-line"
        >
          <span className="text-lg text-accent-ink">✦</span>
          <span className="flex flex-1 flex-col gap-[3px]">
            <strong className="text-xs">Auto tint</strong>
            <small className="text-[11px] text-muted">Extract colors from screenshot</small>
          </span>
          <span
            style={{ background: preview }}
            className="size-[29px] rounded-lg border-2 border-line-soft shadow-[0_5px_13px_var(--color-shadow)]"
          />
        </button>

        <div className={fieldLabel}>
          <span>Palette</span>
          <output className={fieldLabelOutput}>{gradient.angle}°</output>
        </div>

        <div className="grid grid-cols-6 gap-[7px]">
          {PRESETS.map((preset) => (
            <button
              key={preset.name}
              type="button"
              title={preset.name}
              aria-label={`Use ${preset.name} gradient`}
              style={{
                background: `linear-gradient(${preset.angle}deg, ${preset.from}, ${preset.to})`,
              }}
              onClick={() =>
                dispatch({
                  type: "setGradient",
                  gradient: { from: preset.from, to: preset.to, angle: preset.angle },
                })
              }
              className="aspect-square min-w-0 cursor-pointer rounded-lg border border-line-soft p-0
                transition-[transform,box-shadow] duration-100
                hover:-translate-y-0.5 hover:shadow-[0_6px_12px_var(--color-shadow)]"
            />
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <ColorField
            label="From"
            ariaLabel="Gradient start color"
            value={gradient.from}
            onChange={(value) => dispatch({ type: "setGradientColor", key: "from", value })}
          />
          <ColorField
            label="To"
            ariaLabel="Gradient end color"
            value={gradient.to}
            onChange={(value) => dispatch({ type: "setGradientColor", key: "to", value })}
          />
        </div>

        <RangeField
          label="Gradient angle"
          min={0}
          max={360}
          step={1}
          value={gradient.angle}
          display={`${gradient.angle}°`}
          onChange={(value) => dispatch({ type: "setAngle", value })}
        />
      </fieldset>
    </ControlSection>
  );
}
