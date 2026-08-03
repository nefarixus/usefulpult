"use client";

import { useEffect, useState } from "react";

const LINES = [
  "INITIALIZING HOME CONSOLE...",
  "> монтирую модуль: часы          [OK]",
  "> монтирую модуль: погода        [OK]",
  "> монтирую модуль: курсы валют   [OK]",
  "> монтирую модуль: чек-лист      [OK]",
  "> монтирую модуль: генератор слов[OK]",
  "ГОТОВО. добро пожаловать домой.",
];

export default function BootSequence({ onDone }: { onDone: () => void }) {
  const [visibleCount, setVisibleCount] = useState(0);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (reduceMotion) {
      onDone();
      return;
    }

    const timers: ReturnType<typeof setTimeout>[] = [];
    LINES.forEach((_, i) => {
      timers.push(
        setTimeout(() => setVisibleCount(i + 1), 220 + i * 220)
      );
    });
    timers.push(
      setTimeout(() => setClosing(true), 220 + LINES.length * 220 + 500)
    );
    timers.push(
      setTimeout(onDone, 220 + LINES.length * 220 + 900)
    );

    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className={`fixed inset-0 z-40 flex items-center justify-center bg-console-bg px-6 transition-opacity duration-500 ${
        closing ? "opacity-0" : "opacity-100"
      }`}
      role="status"
      aria-label="Загрузка домашней консоли"
    >
      <div className="w-full max-w-lg font-mono text-sm text-console-green">
        {LINES.slice(0, visibleCount).map((line, i) => (
          <p key={i} className="leading-relaxed">
            {line}
          </p>
        ))}
        {visibleCount < LINES.length && (
          <span className="inline-block h-4 w-2 animate-blink bg-console-green align-middle" />
        )}
        <button
          onClick={onDone}
          className="mt-8 block text-xs text-console-dim underline decoration-dotted underline-offset-4 hover:text-console-amber"
        >
          пропустить →
        </button>
      </div>
    </div>
  );
}
