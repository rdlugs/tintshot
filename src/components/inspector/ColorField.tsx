interface ColorFieldProps {
  label: string;
  ariaLabel: string;
  value: string;
  onChange: (value: string) => void;
}

export function ColorField({ label, ariaLabel, value, onChange }: ColorFieldProps) {
  return (
    <label
      className="flex h-[46px] min-w-0 items-center gap-2 rounded-[9px] border border-line
        bg-surface-raised px-2 py-1.5"
    >
      <input
        type="color"
        aria-label={ariaLabel}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="size-7 cursor-pointer rounded-md border-0 bg-none p-0"
      />
      <span className="flex min-w-0 flex-col gap-[2px]">
        <small className="text-[10px] text-muted">{label}</small>
        <output className="font-mono text-[11px] font-medium text-muted-strong">
          {value.toUpperCase()}
        </output>
      </span>
    </label>
  );
}
