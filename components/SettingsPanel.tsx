"use client";

import { useEffect, useState } from "react";
import { Pipette } from "lucide-react";
import { useSettings, type Theme } from "@/lib/settings";
import type { Lang } from "@/lib/translations";

const THEMES: { id: Exclude<Theme, "custom">; hex: string }[] = [
  { id: "amber", hex: "#e3a955" },
  { id: "ocean", hex: "#6fb0c2" },
  { id: "forest", hex: "#93c17a" },
  { id: "rose", hex: "#d98fa1" },
];

const LANGS: Lang[] = ["ru", "en"];

export default function SettingsPanel() {
  const { theme, setTheme, lang, setLang, t, customAccent, setCustomAccent } = useSettings();
  const [autostart, setAutostartState] = useState<boolean | null>(null);

  useEffect(() => {
    if (window.pult?.getAutostart) {
      window.pult.getAutostart().then(setAutostartState);
    }
  }, []);

  function toggleAutostart() {
    if (autostart === null || !window.pult?.setAutostart) return;
    const next = !autostart;
    setAutostartState(next);
    window.pult.setAutostart(next);
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="mb-2 text-xs font-semibold text-home-dim">
          {t("settings_theme")}
        </p>
        <div className="flex items-center gap-2.5">
          {THEMES.map((th) => (
            <button
              key={th.id}
              onClick={() => setTheme(th.id)}
              aria-label={t(`theme_${th.id}` as const)}
              title={t(`theme_${th.id}` as const)}
              className={`h-8 w-8 shrink-0 rounded-full border-2 transition-transform ${
                theme === th.id
                  ? "scale-110 border-home-text"
                  : "border-transparent hover:scale-105"
              }`}
              style={{ backgroundColor: th.hex }}
            />
          ))}

          <div className="relative h-8 w-8 shrink-0">
            <input
              type="color"
              value={customAccent}
              onChange={(e) => {
                setCustomAccent(e.target.value);
                setTheme("custom");
              }}
              aria-label={t("settings_custom_color")}
              title={t("settings_custom_color")}
              className="absolute inset-0 h-8 w-8 cursor-pointer opacity-0"
            />
            <div
              className={`pointer-events-none flex h-8 w-8 items-center justify-center rounded-full border-2 transition-transform ${
                theme === "custom"
                  ? "scale-110 border-home-text"
                  : "border-transparent"
              }`}
              style={{ backgroundColor: customAccent }}
            >
              <Pipette size={13} className="text-home-bg" />
            </div>
          </div>
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold text-home-dim">
          {t("settings_language")}
        </p>
        <div className="flex gap-2">
          {LANGS.map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={`rounded-xl px-3 py-1.5 text-sm font-semibold transition-colors ${
                lang === l
                  ? "bg-home-accent text-home-bg"
                  : "bg-home-accentSoft text-home-accent hover:bg-home-accent hover:text-home-bg"
              }`}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {autostart !== null && (
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-semibold text-home-dim">
            {t("settings_autostart")}
          </p>
          <button
            onClick={toggleAutostart}
            role="switch"
            aria-checked={autostart}
            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
              autostart ? "bg-home-accent" : "bg-home-border"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-home-text transition-transform ${
                autostart ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      )}
    </div>
  );
}
