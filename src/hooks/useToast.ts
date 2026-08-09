import { useCallback, useEffect, useRef, useState } from "react";

const VISIBLE_MS = 3200;

export interface Toast {
  message: string;
  isError: boolean;
  /** Bumped on every call so repeating the same message re-triggers the animation. */
  key: number;
}

export function useToast() {
  const [toast, setToast] = useState<Toast | null>(null);
  const timer = useRef<number | undefined>(undefined);

  const showToast = useCallback((message: string, isError = false) => {
    window.clearTimeout(timer.current);
    setToast((previous) => ({ message, isError, key: (previous?.key ?? 0) + 1 }));
    timer.current = window.setTimeout(() => setToast(null), VISIBLE_MS);
  }, []);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  return { toast, showToast };
}
