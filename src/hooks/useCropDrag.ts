import {
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type KeyboardEvent,
  type PointerEvent,
  type RefObject,
} from "react";
import {
  mapProjectivePoint,
  type ComputedLayout,
  type PlacementSettings,
  type Point,
} from "../lib/beautifier.ts";
import { clamp } from "../lib/format.ts";
import type { Action } from "../state/settingsReducer.ts";

const KEY_STEP = 0.04;
const KEY_STEP_FAST = 0.15;

/** Convert a rendered canvas delta back into the panel's untilted coordinate space. */
export function inversePanelDelta(
  layout: ComputedLayout,
  previousCanvasPoint: Point,
  currentCanvasPoint: Point,
): Point | null {
  const previous = mapProjectivePoint(layout.panelTransform.inverse, previousCanvasPoint);
  const current = mapProjectivePoint(layout.panelTransform.inverse, currentCanvasPoint);
  if (!previous || !current) return null;
  return { x: current.x - previous.x, y: current.y - previous.y };
}

/**
 * Drag-to-reposition and arrow-key nudging for the preview canvas.
 *
 * The live focal point is mirrored into a ref because pointermove can fire
 * several times before React commits a render; reading the committed prop would
 * drop those intermediate deltas and make fast drags feel sticky.
 */
export function useCropDrag(
  layoutRef: RefObject<ComputedLayout | null>,
  placement: PlacementSettings,
  dispatch: Dispatch<Action>,
) {
  const [isDragging, setIsDragging] = useState(false);
  const live = useRef(placement);
  const last = useRef({ x: 0, y: 0 });

  useEffect(() => {
    live.current = placement;
  }, [placement]);

  const move = (dx: number, dy: number) => {
    const next = {
      ...live.current,
      x: clamp(live.current.x + dx, -1, 1),
      y: clamp(live.current.y + dy, -1, 1),
    };
    live.current = next;
    dispatch({ type: "setPlacement", patch: { x: next.x, y: next.y } });
  };

  const onPointerDown = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!layoutRef.current) return;
    setIsDragging(true);
    last.current = { x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: PointerEvent<HTMLCanvasElement>) => {
    const layout = layoutRef.current;
    if (!isDragging || !layout) return;

    // Translate both pointer positions into logical canvas coordinates, then
    // undo the panel homography so dragging continues to follow the source axes.
    const bounds = event.currentTarget.getBoundingClientRect();
    if (bounds.width <= 0 || bounds.height <= 0) return;
    const toLogical = (clientX: number, clientY: number) => ({
      x: (clientX - bounds.left) * (layout.canvas.width / bounds.width),
      y: (clientY - bounds.top) * (layout.canvas.height / bounds.height),
    });
    const delta = inversePanelDelta(
      layout,
      toLogical(last.current.x, last.current.y),
      toLogical(event.clientX, event.clientY),
    );
    last.current = { x: event.clientX, y: event.clientY };
    if (!delta) return;
    const overflowX = layout.source.width - layout.viewport.width;
    const overflowY = layout.source.height - layout.viewport.height;

    move(
      overflowX > 0.5 ? (-delta.x * 2) / overflowX : 0,
      overflowY > 0.5 ? (-delta.y * 2) / overflowY : 0,
    );
  };

  const stopDragging = () => setIsDragging(false);

  const onKeyDown = (event: KeyboardEvent<HTMLCanvasElement>) => {
    const amount = event.shiftKey ? KEY_STEP_FAST : KEY_STEP;
    if (event.key === "ArrowLeft") move(-amount, 0);
    else if (event.key === "ArrowRight") move(amount, 0);
    else if (event.key === "ArrowUp") move(0, -amount);
    else if (event.key === "ArrowDown") move(0, amount);
    else return;
    event.preventDefault();
  };

  return {
    isDragging,
    canvasHandlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: stopDragging,
      onPointerCancel: stopDragging,
      onKeyDown,
    },
  };
}
