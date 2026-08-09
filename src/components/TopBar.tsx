import type { ThemeMode } from "../hooks/useTheme.ts";
import { buttonSecondary } from "./styles.ts";
import { ThemeToggle } from "./ThemeToggle.tsx";

interface TopBarProps {
  /** Only offered once a screenshot is loaded. */
  onNewImage?: () => void;
  themeMode: ThemeMode;
  onThemeChange: (mode: ThemeMode) => void;
}

export function TopBar({ onNewImage, themeMode, onThemeChange }: TopBarProps) {
  return (
    <header
      className="relative z-20 flex h-[68px] max-sm:h-[60px] shrink-0 items-center justify-between
        border-b border-line-soft bg-bg/85 px-[clamp(18px,3vw,44px)] backdrop-blur-[18px]"
    >
      <a
        href="#"
        aria-label="Tintshot home"
        className="inline-flex items-center text-[19px] font-[720] tracking-[-0.045em] text-text no-underline"
      >
        <span
          aria-hidden="true"
          className="mr-[10px] grid size-[27px] -rotate-3 place-content-center gap-[2px] rounded-lg bg-accent"
        >
          <i className="ml-1 block h-[3px] w-[9px] rounded-[3px] bg-accent-dark" />
          <i className="block h-[3px] w-[13px] rounded-[3px] bg-accent-dark" />
        </span>
        tintshot<span className="text-accent-ink">.</span>
      </a>

      <div className="flex items-center gap-3">
        <span className="flex items-center gap-3 text-xs text-muted max-sm:hidden">
          <span className="size-[6px] rounded-full bg-[#69c98d] shadow-[0_0_0_4px_rgba(105,201,141,0.1)]" />
          Private by design
        </span>
        <ThemeToggle mode={themeMode} onChange={onThemeChange} />
        <a
          href="https://github.com/rdlugs/tintshot"
          target="_blank"
          rel="noreferrer"
          aria-label="View Tintshot on GitHub"
          className={`${buttonSecondary} inline-flex items-center gap-2.5 no-underline max-sm:min-h-[35px] max-sm:px-2.5`}
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4 shrink-0 fill-current">
            <path d="M12 .7a11.5 11.5 0 0 0-3.6 22.4c.6.1.8-.3.8-.6v-2.2c-3.3.7-4-1.4-4-1.4-.5-1.4-1.3-1.7-1.3-1.7-1.1-.8.1-.8.1-.8 1.2.1 1.8 1.2 1.8 1.2 1.1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-5.7 0-1.3.5-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.2 1.2a11 11 0 0 1 5.8 0C14 5 15 5.2 15 5.2c.6 1.6.2 2.8.1 3.1.8.8 1.2 1.8 1.2 3.1 0 4.4-2.8 5.4-5.5 5.7.4.4.8 1.1.8 2.2v3.2c0 .3.2.7.8.6A11.5 11.5 0 0 0 12 .7Z" />
          </svg>
          <span className="max-sm:hidden">GitHub</span>
        </a>
        {onNewImage && (
          <button
            type="button"
            onClick={onNewImage}
            className={`${buttonSecondary} max-sm:min-h-[35px] max-sm:px-3`}
          >
            New image
          </button>
        )}
      </div>
    </header>
  );
}
