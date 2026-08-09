import { useCallback, useEffect } from "react";
import { gradientFromImage } from "./lib/colors.ts";
import { useImageLoader, type LoadedImage } from "./hooks/useImageLoader.ts";
import { usePasteImage } from "./hooks/usePasteImage.ts";
import { useTheme } from "./hooks/useTheme.ts";
import { useToast } from "./hooks/useToast.ts";
import { useSettingsDispatch } from "./state/SettingsContext.tsx";
import { Editor } from "./components/Editor.tsx";
import { classes } from "./components/styles.ts";
import { Toast } from "./components/Toast.tsx";
import { TopBar } from "./components/TopBar.tsx";
import { Welcome } from "./components/Welcome.tsx";

export function App() {
  const dispatch = useSettingsDispatch();
  const { toast, showToast } = useToast();
  // Only the top bar consumes this, so it stays a prop rather than a context.
  const { mode: themeMode, setMode: setThemeMode } = useTheme();

  const handleLoad = useCallback(
    (loaded: LoadedImage) => {
      // A new screenshot gets its own palette and opaque default canvas; any
      // crop from the previous image no longer describes meaningful content.
      dispatch({ type: "setGradient", gradient: gradientFromImage(loaded.element) });
      dispatch({ type: "setTransparentBackground", value: false });
      dispatch({ type: "resetPlacement" });
    },
    [dispatch],
  );

  const handleError = useCallback((message: string) => showToast(message, true), [showToast]);

  const { image, loadFile, clearImage } = useImageLoader({
    onLoad: handleLoad,
    onError: handleError,
  });

  usePasteImage(loadFile);

  // Only <body> can stop the page itself from scrolling behind the pinned
  // desktop editor, and it is outside the React tree.
  useEffect(() => {
    document.body.classList.toggle("is-editing", image !== null);
    return () => document.body.classList.remove("is-editing");
  }, [image]);

  return (
    <div className={classes("flex min-h-screen flex-col", image && "lg:h-full lg:min-h-0")}>
      <TopBar
        onNewImage={image ? clearImage : undefined}
        themeMode={themeMode}
        onThemeChange={setThemeMode}
      />

      <main className="flex-1 lg:min-h-0">
        {image ? <Editor image={image} onNotify={showToast} /> : <Welcome onFile={loadFile} />}
      </main>

      {!image && (
        <footer
          className="flex min-h-[54px] items-center justify-between border-t border-line
            px-[clamp(18px,3vw,44px)] text-[14px] text-faint max-sm:justify-center max-sm:text-center"
        >
          <span>Tintshot is free, private, and open source.</span>
          <span className="max-sm:hidden">Everything happens in your browser.</span>
        </footer>
      )}

      <Toast toast={toast} />
    </div>
  );
}
