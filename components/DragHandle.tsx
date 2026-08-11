"use client";

import { useRef } from "react";

declare global {
  interface Window {
    pult?: {
      getWindowPosition: () => Promise<[number, number]>;
      setWindowPosition: (x: number, y: number) => void;
      getAutostart: () => Promise<boolean>;
      setAutostart: (enabled: boolean) => void;
      copyText: (text: string) => void;
      setWindowOpacity: (value: number) => void;
      getAcrylicEnabled: () => Promise<boolean>;
      setAcrylicEnabled: (enabled: boolean) => void;
      nudgeAcrylic: () => void;
    };
  }
}

// Anything matching this can be clicked/used normally without starting a
// window drag. Add data-no-drag to any custom container (like a modal)
// that should be fully excluded, even its non-interactive padding areas.
const INTERACTIVE_SELECTOR =
  "button, input, a, textarea, select, label, [role='button'], [tabindex], [data-no-drag]";

export default function DragHandle({ children }: { children: React.ReactNode }) {
  const drag = useRef<{
    startMouseX: number;
    startMouseY: number;
    startWinX: number;
    startWinY: number;
  } | null>(null);

  const raf = useRef<number | null>(null);
  const lastEvent = useRef<{ x: number; y: number } | null>(null);

  function flush() {
    raf.current = null;
    if (!drag.current || !lastEvent.current || !window.pult) return;
    const dx = lastEvent.current.x - drag.current.startMouseX;
    const dy = lastEvent.current.y - drag.current.startMouseY;
    window.pult.setWindowPosition(drag.current.startWinX + dx, drag.current.startWinY + dy);
  }

  function onMouseMove(e: MouseEvent) {
    if (!drag.current) return;
    lastEvent.current = { x: e.screenX, y: e.screenY };
    if (raf.current == null) {
      raf.current = requestAnimationFrame(flush);
    }
  }

  function onMouseUp() {
    drag.current = null;
    lastEvent.current = null;
    if (raf.current != null) {
      cancelAnimationFrame(raf.current);
      raf.current = null;
    }
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("mouseup", onMouseUp);
  }

  async function onMouseDown(e: React.MouseEvent) {
    if (!window.pult) return; // running in a regular browser tab — no-op
    const target = e.target as HTMLElement;
    if (target.closest(INTERACTIVE_SELECTOR)) return; // let the click do its own thing

    const [winX, winY] = await window.pult.getWindowPosition();
    drag.current = {
      startMouseX: e.screenX,
      startMouseY: e.screenY,
      startWinX: winX,
      startWinY: winY,
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  }

  return (
    <div onMouseDown={onMouseDown} className="min-h-screen select-none">
      {children}
    </div>
  );
}
