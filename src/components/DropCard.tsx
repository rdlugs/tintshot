import { useRef, useState, type DragEvent, type KeyboardEvent } from "react";
import { buttonPrimary, classes } from "./styles.ts";

interface DropCardProps {
  onFile: (file: File) => void;
}

export function DropCard({ onFile }: DropCardProps) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [isOver, setIsOver] = useState(false);

  const openPicker = () => fileInput.current?.click();

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsOver(false);
    const file = event.dataTransfer.files[0];
    if (file) onFile(file);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openPicker();
    }
  };

  return (
    <div
      tabIndex={0}
      role="button"
      aria-label="Choose or drop a screenshot"
      onClick={openPicker}
      onKeyDown={handleKeyDown}
      onDragEnter={(event) => {
        event.preventDefault();
        setIsOver(true);
      }}
      onDragOver={(event) => {
        event.preventDefault();
        setIsOver(true);
      }}
      onDragLeave={(event) => {
        event.preventDefault();
        setIsOver(false);
      }}
      onDrop={handleDrop}
      className={classes(
        `relative flex min-h-[500px] max-lg:min-h-[450px] max-sm:min-h-[410px] cursor-pointer
         flex-col items-center justify-center overflow-hidden rounded-card border border-dashed
         border-line-strong p-[34px] max-sm:px-[18px] max-sm:py-[26px] text-center
         bg-[radial-gradient(circle_at_50%_15%,rgba(220,231,90,0.07),transparent_46%)]
         transition-[border-color,background-color,transform] duration-150
         hover:-translate-y-0.5 hover:border-accent-ink hover:bg-accent/[0.035]`,
        // The dot texture sits above the card background but below the content.
        "after:pointer-events-none after:absolute after:inset-0 after:opacity-24 after:dot-grid-fade",
        isOver ? "-translate-y-0.5 border-accent-ink bg-accent/[0.035]" : "bg-surface/65",
      )}
    >
      <div
        aria-hidden="true"
        className="mb-7 h-[148px] w-[210px] max-sm:h-[126px] max-sm:w-[180px] -rotate-3
          rounded-card bg-linear-[135deg,#5969d9,#252944] p-[22px]
          shadow-[0_24px_50px_var(--color-shadow)]"
      >
        <div className="size-full overflow-hidden rounded-lg bg-[#e8e9ed] shadow-[0_10px_24px_rgba(13,15,27,0.35)]">
          <div className="flex h-[18px] items-center gap-1 bg-[#282b32] pl-[7px]">
            <i className="size-1 rounded-full bg-[#f06e68]" />
            <i className="size-1 rounded-full bg-[#e8bb56]" />
            <i className="size-1 rounded-full bg-[#59bc73]" />
          </div>
          <div className="h-[calc(100%-18px)] bg-linear-[120deg,#f4f4f4_64%,#dcdff7_64%] px-[13px] py-4">
            <span className="mb-2 block h-[11px] w-[30%] rounded bg-[#555a6e]" />
            <span className="mb-2 block h-[7px] w-[55%] rounded bg-[#acaebb]" />
            <span className="mb-2 block h-[7px] w-[55%] rounded bg-[#acaebb]" />
          </div>
        </div>
      </div>

      <div
        aria-hidden="true"
        className="relative z-1 mb-3 grid size-[34px] place-items-center rounded-full
          border border-line-strong text-[19px] text-accent-ink"
      >
        ↑
      </div>
      <h2 className="relative z-1 mb-[7px] text-lg">Drop a screenshot here</h2>
      <p className="relative z-1 mb-[18px] text-[13px] text-muted">
        Paste from clipboard, drag an image, or choose a file
      </p>
      <button
        type="button"
        className={`${buttonPrimary} relative z-1`}
        onClick={(event) => {
          event.stopPropagation();
          openPicker();
        }}
      >
        Choose screenshot
      </button>
      <small className="relative z-1 mt-[13px] text-[10px] text-faint">
        PNG, JPG, WebP, or GIF · stays on your device
      </small>

      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        hidden
        aria-label="Screenshot file"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onFile(file);
          // Reset so picking the same file twice still fires a change event.
          event.target.value = "";
        }}
      />
    </div>
  );
}
