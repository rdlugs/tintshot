import { useEffect } from "react";

/** Accept an image pasted anywhere in the document. */
export function usePasteImage(onFile: (file: File) => void): void {
  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      const item = [...(event.clipboardData?.items ?? [])].find((candidate) =>
        candidate.type.startsWith("image/"),
      );
      const file = item?.getAsFile();
      if (file) onFile(file);
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [onFile]);
}
