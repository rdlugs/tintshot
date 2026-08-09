import type { ReactNode } from "react";

interface ControlSectionProps {
  /** Step number shown before the title, e.g. "01". */
  index: string;
  title: string;
  children: ReactNode;
}

export function ControlSection({ index, title, children }: ControlSectionProps) {
  return (
    <details
      open
      className="group border-b border-line
        max-lg:mx-auto max-lg:w-[min(680px,calc(100%-32px))] max-lg:border-x max-lg:border-x-line
        max-sm:w-[calc(100%-28px)]"
    >
      <summary
        className="flex h-[53px] cursor-pointer list-none items-center justify-between px-[22px]
          max-sm:px-4 text-[13px] font-bold tracking-[0.08em] text-muted-strong uppercase"
      >
        <span>
          <b className="mr-[9px] font-mono text-[11px] font-semibold text-faint">{index}</b> {title}
        </span>
        {/* Chevron: a rotated corner that flips when the section collapses. The
            nudge happens in the rotated frame, so it has to stay one transform
            rather than Tailwind's separate translate and rotate utilities. */}
        <i
          className="size-[7px] border-r border-b border-muted transition-transform duration-150
            [transform:rotate(45deg)_translate(-2px,2px)]
            group-not-open:[transform:rotate(-45deg)]"
        />
      </summary>
      <div className="flex flex-col gap-[15px] px-[22px] pb-[22px] max-sm:px-4">{children}</div>
    </details>
  );
}
