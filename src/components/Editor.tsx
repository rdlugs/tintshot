import { useRef } from "react";
import type { LoadedImage } from "../hooks/useImageLoader.ts";
import { Inspector } from "./inspector/Inspector.tsx";
import { PreviewStage } from "./PreviewStage.tsx";

interface EditorProps {
  image: LoadedImage;
  onNotify: (message: string, isError?: boolean) => void;
}

export function Editor({ image, onNotify }: EditorProps) {
  // The preview canvas is also the export surface, so both panes share the ref.
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sourceSize = {
    width: image.element.naturalWidth,
    height: image.element.naturalHeight,
  };

  return (
    <section
      // Desktop pins the editor to the viewport so only the inspector scrolls;
      // below 981px the two panes simply stack and the page scrolls normally.
      className="grid min-h-[calc(100vh-68px)] grid-cols-[minmax(0,1fr)_368px] items-stretch
        lg:h-[calc(100dvh-68px)] lg:min-h-0
        max-lg:block"
    >
      <PreviewStage
        image={image.element}
        sourceSize={sourceSize}
        fileName={image.name}
        canvasRef={canvasRef}
      />
      <Inspector
        image={image.element}
        canvasRef={canvasRef}
        sourceSize={sourceSize}
        fileName={image.name}
        onNotify={onNotify}
      />
    </section>
  );
}
