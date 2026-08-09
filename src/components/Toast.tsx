import type { Toast as ToastValue } from "../hooks/useToast.ts";
import { classes } from "./styles.ts";

export function Toast({ toast }: { toast: ToastValue | null }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={classes(
        `pointer-events-none fixed bottom-6 left-1/2 z-100 max-w-[min(420px,calc(100vw-32px))]
         -translate-x-1/2 rounded-[10px] border px-[15px] py-[11px] text-[11px]
         shadow-[0_14px_38px_var(--color-shadow)] transition-[opacity,transform] duration-150`,
        toast ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0",
        toast?.isError
          ? "border-danger-line bg-danger-surface text-danger-text"
          : "border-notice-line bg-notice-surface text-notice-text",
      )}
    >
      {toast?.message ?? ""}
    </div>
  );
}
