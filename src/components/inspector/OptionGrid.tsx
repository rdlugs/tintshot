import { classes, optionButton, optionButtonSelected } from "../styles.ts";

export interface Option<T extends string> {
  value: T;
  label: string;
}

interface OptionGridProps<T extends string> {
  /** Grid template for this particular picker. */
  columns: string;
  options: readonly Option<T>[];
  selected: T;
  buttonClassName?: string;
  ariaLabel?: string;
  onSelect: (value: T) => void;
}

/** A row of mutually exclusive buttons behaving like a toggle group. */
export function OptionGrid<T extends string>({
  columns,
  options,
  selected,
  buttonClassName,
  ariaLabel,
  onSelect,
}: OptionGridProps<T>) {
  return (
    <div className={`grid gap-1.5 ${columns}`} aria-label={ariaLabel}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={option.value === selected}
          onClick={() => onSelect(option.value)}
          className={classes(
            optionButton,
            buttonClassName,
            option.value === selected && optionButtonSelected,
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
