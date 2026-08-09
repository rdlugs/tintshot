interface ToggleProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

/** An accessible checkbox presented as a compact sliding switch. */
export function Toggle({ label, checked, onChange }: ToggleProps) {
  return (
    <label className="relative flex cursor-pointer items-center gap-2 text-[11px] text-muted">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="peer pointer-events-none absolute opacity-0"
      />
      <span
        className="h-4 w-7 rounded-full bg-track p-0.5 transition-colors duration-150
          peer-checked:bg-accent-line
          after:block after:size-3 after:rounded-full after:bg-knob
          after:transition-[transform,background-color] after:duration-150
          peer-checked:after:translate-x-3 peer-checked:after:bg-accent"
      />
      {label}
    </label>
  );
}
