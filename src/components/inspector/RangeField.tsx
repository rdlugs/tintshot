import { fieldLabel, fieldLabelOutput } from "../styles.ts";

interface RangeFieldProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  /** Formatted readout shown in the <output>; omit for a bare slider. */
  display?: string;
  compact?: boolean;
  onChange: (value: number) => void;
}

export function RangeField({
  label,
  value,
  min,
  max,
  step,
  display,
  compact,
  onChange,
}: RangeFieldProps) {
  const input = (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      aria-label={label}
      aria-valuetext={display}
      onChange={(event) => onChange(Number(event.target.value))}
    />
  );

  if (compact) {
    return (
      <label className="grid grid-cols-[58px_1fr_35px] items-center gap-2 text-[11px] text-muted">
        <span>{label}</span>
        {input}
        {display !== undefined && (
          <output className="text-right font-mono text-[10px] font-medium text-faint">
            {display}
          </output>
        )}
      </label>
    );
  }

  return (
    <label className="flex flex-col gap-2">
      <span className={fieldLabel}>
        <span>{label}</span>
        {display !== undefined && <output className={fieldLabelOutput}>{display}</output>}
      </span>
      {input}
    </label>
  );
}
