import { useCallback, useEffect, useRef, useState } from "react";

export interface LoadedImage {
  element: HTMLImageElement;
  name: string;
}

interface Options {
  onLoad: (image: LoadedImage) => void;
  onError: (message: string) => void;
}

/**
 * Turn a picked, dropped, or pasted File into a decoded <img>. Object URLs are
 * revoked as soon as the browser is done with them, including when a load is
 * still in flight at unmount.
 */
export function useImageLoader({ onLoad, onError }: Options) {
  const [image, setImage] = useState<LoadedImage | null>(null);
  const pendingUrls = useRef(new Set<string>());

  useEffect(() => {
    const urls = pendingUrls.current;
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
      urls.clear();
    };
  }, []);

  const loadFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) {
        onError("Choose an image file to continue");
        return;
      }

      const url = URL.createObjectURL(file);
      pendingUrls.current.add(url);
      const element = new Image();

      const release = () => {
        URL.revokeObjectURL(url);
        pendingUrls.current.delete(url);
      };

      element.onload = () => {
        release();
        const loaded = { element, name: file.name || "Clipboard image" };
        setImage(loaded);
        onLoad(loaded);
      };
      element.onerror = () => {
        release();
        onError("That image could not be opened");
      };
      element.src = url;
    },
    [onLoad, onError],
  );

  const clearImage = useCallback(() => setImage(null), []);

  return { image, loadFile, clearImage };
}
