import type { ThemeMode } from "../hooks/useTheme.ts";
import { classes } from "./styles.ts";

interface ThemeToggleProps {
  mode: ThemeMode;
  onChange: (mode: ThemeMode) => void;
}

interface Option {
  value: ThemeMode;
  label: string;
  icon: React.ReactNode;
}

// 16px viewBox, 1.4 stroke: matches the weight of the GitHub mark beside it.
const OPTIONS: Option[] = [
  {
    value: "system",
    label: "System theme",
    icon: (
      <>
        <rect x="2.2" y="3" width="11.6" height="8" rx="1.4" />
        <path d="M5.5 13.4h5" />
      </>
    ),
  },
  {
    value: "light",
    label: "Light theme",
    icon: (
      <>
        <circle cx="8" cy="8" r="3.1" />
        <path d="M8 1.4v1.5M8 13.1v1.5M2.35 2.35l1.06 1.06M12.59 12.59l1.06 1.06M1.4 8h1.5M13.1 8h1.5M2.35 13.65l1.06-1.06M12.59 3.41l1.06-1.06" />
      </>
    ),
  },
  {
    value: "dark",
    label: "Dark theme",
    icon: <path d="M13.4 9.6A5.8 5.8 0 0 1 6.4 2.6a5.8 5.8 0 1 0 7 7Z" />,
  },
];

/**
 * Three-way editor theme control. `system` is a real state rather than an
 * implicit default, so a user can hand the choice back to the OS after pinning
 * one — which a two-state switch cannot express.
 */
export function ThemeToggle({ mode, onChange }: ThemeToggleProps) {
  return (
    <div
      role="group"
      aria-label="Editor theme"
      className="flex items-center gap-0.5 rounded-[10px] border border-line bg-surface-raised p-0.5"
    >
      {OPTIONS.map((option) => {
        const isSelected = option.value === mode;
        return (
          <button
            key={option.value}
            type="button"
            aria-label={option.label}
            aria-pressed={isSelected}
            onClick={() => onChange(option.value)}
            className={classes(
              `grid size-[30px] max-sm:size-[26px] cursor-pointer place-content-center rounded-lg
               border border-transparent transition-[background-color,border-color,color] duration-150`,
              isSelected
                ? "border-accent-line bg-accent/8 text-accent-ink"
                : "text-muted hover:bg-surface-soft hover:text-text",
            )}
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 16 16"
              className="size-4 shrink-0 fill-none stroke-current"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {option.icon}
            </svg>
          </button>
        );
      })}
    </div>
  );
}
